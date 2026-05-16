CREATE TABLE IF NOT EXISTS scope_feedback (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  completed_missions INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scope_feedback_created_at ON scope_feedback(created_at);
