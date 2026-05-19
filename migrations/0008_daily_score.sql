-- T-009 — Daily Score schema.
-- See AGENT_PLAN.md T-009 + CLAUDE.md v2 §5 (Daily Score) + v3 §2 (visuals).
-- All timestamps in UTC (TEXT, CURRENT_TIMESTAMP default).
-- user_id foreign keys cascade-delete with the user record.

PRAGMA foreign_keys = ON;

-- One row per user-per-day. final_score is mental*0.4 + sleep*0.3 + mood*0.3,
-- computed by workers/src/lib/score-calculator.ts (T-010). Stored so /home
-- can read in O(1) without recomputing every paint.
CREATE TABLE IF NOT EXISTS daily_scores (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date         TEXT NOT NULL,                       -- ISO 8601 date (YYYY-MM-DD)
  mental_score INTEGER,                             -- 0–100, NULL when no inputs
  sleep_score  INTEGER,                             -- 0–100, NULL when no inputs
  mood_score   INTEGER,                             -- 0–100, NULL when no inputs
  final_score  INTEGER,                             -- 0–100, NULL when none of the three available
  band         TEXT,                                -- 'low' | 'mid' | 'high' (v3 §2 thresholds)
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, date)
);

-- Each user action that contributes to the score lands here. The calculator
-- reads this table by (user_id, date) to recompute. `value` is JSON so each
-- source can carry whatever shape it needs (sleep hours, mood 1-5, journal
-- sentiment score, etc).
CREATE TABLE IF NOT EXISTS score_inputs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,                        -- ISO date the input applies to
  source      TEXT NOT NULL CHECK (source IN (
                'check_in', 'journal', 'food_log',
                'workout', 'sleep_log', 'goal_progress', 'energy_check_in'
              )),
  value       TEXT NOT NULL,                        -- JSON payload
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_score_inputs_user_date
  ON score_inputs (user_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_scores_user
  ON daily_scores (user_id, date DESC);
