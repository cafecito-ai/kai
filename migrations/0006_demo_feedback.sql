CREATE TABLE IF NOT EXISTS demo_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_id TEXT NOT NULL,
  choices_json TEXT NOT NULL,
  summary TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_demo_feedback_created_at ON demo_feedback(created_at);
