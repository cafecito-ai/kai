// D1 helpers for user_patterns (T-021).
//
// Two operations:
//   - recomputeUserPatterns(db, userId) — wipe + rewrite this user's
//     patterns from the last 14 days of score_inputs + daily_scores.
//     Idempotent. Each pattern gets a 14-day expiry stamp.
//   - getRecentPatterns(db, userId)     — read non-expired patterns. Used
//     by buildKaiContext to inject into the Mind agent prompt.

import {
  aggregateDaySignals,
  detectPatterns,
  type RawInput,
  type ScoreRow,
} from "./mental-patterns";

const WINDOW_DAYS = 14;
const PATTERN_TTL_DAYS = 14;

export type StoredPattern = {
  id: string;
  observation: string;
  detectedAt: string;
  expiresAt: string;
};

// ─────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────

/** Non-expired patterns, newest first, capped at 5. */
export async function getRecentPatterns(
  db: D1Database,
  userId: string,
  limit = 5,
): Promise<StoredPattern[]> {
  const nowIso = new Date().toISOString();
  const result = await db
    .prepare(
      "SELECT id, observation, detected_at, expires_at FROM user_patterns WHERE user_id = ? AND expires_at > ? ORDER BY detected_at DESC LIMIT ?",
    )
    .bind(userId, nowIso, limit)
    .all<{
      id: string;
      observation: string;
      detected_at: string;
      expires_at: string;
    }>();
  return (result.results ?? []).map((r) => ({
    id: r.id,
    observation: r.observation,
    detectedAt: r.detected_at,
    expiresAt: r.expires_at,
  }));
}

// ─────────────────────────────────────────────────────────────────────
// Recompute
// ─────────────────────────────────────────────────────────────────────

/**
 * Pull the last 14 days of score_inputs + daily_scores for this user, run
 * the detector, and replace the user's stored patterns with the result.
 *
 * Wipe-and-replace is intentional — patterns are derived state, and we
 * don't want stale observations lingering after the underlying signal has
 * changed.
 */
export async function recomputeUserPatterns(
  db: D1Database,
  userId: string,
  now: Date = new Date(),
): Promise<{ patternsWritten: number; patterns: string[] }> {
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - WINDOW_DAYS);
  const windowStartIso = windowStart.toISOString().slice(0, 10);

  // Pull abstracted-only fields from score_inputs.
  // NOTE: we read `value` as JSON, but the detector pipeline only looks
  // at known numeric fields (mood, hours, sentiment, journalCount). Any
  // freeform `note` / `mind` / `better` text is loaded but never read —
  // the boundary in mental-patterns.ts enforces this.
  const inputsResult = await db
    .prepare(
      "SELECT date, source, value FROM score_inputs WHERE user_id = ? AND date >= ? ORDER BY date ASC",
    )
    .bind(userId, windowStartIso)
    .all<{ date: string; source: string; value: string }>();

  const inputs: RawInput[] = (inputsResult.results ?? []).map((r) => ({
    date: r.date,
    source: r.source,
    value: safeParse(r.value),
  }));

  const scoresResult = await db
    .prepare(
      "SELECT date, final_score FROM daily_scores WHERE user_id = ? AND date >= ? ORDER BY date ASC",
    )
    .bind(userId, windowStartIso)
    .all<{ date: string; final_score: number | null }>();

  const scoreRows: ScoreRow[] = (scoresResult.results ?? []).map((r) => ({
    date: r.date,
    final: r.final_score,
  }));

  const days = aggregateDaySignals(inputs, scoreRows);
  const patterns = detectPatterns(days, now);

  // Wipe + rewrite.
  await db
    .prepare("DELETE FROM user_patterns WHERE user_id = ?")
    .bind(userId)
    .run();

  if (patterns.length === 0) {
    return { patternsWritten: 0, patterns: [] };
  }

  const expires = new Date(now);
  expires.setDate(expires.getDate() + PATTERN_TTL_DAYS);
  const expiresIso = expires.toISOString();
  const detectedIso = now.toISOString();

  // D1 doesn't have a batch insert helper that's much faster than a
  // simple loop, and 5 patterns max per user keeps this cheap.
  for (const observation of patterns) {
    const id = `pat_${crypto.randomUUID()}`;
    await db
      .prepare(
        "INSERT INTO user_patterns (id, user_id, observation, detected_at, expires_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(id, userId, observation, detectedIso, expiresIso)
      .run();
  }

  return { patternsWritten: patterns.length, patterns };
}

// ─────────────────────────────────────────────────────────────────────
// Bulk recompute (cron path)
// ─────────────────────────────────────────────────────────────────────

/** Recompute patterns for every user that has logged anything in the last
 *  14 days. Called by the scheduled handler. */
export async function recomputeAllUsersPatterns(
  db: D1Database,
  now: Date = new Date(),
): Promise<{ usersProcessed: number; patternsTotal: number }> {
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - WINDOW_DAYS);
  const windowStartIso = windowStart.toISOString().slice(0, 10);

  const usersResult = await db
    .prepare(
      "SELECT DISTINCT user_id FROM score_inputs WHERE date >= ?",
    )
    .bind(windowStartIso)
    .all<{ user_id: string }>();

  const users = (usersResult.results ?? []).map((r) => r.user_id);

  let patternsTotal = 0;
  for (const userId of users) {
    const r = await recomputeUserPatterns(db, userId, now);
    patternsTotal += r.patternsWritten;
  }

  return { usersProcessed: users.length, patternsTotal };
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function safeParse(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
