// Schedule generation route.
//
// POST /api/schedule/generate  { request }  -> { items }
//
// Turns a free-text routine request into a structured weekly schedule. The
// schedule itself lives client-side (local-first, like goals/north-star); this
// just does the AI generation.

import { Hono } from "hono";
import { generateSchedule } from "../lib/schedule-gen";
import type { AppVariables, Env } from "../types";

export const scheduleRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

scheduleRoutes.post("/schedule/generate", async (c) => {
  const body = await c.req.json<{ request?: string; goal?: string }>().catch(() => ({ request: "", goal: "" }));
  const request = (body.request ?? "").trim();
  const goal = (body.goal ?? "").trim();
  // Allow generating a full system from the goal alone (no extra request).
  if (!request && !goal) return c.json({ items: [] }, 400);
  try {
    const items = await generateSchedule(c.env, request, goal || undefined);
    return c.json({ items });
  } catch {
    return c.json({ items: [] }, 200);
  }
});
