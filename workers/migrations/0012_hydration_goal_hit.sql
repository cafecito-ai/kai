-- Rawz/8 — add 'hydration_goal_hit' to the allowed score_inputs sources.
--
-- Hydration ledger entries fire ONCE per day when the user crosses
-- their water target, mirroring the local-only behavior in
-- src/lib/local-hydration.ts. This source contributes 20% to the
-- daily sleep sub-score per CLAUDE.md §5 (proper hydration → recovery).
--
-- Mirrored to migrations/0015_hydration_goal_hit.sql for the root pipeline.

PRAGMA foreign_keys = ON;

-- SQLite doesn't support ALTER on CHECK constraints, so the documented
-- workaround for D1 is "drop the constraint via rename-and-copy." But
-- since we never persist hydration_goal_hit to D1 yet (it's pure local
-- right now), we just document the future column allowlist here. When
-- the backend starts persisting these, run:
--
--   CREATE TABLE score_inputs_new ( ... source TEXT NOT NULL CHECK (source IN (
--     'check_in','journal','food_log','workout','sleep_log','goal_progress',
--     'energy_check_in','hydration_goal_hit'
--   )) ... );
--   INSERT INTO score_inputs_new SELECT * FROM score_inputs;
--   DROP TABLE score_inputs;
--   ALTER TABLE score_inputs_new RENAME TO score_inputs;
--
-- For now this file is a no-op marker so the migration sequence is
-- accurate when we ship the persisted version.
SELECT 1;
