// Durable cross-conversation memory ("self-build").
//
// KAI is meant to be a companion that remembers you over time, not a chatbot
// that resets each session. The live message window only covers the recent
// thread; this is the long-term layer: a short running "what I know about you"
// note, maintained per user, injected into every chat prompt so KAI references
// what they told it days or weeks ago.
//
// How it works:
//   - loadUserMemory: one KV read before building the prompt.
//   - updateUserMemory: after each normal (non-crisis) exchange, a cheap Haiku
//     call merges the latest exchange into the running note. Fire-and-forget via
//     executionCtx.waitUntil so it never adds user-facing latency.
//
// Privacy/safety:
//   - Only normal coaching turns reach this (crisis turns return earlier and
//     never call it), and the extractor is told to NEVER store self-harm /
//     suicide / abuse / crisis content — that lives in the safety system, not in
//     casual memory.
//   - Stored in SESSIONS_KV with a 120-day TTL (refreshed on update) so it's
//     durable enough to feel like memory but not kept forever. Capped in size.

import { callClaude, MODEL_FAST } from "./claude";
import type { Env } from "../types";

const MEMORY_PREFIX = "memory:";
const MAX_MEMORY_CHARS = 1500;
const MEMORY_TTL_SECONDS = 60 * 60 * 24 * 120; // 120 days, refreshed on every update

export async function loadUserMemory(env: Env, userId: string): Promise<string> {
  if (!env.SESSIONS_KV) return "";
  try {
    const raw = await env.SESSIONS_KV.get(`${MEMORY_PREFIX}${userId}`);
    return (raw ?? "").slice(0, MAX_MEMORY_CHARS);
  } catch {
    return "";
  }
}

const EXTRACTOR_SYSTEM = [
  "You maintain a brief running memory for KAI, a wellness companion, about ONE teenage user — the kind of things a good friend naturally remembers so they can pick up right where you left off next time.",
  "",
  "You'll get the CURRENT memory and the latest exchange. Return the UPDATED memory — nothing else.",
  "",
  "KEEP (when they come up): people in their life (names + who they are — friends, a crush, family, a coach), ongoing situations (a fight, a tryout, a game, finals, a trip, a breakup), their goals, clear preferences and interests, recent wins, and what's been weighing on them.",
  "",
  "RULES:",
  "- Concise. Short factual lines, most-relevant first. Hard cap ~1200 characters. MERGE and UPDATE — don't just append; revise facts that changed and drop things clearly resolved or stale.",
  "- Only durable, continuity-relevant facts. Skip small talk, filler, and one-off details.",
  "- NEVER record anything about self-harm, suicide, abuse, eating-disorder behavior, or any crisis — that is handled by a separate system and must never live in casual memory. Omit it entirely.",
  "- Plain text, no headers, no preamble. If nothing worth remembering changed, return the current memory unchanged.",
].join("\n");

export async function updateUserMemory(
  env: Env,
  userId: string,
  userMessage: string,
  assistantReply: string,
  existing: string,
): Promise<void> {
  if (!env.SESSIONS_KV || !env.ANTHROPIC_API_KEY) return;
  try {
    const user = [
      `CURRENT MEMORY:\n${existing.trim() || "(none yet)"}`,
      "",
      `LATEST EXCHANGE:\nTeen: ${userMessage.slice(0, 1500)}\nKAI: ${assistantReply.slice(0, 1500)}`,
      "",
      "Return the UPDATED memory.",
    ].join("\n");
    const updated = await callClaude(env, EXTRACTOR_SYSTEM, [{ role: "user", content: user }], {
      model: MODEL_FAST,
      maxTokens: 400,
      timeoutMs: 12_000,
    });
    const clean = (updated ?? "").trim().slice(0, MAX_MEMORY_CHARS);
    // Don't overwrite a real memory with an empty/failed extraction.
    if (clean.length < 2) return;
    await env.SESSIONS_KV.put(`${MEMORY_PREFIX}${userId}`, clean, {
      expirationTtl: MEMORY_TTL_SECONDS,
    });
  } catch {
    // Fire-and-forget — a failed memory update never affects the user's reply.
  }
}

/** The block injected into the chat system prompt. Empty string when there's
 *  nothing yet, so new users add no prompt weight. */
export function renderMemoryBlock(memory: string, displayName: string): string {
  const m = memory.trim();
  if (!m) return "";
  return `\n\nWHAT YOU ALREADY KNOW ABOUT ${displayName} (from past conversations — this is your memory of them; weave it in naturally when relevant, NEVER recite it back like a list or say where it came from):\n${m}`;
}
