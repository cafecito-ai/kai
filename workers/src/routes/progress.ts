import { Hono } from "hono";
import { createProgressEvent } from "../lib/progress";
import type { Env, EngineId } from "../types";

export const progressRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

progressRoutes.get("/progress", async (c) => {
  const userId = c.get("userId");
  const { results } = await c.env.DB.prepare("SELECT * FROM progress_events WHERE user_id = ? ORDER BY occurred_at DESC LIMIT 100").bind(userId).all();
  return c.json({ eventsByDay: results, level: 1, streaks: {}, belts: {} });
});

progressRoutes.post("/progress/event", async (c) => {
  const body = await c.req.json<{ engine: EngineId | "kai"; eventType: string; eventValue: number; payload?: unknown }>();
  const event = await createProgressEvent(c.env.DB, { userId: c.get("userId"), ...body });
  return c.json({ event });
});
