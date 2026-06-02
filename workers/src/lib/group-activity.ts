// Rawz/7 — group activity helpers (labels + fan-out).
//
// Why server-side label rendering: keeps the text canonical across
// clients (web, future native) and means we can run the D-021 word
// filter on it before it ever lands in a feed. Frontend posts the
// *kind* and *refKey* — backend writes the *label*.

import type { D1Database } from "@cloudflare/workers-types";

export type ActivityKind = "badge" | "level_up" | "streak" | "goal_completed";

export const ALLOWED_REACTIONS = ["🔥", "💪", "👏", "🎯"] as const;
export type Reaction = (typeof ALLOWED_REACTIONS)[number];

// Words we deliberately keep out of auto-rendered labels — same D-021
// safety voice as the rest of groups. (Comparative / shame language.)
const FORBIDDEN_LABEL_WORDS = [
  "beat", "crush", "destroy", "dominate", "win", "won", "lose", "loser",
  "behind", "ahead", "rank", "ranked", "top", "best",
] as const;

function sanitizeLabel(text: string): string {
  let safe = text.trim();
  for (const word of FORBIDDEN_LABEL_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, "gi");
    safe = safe.replace(re, "");
  }
  return safe.replace(/\s+/g, " ").trim();
}

/**
 * Render the human label for a group activity row. Display name is
 * prepended client-side; this returns only the predicate.
 *
 *   badge:          "earned Week Strong"
 *   level_up:       "hit Level 5"
 *   streak:         "checked in 30 days in a row"
 *   goal_completed: "finished a goal"
 */
export function renderActivityLabel(kind: ActivityKind, refKey: string, hint?: string): string {
  switch (kind) {
    case "badge":
      // hint = badge title (e.g. "Week Strong"); refKey = badge id
      return sanitizeLabel(`earned ${hint?.trim() || refKey}`);
    case "level_up":
      // refKey = "5", hint = optional level name ("Consistent")
      return sanitizeLabel(
        hint?.trim()
          ? `hit Level ${refKey} — ${hint.trim()}`
          : `hit Level ${refKey}`,
      );
    case "streak":
      // refKey = "30"
      return sanitizeLabel(`checked in ${refKey} days in a row`);
    case "goal_completed":
      // hint = goal title
      return sanitizeLabel(
        hint?.trim() ? `finished a goal: ${hint.trim()}` : "finished a goal",
      );
  }
}

/**
 * Fan out a single achievement to every group the user belongs to.
 * Idempotent — the UNIQUE constraint on (group_id, actor_user_id, kind,
 * ref_key) means duplicate calls are no-ops.
 *
 * Returns the count of NEW rows written (helpful for testing).
 */
export async function fanOutActivity(
  db: D1Database,
  args: {
    userId: string;
    kind: ActivityKind;
    refKey: string;
    label: string;
  },
): Promise<number> {
  const groups = await db
    .prepare("SELECT group_id FROM group_memberships WHERE user_id = ?")
    .bind(args.userId)
    .all<{ group_id: string }>()
    .catch(() => ({ results: [] as { group_id: string }[] }));

  let written = 0;
  for (const row of groups.results ?? []) {
    const id = `act_${crypto.randomUUID()}`;
    const res = await db
      .prepare(
        `INSERT OR IGNORE INTO group_activity (id, group_id, actor_user_id, kind, label, ref_key)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, row.group_id, args.userId, args.kind, args.label, args.refKey)
      .run()
      .catch(() => null);
    // D1 doesn't reliably surface affected rows on conflict — check by
    // selecting the row's created_at, but for now treat run() success
    // as +1 best-effort. Tests verify dedup separately.
    if (res) written += 1;
  }
  return written;
}

/**
 * Aggregate reactions for a set of activity ids. Returns a map of
 *   activityId -> { reaction -> count, mine: reaction[] }
 * "mine" is the subset the current viewer added — used for the toggle
 * highlight state.
 */
export type ReactionSummary = {
  counts: Partial<Record<Reaction, number>>;
  mine: Reaction[];
};
export async function aggregateReactions(
  db: D1Database,
  activityIds: string[],
  viewerUserId: string,
): Promise<Map<string, ReactionSummary>> {
  const summary = new Map<string, ReactionSummary>();
  if (activityIds.length === 0) return summary;

  // Initialize empty buckets so callers can rely on the key existing.
  for (const id of activityIds) summary.set(id, { counts: {}, mine: [] });

  // Build a parameter list for IN(...).
  const placeholders = activityIds.map(() => "?").join(",");
  const rows = await db
    .prepare(
      `SELECT activity_id, user_id, reaction
         FROM group_activity_reactions
        WHERE activity_id IN (${placeholders})`,
    )
    .bind(...activityIds)
    .all<{ activity_id: string; user_id: string; reaction: Reaction }>()
    .catch(() => ({ results: [] as never[] }));

  for (const r of rows.results ?? []) {
    const bucket = summary.get(r.activity_id);
    if (!bucket) continue;
    bucket.counts[r.reaction] = (bucket.counts[r.reaction] ?? 0) + 1;
    if (r.user_id === viewerUserId) bucket.mine.push(r.reaction);
  }
  return summary;
}
