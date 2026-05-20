-- Mirror of workers/migrations/0006_user_patterns.sql for the root
-- migrations pipeline. Same DDL — keep these two files in sync.
--
-- T-021 — Mental Health pattern recognition storage.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_patterns (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  observation TEXT NOT NULL,
  detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_patterns_user
  ON user_patterns (user_id, expires_at DESC);
