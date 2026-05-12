-- P1-5: track which design direction a teen previewed during the picker.
-- Stays null until D1 (design pick) lands; useful for correlating QA tester
-- feedback with what they actually saw. Free-text, not constrained to a/b/c
-- so we can extend as new variants ship.

ALTER TABLE users ADD COLUMN design_preference TEXT;
