-- T-036 — Groups + memberships + messages + blocks + moderation log.
--
-- One group = up to 8 members. A user can be in up to 3 groups.
-- Adults blocked from teen groups (enforced in /api/groups/join).
-- Invite codes expire 48 hours after creation.
--
-- Score privacy: per-group "hide my score" toggle lives on
-- group_memberships.hide_score. The bucket calculator in the route
-- respects that flag so other members see "—" instead of a bucket.
--
-- Mirrored to migrations/0013_groups.sql for the root pipeline.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS groups (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 24),
  created_by      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code     TEXT NOT NULL UNIQUE,
  invite_expires  TEXT NOT NULL, -- ISO timestamp; 48h after creation
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_groups_invite ON groups(invite_code);

CREATE TABLE IF NOT EXISTS group_memberships (
  group_id           TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  /** Per-group: hide my Daily Score bucket from other members. */
  hide_score         INTEGER NOT NULL DEFAULT 0,
  /** Per-group: opt-in to the weekly leaderboard (T-039). Default off. */
  leaderboard_opt_in INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_group ON group_memberships(group_id);

-- Encouragement / log messages. NOT general chat — every message is
-- either a templated encouragement OR a custom one that passed the
-- safety classifier. Both store as the same row shape.
CREATE TABLE IF NOT EXISTS group_messages (
  id              TEXT PRIMARY KEY,
  group_id        TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  /** NULL = group-wide message; otherwise the recipient. */
  to_user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
  /** "encouragement" | "system" (system = leaderboard top-3 note, etc.) */
  kind            TEXT NOT NULL CHECK (kind IN ('encouragement','system')),
  /** Template id if a template was used; NULL for custom messages. */
  template_id     TEXT,
  /** The actual rendered text shown to the recipient. */
  text            TEXT NOT NULL,
  /** 1 if a system kind, OR if the receiver dismissed/acked. */
  acked           INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_msgs_group_recent ON group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msgs_recipient ON group_messages(to_user_id, acked, created_at DESC);

-- Mutual block. (a,b) means a blocked b AND b blocked a — we always
-- write the symmetric row so a single direction lookup is enough.
CREATE TABLE IF NOT EXISTS group_blocks (
  blocker_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_id, blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON group_blocks(blocker_id);

-- Audit trail of moderation actions (block / leave / report). Reports
-- always email safety@boostaisearch.ai — this is the on-disk record.
CREATE TABLE IF NOT EXISTS group_moderation_log (
  id              TEXT PRIMARY KEY,
  group_id        TEXT REFERENCES groups(id) ON DELETE CASCADE,
  actor_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id  TEXT REFERENCES users(id) ON DELETE CASCADE,
  action          TEXT NOT NULL CHECK (action IN ('block','unblock','leave','report')),
  /** Reporter-supplied context. Never an AI summary. */
  context         TEXT,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_modlog_group ON group_moderation_log(group_id, created_at DESC);
