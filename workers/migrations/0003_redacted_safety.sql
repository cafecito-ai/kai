-- P0-5: Drop raw teen text from safety_events; keep a redacted excerpt.
--
-- Why this matters
-- ----------------
-- Spec Section 13 ("No raw user text in error logs") and the broader
-- COPPA/state-law exposure surface both point in the same direction: if D1
-- ever leaks, we should not have raw teen messages about suicide, self-harm,
-- abuse, etc. sitting in a table. The classifier needs the full text only
-- at classify time, not at log time — so we hash it down to a length-marked
-- prefix/suffix excerpt right at the boundary and store only that.
--
-- The application code in workers/src/lib/safety.ts already INSERTs into a
-- `redacted_excerpt` column. Before this migration that column did not exist,
-- so the INSERT was broken in prod. This migration adds the column, backfills
-- any pre-existing `raw_text` rows into their redacted equivalent so ops
-- review history stays intact, then drops `raw_text` permanently.
--
-- Format
-- ------
-- `len:<N>|<excerpt>` where excerpt is either the full text (N <= 80) or
-- first 40 chars + "..." + last 40 chars. Matches `redactExcerpt()` in
-- safety.ts exactly — keep the two in sync if either changes.

ALTER TABLE safety_events ADD COLUMN redacted_excerpt TEXT;

UPDATE safety_events
  SET redacted_excerpt =
    CASE
      WHEN raw_text IS NULL OR raw_text = '' THEN 'len:0|'
      WHEN LENGTH(raw_text) <= 80 THEN 'len:' || LENGTH(raw_text) || '|' || raw_text
      ELSE 'len:' || LENGTH(raw_text) || '|' || SUBSTR(raw_text, 1, 40) || '...' || SUBSTR(raw_text, -40, 40)
    END
  WHERE redacted_excerpt IS NULL;

ALTER TABLE safety_events DROP COLUMN raw_text;
