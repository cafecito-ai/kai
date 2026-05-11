import { Hono } from "hono";
import { ensureUser } from "../lib/db";
import type { AppVariables, Env } from "../types";

export const goalsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

goalsRoutes.get("/goals", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC").bind(c.get("userId")).all();
  const goals = (results as Array<Record<string, unknown>>).map((row) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    targetDate: row.target_date,
    status: row.status
  }));
  return c.json({ goals });
});

goalsRoutes.post("/goals", async (c) => {
  const body = await c.req.json<{ category: string; title: string; description?: string; targetDate?: string }>();
  await ensureUser(c.env.DB, c.get("userId"));
  const id = crypto.randomUUID();
  await c.env.DB.prepare("INSERT INTO goals (id, user_id, category, title, description, target_date) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, c.get("userId"), body.category, body.title, body.description ?? null, body.targetDate ?? null)
    .run();
  return c.json({ goal: { id, ...body, status: "active" } });
});

goalsRoutes.patch("/goals/:goalId", async (c) => {
  const body = await c.req.json<{ status: string }>();
  await c.env.DB.prepare("UPDATE goals SET status = ?, achieved_at = CASE WHEN ? = 'achieved' THEN CURRENT_TIMESTAMP ELSE achieved_at END WHERE id = ? AND user_id = ?")
    .bind(body.status, body.status, c.req.param("goalId"), c.get("userId"))
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM goals WHERE id = ? AND user_id = ?").bind(c.req.param("goalId"), c.get("userId")).first<Record<string, unknown>>();
  if (!row) return c.json({ error: "Goal not found" }, 404);
  return c.json({
    goal: {
      id: row.id,
      category: row.category,
      title: row.title,
      description: row.description,
      targetDate: row.target_date,
      status: row.status
    }
  });
});
