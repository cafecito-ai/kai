import { Hono } from "hono";
import { ensureUser } from "../lib/db";
import type { AppVariables, Env } from "../types";

export const goalsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

goalsRoutes.get("/goals", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC").bind(c.get("userId")).all();
  const goals = (results as Array<Record<string, unknown>>).map((row) => ({
    id: row.id,
    userId: row.user_id,
    category: row.category,
    title: row.title,
    description: row.description ?? "",
    whyItMatters: row.why_it_matters,
    nextAction: row.next_action,
    targetDate: row.target_date,
    status: row.status,
    confidence: row.confidence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    achievedAt: row.achieved_at
  }));
  return c.json({ goals });
});

goalsRoutes.post("/goals", async (c) => {
  const body = await c.req.json<{ category: string; title: string; description?: string; whyItMatters?: string; nextAction?: string; targetDate?: string | null; confidence?: number | null }>();
  if (!body.title?.trim()) return c.json({ error: "Title is required" }, 422);
  await ensureUser(c.env.DB, c.get("userId"));
  const id = crypto.randomUUID();
  await c.env.DB.prepare("INSERT INTO goals (id, user_id, category, title, description, why_it_matters, next_action, target_date, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, c.get("userId"), body.category, body.title.trim(), body.description ?? "", body.whyItMatters ?? null, body.nextAction ?? null, body.targetDate ?? null, body.confidence ?? null)
    .run();
  return c.json({ goal: { id, ...body, description: body.description ?? "", status: "active" } });
});

goalsRoutes.patch("/goals/:goalId", async (c) => {
  const body = await c.req.json<{ status?: string; title?: string; description?: string; whyItMatters?: string; nextAction?: string | null; targetDate?: string | null; confidence?: number | null }>();
  const current = await c.env.DB.prepare("SELECT * FROM goals WHERE id = ? AND user_id = ?").bind(c.req.param("goalId"), c.get("userId")).first<Record<string, unknown>>();
  if (!current) return c.json({ error: "Goal not found" }, 404);
  const status = normalizeStatus(body.status ?? current.status);
  await c.env.DB.prepare(
    `UPDATE goals
     SET status = ?,
         title = ?,
         description = ?,
         why_it_matters = ?,
         next_action = ?,
         target_date = ?,
         confidence = ?,
         achieved_at = CASE WHEN ? = 'achieved' THEN COALESCE(achieved_at, CURRENT_TIMESTAMP) ELSE achieved_at END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`
  )
    .bind(
      status,
      body.title ?? current.title,
      body.description ?? current.description ?? "",
      body.whyItMatters ?? current.why_it_matters ?? null,
      body.nextAction ?? current.next_action ?? null,
      body.targetDate ?? current.target_date ?? null,
      body.confidence ?? current.confidence ?? null,
      status,
      c.req.param("goalId"),
      c.get("userId")
    )
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM goals WHERE id = ? AND user_id = ?").bind(c.req.param("goalId"), c.get("userId")).first<Record<string, unknown>>();
  if (!row) return c.json({ error: "Goal not found" }, 404);
  return c.json({
    goal: {
      id: row.id,
      userId: row.user_id,
      category: row.category,
      title: row.title,
      description: row.description ?? "",
      whyItMatters: row.why_it_matters,
      nextAction: row.next_action,
      targetDate: row.target_date,
      status: row.status,
      confidence: row.confidence,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      achievedAt: row.achieved_at
    }
  });
});

function normalizeStatus(value: unknown) {
  return value === "paused" || value === "achieved" || value === "released" ? value : "active";
}
