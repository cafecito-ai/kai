import { Hono } from "hono";
import { HAIKU_MODEL, OPUS_MODEL, callClaude } from "../lib/claude";
import { buildKaiContext } from "../lib/context";
import { createMessage, getConversationMessages, getLatestConversation, getOrCreateConversation, getRecentConversationMessages } from "../lib/conversations";
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
  const body = await readChatBody(c);
  if (!body) return c.json({ error: "Invalid payload" }, 400);
  const context = await buildKaiContext(c.env, userId);
  return handleChat(c.env, userId, body.conversationId, body.message, renderKaiSystemPrompt(context), "kai");
});

chatRoutes.post("/engines/:engineId/chat", async (c) => {
  const engineId = c.req.param("engineId") as EngineId;
  if (!["physical", "potential", "mental"].includes(engineId)) return c.json({ error: "Unknown engine" }, 404);
  const userId = c.get("userId");
  const limit = await rateLimit(c.env, userId, CHAT_RATE_LIMIT);
  if (!limit.allowed) return rateLimitedResponse(limit, CHAT_RATE_LIMIT);
  const body = await readChatBody(c);
  if (!body) return c.json({ error: "Invalid payload" }, 400);
  const context = await buildKaiContext(c.env, userId);
  return handleChat(c.env, userId, body.conversationId, body.message, renderEnginePrompt(engineId, context), engineId);
});

async function readChatBody(c: { req: { json: <T>() => Promise<T> } }): Promise<{ conversationId?: string; message: string } | null> {
  try {
    const body = await c.req.json<{ conversationId?: string; message?: unknown }>();
    if (!body || typeof body.message !== "string") return null;
    const trimmed = body.message.trim();
    if (!trimmed) return null;
    return { conversationId: body.conversationId, message: trimmed };
  } catch {
    return null;
  }
}

// User-visible reply when handleChat itself throws — keeps the chat
// surface alive instead of returning a 500 the client renders as the
// generic "could not reach Kai" fallback. Voice matches the rest of
// Kai's recovery copy (no exclamation, no "should").
const HANDLER_CRASH_REPLY = "Something on my end glitched on that turn. Try the same message in a few seconds, or pick a smaller thing to say.";

async function handleChat(env: Env, userId: string, conversationId: string | undefined, message: string, system: string, engine: EngineId | "kai") {
  try {
    const conversation = await getOrCreateConversation(env.DB, { id: conversationId, userId, engine });

    // Load recent turns BEFORE the new user message is persisted so we
    // don't double-include the current message in the Claude prompt.
    // Use getRecentConversationMessages so a long-running conversation
    // sees its newest N turns, not the oldest N (Codex review of #130,
    // P1 — getConversationMessages does ORDER BY ASC LIMIT, which
    // returned the conversation's opening window forever).
    const prior = (await getRecentConversationMessages(env.DB, { conversationId: conversation, userId, limit: HISTORY_TURN_LIMIT })) ?? [];

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
  } catch (err) {
    // A thrown error here used to bubble out as a generic 500 (Cloudflare
    // returns 1101). The client treats any non-2xx as "could not reach
    // Kai" — which masks the real failure. Log the error with the userId
    // + engine, then return a 200 with a voice-on recovery message so the
    // chat surface stays useful while we diagnose. The PII-redacting
    // contract here is the same as elsewhere: never log the raw message,
    // never include it in the response payload.
    console.error("chat handler crashed", {
      userId,
      engine,
      conversationId: conversationId ?? "new",
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    });
    return Response.json({ conversationId: conversationId ?? null, reply: HANDLER_CRASH_REPLY });
  }
}
