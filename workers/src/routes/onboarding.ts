// Voice-first onboarding conversation turn.
//
// POST /api/onboarding/converse
//   { transcript: [{role, text}], latestUserMessage, stepId, draft? }
//   -> { safety, kaiLine, done, delta }
//
// Drives the "meeting Kai for the first time" onboarding: given the running
// transcript and the teen's latest reply, returns (a) Kai's warm, contextual
// next line and (b) a structured profile-extraction delta — so Kai builds the
// user's profile FROM the conversation instead of interrogating them.
//
// Safety is a separate, prior step (classifySafetyFull): a crisis disclosure
// short-circuits the conversational model entirely and returns the 988 handoff
// (CLAUDE.md §6). Everything else mirrors the northstar/schedule extraction
// pattern: strict JSON prompt -> extractJsonObject -> shape-validate -> graceful
// degradation (never throw; the client falls back to its scripted next line).

import { Hono } from "hono";
import { callClaude, selectChatModel } from "../lib/claude";
import { extractJsonObject } from "../lib/json-utils";
import { rateLimit, rateLimitedResponse } from "../lib/rate-limit";
import { classifySafetyFull, logSafetyEvent } from "../lib/safety";
import type { AppVariables, Env } from "../types";

export const onboardingRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

type Role = "kai" | "user";
type Turn = { role: Role; text: string };

const VALID_TONES = new Set(["warm", "balanced", "direct"]);
const MAX_TRANSCRIPT_TURNS = 12;
const MAX_MSG_LEN = 800;
// The conversational prompt is capped at MAX_MSG_LEN, but the safety classifier
// must see the WHOLE message (a crisis line can sit past the first 800 chars);
// this larger bound just protects the classifier from a pathological payload.
const MAX_SAFETY_LEN = 4000;
const ONBOARDING_RATE_LIMIT = { route: "onboarding", limit: 40, periodSeconds: 60 } as const;

// Kai's voice for onboarding: the trusted older-sibling/coach meeting someone
// for the first time. Warm, real, curious — never a form, never a product pitch.
// The model returns BOTH the next spoken line and a structured extraction delta.
const SYSTEM = [
  "You are Kai — a warm, sharp, genuinely-invested coach and older-sibling figure meeting a teenager (13–18) for the very first time, during onboarding. This first conversation is where the relationship begins.",
  "",
  "Your job each turn: read everything they've said so far, react like a real person to their LATEST message, and ask ONE natural next question that moves the conversation forward. One question at a time. Never an interview, never a survey.",
  "",
  "While you talk, casually weave in — never as a scripted pitch — what you do for them: you build a personalized daily system around their goals, break big goals into small daily actions, keep them accountable, learn and adapt over time, and remember what matters to them. Drop these in lightly as the conversation gives you the opening; do not list them.",
  "",
  "Voice rules: sound human, not like ChatGPT. Match their energy — joke back if they joke, slow down and listen if they're heavy. Reference what they said earlier. Never shame, never lecture, never use hollow affirmations or toxic positivity. Never namedrop research or philosophy. Keep your line to 1–3 short sentences.",
  "",
  "As the conversation goes, quietly EXTRACT a profile from what they say — do not ask for fields directly. From \"I want to lose weight before football season because I haven't felt confident\" you'd extract goal, motivation (football), emotional motivation (confidence), and timeframe — without a single extra question.",
  "",
  "Set done=true ONLY when you genuinely have enough to build their system: at minimum their name, what they're here for / a goal, and why it matters to them. Otherwise done=false.",
  "",
  "Return ONLY a JSON object — no prose, no markdown — with this exact shape:",
  '{"kaiLine":"<your next spoken line>","done":<true|false>,"delta":{"firstName":<string|null>,"primaryGoal":<string|null>,"focusAreas":<string[]>,"motivation":<string|null>,"emotionalMotivation":<string|null>,"timeframe":<string|null>,"tone":<"warm"|"balanced"|"direct"|null>,"blocker":<string|null>,"identityStatement":<string|null>,"originStory":<string|null>}}',
  "",
  "Only include a delta field when THIS message gives you real signal for it; use null (or [] for focusAreas) otherwise. Never invent values.",
].join("\n");

type Delta = {
  firstName: string | null;
  primaryGoal: string | null;
  focusAreas: string[];
  motivation: string | null;
  emotionalMotivation: string | null;
  timeframe: string | null;
  tone: "warm" | "balanced" | "direct" | null;
  blocker: string | null;
  identityStatement: string | null;
  originStory: string | null;
};

const EMPTY_DELTA: Delta = {
  firstName: null,
  primaryGoal: null,
  focusAreas: [],
  motivation: null,
  emotionalMotivation: null,
  timeframe: null,
  tone: null,
  blocker: null,
  identityStatement: null,
  originStory: null,
};

function cleanStr(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, " ").slice(0, max);
  return s ? s : null;
}

/** Strict shape validation — drop anything malformed, never propagate junk. */
export function parseConverseResult(raw: string): { kaiLine: string; done: boolean; delta: Delta } | null {
  const jsonText = extractJsonObject(raw);
  if (!jsonText) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const kaiLine = cleanStr(obj.kaiLine, 400) ?? "";
  const done = obj.done === true;
  const rawDelta = (obj.delta && typeof obj.delta === "object" ? obj.delta : {}) as Record<string, unknown>;

  const tone = typeof rawDelta.tone === "string" && VALID_TONES.has(rawDelta.tone)
    ? (rawDelta.tone as Delta["tone"])
    : null;
  const focusAreas = Array.isArray(rawDelta.focusAreas)
    ? rawDelta.focusAreas
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim().replace(/\s+/g, " ").slice(0, 40))
        .filter(Boolean)
        .slice(0, 8)
    : [];

  const delta: Delta = {
    firstName: cleanStr(rawDelta.firstName, 40),
    primaryGoal: cleanStr(rawDelta.primaryGoal, 120),
    focusAreas,
    motivation: cleanStr(rawDelta.motivation, 200),
    emotionalMotivation: cleanStr(rawDelta.emotionalMotivation, 200),
    timeframe: cleanStr(rawDelta.timeframe, 80),
    tone,
    blocker: cleanStr(rawDelta.blocker, 120),
    identityStatement: cleanStr(rawDelta.identityStatement, 140),
    originStory: cleanStr(rawDelta.originStory, 280),
  };

  // A turn with neither a line nor any extraction is useless — treat as malformed
  // so the client falls back to its scripted next line.
  const hasDelta = Object.values(delta).some((v) => (Array.isArray(v) ? v.length > 0 : v !== null));
  if (!kaiLine && !hasDelta) return null;
  return { kaiLine, done, delta };
}

function normalizeTranscript(input: unknown): Turn[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((t): t is { role: unknown; text: unknown } => !!t && typeof t === "object")
    .map((t) => ({
      role: t.role === "kai" ? ("kai" as const) : ("user" as const),
      text: typeof t.text === "string" ? t.text.slice(0, MAX_MSG_LEN) : "",
    }))
    .filter((t) => t.text)
    .slice(-MAX_TRANSCRIPT_TURNS);
}

onboardingRoutes.post("/onboarding/converse", async (c) => {
  const body = await c.req
    .json<{ transcript?: unknown; latestUserMessage?: string; stepId?: string }>()
    .catch(() => ({}) as { transcript?: unknown; latestUserMessage?: string; stepId?: string });
  // Keep the FULL message for the safety classifier; only the conversational
  // prompt is truncated (see `latest` below).
  const rawLatest = (body.latestUserMessage ?? "").trim().slice(0, MAX_SAFETY_LEN);
  if (!rawLatest) {
    return c.json({ safety: { safe: true }, kaiLine: "", done: false, delta: EMPTY_DELTA }, 400);
  }

  // Per-user rate limit before any model call, matching the chat/journal routes
  // (a scripted client must not be able to spend unbounded Anthropic budget).
  const userId = c.get("userId");
  const limit = await rateLimit(c.env, userId, ONBOARDING_RATE_LIMIT);
  if (!limit.allowed) return rateLimitedResponse(limit, ONBOARDING_RATE_LIMIT);

  // 1) Safety always runs first and always wins (CLAUDE.md §6), on the FULL
  //    message. On a crisis disclosure we never call the conversational model —
  //    we hand off to 988 and tell the client to stop normal onboarding.
  const safety = await classifySafetyFull(c.env, rawLatest);
  if (!safety.safe) {
    if (userId) {
      // Fire-and-forget — logging must never block or fail the response. Start
      // the promise regardless; attach it to waitUntil when an execution context
      // exists (c.executionCtx throws when there isn't one, e.g. in tests).
      const logging = logSafetyEvent(c.env, { userId, rawText: rawLatest, classification: safety }).catch(() => {});
      try {
        c.executionCtx.waitUntil(logging);
      } catch {
        /* no execution context — the promise still runs best-effort */
      }
    }
    return c.json({
      safety,
      kaiLine: safety.response ?? "",
      done: true,
      delta: EMPTY_DELTA,
    });
  }

  // 2) Conversational turn + extraction (one Sonnet call, two outputs). The
  //    prompt only needs the truncated message; safety already saw the full one.
  const latest = rawLatest.slice(0, MAX_MSG_LEN);
  const transcript = normalizeTranscript(body.transcript);
  const messages = transcript.map((t) => ({
    role: t.role === "kai" ? ("assistant" as const) : ("user" as const),
    content: t.text,
  }));
  // Ensure the latest user message is present as the final user turn.
  if (messages.length === 0 || messages[messages.length - 1].content !== latest) {
    messages.push({ role: "user" as const, content: latest });
  }

  try {
    const model = c.env.ANTHROPIC_MODEL_ONBOARDING || selectChatModel(c.env, "mental", latest);
    const raw = await callClaude(c.env, SYSTEM, messages, {
      model,
      maxTokens: 600,
      timeoutMs: 15_000,
    });
    const parsed = parseConverseResult(raw);
    if (!parsed) {
      return c.json({ safety: { safe: true }, kaiLine: "", done: false, delta: EMPTY_DELTA });
    }
    return c.json({ safety: { safe: true }, ...parsed });
  } catch {
    // Graceful degradation — the client continues with its scripted next line.
    return c.json({ safety: { safe: true }, kaiLine: "", done: false, delta: EMPTY_DELTA });
  }
});
