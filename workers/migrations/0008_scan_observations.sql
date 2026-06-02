-- T-030 — Body scan observations storage.
--
-- Stores the PARSED OUTPUT of the vision call only — never the photos.
-- Photos live exclusively in client-side encrypted storage per D-019
-- (scaffold) and D-020 (production). The vision call decrypts in
-- Worker memory only and discards the bytes after the call returns.
--
-- One row per session (the three photos analyzed together produce one
-- observation set). observations + summary are stored as JSON text;
-- the schema for observations is documented in scan-vision.ts:
--   {
--     index: 1|2|3,
--     text: string,
--     action: string
--   }
--
-- Mirrored to migrations/0011_scan_observations.sql for the root pipeline.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS scan_observations (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  /** Client-supplied session id — matches the scan-storage record group. */
  session_id      TEXT NOT NULL,
  /** JSON array of { index, text, action } */
  observations    TEXT NOT NULL,
  summary         TEXT NOT NULL,
  /** Vision attempts used (1-3). For audit. */
  attempts        INTEGER NOT NULL,
  /** JSON array-of-arrays of forbidden words flagged during regens. For
   *  Gate 5 audit + telemetry. Empty array on a happy-path scan. */
  filter_hits     TEXT NOT NULL DEFAULT '[]',
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scan_observations_user
  ON scan_observations (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scan_observations_session
  ON scan_observations (user_id, session_id);
