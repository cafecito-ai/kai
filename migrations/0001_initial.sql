PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  age INTEGER,
  parent_email TEXT,
  parent_consent_at TEXT,
  kai_name TEXT DEFAULT 'Kai',
  kai_tone TEXT DEFAULT 'balanced',
  primary_engine TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS user_intake (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  raw_responses TEXT,
  summary TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  engine TEXT NOT NULL,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_message_at TEXT DEFAULT CURRENT_TIMESTAMP,
  message_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS progress_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  engine TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_value REAL,
  payload TEXT,
  occurred_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_progress_user_time ON progress_events(user_id, occurred_at);

CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_r2_key TEXT,
  items TEXT,
  total_calories REAL,
  total_protein REAL,
  notes TEXT,
  consumed_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  achieved_at TEXT
);

CREATE TABLE IF NOT EXISTS friendships (
  id TEXT PRIMARY KEY,
  user_a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_a, user_b)
);

CREATE TABLE IF NOT EXISTS safety_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_category TEXT NOT NULL,
  severity TEXT NOT NULL,
  conversation_id TEXT REFERENCES conversations(id),
  message_id TEXT REFERENCES messages(id),
  raw_text TEXT,
  resources_shown TEXT,
  parent_notified INTEGER DEFAULT 0,
  parent_notified_at TEXT,
  reviewed_by_ops INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
