import { Hono } from "hono";
import { HAIKU_MODEL, OPUS_MODEL, callClaude } from "../lib/claude";
import { buildKaiContext } from "../lib/context";
import { createMessage, getConversationMessages, getLatestConversation, getOrCreateConversation } from "../lib/conversations";
import { sendSafetyAlert } from "../lib/email";
import { renderEnginePrompt } from "../lib/prompts/engines";
import { renderKaiSystemPrompt } from "../lib/prompts/kai";
import { rateLimit, rateLimitedResponse } from "../lib/rate-limit";
import { classifySafetyFull, logSafetyEvent } from "../lib/safety";
import type { AppVariables, Env, EngineId } from "../types";

// Spec §6 model selection. Kai (general operator) is fast/cheap, Mental
// gets the highest-quality model, Physical and the legacy Potential
// surface stay on Sonnet (callClaude's default).
function modelForEngine(engine: EngineId | "kai"): string | undefined {
  if (engine === "kai") return HAIKU_MODEL;
  if (engine === "mental") return OPUS_MODEL;
  return undefined; // sonnet via callClaude default
}

// How many prior turns to send back to the model on each chat request.
// Cap kept small to bound Anthropic spend; the system prompt already
// carries the durable context (intake summary, streak, etc.).
const HISTORY_TURN_LIMIT = 12;

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

  // Load recent turns BEFORE the new user message is persisted so we
  // don't double-include the current message in the Claude prompt.
  // getConversationMessages returns oldest-first; we want the most
  // recent N, so load up to 50 then slice the tail.
  const allPrior = (await getConversationMessages(env.DB, { conversationId: conversation, userId, limit: 50 })) ?? [];
  const prior = allPrior.slice(-HISTORY_TURN_LIMIT);

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

  // Build the Anthropic messages array: prior user/assistant turns
  // followed by the new user message. Claude requires the array start
  // with a user role and forbids two consecutive turns from the same
  // role, so we strip a leading assistant and drop the trailing turn
  // if it's already a user (would collide with the new user message).
  const history = prior
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  while (history.length > 0 && history[0].role !== "user") history.shift();
  if (history.length > 0 && history[history.length - 1].role === "user") history.pop();

  const reply = await callClaude(env, system, [...history, { role: "user", content: message }], {
    model: modelForEngine(engine)
  });
  await createMessage(env.DB, { conversationId: conversation, role: "assistant", content: reply });
  return Response.json({ conversationId: conversation, reply });
}
