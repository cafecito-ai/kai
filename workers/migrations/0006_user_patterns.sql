-- T-021 — Mental Health pattern recognition storage.
--
-- A small table for one-line abstracted observations about the user's
-- recent emotional / sleep / journaling patterns. Populated by a daily
-- cron (or on-demand recompute) from the score_inputs and daily_scores
-- tables. Mind agent reads recent rows into its system prompt context.
--
-- Guardrail (CLAUDE.md / AGENT_PLAN T-021):
--   Patterns are ABSTRACTED observations only. No raw journal content.
--   No specific notes. The detector enforces this at the boundary.
--
-- Mirrored to migrations/0009_user_patterns.sql for the root pipeline.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_patterns (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  observation TEXT NOT NULL,
  detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_patterns_user
  ON user_patterns (user_id, expires_at DESC);
