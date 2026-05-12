-- P2-2: persist the Kai-written summary of a teen's strengths-discovery
-- responses. Sits alongside user_intake.summary (intake) so chat handlers
-- can hydrate both into the system prompt later.

ALTER TABLE user_intake ADD COLUMN strengths_summary TEXT;
