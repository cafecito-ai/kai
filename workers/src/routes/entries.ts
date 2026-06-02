import { Hono } from "hono";
import { ensureUser } from "../lib/db";
import { logAppEvent } from "../lib/events";
import type { AppVariables, Env, EngineId } from "../types";

export const entriesRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

entriesRoutes.get("/engines/:engineId/entries", async (c) => {
  const engine = c.req.param("engineId") as EngineId;
  if (!["physical", "potential", "mental"].includes(engine)) return c.json({ error: "Unknown engine" }, 404);
  const { results } = await c.env.DB.prepare("SELECT * FROM engine_entries WHERE user_id = ? AND engine = ? ORDER BY created_at DESC LIMIT 100")
    .bind(c.get("userId"), engine)
    .all();
  const entries = (results as Array<Record<string, unknown>>).map((row) => ({
    id: row.id,
    engine: row.engine,
    entryType: row.entry_type,
    title: row.title,
    payload: parseJson(row.payload),
    createdAt: row.created_at,
    completedAt: row.completed_at
  }));
  return c.json({ entries });
});

entriesRoutes.post("/engines/:engineId/entries", async (c) => {
  const engine = c.req.param("engineId") as EngineId;
  if (!["physical", "potential", "mental"].includes(engine)) return c.json({ error: "Unknown engine" }, 404);
  const body = await c.req.json<{ entryType: string; title?: string; payload?: unknown; completed?: boolean }>();
  await ensureUser(c.env.DB, c.get("userId"));
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO engine_entries (id, user_id, engine, entry_type, title, payload, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END)`
  )
    .bind(id, c.get("userId"), engine, body.entryType, body.title ?? null, JSON.stringify(body.payload ?? {}), body.completed ? 1 : 0)
    .run();
  await logAppEvent(c.env.DB, { userId: c.get("userId"), eventName: "engine_entry_created", payload: { engine, entryType: body.entryType } });
  return c.json({
    entry: {
      id,
      engine,
      entryType: body.entryType,
      title: body.title,
      payload: body.payload ?? {},
      completedAt: body.completed ? new Date().toISOString() : null
    }
  });
});

function parseJson(value: unknown) {
  if (typeof value !== "string") return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
