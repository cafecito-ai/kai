CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pillar TEXT NOT NULL,
  statement TEXT NOT NULL,
  why TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_missions_user_active ON missions(user_id, status);

ALTER TABLE goals ADD COLUMN mission_id TEXT REFERENCES missions(id) ON DELETE SET NULL;
