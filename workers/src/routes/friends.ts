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

// ── Pure helpers (unit-tested; route handlers stay thin) ──────────────

/** Normalize + validate a username: lowercase a–z, 0–9, underscore, 3–20
 *  chars. Returns null if it can't be made valid. */
export function normalizeUsername(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim().toLowerCase();
  return /^[a-z0-9_]{3,20}$/.test(u) ? u : null;
}

/** Clamp a challenge target into a sane range so a typo can't make an
 *  impossible goal. */
export function clampTarget(n: unknown): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return 1;
  return Math.min(1000, Math.max(1, v));
}

/** Clamp a challenge window length (days) to 1–365. */
export function clampDays(n: unknown): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return 30;
  return Math.min(365, Math.max(1, v));
}

const CHALLENGE_METRICS = new Set(["workout", "sleep_log", "check_in", "custom"]);
export function normalizeMetric(raw: unknown): string {
  return typeof raw === "string" && CHALLENGE_METRICS.has(raw) ? raw : "custom";
}

/** Whole days remaining until ends_on (inclusive of the end day). 0 once the
 *  window has closed. */
export function daysRemaining(endsOn: string, now: Date = new Date()): number {
  const end = new Date(`${endsOn}T23:59:59Z`).getTime();
  const ms = end - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/** A challenge is complete when its window closed OR the member hit target.
 *  (Shared goal, not a race — both members can complete.) */
export function isChallengeComplete(
  count: number,
  target: number,
  endsOn: string,
  now: Date = new Date()
): boolean {
  return count >= target || daysRemaining(endsOn, now) === 0;
}

/** The YYYY-MM-DD `days` after `startKey` (inclusive window of length days). */
export function addDaysKey(startKey: string, days: number): string {
  const d = new Date(`${startKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Math.max(0, days - 1));
  return d.toISOString().slice(0, 10);
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

/** Friendships for the caller, split by direction so the UI can show an
 *  "accept" inbox. Incoming requests are enriched with the requester's name. */
friendsRoutes.get("/friends", async (c) => {
  const userId = c.get("userId");
  const { results } = await c.env.DB
    .prepare("SELECT id, user_a, user_b, status FROM friendships WHERE user_a = ? OR user_b = ?")
    .bind(userId, userId)
    .all<{ id: string; user_a: string; user_b: string; status: string }>();
  const rows = results ?? [];

  const accepted = rows.filter((r) => r.status === "accepted");
  const incomingRows = rows.filter((r) => r.status === "pending" && r.user_b === userId);
  const outgoing = rows.filter((r) => r.status === "pending" && r.user_a === userId);

  const incoming = await Promise.all(
    incomingRows.map(async (r) => {
      const u = await c.env.DB
        .prepare("SELECT username, display_name FROM users WHERE id = ?")
        .bind(r.user_a)
        .first<{ username: string | null; display_name: string | null }>()
        .catch(() => null);
      return {
        friendshipId: r.id,
        fromUserId: r.user_a,
        username: u?.username ?? null,
        displayName: u?.display_name?.trim() || "Someone",
      };
    })
  );

  return c.json({
    accepted: accepted.map((r) => ({ friendshipId: r.id })),
    incoming,
    outgoing: outgoing.map((r) => ({ friendshipId: r.id })),
  });
});

/** Set (or change) the caller's username so friends can find them. */
friendsRoutes.patch("/friends/username", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ username?: string }>().catch(() => ({}) as { username?: string });
  const username = normalizeUsername(body.username);
  if (!username) {
    return c.json({ error: "Username must be 3–20 chars: letters, numbers, underscore." }, 400);
  }
  const taken = await c.env.DB.prepare("SELECT id FROM users WHERE username = ? AND id != ?")
    .bind(username, userId)
    .first<{ id: string }>()
    .catch(() => null);
  if (taken) return c.json({ error: "That username is taken." }, 409);

  await c.env.DB.prepare("UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(username, userId)
    .run();
  return c.json({ username });
});

/** Look up a user by username (for the "add a friend" flow). */
friendsRoutes.get("/friends/search", async (c) => {
  const userId = c.get("userId");
  const username = normalizeUsername(c.req.query("u"));
  if (!username) return c.json({ error: "Invalid username." }, 400);
  const row = await c.env.DB
    .prepare("SELECT id, username, display_name FROM users WHERE username = ? AND id != ? AND deleted_at IS NULL")
    .bind(username, userId)
    .first<{ id: string; username: string; display_name: string | null }>()
    .catch(() => null);
  if (!row) return c.json({ error: "No one with that username." }, 404);
  return c.json({
    user: { userId: row.id, username: row.username, displayName: row.display_name?.trim() || "Friend" },
  });
});

/** Send a friend request by username. */
friendsRoutes.post("/friends/request", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ username?: string }>().catch(() => ({}) as { username?: string });
  const username = normalizeUsername(body.username);
  if (!username) return c.json({ error: "Invalid username." }, 400);

  const target = await c.env.DB
    .prepare("SELECT id FROM users WHERE username = ? AND deleted_at IS NULL")
    .bind(username)
    .first<{ id: string }>()
    .catch(() => null);
  if (!target) return c.json({ error: "No one with that username." }, 404);
  if (target.id === userId) return c.json({ error: "That's you." }, 400);

  const existing = await c.env.DB
    .prepare(
      `SELECT id, status FROM friendships
       WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?) LIMIT 1`
    )
    .bind(userId, target.id, target.id, userId)
    .first<{ id: string; status: string }>()
    .catch(() => null);
  if (existing) {
    return c.json({ friendship: { id: existing.id, status: existing.status }, alreadyExists: true });
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare("INSERT INTO friendships (id, user_a, user_b, status) VALUES (?, ?, ?, 'pending')")
    .bind(id, userId, target.id)
    .run();
  return c.json({ friendship: { id, status: "pending" } });
});

/** Accept a pending request. Only the recipient (user_b) can accept. */
friendsRoutes.post("/friends/:friendshipId/accept", async (c) => {
  const userId = c.get("userId");
  const fid = c.req.param("friendshipId");
  const row = await c.env.DB
    .prepare("SELECT id, user_a, user_b, status FROM friendships WHERE id = ?")
    .bind(fid)
    .first<{ id: string; user_a: string; user_b: string; status: string }>()
    .catch(() => null);
  if (!row) return c.json({ error: "Not found." }, 404);
  if (row.user_b !== userId) return c.json({ error: "Not yours to accept." }, 403);
  if (row.status !== "pending") return c.json({ friendship: { id: fid, status: row.status } });

  await c.env.DB.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").bind(fid).run();
  return c.json({ friendship: { id: fid, status: "accepted" } });
});

// ── 1:1 friend challenges ─────────────────────────────────────────────

/** List the caller's challenges with both members' progress. */
friendsRoutes.get("/friends/challenges", async (c) => {
  const userId = c.get("userId");
  const { results: chs } = await c.env.DB
    .prepare(
      `SELECT ch.id, ch.title, ch.metric, ch.target, ch.starts_on, ch.ends_on, ch.status
       FROM friend_challenges ch
       JOIN friendships f ON f.id = ch.friendship_id
       WHERE (f.user_a = ? OR f.user_b = ?) AND f.status = 'accepted'
       ORDER BY ch.created_at DESC LIMIT 50`
    )
    .bind(userId, userId)
    .all<{ id: string; title: string; metric: string; target: number; starts_on: string; ends_on: string; status: string }>()
    .catch(() => ({ results: [] as Array<{ id: string; title: string; metric: string; target: number; starts_on: string; ends_on: string; status: string }> }));

  const challenges = await Promise.all(
    (chs ?? []).map(async (ch) => {
      const { results: prog } = await c.env.DB
        .prepare(
          `SELECT p.user_id, p.count, u.display_name
           FROM friend_challenge_progress p JOIN users u ON u.id = p.user_id
           WHERE p.challenge_id = ?`
        )
        .bind(ch.id)
        .all<{ user_id: string; count: number; display_name: string | null }>()
        .catch(() => ({ results: [] as Array<{ user_id: string; count: number; display_name: string | null }> }));
      const members = (prog ?? []).map((p) => ({
        userId: p.user_id,
        displayName: p.display_name?.trim() || "Friend",
        count: p.count,
        isYou: p.user_id === userId,
        complete: isChallengeComplete(p.count, ch.target, ch.ends_on),
      }));
      return {
        id: ch.id,
        title: ch.title,
        metric: ch.metric,
        target: ch.target,
        endsOn: ch.ends_on,
        daysRemaining: daysRemaining(ch.ends_on),
        members,
      };
    })
  );
  return c.json({ challenges });
});

/** Create a 1:1 challenge on an accepted friendship. */
friendsRoutes.post("/friends/challenges", async (c) => {
  const userId = c.get("userId");
  const body = await c.req
    .json<{ friendshipId?: string; title?: string; metric?: string; target?: number; days?: number }>()
    .catch(() => ({}) as { friendshipId?: string; title?: string; metric?: string; target?: number; days?: number });
  const friendshipId = typeof body.friendshipId === "string" ? body.friendshipId : "";
  const title = (typeof body.title === "string" ? body.title : "").trim().slice(0, 80);
  if (!friendshipId || !title) return c.json({ error: "Missing challenge details." }, 400);

  const f = await c.env.DB
    .prepare("SELECT id, user_a, user_b, status FROM friendships WHERE id = ?")
    .bind(friendshipId)
    .first<{ id: string; user_a: string; user_b: string; status: string }>()
    .catch(() => null);
  if (!f || f.status !== "accepted") return c.json({ error: "Not an active friendship." }, 404);
  if (f.user_a !== userId && f.user_b !== userId) return c.json({ error: "Not your friendship." }, 403);

  const id = crypto.randomUUID();
  const startsOn = new Date().toISOString().slice(0, 10);
  const endsOn = addDaysKey(startsOn, clampDays(body.days));
  await c.env.DB
    .prepare(
      `INSERT INTO friend_challenges (id, friendship_id, creator_id, title, metric, target, starts_on, ends_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, friendshipId, userId, title, normalizeMetric(body.metric), clampTarget(body.target), startsOn, endsOn)
    .run();
  // Seed a progress row for both members at 0.
  for (const member of [f.user_a, f.user_b]) {
    await c.env.DB
      .prepare("INSERT INTO friend_challenge_progress (challenge_id, user_id, count) VALUES (?, ?, 0)")
      .bind(id, member)
      .run()
      .catch(() => undefined);
  }
  return c.json({ challenge: { id, title, endsOn } });
});

/** Bump the caller's progress on a challenge. */
friendsRoutes.post("/friends/challenges/:id/progress", async (c) => {
  const userId = c.get("userId");
  const challengeId = c.req.param("id");
  const body = await c.req.json<{ delta?: number }>().catch(() => ({}) as { delta?: number });
  const delta = Math.min(100, Math.max(1, Math.floor(Number(body.delta ?? 1)) || 1));

  const member = await c.env.DB
    .prepare("SELECT count FROM friend_challenge_progress WHERE challenge_id = ? AND user_id = ?")
    .bind(challengeId, userId)
    .first<{ count: number }>()
    .catch(() => null);
  if (!member) return c.json({ error: "Not part of this challenge." }, 403);

  // Don't let progress accrue on a cancelled or closed challenge.
  const ch = await c.env.DB
    .prepare("SELECT status, ends_on FROM friend_challenges WHERE id = ?")
    .bind(challengeId)
    .first<{ status: string; ends_on: string }>()
    .catch(() => null);
  if (!ch || ch.status !== "active" || daysRemaining(ch.ends_on) === 0) {
    return c.json({ error: "This challenge is closed." }, 409);
  }

  const next = Math.max(0, member.count + delta);
  await c.env.DB
    .prepare("UPDATE friend_challenge_progress SET count = ?, updated_at = CURRENT_TIMESTAMP WHERE challenge_id = ? AND user_id = ?")
    .bind(next, challengeId, userId)
    .run();
  return c.json({ count: next });
});
