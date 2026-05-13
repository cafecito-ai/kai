-- P1-5: Persist the design picker selection on the user record.
--
-- The application code in `workers/src/routes/user.ts` already reads and
-- writes `users.design_preference`:
--   - `GET /api/user/me` exposes it as `designPreference` (line ~26)
--   - `PATCH /api/user/me` UPDATEs it when `designPreference` is in the
--     payload (line ~70)
-- The column was never added to the schema, so the UPDATE silently fails
-- in production and the GET reads NULL forever. This migration adds it.
--
-- Why persist this at all (per plan P1-5):
--   Until Lev picks a design direction (D1), tracking *which* tester saw
--   which direction lets the team correlate feedback with direction. When
--   the pick lands, this column becomes the source of truth for the
--   rebuild scope. Stored as a short string ("A" | "B" | "C") — the
--   route already trims/slices to 16 chars.

ALTER TABLE users ADD COLUMN design_preference TEXT;
