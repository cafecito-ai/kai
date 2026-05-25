ALTER TABLE goals ADD COLUMN why_it_matters TEXT;
ALTER TABLE goals ADD COLUMN next_action TEXT;
ALTER TABLE goals ADD COLUMN confidence REAL;
ALTER TABLE goals ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS daily_loops (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_iso TEXT NOT NULL,
  steps TEXT NOT NULL,
  score REAL DEFAULT 0,
  streak INTEGER DEFAULT 0,
  recommended_goal_id TEXT,
  kai_message TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date_iso)
);

CREATE INDEX IF NOT EXISTS idx_daily_loops_user_date
ON daily_loops(user_id, date_iso);
