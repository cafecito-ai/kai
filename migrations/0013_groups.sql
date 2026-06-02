-- Mirror of workers/migrations/0010_groups.sql for the root pipeline.
-- Keep these two files in sync.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS groups (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 24),
  created_by      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code     TEXT NOT NULL UNIQUE,
  invite_expires  TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_groups_invite ON groups(invite_code);

CREATE TABLE IF NOT EXISTS group_memberships (
  group_id           TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  hide_score         INTEGER NOT NULL DEFAULT 0,
  leaderboard_opt_in INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_group ON group_memberships(group_id);

CREATE TABLE IF NOT EXISTS group_messages (
  id              TEXT PRIMARY KEY,
  group_id        TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL CHECK (kind IN ('encouragement','system')),
  template_id     TEXT,
  text            TEXT NOT NULL,
  acked           INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_msgs_group_recent ON group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msgs_recipient ON group_messages(to_user_id, acked, created_at DESC);

CREATE TABLE IF NOT EXISTS group_blocks (
  blocker_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_id, blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON group_blocks(blocker_id);

CREATE TABLE IF NOT EXISTS group_moderation_log (
  id              TEXT PRIMARY KEY,
  group_id        TEXT REFERENCES groups(id) ON DELETE CASCADE,
  actor_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id  TEXT REFERENCES users(id) ON DELETE CASCADE,
  action          TEXT NOT NULL CHECK (action IN ('block','unblock','leave','report')),
  context         TEXT,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_modlog_group ON group_moderation_log(group_id, created_at DESC);
