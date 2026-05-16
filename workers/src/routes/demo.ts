import { Hono } from "hono";
import type { AppVariables, Env } from "../types";

const VALID_UI = new Set(["Calm Coach", "Quest Mode", "Lifestyle Feed"]);
const VALID_HABIT = new Set(["Food Camera", "Emotional Check-in", "Streaks + Belts", "Home-screen Character"]);
const VALID_ONBOARDING = new Set(["Fast Start", "Personality Setup", "Goal Setup"]);
const VALID_PARENT = new Set(["Safety-only", "Weekly Summary", "Shared Wins"]);

type DemoChoices = {
  ui: string;
  habit: string;
  onboarding: string;
  parent: string;
};

export const demoRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

demoRoutes.post("/demo-feedback", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = parseDemoFeedback(body);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO demo_feedback (id, user_id, session_id, choices_json, summary, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      null,
      parsed.sessionId,
      JSON.stringify(parsed.choices),
      parsed.summary,
      c.req.header("user-agent") ?? null
    )
    .run();

  return c.json({ ok: true, id });
});

export function parseDemoFeedback(body: unknown):
  | { ok: true; sessionId: string; choices: DemoChoices; summary: string }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid payload" };
  const input = body as Record<string, unknown>;
  const sessionId = cleanText(input.sessionId, 120);
  const summary = cleanText(input.summary, 1000);
  const choices = input.choices;
  if (!sessionId) return { ok: false, error: "Missing sessionId" };
  if (!summary) return { ok: false, error: "Missing summary" };
  if (!choices || typeof choices !== "object") return { ok: false, error: "Missing choices" };

  const rawChoices = choices as Record<string, unknown>;
  const parsedChoices = {
    ui: cleanText(rawChoices.ui, 80),
    habit: cleanText(rawChoices.habit, 80),
    onboarding: cleanText(rawChoices.onboarding, 80),
    parent: cleanText(rawChoices.parent, 80)
  };

  if (!VALID_UI.has(parsedChoices.ui)) return { ok: false, error: "Invalid ui choice" };
  if (!VALID_HABIT.has(parsedChoices.habit)) return { ok: false, error: "Invalid habit choice" };
  if (!VALID_ONBOARDING.has(parsedChoices.onboarding)) return { ok: false, error: "Invalid onboarding choice" };
  if (!VALID_PARENT.has(parsedChoices.parent)) return { ok: false, error: "Invalid parent choice" };

  return { ok: true, sessionId, choices: parsedChoices, summary };
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}
