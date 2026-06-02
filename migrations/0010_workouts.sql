-- Mirror of workers/migrations/0007_workouts.sql for the root migrations
-- pipeline. Same DDL — keep these two files in sync.
--
-- T-023 — Workout logging schema.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workouts (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN (
                  'run', 'strength', 'yoga', 'sport', 'other'
                )),
  duration_min  INTEGER NOT NULL,
  intensity     INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  notes         TEXT,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date
  ON workouts (user_id, date DESC);
