import { Hono } from "hono";
import type { Env } from "../types";

export const friendsRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

// Section 9 thresholds — duplicated locally to keep this PR independent of
// PR #10 (P1-4). Consolidate once both land.
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 6000, 9000];
const STREAK_DAY_MIN_VALUE = 5;

export function computeLevelLocal(totalScore: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalScore >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(10, Math.max(1, level));
}

export function computeOverallStreakLocal(
  days: ReadonlyArray<{ day: string; value: number }>,
  now: Date = new Date()
): number {
  const qualified = new Set(days.filter((d) => d.value >= STREAK_DAY_MIN_VALUE).map((d) => d.day));
  let streak = 0;
  const cursor = new Date(now);
  for (let i = 0; i < 365; i++) {
    const day = cursor.toISOString().slice(0, 10);
    if (!qualified.has(day)) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/**
 * Aggregate-only friend comparison per spec Section 9.3:
 *   "Does NOT show: any conversation content, any goal content, any
 *    reflection content, any meal photos. Aggregate stats only."
 *
 * Returns level + overall streak + total score for each accepted friend.
 * Display names from users.display_name only; never email, never engine
 * breakdowns, never per-event data.
 */
friendsRoutes.get("/friends/compare", async (c) => {
  const userId = c.get("userId");
  const { results } = await c.env.DB
    .prepare(
      `SELECT id, user_a, user_b FROM friendships
       WHERE status = 'accepted' AND (user_a = ? OR user_b = ?)
       ORDER BY created_at ASC LIMIT 50`
    )
    .bind(userId, userId)
    .all<{ id: string; user_a: string; user_b: string }>();

  const friendIds = Array.from(
    new Set(
      (results ?? [])
        .map((row) => (row.user_a === userId ? row.user_b : row.user_a))
        .filter((id) => id && id !== userId)
    )
  );

  if (friendIds.length === 0) return c.json({ friends: [] });

  const summaries = await Promise.all(
    friendIds.map(async (id) => {
      const events = await c.env.DB
        .prepare("SELECT event_value, occurred_at FROM progress_events WHERE user_id = ?")
        .bind(id)
        .all<{ event_value: number | null; occurred_at: string | null }>()
        .catch(() => ({ results: [] as Array<{ event_value: number | null; occurred_at: string | null }> }));

      let totalScore = 0;
      const dayMap = new Map<string, number>();
      for (const row of events.results ?? []) {
        const value = Math.max(0, row.event_value ?? 0);
        totalScore += value;
        if (row.occurred_at) {
          const day = row.occurred_at.slice(0, 10);
          dayMap.set(day, (dayMap.get(day) ?? 0) + value);
        }
      }
      const days = Array.from(dayMap.entries()).map(([day, value]) => ({ day, value }));

      const user = await c.env.DB
        .prepare("SELECT display_name FROM users WHERE id = ?")
        .bind(id)
        .first<{ display_name: string | null }>()
        .catch(() => null);

      return {
        userId: id,
        displayName: user?.display_name?.trim() || "Friend",
        level: computeLevelLocal(totalScore),
        streakOverall: computeOverallStreakLocal(days),
        totalScore
      };
    })
  );

  summaries.sort((a, b) => b.streakOverall - a.streakOverall || b.level - a.level);

  return c.json({ friends: summaries });
});

friendsRoutes.get("/friends", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM friendships WHERE user_a = ? OR user_b = ?").bind(c.get("userId"), c.get("userId")).all();
  return c.json({ accepted: results.filter((row) => row.status === "accepted"), pending: results.filter((row) => row.status === "pending") });
});

friendsRoutes.post("/friends/request", async (c) => {
  const body = await c.req.json<{ targetUserEmail: string }>();
  const id = crypto.randomUUID();
  await c.env.DB.prepare("INSERT INTO friendships (id, user_a, user_b, status) VALUES (?, ?, ?, 'pending')")
    .bind(id, c.get("userId"), body.targetUserEmail)
    .run();
  return c.json({ friendship: { id, status: "pending" } });
});

friendsRoutes.post("/friends/:friendshipId/accept", async (c) => {
  await c.env.DB.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").bind(c.req.param("friendshipId")).run();
  return c.json({ friendship: { id: c.req.param("friendshipId"), status: "accepted" } });
});
