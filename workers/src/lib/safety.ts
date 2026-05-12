import type { Env, SafetyClassification } from "../types";
import { ensureUser } from "./db";

const rules: Array<{ category: NonNullable<SafetyClassification["category"]>; severity: NonNullable<SafetyClassification["severity"]>; pattern: RegExp }> = [
  { category: "suicide_ideation", severity: "critical", pattern: /\b(kill myself|suicide|end my life|not want to live)\b/i },
  { category: "self_harm", severity: "high", pattern: /\b(cut myself|self harm|hurt myself|burn myself)\b/i },
  { category: "eating_disorder", severity: "high", pattern: /\b(purge|starve myself|throw up after eating)\b/i },
  { category: "eating_disorder", severity: "medium", pattern: /\b(skip meals?|skipping meals?|afraid to eat|hate my body|too fat|calories? are scary|under ?500 calories|need to be skinny)\b/i },
  { category: "abuse_disclosure", severity: "high", pattern: /\b(abuse|molest|assaulted|hit me)\b/i },
  { category: "substance", severity: "high", pattern: /\b(overdose|too many pills|drunk and driving)\b/i },
  { category: "violence_to_others", severity: "critical", pattern: /\b(kill them|hurt someone|shoot|stab)\b/i }
];

export function classifySafety(text: string): SafetyClassification {
  const match = rules.find((rule) => rule.pattern.test(text));
  if (!match) return { safe: true };
  return {
    safe: false,
    category: match.category,
    severity: match.severity,
    response:
      "Hey. I hear you. That's a lot. What you're carrying is bigger than what I can help with directly. If you're in immediate danger, call 911 now. In the U.S. or Canada, call or text 988. You can also text HOME to 741741 for Crisis Text Line. I can stay here while you reach out."
  };
}

/**
 * Build a privacy-preserving excerpt of a teen message for ops review.
 *
 * - Texts ≤80 chars: returned as-is with a length prefix (already short, no truncation).
 * - Longer texts: first 40 chars + ellipsis + last 40 chars, with length prefix.
 *
 * Spec Section 13: "No raw user text in error logs." Same intent applied to
 * persisted safety_events.
 */
export function redactExcerpt(text: string | null | undefined): string {
  const value = (text ?? "").toString();
  const len = value.length;
  if (len === 0) return "len:0|";
  if (len <= 80) return `len:${len}|${value}`;
  const head = value.slice(0, 40);
  const tail = value.slice(-40);
  return `len:${len}|${head}…${tail}`;
}

export async function logSafetyEvent(
  env: Env,
  input: { userId: string; conversationId?: string; messageId?: string; rawText: string; classification: SafetyClassification }
) {
  if (input.classification.safe || !input.classification.category || !input.classification.severity) return null;
  const db = env.DB;
  await ensureUser(db, input.userId);
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO safety_events (id, user_id, trigger_category, severity, conversation_id, message_id, redacted_excerpt, resources_shown)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.userId,
      input.classification.category,
      input.classification.severity,
      input.conversationId ?? null,
      input.messageId ?? null,
      redactExcerpt(input.rawText),
      JSON.stringify(["988", "Crisis Text Line"])
    )
    .run();
  return { id };
}
