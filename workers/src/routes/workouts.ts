// T-023 — Workout logging route.
//
// POST /api/workouts/log
//   body: { type, durationMin, intensity, notes? }
//   → inserts into `workouts` table
//   → records a score_input so mood/mental sub-scores update
//   → generates a Body-agent 2-3 sentence comment, filtered
//   → returns { workoutId, bodyComment, score }
//
// GET /api/workouts/recent?limit=10 → last N workouts for the Progress tab.

import { Hono } from "hono";
import { buildKaiContext } from "../lib/context";
import { recordScoreInput, todayUtc } from "../lib/score-store";
import { generateWorkoutComment, type WorkoutPayload } from "../lib/workout-comment";
import type { AppVariables, Env } from "../types";

export const workoutsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const VALID_TYPES = ["run", "strength", "yoga", "sport", "other"] as const;

workoutsRoutes.post("/workouts/log", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    type?: string;
    durationMin?: number;
    intensity?: number;
    notes?: string;
  }>();

  // Validate.
  if (!body.type || !VALID_TYPES.includes(body.type as (typeof VALID_TYPES)[number])) {
    return c.json({ error: "type must be one of: " + VALID_TYPES.join(", ") }, 400);
  }
  if (
    typeof body.durationMin !== "number" ||
    !Number.isFinite(body.durationMin) ||
    body.durationMin < 1 ||
    body.durationMin > 300
  ) {
    return c.json({ error: "durationMin must be a number between 1 and 300" }, 400);
  }
  if (
    typeof body.intensity !== "number" ||
    !Number.isInteger(body.intensity) ||
    body.intensity < 1 ||
    body.intensity > 5
  ) {
    return c.json({ error: "intensity must be an integer 1-5" }, 400);
  }

  const payload: WorkoutPayload = {
    type: body.type as WorkoutPayload["type"],
    durationMin: Math.round(body.durationMin),
    intensity: body.intensity as WorkoutPayload["intensity"],
    notes: body.notes?.slice(0, 500),
  };

  const id = `wo_${crypto.randomUUID()}`;
  const date = todayUtc();

  // Run DB insert + comment generation in parallel.
  const context = await buildKaiContext(c.env, userId);
  const [commentResult, _insert, scoreResult] = await Promise.all([
    generateWorkoutComment(c.env, context, payload),
    c.env.DB
      .prepare(
        "INSERT INTO workouts (id, user_id, date, type, duration_min, intensity, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        id,
        userId,
        date,
        payload.type,
        payload.durationMin,
        payload.intensity,
        payload.notes ?? null,
      )
      .run(),
    // Score ingestion — workout contributes to mood (exercise → mood lift).
    recordScoreInput(c.env.DB, {
      userId,
      date,
      source: "workout",
      value: {
        type: payload.type,
        durationMin: payload.durationMin,
        intensity: payload.intensity,
      },
    }),
  ]);

  return c.json({
    workoutId: id,
    bodyComment: commentResult.comment,
    score: scoreResult.score,
  });
});

workoutsRoutes.get("/workouts/recent", async (c) => {
  const userId = c.get("userId");
  const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") ?? 10)));
  const result = await c.env.DB
    .prepare(
      "SELECT id, date, type, duration_min, intensity, notes, created_at FROM workouts WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT ?",
    )
    .bind(userId, limit)
    .all<{
      id: string;
      date: string;
      type: string;
      duration_min: number;
      intensity: number;
      notes: string | null;
      created_at: string;
    }>();
  return c.json({
    workouts: (result.results ?? []).map((r) => ({
      id: r.id,
      date: r.date,
      type: r.type,
      durationMin: r.duration_min,
      intensity: r.intensity,
      notes: r.notes,
      createdAt: r.created_at,
    })),
  });
});
