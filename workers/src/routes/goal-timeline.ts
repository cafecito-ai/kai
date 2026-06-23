// Goal timeline estimate.
//
// POST /api/goal/timeline  { goal, system? }  -> { estimate: { weeks, rationale, factors[] } | null }
//
// The System is the vehicle; the goal is the destination. Instead of arbitrary
// weekly %, we ask the model for a REALISTIC number of weeks to reach the goal
// given its difficulty and the habits in the system. The client turns that into
// a projected finish date that flexes with the user's consistency.

import { Hono } from "hono";
import { callClaude, MODEL_FAST } from "../lib/claude";
import type { AppVariables, Env } from "../types";

export const goalTimelineRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const SYSTEM = [
  "A teenager set a goal and has a system of daily/weekly habits built around it. Estimate how many WEEKS it realistically takes to reach this goal if they stay reasonably consistent.",
  "Base it on the goal's difficulty and the habits listed. Be realistic and encouraging — not so long it's discouraging, not so short it's a lie. Most teen goals land between 4 and 52 weeks.",
  "Keep it safe and healthy for a teenager; never tie timelines to weight or appearance numbers.",
  "",
  'Return ONLY JSON: {"weeks": <integer 1-104>, "rationale": "<one short sentence, <=120 chars>", "factors": ["<=6 words", "<=6 words", "<=6 words"]}',
  "factors are the 2-3 things that most affect how fast they get there (e.g. \"consistency beats intensity\", \"sleep drives recovery\").",
].join("\n");

export type GoalTimelineEstimate = {
  weeks: number;
  rationale: string;
  factors: string[];
};

/** Pull the first {...} object out of the model output and validate it.
 *  Returns null on anything malformed (route serves a graceful null). */
export function parseTimeline(raw: string): GoalTimelineEstimate | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const obj = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    const weeks = Math.round(Number(obj.weeks));
    if (!Number.isFinite(weeks) || weeks < 1) return null;
    const rationale = typeof obj.rationale === "string" ? obj.rationale.replace(/\s+/g, " ").trim().slice(0, 120) : "";
    const factors = Array.isArray(obj.factors)
      ? obj.factors.filter((f): f is string => typeof f === "string").map((f) => f.trim().slice(0, 48)).filter(Boolean).slice(0, 3)
      : [];
    return { weeks: Math.min(weeks, 104), rationale, factors };
  } catch {
    return null;
  }
}

goalTimelineRoutes.post("/goal/timeline", async (c) => {
  const body = await c.req.json<{ goal?: string; system?: string }>().catch(() => ({ goal: "", system: "" }));
  const goal = (body.goal ?? "").trim().slice(0, 160);
  const system = (body.system ?? "").trim().slice(0, 800);
  if (!goal) return c.json({ estimate: null }, 400);

  try {
    const raw = await callClaude(
      c.env,
      SYSTEM,
      [{ role: "user", content: `Goal: "${goal}"\n\nTheir system:\n${system || "(not built yet)"}\n\nReturn the estimate as JSON.` }],
      { model: MODEL_FAST, maxTokens: 200, timeoutMs: 12_000 },
    );
    return c.json({ estimate: parseTimeline(raw) });
  } catch {
    return c.json({ estimate: null }, 200);
  }
});
