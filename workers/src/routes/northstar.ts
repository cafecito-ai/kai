// North Star goal moves.
//
// POST /api/north-star/moves  { goal }  -> { moves: string[] }
//
// Generates 3 concrete, today-doable actions that DIRECTLY move the teen toward
// their long-term goal. The North Star ring only fills from completing these
// (not from generic logging) — progress is earned by goal-aligned action, with
// the alignment guaranteed because the moves are generated for that exact goal.

import { Hono } from "hono";
import { callClaude, MODEL_FAST } from "../lib/claude";
import type { AppVariables, Env } from "../types";

export const northStarRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const SYSTEM = [
  "A teenager set a long-term goal. Give EXACTLY 3 concrete actions they could take TODAY that directly move them toward it — the small, real-world moves that actually build toward this specific goal, not generic wellness tasks (not 'drink water', not 'sleep more' unless the goal is literally about that).",
  "",
  "Each action: starts with a verb, 9 words or fewer, specific, and genuinely doable today.",
  "Keep every suggestion safe, healthy, and appropriate for a teenager — nothing risky, nothing that pressures another person, nothing about appearance or weight.",
  "",
  'Return ONLY a JSON array of exactly 3 short strings. No prose, no markdown. Example: ["Start one short conversation with someone new","Make eye contact and smile at three people","Text them something low-key and casual"]',
].join("\n");

function parseMoves(raw: string): string[] {
  // Pull the first [...] array out of the response and parse it.
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start < 0 || end <= start) return [];
  try {
    const arr = JSON.parse(raw.slice(start, end + 1)) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim().replace(/\s+/g, " ").slice(0, 80))
      .filter(Boolean)
      .slice(0, 3);
  } catch {
    return [];
  }
}

northStarRoutes.post("/north-star/moves", async (c) => {
  const body = await c.req.json<{ goal?: string }>().catch(() => ({ goal: "" }));
  const goal = (body.goal ?? "").trim().slice(0, 120);
  if (!goal) return c.json({ moves: [] }, 400);

  try {
    const raw = await callClaude(
      c.env,
      SYSTEM,
      [{ role: "user", content: `Goal: "${goal}"\n\nReturn the 3 moves as a JSON array.` }],
      { model: MODEL_FAST, maxTokens: 200, timeoutMs: 12_000 },
    );
    const moves = parseMoves(raw);
    return c.json({ moves });
  } catch {
    return c.json({ moves: [] }, 200);
  }
});
