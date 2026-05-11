import { Hono } from "hono";
import { callClaude } from "../lib/claude";
import { sendSafetyAlert } from "../lib/email";
import { enginePrompt } from "../lib/prompts/engines";
import { kaiSystemPrompt } from "../lib/prompts/kai";
import { classifySafety, logSafetyEvent } from "../lib/safety";
import type { Env, EngineId } from "../types";

export const chatRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

chatRoutes.post("/kai/chat", async (c) => {
  const body = await c.req.json<{ conversationId?: string; message: string }>();
  return handleChat(c.env, c.get("userId"), body.conversationId, body.message, kaiSystemPrompt);
});

chatRoutes.post("/engines/:engineId/chat", async (c) => {
  const engineId = c.req.param("engineId") as EngineId;
  if (!["physical", "potential", "mental"].includes(engineId)) return c.json({ error: "Unknown engine" }, 404);
  const body = await c.req.json<{ conversationId?: string; message: string }>();
  return handleChat(c.env, c.get("userId"), body.conversationId, body.message, enginePrompt(engineId));
});

async function handleChat(env: Env, userId: string, conversationId: string | undefined, message: string, system: string) {
  const safety = classifySafety(message);
  if (!safety.safe) {
    const event = await logSafetyEvent(env.DB, { userId, conversationId, rawText: message, classification: safety });
    if (event && safety.category && safety.severity) {
      await sendSafetyAlert(env, { eventId: event.id, category: safety.category, severity: safety.severity });
    }
    return Response.json({ reply: safety.response, safetyEvent: event });
  }
  const reply = await callClaude(env, system, [{ role: "user", content: message }]);
  return Response.json({ reply });
}
