import type { Env } from "../types";

export async function sendParentConsentEmail(
  env: Env,
  input: { to: string; teenName?: string; consentUrl: string }
) {
  if (!env.EMAIL || !env.EMAIL_FROM) return { skipped: true };
  const teen = input.teenName || "your teen";
  const text = `${teen} wants to use Kai, a wellness coaching app. Review and approve here: ${input.consentUrl}`;
  return env.EMAIL.send({
    to: input.to,
    from: env.EMAIL_FROM,
    subject: "Kai parent consent",
    text,
    html: `<p>${teen} wants to use Kai, a wellness coaching app.</p><p><a href="${input.consentUrl}">Review and approve access</a></p>`
  });
}

export async function sendSafetyAlert(env: Env, input: { category: string; severity: string; eventId: string }) {
  if (!env.EMAIL || !env.EMAIL_FROM || !env.SAFETY_ALERT_EMAIL) return { skipped: true };
  return env.EMAIL.send({
    to: env.SAFETY_ALERT_EMAIL,
    from: env.EMAIL_FROM,
    subject: `Kai safety alert: ${input.severity}`,
    text: `Safety event ${input.eventId} was logged. Category: ${input.category}. Severity: ${input.severity}.`,
    html: `<p>Safety event <strong>${input.eventId}</strong> was logged.</p><p>Category: ${input.category}<br/>Severity: ${input.severity}</p>`
  });
}
