-- Rawz/7 — per-group activity feed + emoji reactions.
--
-- This is the "scrolling moments" loop scoped to your trust circle: when
-- someone in your group earns a badge / levels up / hits a streak
-- milestone, KAI auto-posts a row here. Members can react with a
-- fixed emoji set (no free text → no moderation surface).
--
-- Why not reuse group_messages? Two reasons:
--   1. group_messages.kind CHECK constrains to 'encouragement' / 'system'
--      and is wired to the encouragement template flow.
--   2. Reactions need a separate join table — overloading messages would
--      make every query awkward.
--
-- Mirrored to migrations/0014_group_activity.sql for the root pipeline.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS group_activity (
  id              TEXT PRIMARY KEY,
  group_id        TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  /** The teen who earned the achievement (not whoever triggered the row). */
  actor_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  /** Achievement category. Used for icon + grouping. */
  kind            TEXT NOT NULL CHECK (kind IN ('badge','level_up','streak','goal_completed')),
  /** Pre-rendered text shown in the feed. Auto-generated server-side
   *  using a fixed set of templates — never user-supplied. */
  label           TEXT NOT NULL,
  /** Idempotency key. Lets us safely re-post on retry without duplicates.
   *  Examples: badge id ('week-strong'), level number ('5'), streak day ('30'). */
  ref_key         TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  /** One row per achievement per group — never duplicate. */
  UNIQUE (group_id, actor_user_id, kind, ref_key)
);
CREATE INDEX IF NOT EXISTS idx_activity_group_recent ON group_activity(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_actor ON group_activity(actor_user_id, created_at DESC);

-- Emoji reactions. Fixed set of 4 enforced via CHECK so we never have to
-- moderate freeform reaction text.
CREATE TABLE IF NOT EXISTS group_activity_reactions (
  activity_id     TEXT NOT NULL REFERENCES group_activity(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction        TEXT NOT NULL CHECK (reaction IN ('🔥','💪','👏','🎯')),
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (activity_id, user_id, reaction)
);
CREATE INDEX IF NOT EXISTS idx_reactions_activity ON group_activity_reactions(activity_id);
