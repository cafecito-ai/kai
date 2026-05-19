// /api/score routes — T-011 / T-012 / T-013 / T-014.
//
//   GET  /api/score/today              → today's DailyScoreRow + inputs
//   POST /api/score/input              → record a score input (ingestion)
//   GET  /api/score/recent-input       → latest score_input for the user
//                                        (powers the "Recent" card on /home)

import { Hono } from "hono";
import {
  getDailyScore,
  getLatestScoreInput,
  getScoreInputs,
  recordScoreInput,
  todayUtc,
} from "../lib/score-store";
import type { AppVariables, Env } from "../types";

export const scoreRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

scoreRoutes.get("/score/today", async (c) => {
  const userId = c.get("userId");
  const date = todayUtc();
  // Read both in parallel — they don't depend on each other.
  const [score, inputs] = await Promise.all([
    getDailyScore(c.env.DB, userId, date),
    getScoreInputs(c.env.DB, userId, date),
  ]);
  return c.json({
    date,
    score: score ?? {
      userId,
      date,
      mental: null,
      sleep: null,
      mood: null,
      final: null,
      band: null,
      updatedAt: new Date().toISOString(),
    },
    inputs,
    suggestions: suggestionsFor(score?.final ?? null, inputs.length),
  });
});

scoreRoutes.post("/score/input", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    source: string;
    value: unknown;
    date?: string;
  }>();
  // Source validation — the calculator's CHECK constraint in the DB catches
  // bad sources too, but failing fast at the route boundary is friendlier.
  if (
    ![
      "check_in",
      "journal",
      "food_log",
      "workout",
      "sleep_log",
      "goal_progress",
      "energy_check_in",
    ].includes(body.source)
  ) {
    return c.json({ error: "Unknown source" }, 400);
  }
  const result = await recordScoreInput(c.env.DB, {
    userId,
    date: body.date,
    source: body.source as
      | "check_in"
      | "journal"
      | "food_log"
      | "workout"
      | "sleep_log"
      | "goal_progress"
      | "energy_check_in",
    value: body.value,
  });
  return c.json(result);
});

scoreRoutes.get("/score/recent-input", async (c) => {
  const userId = c.get("userId");
  const row = await getLatestScoreInput(c.env.DB, userId);
  return c.json({ input: row });
});

// ─────────────────────────────────────────────────────────────────────
// Suggestions
// ─────────────────────────────────────────────────────────────────────
//
// Per AGENT_PLAN T-012: at most 2 suggestions, each <10 words, each linking
// to a feature. We start with rule-based suggestions keyed off score band +
// what inputs are missing. A Haiku-generated personalisation pass can swap
// in later (Phase B follow-up) — keeping the contract `string[]` makes that
// a drop-in.

function suggestionsFor(
  final: number | null,
  inputCount: number,
): string[] {
  if (final == null) {
    return [
      "Quick check-in · 30 seconds",
      "Log last night's sleep — even a guess",
    ];
  }
  if (final <= 40) {
    return [
      "Take a slow breath — 3 rounds of 4-4-8",
      "Tell KAI what's loudest right now",
    ];
  }
  if (final <= 70) {
    if (inputCount < 2) return ["Add one more rep — quick check-in"];
    return ["Stretch 5 minutes — undo the day"];
  }
  return ["Lock it in — short evening reflection"];
}
