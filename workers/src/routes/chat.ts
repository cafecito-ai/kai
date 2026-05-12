import { Hono } from "hono";
import { callClaude } from "../lib/claude";
import { createMessage, getConversationMessages, getLatestConversation, getOrCreateConversation } from "../lib/conversations";
import { sendSafetyAlert } from "../lib/email";
import { enginePrompt } from "../lib/prompts/engines";
import { kaiSystemPrompt } from "../lib/prompts/kai";
import { classifySafetyFull, logSafetyEvent } from "../lib/safety";
import type { AppVariables, Env, EngineId } from "../types";

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
  const body = await c.req.json<{ conversationId?: string; message: string }>();
  return handleChat(c.env, c.get("userId"), body.conversationId, body.message, kaiSystemPrompt, "kai");
});

chatRoutes.post("/engines/:engineId/chat", async (c) => {
  const engineId = c.req.param("engineId") as EngineId;
  if (!["physical", "potential", "mental"].includes(engineId)) return c.json({ error: "Unknown engine" }, 404);
  const body = await c.req.json<{ conversationId?: string; message: string }>();
  return handleChat(c.env, c.get("userId"), body.conversationId, body.message, enginePrompt(engineId), engineId);
});

async function handleChat(env: Env, userId: string, conversationId: string | undefined, message: string, system: string, engine: EngineId | "kai") {
  const conversation = await getOrCreateConversation(env.DB, { id: conversationId, userId, engine });
  const userMessage = await createMessage(env.DB, { conversationId: conversation, role: "user", content: message });
  const safety = await classifySafetyFull(env, message);
  if (!safety.safe) {
    const event = await logSafetyEvent(env.DB, { userId, conversationId: conversation, messageId: userMessage.id, rawText: message, classification: safety });
    if (event && safety.category && safety.severity) {
      await sendSafetyAlert(env, { eventId: event.id, category: safety.category, severity: safety.severity });
    }
    await createMessage(env.DB, { conversationId: conversation, role: "assistant", content: safety.response ?? "", metadata: { safetyEventId: event?.id } });
    return Response.json({ conversationId: conversation, reply: safety.response, safetyEvent: event });
  }
  const reply = await callClaude(env, system, [{ role: "user", content: message }]);
  await createMessage(env.DB, { conversationId: conversation, role: "assistant", content: reply });
  return Response.json({ conversationId: conversation, reply });
}
