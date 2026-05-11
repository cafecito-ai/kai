import { Hono } from "hono";
import type { Env } from "../types";

export const userRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

userRoutes.get("/user/me", async (c) => {
  const userId = c.get("userId");
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  return c.json({ user, intake: null, primaryEngine: user?.primary_engine ?? "physical", kaiName: user?.kai_name ?? "Kai", kaiTone: user?.kai_tone ?? "balanced" });
});

userRoutes.patch("/user/me", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ kaiName?: string; kaiTone?: string; primaryEngine?: string }>();
  await c.env.DB.prepare(
    `INSERT INTO users (id, kai_name, kai_tone, primary_engine, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET kai_name = excluded.kai_name, kai_tone = excluded.kai_tone, primary_engine = excluded.primary_engine, updated_at = CURRENT_TIMESTAMP`
  )
    .bind(userId, body.kaiName ?? "Kai", body.kaiTone ?? "balanced", body.primaryEngine ?? "physical")
    .run();
  return c.json({ ok: true });
});

userRoutes.post("/onboarding/intake", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ responses: Record<string, string> }>();
  const text = Object.values(body.responses).join(" ").toLowerCase();
  const suggestedEngine = /goal|school|sport|business|future|music|instrument/.test(text)
    ? "potential"
    : /stress|sad|anxious|friend|social|identity|emotion/.test(text)
      ? "mental"
      : "physical";
  const summary = Object.values(body.responses).filter(Boolean).slice(0, 3).join(" ");
  await c.env.DB.prepare(
    `INSERT INTO user_intake (user_id, raw_responses, summary)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET raw_responses = excluded.raw_responses, summary = excluded.summary`
  )
    .bind(userId, JSON.stringify(body.responses), summary)
    .run();
  return c.json({ summary, suggestedEngine, reasoning: "Based on the themes in your answers, this is the cleanest first step." });
});
