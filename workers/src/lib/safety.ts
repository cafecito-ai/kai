import type { SafetyClassification } from "../types";
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

export async function logSafetyEvent(db: D1Database, input: { userId: string; conversationId?: string; messageId?: string; rawText: string; classification: SafetyClassification }) {
  if (input.classification.safe || !input.classification.category || !input.classification.severity) return null;
  await ensureUser(db, input.userId);
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO safety_events (id, user_id, trigger_category, severity, conversation_id, message_id, raw_text, resources_shown)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.userId,
      input.classification.category,
      input.classification.severity,
      input.conversationId ?? null,
      input.messageId ?? null,
      input.rawText,
      JSON.stringify(["988", "Crisis Text Line"])
    )
    .run();
  return { id };
}
