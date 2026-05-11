import { Hono } from "hono";
import { createConsentRequest } from "../lib/consent";
import { ensureUser } from "../lib/db";
import { logAppEvent } from "../lib/events";
import type { AppVariables, Env } from "../types";

export const userRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

userRoutes.get("/user/me", async (c) => {
  const userId = c.get("userId");
  await ensureUser(c.env.DB, userId);
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  return c.json({
    user,
    intake: null,
    primaryEngine: user?.primary_engine ?? "physical",
    kaiName: user?.kai_name ?? "Kai",
    kaiTone: user?.kai_tone ?? "balanced",
    onboardingCompletedAt: user?.onboarding_completed_at ?? null,
    consentStatus: user?.consent_status ?? "not_required",
    parentConsentAt: user?.parent_consent_at ?? null
  });
});

userRoutes.patch("/user/me", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ kaiName?: string; kaiTone?: string; primaryEngine?: string; age?: number; parentEmail?: string; email?: string; displayName?: string; onboardingCompleted?: boolean }>();
  await c.env.DB.prepare(
    `INSERT INTO users (id, email, display_name, age, parent_email, kai_name, kai_tone, primary_engine, onboarding_completed_at, consent_status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END, CASE WHEN ? < 18 THEN 'pending' ELSE 'not_required' END, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET
       email = COALESCE(excluded.email, users.email),
       display_name = COALESCE(excluded.display_name, users.display_name),
       age = COALESCE(excluded.age, users.age),
       parent_email = COALESCE(excluded.parent_email, users.parent_email),
       kai_name = COALESCE(excluded.kai_name, users.kai_name),
       kai_tone = COALESCE(excluded.kai_tone, users.kai_tone),
       primary_engine = COALESCE(excluded.primary_engine, users.primary_engine),
       onboarding_completed_at = CASE WHEN ? THEN COALESCE(users.onboarding_completed_at, CURRENT_TIMESTAMP) ELSE users.onboarding_completed_at END,
       consent_status = CASE
         WHEN excluded.age IS NULL THEN COALESCE(users.consent_status, 'not_required')
         WHEN excluded.age < 18 THEN COALESCE(users.consent_status, 'pending')
         ELSE 'not_required'
       END,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind(
      userId,
      body.email ?? null,
      body.displayName ?? null,
      body.age ?? null,
      body.parentEmail ?? null,
      body.kaiName ?? null,
      body.kaiTone ?? null,
      body.primaryEngine ?? null,
      body.onboardingCompleted ? 1 : 0,
      body.age ?? null,
      body.onboardingCompleted ? 1 : 0
    )
    .run();
  return c.json({ ok: true });
});

userRoutes.post("/onboarding/intake", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ responses: Record<string, string> }>();
  await ensureUser(c.env.DB, userId);
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
  await logAppEvent(c.env.DB, { userId, eventName: "onboarding_intake_submitted", payload: { suggestedEngine } });
  return c.json({ summary, suggestedEngine, reasoning: "Based on the themes in your answers, this is the cleanest first step." });
});

userRoutes.post("/parent/consent/request", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ parentEmail: string; teenName?: string }>();
  if (!body.parentEmail) return c.json({ error: "parentEmail is required" }, 400);
  await ensureUser(c.env.DB, userId);
  const origin = new URL(c.req.url).origin;
  const result = await createConsentRequest(c.env, { userId, parentEmail: body.parentEmail, teenName: body.teenName, origin });
  await logAppEvent(c.env.DB, { userId, eventName: "parent_consent_requested", payload: { parentEmail: body.parentEmail } });
  return c.json({ ok: true, expiresAt: result.expiresAt, emailSent: result.emailSent });
});
