import type { Env, SafetyClassification } from "../types";
import { ensureUser } from "./db";
import { sendParentSafetyAlert } from "./email";

const PARENT_NOTIFIABLE_CATEGORIES = new Set<NonNullable<SafetyClassification["category"]>>([
  "suicide_ideation",
  "self_harm",
  "abuse_disclosure"
]);

const PARENT_NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

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
 * - Texts <=80 chars: returned as-is with a length prefix (already short, no truncation).
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
  return `len:${len}|${head}...${tail}`;
}

/**
 * Pure decision for whether to fire a parent notification for a safety event.
 *
 * Per spec Section 7: "Always notify for critical severity in suicide/self-harm/
 * abuse categories, regardless of user consent, IF parent contact is on file."
 *
 * Note: the current regex classifier tiers `self_harm` and `abuse_disclosure` as
 * `high` (not `critical`). Section 7's "Critical categories" list treats those
 * three as inherently critical, so we accept `critical` OR `high` to match
 * spec intent. Revisit when the LLM-based classifier (P1-1) lands.
 */
export function shouldNotifyParent(input: {
  severity?: NonNullable<SafetyClassification["severity"]> | null;
  category?: NonNullable<SafetyClassification["category"]> | null;
  parentEmail?: string | null;
  lastNotifiedAt?: string | null;
  now?: Date;
}): boolean {
  if (!input.parentEmail) return false;
  if (!input.category || !PARENT_NOTIFIABLE_CATEGORIES.has(input.category)) return false;
  if (input.severity !== "critical" && input.severity !== "high") return false;
  if (input.lastNotifiedAt) {
    const last = new Date(input.lastNotifiedAt).getTime();
    if (Number.isFinite(last)) {
      const now = (input.now ?? new Date()).getTime();
      if (now - last < PARENT_NOTIFY_COOLDOWN_MS) return false;
    }
  }
  return true;
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

  const parentNotified = await maybeNotifyParent(env, {
    eventId: id,
    userId: input.userId,
    category: input.classification.category,
    severity: input.classification.severity
  });

  return { id, parentNotified };
}

async function maybeNotifyParent(
  env: Env,
  input: {
    eventId: string;
    userId: string;
    category: NonNullable<SafetyClassification["category"]>;
    severity: NonNullable<SafetyClassification["severity"]>;
  }
): Promise<boolean> {
  const user = await env.DB
    .prepare("SELECT parent_email, display_name, kai_name FROM users WHERE id = ?")
    .bind(input.userId)
    .first<{ parent_email: string | null; display_name: string | null; kai_name: string | null }>();

  const recent = await env.DB
    .prepare(
      `SELECT parent_notified_at FROM safety_events
       WHERE user_id = ? AND trigger_category = ? AND parent_notified = 1
       ORDER BY parent_notified_at DESC LIMIT 1`
    )
    .bind(input.userId, input.category)
    .first<{ parent_notified_at: string | null }>();

  const decision = shouldNotifyParent({
    severity: input.severity,
    category: input.category,
    parentEmail: user?.parent_email,
    lastNotifiedAt: recent?.parent_notified_at ?? null
  });
  if (!decision || !user?.parent_email) return false;

  try {
    await sendParentSafetyAlert(env, {
      parentEmail: user.parent_email,
      teenName: user.display_name
    });
    await env.DB
      .prepare(
        "UPDATE safety_events SET parent_notified = 1, parent_notified_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .bind(input.eventId)
      .run();
    return true;
  } catch {
    // Don't fail the chat turn if parent email fails. Ops alert + DB row remain.
    return false;
  }
}
