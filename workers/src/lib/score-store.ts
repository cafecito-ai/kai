// D1 query helpers for Daily Score (T-009 schema, T-013 ingestion).
//
// Two tables:
//   - daily_scores(user_id, date, mental/sleep/mood/final, band, ...)
//   - score_inputs(id, user_id, date, source, value JSON, created_at)
//
// Ingestion flow: feature endpoints (check-in, journal, food-log, workout,
// sleep-log, goal-progress) call `recordScoreInput()` which inserts a
// score_inputs row and immediately recomputes daily_scores for that
// (user, date). Recompute is idempotent — running twice with the same
// rows returns the same final score.

import {
  calculateDailyScore,
  type ScoreInput,
  type SourceKind,
} from "./score-calculator";

export type DailyScoreRow = {
  userId: string;
  date: string;
  mental: number | null;
  sleep: number | null;
  mood: number | null;
  final: number | null;
  band: "low" | "mid" | "high" | null;
  updatedAt: string;
};

export type ScoreInputRow = {
  id: string;
  userId: string;
  date: string;
  source: SourceKind;
  value: unknown;
  createdAt: string;
};

/** YYYY-MM-DD in UTC. The calculator + UI both use the user's local date,
 *  but for ingestion idempotence we anchor on whatever date the caller
 *  passes in (defaulting to "today" in the caller's local tz). */
export function todayUtc(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────

export async function getDailyScore(
  db: D1Database,
  userId: string,
  date: string,
): Promise<DailyScoreRow | null> {
  const row = await db
    .prepare(
      "SELECT user_id, date, mental_score, sleep_score, mood_score, final_score, band, updated_at FROM daily_scores WHERE user_id = ? AND date = ?",
    )
    .bind(userId, date)
    .first<{
      user_id: string;
      date: string;
      mental_score: number | null;
      sleep_score: number | null;
      mood_score: number | null;
      final_score: number | null;
      band: string | null;
      updated_at: string;
    }>();
  if (!row) return null;
  return {
    userId: row.user_id,
    date: row.date,
    mental: row.mental_score,
    sleep: row.sleep_score,
    mood: row.mood_score,
    final: row.final_score,
    band:
      row.band === "low" || row.band === "mid" || row.band === "high"
        ? row.band
        : null,
    updatedAt: row.updated_at,
  };
}

export async function getScoreInputs(
  db: D1Database,
  userId: string,
  date: string,
): Promise<ScoreInputRow[]> {
  const result = await db
    .prepare(
      "SELECT id, user_id, date, source, value, created_at FROM score_inputs WHERE user_id = ? AND date = ? ORDER BY created_at ASC",
    )
    .bind(userId, date)
    .all<{
      id: string;
      user_id: string;
      date: string;
      source: string;
      value: string;
      created_at: string;
    }>();
  return (result.results ?? []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    date: r.date,
    source: r.source as SourceKind,
    value: safeParse(r.value),
    createdAt: r.created_at,
  }));
}

/** Latest input across the whole user, regardless of date. Used by /home
 *  to render the "Recent" card. */
export async function getLatestScoreInput(
  db: D1Database,
  userId: string,
): Promise<ScoreInputRow | null> {
  const row = await db
    .prepare(
      "SELECT id, user_id, date, source, value, created_at FROM score_inputs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    )
    .bind(userId)
    .first<{
      id: string;
      user_id: string;
      date: string;
      source: string;
      value: string;
      created_at: string;
    }>();
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    source: row.source as SourceKind,
    value: safeParse(row.value),
    createdAt: row.created_at,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Writes — single ingestion entrypoint
// ─────────────────────────────────────────────────────────────────────

/** Record one score input and recompute the user's score for that date. */
export async function recordScoreInput(
  db: D1Database,
  args: {
    userId: string;
    date?: string;
    source: SourceKind;
    value: unknown;
  },
): Promise<{ inputId: string; score: DailyScoreRow }> {
  const date = args.date ?? todayUtc();
  const inputId = `si_${crypto.randomUUID()}`;
  await db
    .prepare(
      "INSERT INTO score_inputs (id, user_id, date, source, value) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(inputId, args.userId, date, args.source, JSON.stringify(args.value))
    .run();
  const score = await recomputeDailyScore(db, args.userId, date);
  return { inputId, score };
}

/** Read all of today's inputs, run the calculator, and upsert daily_scores. */
export async function recomputeDailyScore(
  db: D1Database,
  userId: string,
  date: string,
): Promise<DailyScoreRow> {
  const inputs = await getScoreInputs(db, userId, date);
  const calc: ScoreInput[] = inputs.map((i) => ({
    source: i.source,
    value: i.value,
  }));
  const result = calculateDailyScore(calc);
  await db
    .prepare(
      `INSERT INTO daily_scores (user_id, date, mental_score, sleep_score, mood_score, final_score, band, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, date) DO UPDATE SET
         mental_score = excluded.mental_score,
         sleep_score = excluded.sleep_score,
         mood_score = excluded.mood_score,
         final_score = excluded.final_score,
         band = excluded.band,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      userId,
      date,
      result.mental,
      result.sleep,
      result.mood,
      result.final,
      result.band,
    )
    .run();
  return {
    userId,
    date,
    mental: result.mental,
    sleep: result.sleep,
    mood: result.mood,
    final: result.final,
    band: result.band,
    updatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
