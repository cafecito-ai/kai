import { sendParentConsentEmail } from "./email";
import type { Env } from "../types";

export async function createConsentRequest(
  env: Env,
  input: { userId: string; parentEmail: string; teenName?: string; origin: string }
) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  await env.DB.prepare(
    "INSERT INTO parent_consent_tokens (token, user_id, parent_email, expires_at) VALUES (?, ?, ?, ?)"
  )
    .bind(token, input.userId, input.parentEmail, expiresAt)
    .run();
  await env.DB.prepare("UPDATE users SET consent_status = 'pending', parent_email = ? WHERE id = ?")
    .bind(input.parentEmail, input.userId)
    .run();
  const consentUrl = `${input.origin.replace(/\/$/, "")}/api/parent/consent?token=${encodeURIComponent(token)}`;
  const emailResult = await sendParentConsentEmail(env, { to: input.parentEmail, consentUrl, teenName: input.teenName });
  return { token, expiresAt, emailSent: !("skipped" in emailResult) };
}

export async function consumeConsentToken(db: D1Database, token: string) {
  const row = await db
    .prepare("SELECT token, user_id, expires_at, consumed_at FROM parent_consent_tokens WHERE token = ?")
    .bind(token)
    .first<{ token: string; user_id: string; expires_at: string; consumed_at: string | null }>();
  if (!row || row.consumed_at) return { ok: false, reason: "invalid" };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
  await db.prepare("UPDATE parent_consent_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE token = ?").bind(token).run();
  await db
    .prepare("UPDATE users SET parent_consent_at = CURRENT_TIMESTAMP, consent_status = 'complete' WHERE id = ?")
    .bind(row.user_id)
    .run();
  return { ok: true };
}
