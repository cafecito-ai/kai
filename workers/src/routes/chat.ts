import { Hono } from "hono";
import { callClaude } from "../lib/claude";
import { buildKaiContext } from "../lib/context";
import { createMessage, getConversationMessages, getLatestConversation, getOrCreateConversation } from "../lib/conversations";
import { sendSafetyAlert } from "../lib/email";
import { inferKaiNextAction, KAI_NEXT_ACTIONS, type KaiActionId, type KaiNextAction } from "../lib/kai-actions";
import { renderEnginePrompt } from "../lib/prompts/engines";
import { renderGuideConceptsForAction, renderKaiSystemPrompt } from "../lib/prompts/kai";
import { rateLimit, rateLimitedResponse } from "../lib/rate-limit";
import { classifySafetyFull, logSafetyEvent } from "../lib/safety";
import type { AppVariables, Env, EngineId } from "../types";

const CHAT_RATE_LIMIT = { route: "chat", limit: 30, periodSeconds: 60 } as const;

export const chatRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

chatRoutes.get("/conversations/current", async (c) => {
  const engine = (c.req.query("engine") ?? "kai") as EngineId | "kai";
  if (!["kai", "physical", "potential", "mental"].includes(engine)) return c.json({ error: "Unknown engine" }, 404);
  const conversation = await getLatestConversation(c.env.DB, { userId: c.get("userId"), engine });
  if (!conversation) return c.json({ conversationId: null, messages: [] });
  const messages = await getConversationMessages(c.env.DB, { conversationId: conversation.id, userId: c.get("userId") });
  return c.json({ conversationId: conversation.id, messages: messages ?? [], nextAction: inferLatestNextAction(messages ?? []) });
});

chatRoutes.post("/conversations/tool-completion", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ conversationId?: string | null; title?: string; summary?: string; nextActionId?: string }>();
  const title = normalizeToolText(body.title, 70);
  const summary = normalizeToolText(body.summary, 320);
  if (!title || !summary) return c.json({ error: "Tool completion needs a title and summary" }, 400);
  const nextAction = body.nextActionId && isKaiActionId(body.nextActionId) ? KAI_NEXT_ACTIONS[body.nextActionId] : inferKaiNextAction(`${title} ${summary}`);
  const conversationId = await getOrCreateConversation(c.env.DB, { id: body.conversationId ?? undefined, userId, engine: "kai" });
  const content = `${title} saved. ${summary}`;
  const message = await createMessage(c.env.DB, {
    conversationId,
    role: "assistant",
    content,
    metadata: { source: "tool_completion", nextAction }
  });
  return c.json({ conversationId, message: { ...message, role: "assistant", content }, nextAction });
});

chatRoutes.post("/kai/chat", async (c) => {
  const userId = c.get("userId");
  const limit = await rateLimit(c.env, userId, CHAT_RATE_LIMIT);
  if (!limit.allowed) return rateLimitedResponse(limit, CHAT_RATE_LIMIT);
  const body = await c.req.json<{ conversationId?: string; message: string }>();
  const context = await buildKaiContext(c.env, userId);
  return handleChat(c.env, userId, body.conversationId, body.message, renderKaiSystemPrompt(context), "kai");
});

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
  const nextAction = inferKaiNextAction(normalized.text);
  const systemWithGuideContext = `${system}\n\n${renderGuideConceptsForAction(nextAction.id)}`;
  const safety = await classifySafetyFull(env, normalized.text);
  if (!safety.safe) {
    const event = await logSafetyEvent(env, { userId, conversationId: conversation, messageId: userMessage.id, rawText: message, classification: safety });
    if (event && safety.category && safety.severity) {
      await sendSafetyAlert(env, { eventId: event.id, category: safety.category, severity: safety.severity });
    }
    await createMessage(env.DB, { conversationId: conversation, role: "assistant", content: safety.response ?? "", metadata: { safetyEventId: event?.id, nextAction } });
    return Response.json({ conversationId: conversation, reply: safety.response, safetyEvent: event, nextAction });
  }
  const recentMessages = await getConversationMessages(env.DB, { conversationId: conversation, userId, limit: 10 });
  const modelMessages = (recentMessages ?? [])
    .filter((item): item is typeof item & { role: "user" | "assistant" } => item.role === "user" || item.role === "assistant")
    .map((item) => ({ role: item.role, content: item.id === userMessage.id ? normalized.modelContent : item.content }));
  const rawReply = await callClaude(env, systemWithGuideContext, modelMessages.length ? modelMessages : [{ role: "user", content: normalized.modelContent }]);
  const reply = tightenControlLayerReply(rawReply, nextAction);
  await createMessage(env.DB, { conversationId: conversation, role: "assistant", content: reply, metadata: { nextAction } });
  return Response.json({ conversationId: conversation, reply, nextAction });
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
    modelContent: `${corrected}\n\nKai note: The teen typed ${JSON.stringify(message)}. Treat it as a likely typo/autocorrect issue. Do not make a big deal of it; if needed, briefly say what you understood and keep helping.`
  };
}

function tightenControlLayerReply(reply: string, nextAction: KaiNextAction) {
  const trimmed = reply.trim();
  if (!trimmed || nextAction.id === "talk" || nextAction.id === "reset") return trimmed;

  const genericPatterns = [
    /\bWant to talk it out or pick a reset\?\s*/i,
    /\bWant to pick a reset or talk it out\?\s*/i,
    /\bCan you tell me more about what'?s going on\?\s*/i,
    /\bCan you tell me more about what is going on\?\s*/i,
    /\bCan you tell me more about what'?s making you feel that way\?\s*/i,
    /\bIs it something specific that'?s making you feel/i
  ];
  if (!genericPatterns.some((pattern) => pattern.test(trimmed)) && hasActionSignal(trimmed, nextAction.id) && hasActionMove(trimmed)) return trimmed;

  return controlLayerFallbacks[nextAction.id];
}

function hasActionSignal(reply: string, actionId: Exclude<KaiActionId, "talk" | "reset">) {
  const lower = reply.toLowerCase();
  return actionSignals[actionId].some((signal) => lower.includes(signal));
}

function hasActionMove(reply: string) {
  const lower = reply.toLowerCase();
  if (lower.includes("open ")) return true;
  return false;
}

const actionSignals: Record<Exclude<KaiActionId, "talk" | "reset">, string[]> = {
  food: ["fuel", "food", "eat", "meal", "practice"],
  sleep: ["sleep", "recovery", "wind-down", "tired", "wired"],
  stretch: ["stretch", "mobility", "tight", "sore", "body reset"],
  scan: ["body scan", "posture", "alignment", "private scan"],
  goal: ["goal", "next visible rep", "assignment", "next action"],
  confidence: ["confidence", "proof", "fake hype", "evidence"],
  social: ["social", "boundary", "group chat", "left out"],
  screen: ["screen", "phone", "scroll", "doomscroll", "comparison"]
};

const controlLayerFallbacks: Record<Exclude<KaiActionId, "talk" | "reset">, string> = {
  food: "Fuel check is the move. Keep it simple: carbs, protein, and water before practice. Open Food and log what you have so Kai can use it for the next read.",
  sleep: "Sleep protection is the move. Keep today lighter, get water and food in, and protect tonight's wind-down. Open Sleep and log the rough night so Kai can carry it forward.",
  stretch: "Stretch reset is the move. Pick one tight area, breathe slowly, and do a short mobility rep. Open Stretch so Kai can guide it.",
  scan: "Private body scan is the move. Check posture and recovery without judging your body. Open Body scan and let Kai turn it into one useful next adjustment.",
  goal: "One goal move is the play. Shrink the assignment to the next visible rep, not the whole mountain. Open Goal and lock the next action.",
  confidence: "Confidence proof is the move. Skip fake hype and bank one small piece of evidence today. Open Confidence and choose the proof rep.",
  social: "A calm social boundary is the move. Separate the group-chat story from what you actually know, then pick one steady response. Open Social and write it cleanly.",
  screen: "Screen reset is the move. No guilt spiral. Put the phone down for one hour and choose a replacement that gives your brain a break. Open Screen reset."
};

function normalizeToolText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function isKaiActionId(value: string): value is KaiActionId {
  return value in KAI_NEXT_ACTIONS;
}

function inferLatestNextAction(messages: Array<{ role: unknown; content: string; metadata?: unknown }>): KaiNextAction | null {
  for (const message of [...messages].reverse()) {
    const action = readMetadataNextAction(message.metadata);
    if (action) return action;
    if (message.role === "user") return inferKaiNextAction(message.content);
  }
  return null;
}

function readMetadataNextAction(metadata: unknown): KaiNextAction | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const nextAction = (metadata as { nextAction?: unknown }).nextAction;
  if (!nextAction || typeof nextAction !== "object" || Array.isArray(nextAction)) return null;
  const id = (nextAction as { id?: unknown }).id;
  return typeof id === "string" && isKaiActionId(id) ? KAI_NEXT_ACTIONS[id] : null;
}
