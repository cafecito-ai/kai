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

export async function sendParentSafetyAlert(
  env: Env,
  input: { parentEmail: string; teenName?: string | null }
) {
  if (!env.EMAIL || !env.EMAIL_FROM) return { skipped: true };
  const teen = input.teenName?.trim() || "Your teen";
  const text = [
    `${teen} reached out to Kai today about something serious.`,
    "We pointed them to crisis resources, including the 988 Suicide & Crisis Lifeline and Crisis Text Line (text HOME to 741741).",
    "Please check in with them when you can. Kai is a wellness coaching app, not a substitute for real support.",
    "If you believe they are in immediate danger, call 911 or take them to the nearest emergency room."
  ].join("\n\n");
  const html = [
    `<p>${teen} reached out to Kai today about something serious.</p>`,
    "<p>We pointed them to crisis resources, including the <strong>988 Suicide &amp; Crisis Lifeline</strong> and Crisis Text Line (text <strong>HOME</strong> to <strong>741741</strong>).</p>",
    "<p>Please check in with them when you can. Kai is a wellness coaching app, not a substitute for real support.</p>",
    "<p>If you believe they are in immediate danger, call 911 or take them to the nearest emergency room.</p>"
  ].join("");
  return env.EMAIL.send({
    to: input.parentEmail,
    from: env.EMAIL_FROM,
    subject: "Your teen reached out to Kai today",
    text,
    html
  });
}
