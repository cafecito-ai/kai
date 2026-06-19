-- Phase G — the real friend graph: usernames for search, and 1:1 challenges.
-- Lightweight accountability between two friends, NOT a social network.

-- Username for friend search. Nullable (set on first use), unique when present.
ALTER TABLE users ADD COLUMN username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)
  WHERE username IS NOT NULL;

-- A shared goal between the two members of a friendship.
CREATE TABLE IF NOT EXISTS friend_challenges (
  id TEXT PRIMARY KEY,
  friendship_id TEXT NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metric TEXT NOT NULL,            -- 'workout' | 'sleep_log' | 'check_in' | 'custom'
  target INTEGER NOT NULL,         -- e.g. 20 workouts, 7 days
  starts_on TEXT NOT NULL,         -- YYYY-MM-DD
  ends_on TEXT NOT NULL,           -- YYYY-MM-DD
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'complete' | 'cancelled'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_friend_challenges_friendship
  ON friend_challenges(friendship_id);

-- Per-user progress on a challenge (one row per member).
CREATE TABLE IF NOT EXISTS friend_challenge_progress (
  challenge_id TEXT NOT NULL REFERENCES friend_challenges(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (challenge_id, user_id)
);
