-- Mirror of workers/migrations/0009_voice_sessions.sql for the root
-- migrations pipeline. Same DDL — keep these two files in sync.
--
-- T-034 — Voice session storage.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS voice_sessions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent           TEXT CHECK (agent IN ('mental', 'physical')),
  started_at      TEXT NOT NULL,
  ended_at        TEXT,
  duration_sec    INTEGER,
  transcript      TEXT NOT NULL DEFAULT '',
  safety_flagged  INTEGER NOT NULL DEFAULT 0,
  safety_category TEXT,
  ended_by_safety INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_user
  ON voice_sessions (user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_safety
  ON voice_sessions (safety_flagged) WHERE safety_flagged = 1;
