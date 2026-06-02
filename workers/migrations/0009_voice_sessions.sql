-- T-034 — Voice session storage.
--
-- One row per phone call between user and KAI. Transcripts can be
-- long (10-min cap) so we store them as TEXT.
--
-- Schema:
--   id              — Bland call_id (their identifier; unique per call)
--   user_id         — our user_id, resolved from the calling phone number
--                     OR from a one-time-code the user enters at call start
--   agent           — mental | physical (decided after first user turn)
--   started_at      — ISO timestamp call connected
--   ended_at        — ISO timestamp call ended (null mid-call)
--   duration_sec    — call length in seconds (null mid-call)
--   transcript      — full transcript as plain text, "Speaker: text\n"
--   safety_flagged  — 1 if safety classifier fired during the call
--   safety_category — populated only when flagged
--   ended_by_safety — 1 if call was ended by safety handoff (vs natural end)
--   created_at      — DB insert time
--
-- Mirrored to migrations/0012_voice_sessions.sql for the root pipeline.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS voice_sessions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent           TEXT CHECK (agent IN ('mental', 'physical')),
  started_at      TEXT NOT NULL,
  ended_at        TEXT,
  duration_sec    INTEGER,
  transcript      TEXT NOT NULL DEFAULT '',
  safety_flagged  INTEGER NOT NULL DEFAULT 0,
  safety_category TEXT,
  ended_by_safety INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_user
  ON voice_sessions (user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_safety
  ON voice_sessions (safety_flagged) WHERE safety_flagged = 1;
