import { Hono } from "hono";
import { ensureDemoFeedbackTable, ensureScopeFeedbackTable } from "./demo";
import type { AppVariables, Env } from "../types";

export const opsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

opsRoutes.get("/ops/safety-events", async (c) => {
  if (!c.get("isOps")) return c.json({ error: "Forbidden" }, 403);
  const { results } = await c.env.DB.prepare(
    `SELECT id, user_id, trigger_category, severity, conversation_id, message_id, resources_shown, parent_notified, reviewed_by_ops, created_at
     FROM safety_events
     ORDER BY created_at DESC
     LIMIT 100`
  ).all();

  return c.json({
    events: (results as Array<Record<string, unknown>>).map((row) => ({
      id: row.id,
      userId: row.user_id,
      category: row.trigger_category,
      severity: row.severity,
      conversationId: row.conversation_id,
      messageId: row.message_id,
      resourcesShown: parseJson(row.resources_shown),
      parentNotified: Boolean(row.parent_notified),
      reviewedByOps: Boolean(row.reviewed_by_ops),
      createdAt: row.created_at
    }))
  });
});

opsRoutes.get("/ops/demo-feedback", async (c) => {
  if (!c.get("isOps")) return c.json({ error: "Forbidden" }, 403);
  await ensureDemoFeedbackTable(c.env.DB);
  const { results } = await c.env.DB.prepare(
    `SELECT id, user_id, session_id, choices_json, summary, user_agent, created_at
     FROM demo_feedback
     ORDER BY created_at DESC
     LIMIT 100`
  ).all();

  return c.json({
    feedback: (results as Array<Record<string, unknown>>).map((row) => ({
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      choices: parseJson(row.choices_json),
      summary: row.summary,
      userAgent: row.user_agent,
      createdAt: row.created_at
    }))
  });
});

opsRoutes.get("/ops/scope-feedback", async (c) => {
  if (!c.get("isOps")) return c.json({ error: "Forbidden" }, 403);
  await ensureScopeFeedbackTable(c.env.DB);
  const { results } = await c.env.DB.prepare(
    `SELECT id, session_id, answers_json, completed_missions, summary, user_agent, created_at
     FROM scope_feedback
     ORDER BY created_at DESC
     LIMIT 100`
  ).all();

  return c.json({
    feedback: (results as Array<Record<string, unknown>>).map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      answers: parseJson(row.answers_json),
      completedMissions: row.completed_missions,
      summary: row.summary,
      userAgent: row.user_agent,
      createdAt: row.created_at
    }))
  });
});

function parseJson(value: unknown) {
  if (typeof value !== "string") return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
