import { Hono } from "hono";
import { renderAgentPrompt, renderBodyPrompt } from "../lib/agent-prompts";
import { pickAgent } from "../lib/agent-router";
import {
  BODY_LANGUAGE_FALLBACK,
  passesBodyLanguageFilter,
} from "../lib/body-language-filter";
import { formatKaiReply, repairComplexMessageReply } from "../lib/chat-format";
import {
  fastKaiReply,
  fastPhysicalReply,
  matchContinuationWorkflow,
  matchKaiWorkflow,
  matchPhysicalWorkflow,
  safePreSafetyFastReply,
  type WorkflowReply,
} from "../lib/chat-workflows";
import { callClaudeDetailed, selectChatModel, type ClaudeSource } from "../lib/claude";
import { buildKaiContext, type KaiContext } from "../lib/context";
import { createMessage, deleteConversationForUser, getConversationMessages, getLatestConversation, getOrCreateConversation } from "../lib/conversations";
import { sendSafetyAlert } from "../lib/email";
import { detectGrowthPlanSuggestion, type GrowthPlanSuggestion } from "../lib/growth-plan";
import { renderEnginePrompt } from "../lib/prompts/engines";
import { rateLimit, rateLimitedResponse } from "../lib/rate-limit";
import { classifySafetyFull, logSafetyEvent } from "../lib/safety";
import type { AppVariables, Env, EngineId } from "../types";

const MAX_BODY_REGENERATIONS = 3;

// Routed/engine chat turns are real coaching (greetings are served by the
// fast-paths upstream), so give the model room for the "go deeper" replies
// the prompts ask for. ~600–800 tokens ≈ a full, useful coaching answer.
const DEPTH_MAX_TOKENS = 700;

// Fast-path canned replies are tuned for brief messages. Longer openers carry
// nuance the keyword matchers mangle, so they go to the model instead.
const MAX_FASTPATH_LEN = 160;
const MAX_CONTINUATION_LEN = 60;

const CHAT_RATE_LIMIT = { route: "chat", limit: 30, periodSeconds: 60 } as const;

/** Map LLM provenance to the responseSource we expose. A "fallback" reply is
 *  the hardcoded rule table — never advertise it as "model". */
function sourceLabel(source: ClaudeSource): string {
  if (source === "anthropic") return "model";
  if (source === "workers-ai") return "workers-ai";
  return "fallback";
}

export const chatRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

chatRoutes.get("/conversations/current", async (c) => {
  const engine = (c.req.query("engine") ?? "kai") as EngineId | "kai";
  if (!["kai", "physical", "potential", "mental"].includes(engine)) return c.json({ error: "Unknown engine" }, 404);
  const conversation = await getLatestConversation(c.env.DB, { userId: c.get("userId"), engine });
  if (!conversation) return c.json({ conversationId: null, messages: [] });
  const messages = await getConversationMessages(c.env.DB, { conversationId: conversation.id, userId: c.get("userId") });
  return c.json({ conversationId: conversation.id, messages: messages ?? [] });
});

chatRoutes.delete("/conversations/:conversationId", async (c) => {
  const deleted = await deleteConversationForUser(c.env.DB, {
    conversationId: c.req.param("conversationId"),
    userId: c.get("userId"),
  });
  if (!deleted) return c.json({ error: "Conversation not found" }, 404);
  return c.json({ ok: true });
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
  const latestCheckIn = (r.latestCheckIn as Record<string, unknown>) ?? null;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const str = (v: unknown, max = 120) =>
    typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
  const checkInWindow = (v: unknown) =>
    v === "morning" || v === "evening" || v === "other" ? v : "other";
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
    latestCheckIn: latestCheckIn
      ? {
          mood: Math.max(1, Math.min(5, Math.floor(num(latestCheckIn.mood) ?? 3))),
          moodLabel: str(latestCheckIn.moodLabel, 40),
          mind: str(latestCheckIn.mind, 220),
          better: str(latestCheckIn.better, 180),
          reflection: str(latestCheckIn.reflection, 260),
          window: checkInWindow(latestCheckIn.window),
          createdAt: str(latestCheckIn.createdAt, 40),
        }
      : null,
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
  const growthPlanSuggestion = detectGrowthPlanSuggestion(normalized.text, "chat");
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
  const engineDecision = engine === "physical" ? "physical" : "mental";
  const generated = await callClaudeDetailed(
    env,
    withReadableReplyInstructions(system),
    modelMessages.length ? modelMessages : [{ role: "user", content: normalized.modelContent }],
    { model: selectChatModel(env, engineDecision, normalized.text), maxTokens: DEPTH_MAX_TOKENS },
  );
  const reply = repairComplexMessageReply(formatKaiReply(generated.text, engine === "physical" ? "body" : "general"), normalized.text);
  await createMessage(env.DB, { conversationId: conversation, role: "assistant", content: reply, metadata: { responseSource: sourceLabel(generated.source), growthPlanSuggestion } });
  return chatJson({ conversationId: conversation, reply, responseSource: sourceLabel(generated.source), growthPlanSuggestion });
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
  const growthPlanSuggestion = detectGrowthPlanSuggestion(normalized.text, "chat");
  const userMessage = await createMessage(env.DB, { conversationId: conversation, role: "user", content: message });

  const preSafetyReply = safePreSafetyFastReply(normalized.text);
  if (preSafetyReply) return persistWorkflowReply(env, conversation, preSafetyReply, { routedTo: "kai", growthPlanSuggestion });

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

  const recentMessagesForWorkflow = await getConversationMessages(env.DB, { conversationId: conversation, userId, limit: 8 });
  const priorAssistantCount = (recentMessagesForWorkflow ?? []).filter(
    (m) => m.role === "assistant" && typeof m.content === "string" && m.content.trim().length > 0,
  ).length;

  // Continuation workflows are keyword matchers designed for a SHORT follow-up
  // right after the opening canned reply (e.g. "photos", "people", "shot reps").
  // They self-loop if allowed to keep firing (their own reply contains the
  // keyword they match on), so restrict them to the first follow-up (exactly one
  // prior assistant turn) AND to short messages. Anything longer or later is a
  // real conversation → the model handles it with full context.
  if (priorAssistantCount === 1 && normalized.text.length <= MAX_CONTINUATION_LEN) {
    const continuationReply = matchContinuationWorkflow(normalized.text, recentMessagesForWorkflow ?? []);
    if (continuationReply) return persistWorkflowReply(env, conversation, continuationReply, {
      routedTo: continuationReply.mode === "body" ? "physical" : "kai",
      growthPlanSuggestion,
    });
  }

  // The stateless instant workflows match a single message with NO view of
  // history. Let them answer only the OPENING turn, and only for SHORT messages
  // (the canned replies are tuned for brief common openers like "im lonely";
  // long, rich messages get greedily mis-matched, so send those to the model).
  // Once a conversation is underway, every turn defers to the model.
  if (priorAssistantCount === 0 && normalized.text.length <= MAX_FASTPATH_LEN) {
    const physicalWorkflowReply = matchPhysicalWorkflow(normalized.text);
    if (physicalWorkflowReply) return persistWorkflowReply(env, conversation, physicalWorkflowReply, { routedTo: "physical", growthPlanSuggestion });

    const instantReply = matchKaiWorkflow(normalized.text);
    if (instantReply) return persistWorkflowReply(env, conversation, instantReply, { routedTo: "kai", growthPlanSuggestion });
  }

  const context = {
    ...(await buildKaiContext(env, userId)),
    clientContext,
  };

  // Route to Mind or Body. The pick is internal — user never sees it.
  const decision = await pickAgent(env, normalized.text);
  const system = withReadableReplyInstructions(renderAgentPrompt(decision, context));
  const recentMessages = recentMessagesForWorkflow ?? await getConversationMessages(env.DB, { conversationId: conversation, userId, limit: 10 });
  const modelMessages = buildModelMessages(recentMessages ?? [], userMessage.id, normalized.modelContent);
  const promptMessages = modelMessages.length ? modelMessages : [{ role: "user" as const, content: normalized.modelContent }];
  // Depth turns: a stronger model with room to breathe (the workflow
  // fast-paths already handled greetings, so anything here is real coaching).
  const chatOpts = { model: selectChatModel(env, decision, normalized.text), maxTokens: DEPTH_MAX_TOKENS };
  const generated = await callClaudeDetailed(env, system, promptMessages, chatOpts);
  let reply = generated.text;
  let source: ClaudeSource = generated.source;

  // Body responses get the post-generation forbidden-language guard.
  if (decision === "physical") {
    let attempt = 0;
    while (!passesBodyLanguageFilter(reply) && attempt < MAX_BODY_REGENERATIONS) {
      attempt += 1;
      const stricter = withReadableReplyInstructions(`${renderBodyPrompt(context)}\n\nIMPORTANT: A previous response was rejected by the post-generation filter for using forbidden body-language. Try again, focusing only on posture, mobility, recovery, and performance. Do not describe size, shape, or appearance.`);
      const regen = await callClaudeDetailed(env, stricter, promptMessages, chatOpts);
      reply = regen.text;
      source = regen.source;
    }
    if (!passesBodyLanguageFilter(reply)) {
      reply = BODY_LANGUAGE_FALLBACK;
      source = "fallback";
    }
  }
  const formattedReply = repairComplexMessageReply(formatKaiReply(reply, decision === "physical" ? "body" : "mind"), normalized.text);
  const responseSource = sourceLabel(source);

  await createMessage(env.DB, {
    conversationId: conversation,
    role: "assistant",
    content: formattedReply,
    metadata: { routedTo: decision, responseSource, growthPlanSuggestion },
  });
  return chatJson({ conversationId: conversation, reply: formattedReply, routedTo: decision, responseSource, growthPlanSuggestion });
}

export { fastKaiReply, fastPhysicalReply };

async function persistWorkflowReply(
  env: Env,
  conversation: string,
  workflowReply: WorkflowReply,
  input: { routedTo: EngineId | "kai"; growthPlanSuggestion?: GrowthPlanSuggestion | null },
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
      growthPlanSuggestion: input.growthPlanSuggestion ?? null,
    },
  });
  return chatJson({
    conversationId: conversation,
    reply: formattedReply,
    routedTo: input.routedTo,
    responseSource: workflowReply.source,
    workflow: workflowReply.workflow,
    growthPlanSuggestion: input.growthPlanSuggestion ?? null,
  });
}

function chatJson(body: {
  conversationId: string;
  reply?: string;
  routedTo?: EngineId | "kai";
  responseSource?: string;
  workflow?: string;
  growthPlanSuggestion?: GrowthPlanSuggestion | null;
}) {
  const { growthPlanSuggestion, ...rest } = body;
  return Response.json(growthPlanSuggestion ? { ...rest, growthPlanSuggestion } : rest);
}

function withReadableReplyInstructions(system: string) {
  return `${system}

	CONVERSATION STYLE:
	- Sound like a trusted friend/coach, not a worksheet or a chatbot script.
	- For simple greetings, stay quick. For almost anything else, do not give a thin two-line reply.
	- For advice, plans, relationship questions, nutrition, confidence, school pressure, loneliness, motivation, identity, or anything emotionally loaded, go deeper: validate the feeling, name the likely pattern, give the why, offer concrete steps/examples/scripts, and ask one grounded follow-up.
	- Bullet points are allowed when they make the answer easier to use. Keep them practical and human, not corporate.
	- Do not force a philosophy lens or options menu every time.
	- Ask at most one natural follow-up question, only when it helps the teen keep talking.
	- If the user is casual, be casual. If they ask for a plan, be direct and useful.
- Users may write long, messy, complicated, or explicit messages. Do not ask them to restate it more plainly just because the wording is hard; answer the best-understood meaning unless the safety guardrails require a refusal or crisis response.
- For long or complex messages, first name the emotional core in one sentence, then give a useful path forward with concrete next moves. Only after that may you ask one specific clarifying question if a missing detail truly matters.
- Never use "say it more plainly", "restate it", "tell me more about each piece", or similar deflection. Do not start with "It sounds like".
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
