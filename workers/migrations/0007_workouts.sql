-- T-023 — Workout logging schema.
--
-- A simple log of completed workouts. Used by:
--   - /api/workouts/log to insert + return a Body-agent comment
--   - Daily Score ingestion (score_inputs source 'workout' already
--     accepted by score-calculator; this is the canonical store)
--   - Progress tab to show recent workout history
--
-- Mirrored to migrations/0010_workouts.sql for the root pipeline.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workouts (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,                 -- YYYY-MM-DD user-local
  type          TEXT NOT NULL CHECK (type IN (
                  'run', 'lift', 'bodyweight', 'yoga', 'sport', 'other'
                )),
  duration_min  INTEGER NOT NULL,              -- 1-300
  intensity     INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  notes         TEXT,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date
  ON workouts (user_id, date DESC);
