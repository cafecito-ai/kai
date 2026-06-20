import { Hono } from "hono";
import { renderAgentPrompt, renderBodyPrompt } from "../lib/agent-prompts";
import { pickAgent, type AgentDecision } from "../lib/agent-router";
import {
  BODY_LANGUAGE_FALLBACK,
  passesBodyLanguageFilter,
} from "../lib/body-language-filter";
import { callClaudeDetailed, selectChatModel, type ClaudeSource } from "../lib/claude";
import { buildKaiContext, type KaiContext } from "../lib/context";
import { loadUserMemory, renderMemoryBlock, updateUserMemory } from "../lib/memory";
import { extractScheduleIntent, looksLikeScheduleRequest, type ScheduleIntent } from "../lib/schedule-gen";
import { createMessage, getConversationMessages, getLatestConversation, getOrCreateConversation } from "../lib/conversations";
import { sendSafetyAlert } from "../lib/email";
import { renderEnginePrompt } from "../lib/prompts/engines";
import { rateLimit, rateLimitedResponse } from "../lib/rate-limit";
import { classifySafetyFull, conversationHasSafetyEvent, logSafetyEvent, signalsSafeNow } from "../lib/safety";
import type { AppVariables, Env, EngineId } from "../types";

const MAX_BODY_REGENERATIONS = 3;

// Session-sticky safety hold: once a conversation has had a crisis disclosure,
// later benign turns get this instead of normal coaching — warm, present, and
// keeping real help on the table, without lecturing or pivoting to other topics.
const SAFETY_HOLD_PROMPT = [
  "Earlier in THIS conversation the teen disclosed something serious and was already given crisis resources (988 / Crisis Text Line).",
  "Their latest message is not itself a crisis, but you must NOT resume normal wellness coaching or pivot to other topics (school, fitness, goals, etc.).",
  "Stay warm and present. In 2-3 short sentences: gently check how they're doing right now, let them know you're still here, and keep the door open to real support (988, or a trusted adult) without being pushy or repetitive.",
  "Do not lecture. Do not diagnose. Do not start your reply with the word \"I\". Vary your wording naturally — don't sound like a canned script.",
].join("\n");

const SAFETY_HOLD_FALLBACK =
  "Still right here with you. You don't have to have words for it — we can just sit with it. And that line is always open: call or text 988 anytime, or reach a trusted adult. How are you doing right now?";

const CHAT_RATE_LIMIT = { route: "chat", limit: 30, periodSeconds: 60 } as const;

export const chatRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

chatRoutes.get("/conversations/current", async (c) => {
  const engine = (c.req.query("engine") ?? "kai") as EngineId | "kai";
  if (!["kai", "physical", "potential", "mental"].includes(engine)) return c.json({ error: "Unknown engine" }, 404);
  const conversation = await getLatestConversation(c.env.DB, { userId: c.get("userId"), engine });
  if (!conversation) return c.json({ conversationId: null, messages: [] });
  const messages = await getConversationMessages(c.env.DB, { conversationId: conversation.id, userId: c.get("userId") });
  return c.json({ conversationId: conversation.id, messages: messages ?? [] });
});

chatRoutes.post("/kai/chat", async (c) => {
  const userId = c.get("userId");
  const limit = await rateLimit(c.env, userId, CHAT_RATE_LIMIT);
  if (!limit.allowed) return rateLimitedResponse(limit, CHAT_RATE_LIMIT);
  const body = await c.req.json<{
    conversationId?: string;
    message: string;
    // Rawz/8 — KAI memory payload from the client. Shape-validated by
    // sanitizeClientContext to drop anything weird before it touches the prompt.
    clientContext?: unknown;
  }>();
  const context = await buildKaiContext(c.env, userId);
  const merged = { ...context, clientContext: sanitizeClientContext(body.clientContext) };
  const waitUntil = c.executionCtx?.waitUntil?.bind(c.executionCtx);
  return handleRoutedChat(c.env, userId, body.conversationId, body.message, merged, waitUntil);
});

/** Defensive shape check on the client-supplied context. Anything that
 *  doesn't match the expected shape gets dropped silently. Caps array
 *  sizes so a malicious client can't blow up our prompt budget. */
function sanitizeClientContext(raw: unknown): import("../lib/context").KaiClientContext | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const score = (r.todayScore as Record<string, unknown>) ?? {};
  const hydration = (r.hydration as Record<string, unknown>) ?? {};
  const level = (r.level as Record<string, unknown>) ?? {};
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const str = (v: unknown, max = 120) =>
    typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
  return {
    todayScore: {
      final: num(score.final),
      mental: num(score.mental),
      sleep: num(score.sleep),
      mood: num(score.mood),
    },
    recentActivity: Array.isArray(r.recentActivity)
      ? r.recentActivity
          .slice(0, 10)
          .map((a) => {
            const o = (a as Record<string, unknown>) ?? {};
            return { source: str(o.source, 32), count: Math.max(0, Math.floor(num(o.count) ?? 0)) };
          })
          .filter((a) => a.source.length > 0)
      : [],
    missingLogs: Array.isArray(r.missingLogs)
      ? (r.missingLogs as unknown[]).slice(0, 6).map((m) => str(m, 60)).filter(Boolean)
      : [],
    activeGoals: Array.isArray(r.activeGoals)
      ? (r.activeGoals as unknown[]).slice(0, 3).map((g) => {
          const o = (g as Record<string, unknown>) ?? {};
          return {
            title: str(o.title, 80),
            identityFrame: str(o.identityFrame, 100),
            streakDays: Math.max(0, Math.floor(num(o.streakDays) ?? 0)),
          };
        })
      : [],
    activeChallenges: Array.isArray(r.activeChallenges)
      ? (r.activeChallenges as unknown[]).slice(0, 3).map((c) => {
          const o = (c as Record<string, unknown>) ?? {};
          return {
            title: str(o.title, 80),
            daysHit: Math.max(0, Math.floor(num(o.daysHit) ?? 0)),
            target: Math.max(1, Math.floor(num(o.target) ?? 1)),
            daysRemaining: Math.max(0, Math.floor(num(o.daysRemaining) ?? 0)),
          };
        })
      : [],
    hydration: {
      todayGlasses: Math.max(0, Math.floor(num(hydration.todayGlasses) ?? 0)),
      todayTarget: Math.max(1, Math.floor(num(hydration.todayTarget) ?? 8)),
      goalHitsLast7Days: Math.max(0, Math.min(7, Math.floor(num(hydration.goalHitsLast7Days) ?? 0))),
    },
    level: {
      current: Math.max(1, Math.floor(num(level.current) ?? 1)),
      label: str(level.label, 40),
    },
    localHour: (() => {
      const h = num(r.localHour);
      return h != null && h >= 0 && h <= 23 ? Math.floor(h) : undefined;
    })(),
    localWeekday: (() => {
      const weekday = str(r.localWeekday, 12);
      return /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.test(weekday)
        ? weekday
        : undefined;
    })(),
    scheduleItems: Array.isArray(r.scheduleItems)
      ? (r.scheduleItems as unknown[])
          .slice(0, 30)
          .map((it) => {
            const o = (it as Record<string, unknown>) ?? {};
            return { id: str(o.id, 40), title: str(o.title, 60), section: str(o.section, 16) };
          })
          .filter((it) => it.id.length > 0 && it.title.length > 0)
      : undefined,
  };
}

chatRoutes.post("/engines/:engineId/chat", async (c) => {
  const engineId = c.req.param("engineId") as EngineId;
  if (!["physical", "potential", "mental"].includes(engineId)) return c.json({ error: "Unknown engine" }, 404);
  const userId = c.get("userId");
  const limit = await rateLimit(c.env, userId, CHAT_RATE_LIMIT);
  if (!limit.allowed) return rateLimitedResponse(limit, CHAT_RATE_LIMIT);
  const body = await c.req.json<{ conversationId?: string; message: string }>();
  const context = await buildKaiContext(c.env, userId);
  return handleChat(c.env, userId, body.conversationId, body.message, renderEnginePrompt(engineId, context), engineId);
});

/** Load recent conversation turns (incl. the just-saved user message) so the
 *  model has coaching continuity — follow-ups like "why?" / "what next?" need
 *  the prior turns, not just the latest message. */
async function buildHistory(env: Env, conversationId: string, userId: string, fallbackMessage: string) {
  // Wide window so Kai actually remembers the ongoing thread (not just the last
  // few turns). Sonnet's context easily holds this; the recent-tail query keeps
  // it to the latest messages. Durable cross-conversation memory rides on top via
  // the user_patterns summary injected into the system prompt.
  const recent = await getConversationMessages(env.DB, { conversationId, userId, limit: 30 });
  const msgs = (recent ?? [])
    .filter((m): m is typeof m & { role: "user" | "assistant" } => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));
  return msgs.length ? msgs : [{ role: "user" as const, content: fallbackMessage }];
}

async function handleChat(env: Env, userId: string, conversationId: string | undefined, message: string, system: string, engine: EngineId | "kai") {
  const conversation = await getOrCreateConversation(env.DB, { id: conversationId, userId, engine });
  const userMessage = await createMessage(env.DB, { conversationId: conversation, role: "user", content: message });
  const safety = await classifySafetyFull(env, message);
  if (!safety.safe) {
    const event = await logSafetyEvent(env, { userId, conversationId: conversation, messageId: userMessage.id, rawText: message, classification: safety });
    if (event && safety.category && safety.severity) {
      await sendSafetyAlert(env, { eventId: event.id, category: safety.category, severity: safety.severity });
    }
    await createMessage(env.DB, { conversationId: conversation, role: "assistant", content: safety.response ?? "", metadata: { safetyEventId: event?.id } });
    return Response.json({ conversationId: conversation, reply: safety.response, safetyEvent: event });
  }
  const history = await buildHistory(env, conversation, userId, message);
  const generated = await callClaudeDetailed(env, system, history, { model: selectChatModel(env, engine, message), maxTokens: 600 });
  // CHAT only ever serves Claude. If the model is unavailable (timeout, outage,
  // rate-limit, or only the Llama secondary answered) we do NOT fabricate an
  // in-voice line and persist it as if Kai said it — we tell the client so it
  // can show a real retry state instead of a fake reply.
  if (generated.source !== "anthropic") return modelUnavailable(conversation);
  const reply = limitToOneQuestion(generated.text);
  await createMessage(env.DB, { conversationId: conversation, role: "assistant", content: reply, metadata: { responseSource: "model" } });
  return Response.json({ conversationId: conversation, reply, responseSource: "model" });
}

// The model is unavailable (network / timeout / rate-limit / no usable Anthropic
// reply). We deliberately DON'T fabricate a coaching line and save it as Kai's —
// a fake "lost the thread" reply erodes trust. Instead we return a retryable
// signal and persist nothing, so the client shows a loading/error state and can
// re-send. NOTE: this never touches the crisis, safety-hold, or body-language
// content paths — those return above with their mandatory content.
function modelUnavailable(conversationId: string): Response {
  return Response.json({ conversationId, error: "model_unavailable", retryable: true }, { status: 503 });
}

/**
 * v3 chat path. Per CLAUDE.md v2 §4 + CLAUDE_v3_PATCH:
 *   1. Safety classifier runs first and always wins
 *   2. If safe, the routing classifier picks Mind or Body (transparent to user)
 *   3. Body responses run through the forbidden-language filter; up to 3
 *      regenerations with a stricter prompt before falling back
 *   4. User always sees "KAI" — the routing is invisible
 */
async function handleRoutedChat(
  env: Env,
  userId: string,
  conversationId: string | undefined,
  message: string,
  context: KaiContext,
  waitUntil?: (p: Promise<unknown>) => void,
) {
  const conversation = await getOrCreateConversation(env.DB, { id: conversationId, userId, engine: "kai" });
  const userMessage = await createMessage(env.DB, { conversationId: conversation, role: "user", content: message });

  // Safety wins. Always.
  const safety = await classifySafetyFull(env, message);
  if (!safety.safe) {
    const event = await logSafetyEvent(env, {
      userId,
      conversationId: conversation,
      messageId: userMessage.id,
      rawText: message,
      classification: safety,
    });
    if (event && safety.category && safety.severity) {
      await sendSafetyAlert(env, { eventId: event.id, category: safety.category, severity: safety.severity });
    }
    await createMessage(env.DB, {
      conversationId: conversation,
      role: "assistant",
      content: safety.response ?? "",
      metadata: { safetyEventId: event?.id },
    });
    return Response.json({ conversationId: conversation, reply: safety.response, safetyEvent: event });
  }

  // Session-sticky safety: if this conversation already had a crisis disclosure,
  // a later benign message must NOT snap back to normal coaching. Stay in a warm
  // hold (keep checking in, keep help on the table) until the teen signals safe.
  if ((await conversationHasSafetyEvent(env.DB, conversation)) && !signalsSafeNow(message)) {
    const held = await callClaudeDetailed(env, SAFETY_HOLD_PROMPT, await buildHistory(env, conversation, userId, message), {
      model: selectChatModel(env, "mental", message),
      maxTokens: 320,
    });
    const holdReply = held.source === "fallback" ? SAFETY_HOLD_FALLBACK : held.text;
    await createMessage(env.DB, {
      conversationId: conversation,
      role: "assistant",
      content: holdReply,
      metadata: { safetyHold: true, responseSource: held.source === "anthropic" ? "model" : held.source },
    });
    return Response.json({ conversationId: conversation, reply: holdReply, safetyHold: true });
  }

  // Schedule intent: "add gym every Monday at 6" / "make me a productivity
  // routine" updates the teen's Schedule. Cheap regex pre-filter first, then a
  // single extraction call only when the message actually looks schedule-y.
  let scheduleUpdate: ScheduleIntent | null = null;
  if (looksLikeScheduleRequest(message)) {
    // Pass the user's REAL current items (sent in clientContext) so removal/swap
    // resolves to exact ids instead of an inferred fuzzy phrase.
    scheduleUpdate = await extractScheduleIntent(env, message, undefined, context.clientContext?.scheduleItems);
  }

  // Route to Mind or Body. The pick is internal — user never sees it.
  const decision = await pickAgent(env, message);
  // Durable cross-conversation memory: inject what KAI already knows about them
  // so it picks up where you left off, not from scratch.
  const memory = await loadUserMemory(env, userId);
  let system = renderAgentPrompt(decision, context) + renderMemoryBlock(memory, context.displayName);
  if (scheduleUpdate) {
    const what =
      scheduleUpdate.action === "replace"
        ? "set up a new system"
        : scheduleUpdate.action === "remove"
          ? `drop "${scheduleUpdate.removeQuery ?? "that"}" from their system`
          : "add to their system";
    system += `\n\nSYSTEM UPDATE: The teen just asked to ${what} — it's being saved to their System (in the Schedule section) right now. In ONE warm, natural line, confirm it's done and they can see it in their System. Don't list every item back at them.`;
  }

  // Our chat engine: depth turns run on the tiered model (Sonnet) with a real
  // token/latency budget, and we record provenance so a hardcoded fallback is
  // never mislabeled "model".
  const chatOpts = { model: selectChatModel(env, decision, message), maxTokens: 600 };
  const history = await buildHistory(env, conversation, userId, message);
  const generated = await callClaudeDetailed(env, system, history, chatOpts);
  let reply = generated.text;
  let source = generated.source;

  // Body responses get the post-generation forbidden-language guard: regen with
  // a stricter prompt, up to MAX_BODY_REGENERATIONS, before giving up.
  if (decision === "physical") {
    let attempt = 0;
    while (!passesBodyLanguageFilter(reply) && attempt < MAX_BODY_REGENERATIONS) {
      attempt += 1;
      const stricter = `${renderBodyPrompt(context)}\n\nIMPORTANT: A previous response was rejected by the post-generation filter for using forbidden body-language. Try again, focusing only on posture, mobility, recovery, and performance. Do not describe size, shape, or appearance.`;
      const regen = await callClaudeDetailed(env, stricter, history, chatOpts);
      reply = regen.text;
      source = regen.source;
    }
  }

  const outcome = resolveChatOutcome({ decision, source, reply, passesBodyFilter: passesBodyLanguageFilter(reply) });

  // Genuine model outage: don't fabricate a reply. Tell the client to retry.
  if (outcome.kind === "model_unavailable") return modelUnavailable(conversation);

  reply = outcome.reply;
  const responseSource = outcome.kind === "reply" ? "model" : "body_filter_fallback";

  await createMessage(env.DB, {
    conversationId: conversation,
    role: "assistant",
    content: reply,
    metadata: { routedTo: decision, responseSource },
  });

  // Update durable memory from this exchange — only real model replies, and only
  // on this normal path (crisis turns returned earlier and never reach here, so
  // crisis content never lands in casual memory). The body-language content
  // fallback is a canned safe line, not a real exchange, so it's excluded too.
  // Fire-and-forget: no latency.
  if (outcome.kind === "reply" && waitUntil) {
    waitUntil(updateUserMemory(env, userId, message, reply, memory));
  }

  return Response.json({
    conversationId: conversation,
    reply,
    routedTo: decision,
    responseSource,
    scheduleUpdate: scheduleUpdate ?? undefined,
  });
}

/** Outcome of a routed chat turn after generation + the body-language guard.
 *  Pure decision so it can be unit-tested without a DB or live model:
 *   - reply               → a real Claude reply (capped to one follow-up Q)
 *   - body_filter_fallback → the model spoke but kept tripping the forbidden
 *                            body-language filter; serve the safe canned line
 *                            (a content-safety guarantee, NOT a model outage)
 *   - model_unavailable   → no usable Anthropic reply; the caller signals the
 *                            client to retry instead of faking a line. */
export type ChatOutcome =
  | { kind: "reply"; reply: string }
  | { kind: "body_filter_fallback"; reply: string }
  | { kind: "model_unavailable" };

export function resolveChatOutcome(args: {
  decision: AgentDecision;
  source: ClaudeSource;
  reply: string;
  passesBodyFilter: boolean;
}): ChatOutcome {
  // Content safety wins: a body reply that still trips the filter after regens
  // is replaced with the safe canned line. This is a real, useful message — not
  // a "lost the thread" fake — so we serve it even though the model "spoke".
  if (args.decision === "physical" && !args.passesBodyFilter) {
    return { kind: "body_filter_fallback", reply: BODY_LANGUAGE_FALLBACK };
  }
  // CHAT only ever serves Claude. A non-anthropic source (Llama secondary / rule
  // table) means the model was unavailable — don't fabricate, ask to retry.
  if (args.source !== "anthropic") return { kind: "model_unavailable" };
  return { kind: "reply", reply: limitToOneQuestion(args.reply) };
}

/** Enforce the one-follow-up-question rule deterministically (the prompt alone
 *  doesn't hold — the eval showed back-to-back interrogation). If a reply has
 *  more than one question sentence, drop all but the LAST (the intended
 *  follow-up); statements are untouched. */
export function limitToOneQuestion(reply: string): string {
  const parts = reply.split(/(?<=[.?!])\s+/);
  const qIdx = parts.map((p, i) => (/\?\s*$/.test(p.trim()) ? i : -1)).filter((i) => i >= 0);
  if (qIdx.length <= 1) return reply;
  const keep = qIdx[qIdx.length - 1];
  return parts.filter((_, i) => !qIdx.includes(i) || i === keep).join(" ").trim();
}
