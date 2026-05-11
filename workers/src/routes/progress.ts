import { Hono } from "hono";
import { createProgressEvent } from "../lib/progress";
import type { AppVariables, Env, EngineId } from "../types";

export const progressRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

progressRoutes.get("/progress", async (c) => {
  const userId = c.get("userId");
  const { results } = await c.env.DB.prepare("SELECT * FROM progress_events WHERE user_id = ? ORDER BY occurred_at DESC LIMIT 100").bind(userId).all();
  const events = (results as Array<Record<string, unknown>>).map((row) => ({
    id: row.id,
    engine: row.engine,
    eventType: row.event_type,
    eventValue: row.event_value,
    payload: parseJson(row.payload),
    occurredAt: row.occurred_at
  }));
  return c.json({ eventsByDay: events, level: 1, streaks: {}, belts: {} });
});

progressRoutes.post("/progress/event", async (c) => {
  const body = await c.req.json<{ engine: EngineId | "kai"; eventType: string; eventValue: number; payload?: unknown }>();
  const event = await createProgressEvent(c.env.DB, { userId: c.get("userId"), ...body });
  return c.json({ event });
});

function parseJson(value: unknown) {
  if (typeof value !== "string") return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
