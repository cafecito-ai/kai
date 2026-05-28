import { Hono } from "hono";
import { renderAgentPrompt, renderBodyPrompt } from "../lib/agent-prompts";
import { pickAgent } from "../lib/agent-router";
import {
  BODY_LANGUAGE_FALLBACK,
  passesBodyLanguageFilter,
} from "../lib/body-language-filter";
import { formatKaiReply } from "../lib/chat-format";
import {
  fastKaiReply,
  fastPhysicalReply,
  matchKaiWorkflow,
  matchPhysicalWorkflow,
  safePreSafetyFastReply,
  type WorkflowReply,
} from "../lib/chat-workflows";
import { callClaude } from "../lib/claude";
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
  return handleRoutedChat(
    c.env,
    userId,
    body.conversationId,
    body.message,
    sanitizeClientContext(body.clientContext),
  );
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

async function handleChat(env: Env, userId: string, conversationId: string | undefined, message: string, system: string, engine: EngineId | "kai") {
  const conversation = await getOrCreateConversation(env.DB, { id: conversationId, userId, engine });
  const normalized = normalizeUserMessage(message);
  const userMessage = await createMessage(env.DB, { conversationId: conversation, role: "user", content: message });
  const safety = await classifySafetyFull(env, normalized.text);
  if (!safety.safe) {
    const event = await logSafetyEvent(env, { userId, conversationId: conversation, messageId: userMessage.id, rawText: message, classification: safety });
    if (event && safety.category && safety.severity) {
      await sendSafetyAlert(env, { eventId: event.id, category: safety.category, severity: safety.severity });
    }
    await createMessage(env.DB, { conversationId: conversation, role: "assistant", content: safety.response ?? "", metadata: { safetyEventId: event?.id } });
    return Response.json({ conversationId: conversation, reply: safety.response, safetyEvent: event });
  }
  const recentMessages = await getConversationMessages(env.DB, { conversationId: conversation, userId, limit: 10 });
  const modelMessages = buildModelMessages(recentMessages ?? [], userMessage.id, normalized.modelContent);
  const rawReply = await callClaude(env, withReadableReplyInstructions(system), modelMessages.length ? modelMessages : [{ role: "user", content: normalized.modelContent }]);
  const reply = formatKaiReply(rawReply, engine === "physical" ? "body" : "general");
  await createMessage(env.DB, { conversationId: conversation, role: "assistant", content: reply });
  return Response.json({ conversationId: conversation, reply });
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
  clientContext: KaiContext["clientContext"],
) {
  const conversation = await getOrCreateConversation(env.DB, { id: conversationId, userId, engine: "kai" });
  const normalized = normalizeUserMessage(message);
  const userMessage = await createMessage(env.DB, { conversationId: conversation, role: "user", content: message });

  const preSafetyReply = safePreSafetyFastReply(normalized.text);
  if (preSafetyReply) return persistWorkflowReply(env, conversation, preSafetyReply, { routedTo: "kai" });

  // Safety wins. Always.
  const safety = await classifySafetyFull(env, normalized.text);
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

  const instantReply = matchKaiWorkflow(normalized.text);
  if (instantReply) return persistWorkflowReply(env, conversation, instantReply, { routedTo: "kai" });

  const context = {
    ...(await buildKaiContext(env, userId)),
    clientContext,
  };

  // Route to Mind or Body. The pick is internal — user never sees it.
  const decision = await pickAgent(env, normalized.text);
  const system = withReadableReplyInstructions(renderAgentPrompt(decision, context));
  const recentMessages = await getConversationMessages(env.DB, { conversationId: conversation, userId, limit: 10 });
  const modelMessages = buildModelMessages(recentMessages ?? [], userMessage.id, normalized.modelContent);
  const fastReply = decision === "physical" ? matchPhysicalWorkflow(normalized.text) : null;

  if (fastReply) {
    return persistWorkflowReply(env, conversation, fastReply, { routedTo: decision });
  }

  let reply = await callClaude(env, system, modelMessages.length ? modelMessages : [{ role: "user", content: normalized.modelContent }]);

  // Body responses get the post-generation forbidden-language guard.
  if (decision === "physical") {
    let attempt = 0;
    while (!passesBodyLanguageFilter(reply) && attempt < MAX_BODY_REGENERATIONS) {
      attempt += 1;
      const stricter = withReadableReplyInstructions(`${renderBodyPrompt(context)}\n\nIMPORTANT: A previous response was rejected by the post-generation filter for using forbidden body-language. Try again, focusing only on posture, mobility, recovery, and performance. Do not describe size, shape, or appearance.`);
      reply = await callClaude(env, stricter, modelMessages.length ? modelMessages : [{ role: "user", content: normalized.modelContent }]);
    }
    if (!passesBodyLanguageFilter(reply)) {
      reply = BODY_LANGUAGE_FALLBACK;
    }
  }
  const formattedReply = formatKaiReply(reply, decision === "physical" ? "body" : "mind");

  await createMessage(env.DB, {
    conversationId: conversation,
    role: "assistant",
    content: formattedReply,
    metadata: { routedTo: decision },
  });
  return Response.json({ conversationId: conversation, reply: formattedReply, routedTo: decision });
}

export { fastKaiReply, fastPhysicalReply };

async function persistWorkflowReply(
  env: Env,
  conversation: string,
  workflowReply: WorkflowReply,
  input: { routedTo: EngineId | "kai" },
) {
  const formattedReply = formatKaiReply(workflowReply.reply, workflowReply.mode);
  await createMessage(env.DB, {
    conversationId: conversation,
    role: "assistant",
    content: formattedReply,
    metadata: {
      routedTo: input.routedTo,
      fastPath: true,
      responseSource: workflowReply.source,
      workflow: workflowReply.workflow,
    },
  });
  return Response.json({
    conversationId: conversation,
    reply: formattedReply,
    routedTo: input.routedTo,
    responseSource: workflowReply.source,
    workflow: workflowReply.workflow,
  });
}

function withReadableReplyInstructions(system: string) {
  return `${system}

CONVERSATION STYLE:
- Sound like a trusted friend/coach, not a worksheet or a chatbot script.
- Usually reply in 1-2 short paragraphs separated by a blank line.
- Do not force a philosophy lens, options menu, or closing question every time.
- Ask at most one natural follow-up question, only when it helps the teen keep talking.
- If the user is casual, be casual. If they ask for a plan, be direct and useful.
- No markdown headers.`;
}

function normalizeUserMessage(message: string) {
  const corrected = message
    .replace(/\bdelressed\b/gi, "depressed")
    .replace(/\bdepreseed\b/gi, "depressed")
    .replace(/\bdepresed\b/gi, "depressed")
    .replace(/\banxeity\b/gi, "anxiety")
    .replace(/\banxity\b/gi, "anxiety");
  if (corrected === message) return { text: message, modelContent: message };
  return {
    text: corrected,
    modelContent: `${corrected}\n\nKAI note: The teen typed ${JSON.stringify(message)}. Treat it as a likely typo/autocorrect issue. Do not make a big deal of it; if needed, briefly say what you understood and keep helping.`,
  };
}

function buildModelMessages(
  messages: Array<{ id?: string; role: unknown; content: string }>,
  latestUserMessageId: string,
  latestUserModelContent: string,
) {
  return messages
    .filter((item): item is { id?: string; role: "user" | "assistant"; content: string } => item.role === "user" || item.role === "assistant")
    .map((item) => ({
      role: item.role,
      content: item.id === latestUserMessageId ? latestUserModelContent : item.content,
    }));
}
