import type { Env, EngineId } from "../types";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

/** Per-call overrides for the chat LLM. Lets the chat route pick a stronger
 *  model (and a bigger token/latency budget) for depth turns while leaving
 *  the lightweight callers (check-in, food/workout comments) on the default. */
export interface CallClaudeOptions {
  model?: string;
  maxTokens?: number;
  timeoutMs?: number;
}

/** Where a reply actually came from. "fallback" means the Anthropic call failed
 *  and we served a hardcoded rule-table reply — the caller must not advertise
 *  that as real model output. ("workers-ai" is retained for type compatibility
 *  but is no longer produced; see callClaudeDetailed.) */
export type ClaudeSource = "anthropic" | "workers-ai" | "fallback";

export interface ClaudeResult {
  text: string;
  source: ClaudeSource;
}

// Sonnet depth replies can take 10-18s; the old 12s cap meant slower turns
// timed out and fell through to the fallback. Give the model real room.
const ANTHROPIC_TIMEOUT_MS = 18_000;
const ANTHROPIC_MAX_ATTEMPTS = 2;
const WORKERS_AI_TIMEOUT_MS = 6_000;
const DEFAULT_MAX_TOKENS = 320;

// Model tiers (CLAUDE.md §8). Each is env-overridable so ops can retune
// without a code change. Running ALL chat turns on Sonnet for now (predictable
// per-user cost for the free version). Opus is opt-in: set
// ANTHROPIC_MODEL_HIGH_STAKES=claude-opus-4-8 to escalate the heaviest turns.
const MODEL_FAST = "claude-haiku-4-5-20251001";
const MODEL_DEPTH = "claude-sonnet-4-6";
const MODEL_HIGH_STAKES = "claude-sonnet-4-6";

/** Pick the chat model for a routed (post-workflow) turn. Both engines get a
 *  depth-capable model by default; genuinely heavy/long messages escalate to
 *  the high-stakes tier. Greeting/fast turns don't reach here — they're served
 *  by the workflow fast-paths before any model call. */
export function selectChatModel(env: Env, decision: EngineId | "kai" | "mental", message: string): string {
  // Depth tiers use their own env override or the code default — NOT the generic
  // ANTHROPIC_MODEL var, which is the *fast* default for lightweight callers and
  // may point at an older/cheaper (or stale) model. Letting it leak into the
  // depth path silently downgrades chat (and a dead id sends it to the fallback).
  if (isHighStakes(message)) return env.ANTHROPIC_MODEL_HIGH_STAKES || MODEL_HIGH_STAKES;
  if (decision === "physical") return env.ANTHROPIC_MODEL_PHYSICAL || MODEL_DEPTH;
  return env.ANTHROPIC_MODEL_MENTAL || MODEL_DEPTH;
}

export { MODEL_FAST };

function isHighStakes(message: string): boolean {
  const text = message.toLowerCase();
  // Long, layered messages and emotionally heavy (but non-crisis — crisis is
  // handled upstream by the safety classifier) topics warrant the deepest model.
  if (message.length > 420) return true;
  return /\b(panic attack|panicking|hopeless|worthless|hate myself|can'?t cope|falling apart|breaking down|spiraling|overwhelmed|grief|grieving|trauma|assault|abuse)\b/.test(
    text,
  );
}

/** Backwards-compatible string API. Lightweight callers keep using this. */
export async function callClaude(
  env: Env,
  system: string,
  messages: ClaudeMessage[],
  opts: CallClaudeOptions = {},
): Promise<string> {
  return (await callClaudeDetailed(env, system, messages, opts)).text;
}

/** Same as callClaude, but reports provenance so the chat route can label a
 *  rule-table reply as "fallback" instead of pretending it was the model. */
export async function callClaudeDetailed(
  env: Env,
  system: string,
  messages: ClaudeMessage[],
  opts: CallClaudeOptions = {},
): Promise<ClaudeResult> {
  if (env.ANTHROPIC_API_KEY) {
    const anthropicReply = await callAnthropic(env, system, messages, opts);
    if (anthropicReply) return { text: anthropicReply, source: "anthropic" };
  }

  // Workers-AI (Llama) is a LAST-RESORT secondary only. It refuses normal teen
  // fitness questions and echoes the raw transcript, so the CHAT route discards
  // any non-"anthropic" source and serves a clean in-voice line instead (see
  // chat.ts). Lightweight callers (food/workout/sleep comments) keep it as a
  // degraded-but-filtered fallback.
  if (env.AI) {
    const workersAiReply = await callWorkersAi(env.AI, env.AI_TEXT_MODEL, system, messages, opts);
    if (workersAiReply) return { text: workersAiReply, source: "workers-ai" };
  }

  return { text: fallbackReply(messages), source: "fallback" };
}

async function callAnthropic(env: Env, system: string, messages: ClaudeMessage[], opts: CallClaudeOptions) {
  const timeoutMs = opts.timeoutMs ?? ANTHROPIC_TIMEOUT_MS;
  const body = JSON.stringify({
    model: opts.model || env.ANTHROPIC_MODEL || MODEL_FAST,
    system,
    messages: normalizeAnthropicMessages(messages),
    max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: 0.45,
  });

  for (let attempt = 1; attempt <= ANTHROPIC_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
        },
        body,
      });
      if (response.ok) {
        const json = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
        return json.content?.find((item) => item.type === "text" && item.text)?.text?.trim() || null;
      }
      // Non-OK. 429 (rate limit) / 529 (overloaded) / 5xx come back fast and
      // are worth one retry — that's the blip that drops users to the fallback.
      // 4xx (other than 429) won't fix on retry.
      const transient = response.status === 429 || response.status === 529 || response.status >= 500;
      console.warn(`anthropic status ${response.status}${transient && attempt < ANTHROPIC_MAX_ATTEMPTS ? " — retrying" : ""}`);
      if (!transient || attempt === ANTHROPIC_MAX_ATTEMPTS) return null;
    } catch (err) {
      // Timeout / network. Don't burn another full timeout window making the
      // teen wait twice — bail to the fallback now.
      console.warn(`anthropic call failed: ${String(err).slice(0, 80)}`);
      clearTimeout(timeoutId);
      return null;
    }
    clearTimeout(timeoutId);
    // Brief backoff before the retry (transient HTTP errors only).
    await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
  }
  return null;
}

async function callWorkersAi(
  ai: NonNullable<Env["AI"]>,
  model: string | undefined,
  system: string,
  messages: ClaudeMessage[],
  opts: CallClaudeOptions
) {
  try {
    const prompt = `${system}\n\nConversation:\n${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}\nassistant:`;
    const result = (await withTimeout(
      ai.run(model || "@cf/meta/llama-3.1-8b-instruct", {
        prompt,
        max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: 0.5
      }),
      opts.timeoutMs ?? WORKERS_AI_TIMEOUT_MS,
    )) as { response?: string; text?: string };
    return (result.response || result.text || "").trim() || null;
  } catch {
    return null;
  }
}

function normalizeAnthropicMessages(messages: ClaudeMessage[]) {
  const normalized: ClaudeMessage[] = [];
  for (const message of messages) {
    const content = message.content.trim();
    if (!content) continue;
    const previous = normalized.at(-1);
    if (previous?.role === message.role) {
      previous.content = `${previous.content}\n\n${content}`;
    } else {
      normalized.push({ role: message.role, content });
    }
  }
  return normalized.length ? normalized : [{ role: "user" as const, content: "Help me choose one small next move." }];
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("AI request timed out")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function fallbackReply(messages: ClaudeMessage[]) {
  const last = [...messages].reverse().find((message) => message.role === "user")?.content.toLowerCase() ?? "";
  if (/\b(yo|hey|hi|hello|sup|what'?s up|wassup)\b/.test(last)) {
    return "I’m here. What’s the vibe today: mind, body, school, sleep, or confidence?";
  }
  if (/\b(friend|friends|group chat|left me out|lonely|crush|delivered|rejected|ignored|social)\b/.test(last)) {
    return "Oof. That actually hurts. Was it clearly on purpose, or is the silence making your brain run?";
  }
  if (/\b(mad|angry|rage|yelled|fight|mom|dad|parent|parents)\b/.test(last)) {
    return "Feeling bad after means you probably care more than you showed. Cool down first, then say one honest sentence.";
  }
  if (/\b(point of trying|always quit|why try|i always fail|nothing works|keep quitting|what's the point|whats the point)\b/.test(last)) {
    return "Quitting before doesn’t mean you’re cooked forever. The plan was probably too big. What’s one tiny thing you could do for three days?";
  }
  if (/\b(protein|high protein|hungry|lunch|lunc|food|eat|make|cook)\b/.test(last)) {
    return "I got you. Go protein + carb + something fresh: eggs and toast, a turkey/rice bowl, tuna sandwich, Greek yogurt with fruit, beans and rice, or leftovers with water. What do you have?";
  }
  if (/\b(test|quiz|exam|homework|study|studying|school|grades?|class|assignment|finals?)\b/.test(last)) {
    return "Yeah, test stress can make your brain freeze. Do 12 minutes on one topic with your phone away, then check what still feels confusing.";
  }
  if (/\b(basketball|hoop|shooting|handles)\b/.test(last)) {
    return "Keep it simple today: 5 minutes handles, 10 minutes form shots, 5 minutes stretching. Log it after so it counts.";
  }
  if (last.includes("sleep") || last.includes("tired")) {
    return "No perfect routine needed tonight. Just make the next hour easier: dim the screen, plug the phone away from bed, and do one boring thing.";
  }
  if (last.includes("food") || last.includes("eat") || last.includes("practice")) {
    return "Fuel should support the day, not turn into pressure. Tell me what you ate and what you’re trying to do, and I’ll keep it simple.";
  }
  if (last.includes("scroll") || last.includes("phone") || last.includes("tiktok") || last.includes("instagram")) {
    return "Okay, the phone won that round. Day’s not over. Put it across the room for 15 minutes and pick one replacement.";
  }
  if (last.length > 220) {
    return "That’s a lot to carry, but you don’t need to rewrite it for me. The next move is to separate it into three pieces: what happened, what hit you the hardest, and what you can control in the next 10 minutes. Start with the part that feels most urgent right now.";
  }
  return "I can work with that. The next move is to name the part that matters most right now, then take one small action instead of trying to solve the whole thing at once.";
}
