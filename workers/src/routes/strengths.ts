import { Hono } from "hono";
import { ensureUser } from "../lib/db";
import { logAppEvent } from "../lib/events";
import { countAnswered, deterministicStrengthsSummary, summarizeStrengths, type StrengthsResponses } from "../lib/strengths";
import type { AppVariables, Env } from "../types";

export const strengthsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

strengthsRoutes.post("/engines/superpower/strengths", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ responses: StrengthsResponses }>();
  if (!body.responses || typeof body.responses !== "object") {
    return c.json({ error: "responses is required" }, 400);
  }

  await ensureUser(c.env.DB, userId);

  const answered = countAnswered(body.responses);
  if (answered === 0) {
    return c.json({ error: "answer at least one question" }, 400);
  }

  const summary =
    (await summarizeStrengths(c.env, body.responses)) ?? deterministicStrengthsSummary(body.responses);

  // Upsert into user_intake (the existing onboarding-summary table). The new
  // strengths_summary column (migration 0005) is null until the teen runs
  // this flow.
  await c.env.DB
    .prepare(
      `INSERT INTO user_intake (user_id, raw_responses, summary, strengths_summary)
       VALUES (?, NULL, NULL, ?)
       ON CONFLICT(user_id) DO UPDATE SET strengths_summary = excluded.strengths_summary`
    )
    .bind(userId, summary)
    .run();

  await logAppEvent(c.env.DB, {
    userId,
    eventName: "strengths_discovery_completed",
    payload: { answered, total: 15 }
  });

  return c.json({ summary, answered, total: 15 });
});
