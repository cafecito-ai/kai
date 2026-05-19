-- Mirror of root migrations/0008_daily_score.sql for the workers/ migrations
-- pipeline. Same DDL — keep these two files in sync.
--
-- T-009 — Daily Score schema (CLAUDE.md v2 §5 + v3 §2)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS daily_scores (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date         TEXT NOT NULL,
  mental_score INTEGER,
  sleep_score  INTEGER,
  mood_score   INTEGER,
  final_score  INTEGER,
  band         TEXT,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS score_inputs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  source      TEXT NOT NULL CHECK (source IN (
                'check_in', 'journal', 'food_log',
                'workout', 'sleep_log', 'goal_progress', 'energy_check_in'
              )),
  value       TEXT NOT NULL,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_score_inputs_user_date
  ON score_inputs (user_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_scores_user
  ON daily_scores (user_id, date DESC);
