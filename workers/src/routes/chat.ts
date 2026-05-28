import { Hono } from "hono";
import { renderAgentPrompt, renderBodyPrompt } from "../lib/agent-prompts";
import { pickAgent } from "../lib/agent-router";
import {
  BODY_LANGUAGE_FALLBACK,
  passesBodyLanguageFilter,
} from "../lib/body-language-filter";
import { formatKaiReply } from "../lib/chat-format";
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

  const instantReply = fastKaiReply(normalized.text);
  if (instantReply) {
    const formattedReply = formatKaiReply(instantReply, "general");
    await createMessage(env.DB, {
      conversationId: conversation,
      role: "assistant",
      content: formattedReply,
      metadata: { fastPath: true },
    });
    return Response.json({ conversationId: conversation, reply: formattedReply, routedTo: "kai" });
  }

  const context = {
    ...(await buildKaiContext(env, userId)),
    clientContext,
  };

  // Route to Mind or Body. The pick is internal — user never sees it.
  const decision = await pickAgent(env, normalized.text);
  const system = withReadableReplyInstructions(renderAgentPrompt(decision, context));
  const recentMessages = await getConversationMessages(env.DB, { conversationId: conversation, userId, limit: 10 });
  const modelMessages = buildModelMessages(recentMessages ?? [], userMessage.id, normalized.modelContent);
  const fastReply = decision === "physical" ? fastPhysicalReply(normalized.text) : null;

  if (fastReply) {
    const formattedReply = formatKaiReply(fastReply, "body");
    await createMessage(env.DB, {
      conversationId: conversation,
      role: "assistant",
      content: formattedReply,
      metadata: { routedTo: decision, fastPath: true },
    });
    return Response.json({ conversationId: conversation, reply: formattedReply, routedTo: decision });
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

export function fastKaiReply(message: string): string | null {
  const text = message.toLowerCase();

  if (/^\s*(yo|hey|hi|hello|sup|what'?s up|wassup|wyd)\s*(kai|coach)?[\s?.!]*$/i.test(message)) {
    return [
      "I’m here. Quick read: don’t make today huge.",
      "Pick one lane right now: mind, body, school, sleep, or confidence. I’ll turn it into the next move.",
    ].join("\n\n");
  }

  if (/\b(sad|depressed|delressed|lonely|empty|numb|down bad|rough day)\b/.test(text)) {
    return [
      "I hear you. Let’s slow this down instead of turning it into a whole verdict on your life.",
      "What happened today that made the sadness louder: something with people, pressure, sleep, your body, or just a wave that showed up?",
      "Marcus would call this the first move: name the thing clearly, then take one small action that is still yours.",
    ].join("\n\n");
  }

  if (/\b(unmotivated|no motivation|lazy|stuck|can't start|cant start|procrastinat|doomscroll|phone addiction)\b/.test(text)) {
    return [
      "Motivation is unreliable. We can still build a first rep.",
      "Put the phone out of reach and give me ten minutes on the smallest useful task. Not the perfect task, the first one.",
      "Want me to pick a 10-minute reset, school block, workout start, or sleep reset?",
    ].join("\n\n");
  }

  if (/\b(overthinking|spiraling|anxious|anxiety|stress|stressed|panic)\b/.test(text)) {
    return [
      "Your brain is trying to protect you by running every scenario. That does not mean every scenario deserves your attention.",
      "Do this once: exhale longer than you inhale for five breaths, then write the exact problem in one sentence.",
      "Want the practical next move, or the philosophy lens for this?",
    ].join("\n\n");
  }

  if (/\b(what should i do|help me|where do i start|start today|lock in|locked in)\b/.test(text)) {
    return [
      "Start with one honest rep: check your mood, move your body for five minutes, or clean up one thing you have been avoiding.",
      "The goal is not to become a new person by tonight. It is to prove you can steer the next ten minutes.",
      "Pick mind, body, school, or sleep and I will make it specific.",
    ].join("\n\n");
  }

  return null;
}

export function fastPhysicalReply(message: string): string | null {
  const text = message.toLowerCase();
  const asksMusclePlan = /\b(bulk|bulking|gain muscle|muscle gain|muscle-building|meal plan|diet)\b/.test(text) &&
    /\b(summer|muscle|bulk|bulking|diet|meal|food|eat|training|workout)\b/.test(text);
  if (!asksMusclePlan) return null;

  return [
    "Let's frame this as a muscle-building phase: train consistently, eat steady meals, and protect recovery.",
    "For food, build each meal around a protein, a carb, a fruit or vegetable, and water. Think eggs with toast and fruit, chicken or tofu with rice and vegetables, or Greek yogurt or a sandwich after training.",
    "For training, aim for three to four strength sessions a week, keep basketball or conditioning in if you play, and treat sleep like part of practice.",
  ].join("\n\n");
}

function withReadableReplyInstructions(system: string) {
  return `${system}

READABILITY OVERRIDE:
- Do not send a wall of text.
- Use 2-3 short paragraphs separated by blank lines.
- Keep each paragraph to 1-2 short sentences.
- No markdown headers.
- End with one short invitation that keeps the conversation going. Offer either a practical next move or a philosophy/discipline lens related to what they shared.`;
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
