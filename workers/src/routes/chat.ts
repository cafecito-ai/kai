import { Hono } from "hono";
import { renderAgentPrompt, renderBodyPrompt } from "../lib/agent-prompts";
import { pickAgent } from "../lib/agent-router";
import {
  BODY_LANGUAGE_FALLBACK,
  passesBodyLanguageFilter,
} from "../lib/body-language-filter";
import { callClaudeDetailed, selectChatModel } from "../lib/claude";
import { buildKaiContext, type KaiContext } from "../lib/context";
import { createMessage, getConversationMessages, getLatestConversation, getOrCreateConversation } from "../lib/conversations";
import { sendSafetyAlert } from "../lib/email";
import { renderEnginePrompt } from "../lib/prompts/engines";
import { rateLimit, rateLimitedResponse } from "../lib/rate-limit";
import { classifySafetyFull, logSafetyEvent } from "../lib/safety";
import type { AppVariables, Env, EngineId } from "../types";

const MAX_BODY_REGENERATIONS = 3;

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
  return handleRoutedChat(c.env, userId, body.conversationId, body.message, merged);
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
  const recent = await getConversationMessages(env.DB, { conversationId, userId, limit: 10 });
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
  const generated = await callClaudeDetailed(env, system, history, { model: selectChatModel(env, engine, message), maxTokens: 700 });
  const responseSource = generated.source === "anthropic" ? "model" : generated.source === "workers-ai" ? "workers-ai" : "fallback";
  await createMessage(env.DB, { conversationId: conversation, role: "assistant", content: generated.text, metadata: { responseSource } });
  return Response.json({ conversationId: conversation, reply: generated.text, responseSource });
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

  // Route to Mind or Body. The pick is internal — user never sees it.
  const decision = await pickAgent(env, message);
  const system = renderAgentPrompt(decision, context);

  // Our chat engine: depth turns run on the tiered model (Sonnet) with a real
  // token/latency budget, and we record provenance so a hardcoded fallback is
  // never mislabeled "model".
  const chatOpts = { model: selectChatModel(env, decision, message), maxTokens: 700 };
  const history = await buildHistory(env, conversation, userId, message);
  const generated = await callClaudeDetailed(env, system, history, chatOpts);
  let reply = generated.text;
  let source = generated.source;

  // Body responses get the post-generation forbidden-language guard.
  if (decision === "physical") {
    let attempt = 0;
    while (!passesBodyLanguageFilter(reply) && attempt < MAX_BODY_REGENERATIONS) {
      attempt += 1;
      const stricter = `${renderBodyPrompt(context)}\n\nIMPORTANT: A previous response was rejected by the post-generation filter for using forbidden body-language. Try again, focusing only on posture, mobility, recovery, and performance. Do not describe size, shape, or appearance.`;
      const regen = await callClaudeDetailed(env, stricter, history, chatOpts);
      reply = regen.text;
      source = regen.source;
    }
    if (!passesBodyLanguageFilter(reply)) {
      reply = BODY_LANGUAGE_FALLBACK;
      source = "fallback";
    }
  }
  const responseSource = source === "anthropic" ? "model" : source === "workers-ai" ? "workers-ai" : "fallback";

  await createMessage(env.DB, {
    conversationId: conversation,
    role: "assistant",
    content: reply,
    metadata: { routedTo: decision, responseSource },
  });
  return Response.json({ conversationId: conversation, reply, routedTo: decision, responseSource });
}
