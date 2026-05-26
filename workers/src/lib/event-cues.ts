/**
 * Generates a short Kai "next move" cue after a completed engine
 * action (logged a meal, finished a tracker session, tapped Sleep
 * / Wake, ran a body scan, completed a Mental reset etc.).
 *
 * The cue is the engagement-loop move described in the product
 * strategy doc: "after every engine action, Kai writes one short
 * follow-up cue based on the data."
 *
 * Cue rules (load-bearing — these are the editorial guardrails):
 *   - One sentence. No exclamation points. No emoji.
 *   - Warm. Plain. Specific when possible.
 *   - NEVER preach. NEVER use "should". NEVER score.
 *   - Reference the actual event when possible ("That was 8h —
 *     more than the last few nights"), but never invent stats.
 *   - On failure to generate, fall back to a static per-event-type
 *     line. Better silence than something off-tone.
 */

import type { Env } from "../types";
import { callAnthropicCompletion } from "./claude";

export type CueRequest = {
  eventType: string;
  eventValue?: number;
  /** Free-form payload from the originating engine entry. Logged
   * verbatim to the prompt so the model can use specifics like
   * sleep duration or session title. */
  payload?: Record<string, unknown>;
  kaiName?: string;
};

export type CueResponse = {
  cue: string;
  source: "model" | "fallback";
};

// Hand-written fallbacks keyed by event type. Used when the model
// fails or returns something we won't ship. Kept calm + voice-on.
const FALLBACK_CUES: Record<string, string> = {
  sleep_start: "Rest well. Tap again when you're up.",
  sleep_log: "Logged. Sleep is the quiet rep.",
  meal_logged: "Got it. Eating is enough on its own — no scoring.",
  food_photo: "Saved. Kai keeps the read descriptive, not judgmental.",
  food_photo_stub: "Saved as a manual note. Photo features unlock when you take a real one.",
  body_scan: "Saved. Posture is a slow signal — one scan is data, not a verdict.",
  tracker_session: "Nice rep. Recovery beats forcing the next one.",
  workout: "Nice rep. Recovery beats forcing the next one.",
  workout_partial: "Partial counts. Showing up is the harder part.",
  // Mental-engine event types — included so when cues land in
  // Mental too we don't have to reship.
  feelings_check_in: "Naming it is the start. The next move can be small.",
  thought_reframe: "A second read of the same situation. That's a real skill.",
  mental_breathing: "Settled the system a little. Let that be enough for the next ten minutes.",
  meditation: "Quiet wins compound. Same place tomorrow.",
  social_reset: "Stepping away from the feed is a strong move.",
  letter_written: "Words to your future self carry weight.",
  goal_created: "Picked one. Now make the next step small enough to start.",
  goal_completed: "Hit. Reset the next one small.",
  goal_reframed: "A goal can change without becoming a failure.",
  next_step_planned: "Saved. Shrink it further if it stalls.",
  strengths_discovery: "Patterns are showing up. Let them tell you what to try.",
  default: "Logged."
};

// Words / phrases we never want Kai cues to use — even if the model
// produces them. Drop the response and use the fallback if any
// match. Lower-cased compare.
const FORBIDDEN_TOKENS = [
  " should ",
  " should.",
  " should,",
  "you should",
  "transform",
  "unlock",
  "level up",
  "synergy",
  "leverage",
  "journey",
  "kill yourself",
  "harm yourself"
];

export function getFallbackCue(eventType: string): string {
  return FALLBACK_CUES[eventType] ?? FALLBACK_CUES.default;
}

/**
 * Returns true if the cue text steers clear of preachy / corporate
 * / unsafe vocabulary. Exported so tests can assert directly.
 */
export function isSafeCue(cue: string): boolean {
  const lower = ` ${cue.toLowerCase()} `;
  for (const token of FORBIDDEN_TOKENS) {
    if (lower.includes(token)) return false;
  }
  // Reject anything with exclamation points — voice rule from
  // CLAUDE.md §1 ("Never use exclamation points" in the safety
  // response prompt; we apply the same rule for cues since teens
  // read excessive enthusiasm as cringe).
  if (cue.includes("!")) return false;
  // Reject anything longer than two short sentences. The cue should
  // be ONE sentence; we allow a brief follow-up clause if the model
  // adds one. Hard cap at 220 chars so a runaway response can't
  // crowd the UI.
  if (cue.length > 220) return false;
  return true;
}

function buildPrompt(req: CueRequest): string {
  const kaiName = req.kaiName?.trim() || "Kai";
  const payloadText = req.payload ? JSON.stringify(req.payload).slice(0, 400) : "{}";
  return [
    `You are ${kaiName}, a warm AI mentor for a teenager. A teen just completed an action in the app. Write ONE short follow-up line of 1 sentence (15 words max).`,
    "",
    "RULES — these are load-bearing:",
    "- One sentence. No exclamation points. No emoji.",
    "- Warm, plain, slightly irreverent. Like a thoughtful older sibling.",
    "- Never preach. Never say 'should'. Never score the teen.",
    "- Don't invent stats. Use only what's in the event payload.",
    "- No 'level up', 'transform', 'journey', or other corporate-wellness phrases.",
    "",
    `Event type: ${req.eventType}`,
    req.eventValue !== undefined ? `Event value: ${req.eventValue}` : "",
    `Event payload: ${payloadText}`,
    "",
    `Respond with only the one-sentence cue. Nothing else.`
  ]
    .filter(Boolean)
    .join("\n");
}

const CUE_TIMEOUT_MS = 6_000;

function cleanModelOutput(raw: string): string {
  return raw.replace(/^["“'`]+|["”'`]+$/g, "").trim();
}

export async function generateEventCue(env: Env, req: CueRequest): Promise<CueResponse> {
  const fallback = (): CueResponse => ({ cue: getFallbackCue(req.eventType), source: "fallback" });
  const prompt = buildPrompt(req);

  // Prefer Anthropic when ANTHROPIC_API_KEY is set so cues feel personal
  // and on-voice (Sonnet 4.6 default). Falls through to Workers AI on
  // null (no key, network error, or empty response).
  try {
    const anthropicReply = await withTimeout(
      callAnthropicCompletion(env, prompt, { maxTokens: 60, temperature: 0.55 }),
      CUE_TIMEOUT_MS
    );
    if (anthropicReply) {
      const cleaned = cleanModelOutput(anthropicReply);
      if (cleaned && isSafeCue(cleaned)) {
        return { cue: cleaned, source: "model" };
      }
    }
  } catch {
    // Anthropic timed out or threw — try Workers AI as a second model
    // chance before degrading to the static fallback.
  }

  if (!env.AI) return fallback();
  try {
    const model = env.AI_TEXT_MODEL || "@cf/meta/llama-3.1-8b-instruct";
    const result = (await withTimeout(
      env.AI.run(model, { prompt, max_tokens: 60, temperature: 0.55 }),
      CUE_TIMEOUT_MS
    )) as { response?: string; text?: string };
    const raw = (result.response || result.text || "").trim();
    const cleaned = cleanModelOutput(raw);
    if (!cleaned || !isSafeCue(cleaned)) return fallback();
    return { cue: cleaned, source: "model" };
  } catch {
    return fallback();
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("cue timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
