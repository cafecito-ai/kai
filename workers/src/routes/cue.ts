import { Hono } from "hono";
import { generateEventCue, type CueResponse } from "../lib/event-cues";
import type { Env } from "../types";

export const cueRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

/**
 * POST /api/kai/cue
 *
 * Returns a single one-sentence Kai cue tailored to a just-completed
 * engine event. Frontend calls this in parallel with the event-log
 * write (non-blocking) and surfaces the cue in a small sage note
 * inside the engine card.
 *
 * Failures and unsafe model output both fall back to a hand-written
 * per-event cue. Always 200; the response always has a usable cue.
 */
cueRoutes.post("/kai/cue", async (c) => {
  const body = await c.req.json<{
    eventType?: string;
    eventValue?: number;
    payload?: Record<string, unknown>;
    kaiName?: string;
  }>();

  if (!body.eventType || typeof body.eventType !== "string") {
    return c.json({ error: "eventType is required" }, 400);
  }

  const result: CueResponse = await generateEventCue(c.env, {
    eventType: body.eventType,
    eventValue: body.eventValue,
    payload: body.payload,
    kaiName: body.kaiName
  });
  return c.json(result);
});
