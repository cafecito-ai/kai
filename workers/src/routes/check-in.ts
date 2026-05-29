// Emotional check-in (T-015).
//
//   POST /api/check-in
//     body: { mood: 1-5, mind?: string, better?: string }
//
// Flow:
//   1. Safety classifier runs on any free-text response. If safety fires,
//      the response is a crisis handoff and the check-in is NOT recorded as
//      a score input.
//   2. recordScoreInput(check_in, { mood, mind, better }) — feeds the
//      mood_score via T-013 ingestion.
//   3. Mind agent generates a 2–4 sentence reflection grounded in the
//      check-in. Always uses the Mind prompt — check-ins are emotional
//      territory regardless of message content.

import { Hono } from "hono";
import { renderMindPrompt } from "../lib/agent-prompts";
import { callClaude } from "../lib/claude";
import { buildKaiContext } from "../lib/context";
import { sendSafetyAlert } from "../lib/email";
import { detectGrowthPlanSuggestion } from "../lib/growth-plan";
import { rateLimit, rateLimitedResponse } from "../lib/rate-limit";
import { classifySafetyFull, logSafetyEvent } from "../lib/safety";
import { getScoreInputs, recordScoreInput, todayUtc } from "../lib/score-store";
import type { AppVariables, Env } from "../types";

const CHECKIN_RATE_LIMIT = {
  route: "check-in",
  limit: 6,
  periodSeconds: 60,
} as const;

export const checkInRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

checkInRoutes.post("/check-in", async (c) => {
  const userId = c.get("userId");
  const limit = await rateLimit(c.env, userId, CHECKIN_RATE_LIMIT);
  if (!limit.allowed) return rateLimitedResponse(limit, CHECKIN_RATE_LIMIT);

  const body = await c.req.json<{
    mood: number;
    mind?: string;
    better?: string;
  }>();

  // Mood is required + must be 1–5. Free text is optional.
  if (
    !Number.isFinite(body.mood) ||
    body.mood < 1 ||
    body.mood > 5
  ) {
    return c.json({ error: "Mood must be 1–5" }, 400);
  }
  const mind = (body.mind ?? "").trim();
  const better = (body.better ?? "").trim();
  const growthPlanSuggestion = detectGrowthPlanSuggestion([mind, better].filter(Boolean).join(" "), "check_in");

  // Safety check on the free text. If safety fires we don't record the
  // check-in as a score input — we hand the user off and end the flow.
  const combined = [mind, better].filter(Boolean).join(" \n\n");
  if (combined) {
    const safety = await classifySafetyFull(c.env, combined);
    if (!safety.safe) {
      const event = await logSafetyEvent(c.env, {
        userId,
        conversationId: undefined,
        messageId: undefined,
        rawText: combined,
        classification: safety,
      });
      if (event && safety.category && safety.severity) {
        await sendSafetyAlert(c.env, {
          eventId: event.id,
          category: safety.category,
          severity: safety.severity,
        });
      }
      return c.json({
        safetyEvent: event,
        reflection: safety.response,
        score: null,
      });
    }
  }

  // Has-checked-in-today guard: warn (but don't block) repeat check-ins
  // in the same window. AGENT_PLAN T-015 says "available once per morning
  // and once per evening" — we surface a flag the UI can honor without
  // hard-locking the user out.
  const existing = await getScoreInputs(c.env.DB, userId, todayUtc());
  const window = timeWindow();
  const dupInWindow = existing.some(
    (i) =>
      i.source === "check_in" &&
      windowOf(new Date(i.createdAt)) === window,
  );

  // Ingest. value JSON shape matches what the calculator expects.
  const { score } = await recordScoreInput(c.env.DB, {
    userId,
    source: "check_in",
    value: { mood: body.mood, mind, better },
  });

  // Mind agent reflection — context-aware via buildKaiContext.
  const context = await buildKaiContext(c.env, userId);
  const system = renderMindPrompt(context);
  // Build a short user message that summarises the check-in so the Mind
  // agent has something concrete to reflect on, without filling the prompt
  // with form fields.
  const userMessage = formatCheckInForAgent(body.mood, mind, better, window);
  const reflection = await callClaude(c.env, system, [
    { role: "user", content: userMessage },
  ]);

  return c.json({
    score,
    reflection,
    window,
    duplicateInWindow: dupInWindow,
    ...(growthPlanSuggestion ? { growthPlanSuggestion } : {}),
  });
});

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function timeWindow(date = new Date()): "morning" | "evening" | "other" {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 17 && h < 23) return "evening";
  return "other";
}

function windowOf(date: Date): "morning" | "evening" | "other" {
  return timeWindow(date);
}

function moodLabel(m: number): string {
  if (m === 1) return "really rough";
  if (m === 2) return "off";
  if (m === 3) return "okay";
  if (m === 4) return "pretty good";
  return "really good";
}

function formatCheckInForAgent(
  mood: number,
  mind: string,
  better: string,
  window: "morning" | "evening" | "other",
): string {
  const parts = [
    `[Check-in · ${window}] Mood ${mood}/5 (${moodLabel(mood)}).`,
  ];
  if (mind) parts.push(`What's on my mind: ${mind}`);
  if (better) parts.push(`What would make today better: ${better}`);
  parts.push(
    "Please respond as KAI's Mind side — 2 to 4 short sentences, no lists, no namedropping researchers, no toxic positivity. If they shared something hard, meet them in it before suggesting anything.",
  );
  return parts.join("\n\n");
}
