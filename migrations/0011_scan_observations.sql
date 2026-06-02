-- Mirror of workers/migrations/0008_scan_observations.sql for the root
-- migrations pipeline. Same DDL — keep these two files in sync.
--
-- T-030 — Body scan observations storage.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS scan_observations (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id      TEXT NOT NULL,
  observations    TEXT NOT NULL,
  summary         TEXT NOT NULL,
  attempts        INTEGER NOT NULL,
  filter_hits     TEXT NOT NULL DEFAULT '[]',
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scan_observations_user
  ON scan_observations (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scan_observations_session
  ON scan_observations (user_id, session_id);
