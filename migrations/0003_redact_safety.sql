-- Spec Section 13: "All errors are logged with user ID (not name) and request ID.
-- No raw user text in error logs." Same principle applies to safety_events storage.
-- Going forward we persist a redacted excerpt (first/last 40 chars + length) and
-- stop writing the full message body. The classifier still sees the full text at
-- classify time; it just never lands in the row.
--
-- We leave the legacy `raw_text` column in place for now. New rows will write
-- NULL into it; a follow-up migration can drop the column once historical rows
-- have been purged.

ALTER TABLE safety_events ADD COLUMN redacted_excerpt TEXT;
