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

  const preSafetyReply = safePreSafetyFastReply(normalized.text);
  if (preSafetyReply) {
    const formattedReply = formatKaiReply(preSafetyReply, "general");
    await createMessage(env.DB, {
      conversationId: conversation,
      role: "assistant",
      content: formattedReply,
      metadata: { fastPath: true, preSafety: true },
    });
    return Response.json({ conversationId: conversation, reply: formattedReply, routedTo: "kai" });
  }

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

  if (isBenignGreeting(message)) {
    return [
      "I’m here.",
      "What’s the vibe today: mind, body, school, sleep, or confidence?",
    ].join("\n\n");
  }

  if (/\b(sad|depressed|delressed|lonely|empty|numb|down bad|rough day)\b/.test(text)) {
    return [
      "Damn. I’m here with you.",
      "What made it hit today: people, pressure, sleep, or just one of those waves?",
    ].join("\n\n");
  }

  if (/\b(test|quiz|exam|homework|study|studying|school|grades?|class|assignment|finals?)\b/.test(text) && /\b(can'?t focus|focus|pressure|stressed|tomorrow|behind|overwhelmed|locked|lock in)\b/.test(text)) {
    return [
      "School pressure can make your brain freeze.",
      "Do one 12-minute block: phone away, one topic only, then tell me what part still feels messy.",
    ].join("\n\n");
  }

  if (/\b(gym|lifting|lift|weights|workout)\b/.test(text) && /\b(embarrassed|nervous|anxious|awkward|dont know what to do|don't know what to do|new|first time)\b/.test(text)) {
    return [
      "Gym anxiety is normal when you don’t have a script yet.",
      "Make the first trip almost too simple: walk in, do one machine or dumbbell movement, leave with proof you showed up.",
    ].join("\n\n");
  }

  if (/\b(ugly|awkward|low confidence|no confidence|insecure|embarrassed|hate how i look|feel weird)\b/.test(text)) {
    return [
      "That feeling can get loud at school.",
      "Don’t debate your whole identity today. Give me the moment it hits hardest: walking in, talking to people, photos, or being compared?",
    ].join("\n\n");
  }

  if (/\b(invisible|lonely|alone|no one cares|left out)\b/.test(text) && /\b(weekend|weekends|school|today|lately|feel)\b/.test(text)) {
    return [
      "Feeling invisible hits different when there’s no structure around you.",
      "Don’t disappear into the whole weekend. Pick one proof-of-life move: text one person, get outside, or log what you’re feeling.",
    ].join("\n\n");
  }

  if (/\b(friend|friends|group chat|left me out|lonely|crush|delivered|rejected|ignored|social)\b/.test(text)) {
    return [
      "That kind of stuff stings because it hits belonging.",
      "What actually happened: left out, ignored, embarrassed, or you’re reading the silence?",
    ].join("\n\n");
  }

  if (/\b(parents?|mom|dad|home)\b/.test(text) && /\b(fighting|fight|yelling|arguing|cant relax|can't relax|unsafe|stressed)\b/.test(text)) {
    return [
      "Home stress can make your body stay on alert even when you’re doing nothing wrong.",
      "Control the tiny circle first: breathe slower, move to the safest quiet spot, and name one thing you can do in the next five minutes.",
    ].join("\n\n");
  }

  if (/\b(unmotivated|no motivation|lazy|stuck|can't start|cant start|procrastinat|doomscroll|phone addiction)\b/.test(text)) {
    return [
      "Yeah, that stuck feeling is real.",
      "Don’t solve your whole life right now. Give me one thing you’ve been avoiding and I’ll make it a 10-minute start.",
    ].join("\n\n");
  }

  if (/\b(skipped everything|missed everything|broke my streak|failed today|already failed|ruined today)\b/.test(text)) {
    return [
      "You didn’t fail the whole path. You missed a day.",
      "Make today count again with one tiny reset: water, mood log, five-minute clean, or lights-out setup.",
    ].join("\n\n");
  }

  if (/\b(sleep|3am|2am|late|tired|exhausted|can'?t sleep|cant sleep)\b/.test(text) && /\b(scroll|phone|staying up|up until|late|tired|exhausted|can'?t sleep|cant sleep)\b/.test(text)) {
    return [
      "Tonight’s win is not a perfect routine.",
      "It’s making the next hour quieter: dim the screen, plug the phone away from bed, and choose one boring wind-down thing.",
    ].join("\n\n");
  }

  if (/\b(tiktok|instagram|youtube|scroll|scrolling|doomscroll|phone|screen time|social media)\b/.test(text)) {
    return [
      "Your attention got pulled. That doesn’t mean the day is gone.",
      "Put the phone across the room for 15 minutes and pick the replacement: shower, walk, homework sprint, or sleep setup.",
    ].join("\n\n");
  }

  if (/\b(mad|angry|rage|yelled|fight|fighting|mom|dad|parent|parents)\b/.test(text) && /\b(feel bad|guilty|regret|sorry|mad|angry|yelled|fight)\b/.test(text)) {
    return [
      "Feeling bad after anger usually means your standards are still alive.",
      "First repair is small: cool down, then say one clean sentence about what you wish you handled differently.",
    ].join("\n\n");
  }

  if (/\b(point of trying|always quit|why try|i always fail|nothing works|keep quitting|what's the point|whats the point)\b/.test(text)) {
    return [
      "Quitting a lot does not prove you’re broken. It proves the system has been too heavy.",
      "What’s the smallest habit you’d actually repeat for three days?",
    ].join("\n\n");
  }

  if (/\b(cooked|fried|drained|burnt out|burned out|overwhelmed)\b/.test(text) && /\b(what do i do|what should i do|help|start|fix)\b/.test(text)) {
    return [
      "Cooked usually means overloaded, not hopeless.",
      "Do the reset version: water, stand up, clear one surface, then tell me the one thing you’re avoiding.",
    ].join("\n\n");
  }

  if (/\b(overthinking|spiraling|anxious|anxiety|stress|stressed|panic)\b/.test(text)) {
    return [
      "Your brain is doing the too-many-tabs thing.",
      "What’s the main loop: school, people, future, or your own self-talk?",
    ].join("\n\n");
  }

  if (/\b(what should i do|what do i do|help me|where do i start|start today|lock in|locked in)\b/.test(text)) {
    if (/\b(week|this week|plan)\b/.test(text)) {
      return [
        "Here’s the lock-in week: one body rep, one school/work rep, one sleep rep each day.",
        "Keep them small enough to actually finish. Want me to make it basketball, confidence, school, or sleep focused?",
      ].join("\n\n");
    }
    return [
      "Let’s not make it huge.",
      "Pick one: reset your mind, move your body, handle school, or protect sleep.",
    ].join("\n\n");
  }

  return null;
}

function safePreSafetyFastReply(message: string): string | null {
  return isBenignGreeting(message) ? fastKaiReply(message) : null;
}

function isBenignGreeting(message: string): boolean {
  return /^\s*(yo|hey|hi|hello|sup|what'?s up|wassup|wyd)\s*(kai|coach)?[\s?.!]*$/i.test(message);
}

export function fastPhysicalReply(message: string): string | null {
  const text = message.toLowerCase();
  if (/\b(basketball|hoop|shooting|handles|workout|training)\b/.test(text) && /\b(skip|skipping|better|improve|get better|workouts?|practice)\b/.test(text)) {
    return [
      "Basketball improvement needs a repeatable floor, not a perfect workout.",
      "Do 20 minutes today: 5 minutes handles, 10 minutes form shots or wall reps, 5 minutes mobility. Log it so the streak has proof.",
    ].join("\n\n");
  }

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
