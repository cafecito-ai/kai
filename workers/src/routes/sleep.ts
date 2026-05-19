// Sleep log (T-017).
//
//   POST /api/sleep  body: { hours: number, quality?: 1-5, notes?: string }
//
//   - Records score_input(source=sleep_log) feeding sleep_score via the
//     saturating curve in score-calculator.ts.
//   - Mind agent reflects only when patterns are notable per AGENT_PLAN
//     T-017 (3+ nights under 6h, 3+ over 9h). Single entries get a short
//     acknowledgement.
//   - No safety classifier on sleep numbers (they're not free text) —
//     but the optional notes field is screened.

import { Hono } from "hono";
import { renderMindPrompt } from "../lib/agent-prompts";
import { callClaude } from "../lib/claude";
import { buildKaiContext } from "../lib/context";
import { rateLimit, rateLimitedResponse } from "../lib/rate-limit";
import { classifySafetyFull, logSafetyEvent } from "../lib/safety";
import {
  getScoreInputs,
  recordScoreInput,
  todayUtc,
} from "../lib/score-store";
import type { AppVariables, Env } from "../types";

const SLEEP_RATE_LIMIT = {
  route: "sleep",
  limit: 10,
  periodSeconds: 60,
} as const;

export const sleepRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

sleepRoutes.post("/sleep", async (c) => {
  const userId = c.get("userId");
  const limit = await rateLimit(c.env, userId, SLEEP_RATE_LIMIT);
  if (!limit.allowed) return rateLimitedResponse(limit, SLEEP_RATE_LIMIT);

  const body = await c.req.json<{
    hours: number;
    quality?: number;
    notes?: string;
  }>();
  const hours = Number(body.hours);
  if (!Number.isFinite(hours) || hours < 0 || hours > 16) {
    return c.json({ error: "Hours must be 0–16" }, 400);
  }
  const quality =
    typeof body.quality === "number" && body.quality >= 1 && body.quality <= 5
      ? body.quality
      : undefined;
  const notes = (body.notes ?? "").trim();

  // Optional notes: safety screen.
  if (notes) {
    const safety = await classifySafetyFull(c.env, notes);
    if (!safety.safe) {
      await logSafetyEvent(c.env, {
        userId,
        conversationId: undefined,
        messageId: undefined,
        rawText: notes,
        classification: safety,
      });
      return c.json({
        reflection: safety.response,
        score: null,
        safetyFlagged: true,
      });
    }
  }

  const { score } = await recordScoreInput(c.env.DB, {
    userId,
    source: "sleep_log",
    value: { hours, quality, notes: notes || undefined },
  });

  // Pattern check: look back 7 days to decide if a reflection is warranted.
  const reflection = await maybeReflectOnSleep(c.env, userId, hours);

  return c.json({ score, reflection });
});

async function maybeReflectOnSleep(
  env: Env,
  userId: string,
  hoursToday: number,
): Promise<string> {
  // Look up last 7 days of sleep inputs.
  const today = new Date();
  const recent: number[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const inputs = await getScoreInputs(env.DB, userId, date);
    const log = [...inputs]
      .reverse()
      .find((x) => x.source === "sleep_log");
    if (log) {
      const v = log.value as { hours?: number };
      if (typeof v.hours === "number") recent.push(v.hours);
    }
  }

  // Pattern triggers from AGENT_PLAN T-017.
  const lastThree = recent.slice(0, 3);
  const allUnder6 =
    lastThree.length >= 3 && lastThree.every((h) => h < 6);
  const allOver9 =
    lastThree.length >= 3 && lastThree.every((h) => h > 9);

  if (allUnder6 || allOver9) {
    const context = await buildKaiContext(env, userId);
    const system = renderMindPrompt(context);
    const note = allUnder6
      ? `User has logged ${lastThree.length} nights of under 6h sleep in a row (most recent: ${hoursToday}h).`
      : `User has logged ${lastThree.length} nights of over 9h sleep in a row (most recent: ${hoursToday}h).`;
    const userMessage = `${note}\n\nRespond as KAI's Mind side — 2 short sentences max, observational not preachy. No prescription, no supplements, no "you should". Just notice and ask one open question.`;
    return await callClaude(env, system, [
      { role: "user", content: userMessage },
    ]);
  }

  // Single entry — short acknowledgement (no LLM round-trip).
  if (hoursToday >= 7 && hoursToday <= 9) return "Solid. Logged.";
  if (hoursToday < 6) return "Short night. Take it easy on yourself today.";
  if (hoursToday > 10) return "Long one. Hope it left you better than you started.";
  return "Logged.";
}
