import type { Env, SafetyClassification } from "../types";
import { withTimeout } from "./claude";
import { ensureUser } from "./db";
import { sendParentSafetyAlert } from "./email";
import { extractJsonObject } from "./json-utils";

// Re-export so existing imports (workers/test/safety.test.ts) keep working
// without touching every caller. Single source of truth lives in json-utils.
export { extractJsonObject };

const PARENT_NOTIFIABLE_CATEGORIES = new Set<NonNullable<SafetyClassification["category"]>>([
  "suicide_ideation",
  "self_harm",
  "abuse_disclosure"
]);

const PARENT_NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const SAFETY_LLM_TIMEOUT_MS = 1_500;

const rules: Array<{ category: NonNullable<SafetyClassification["category"]>; severity: NonNullable<SafetyClassification["severity"]>; pattern: RegExp }> = [
  { category: "suicide_ideation", severity: "critical", pattern: /\b(kill myself|suicide|end my life|not want to live)\b/i },
  { category: "self_harm", severity: "high", pattern: /\b(cut myself|self harm|hurt myself|burn myself)\b/i },
  { category: "eating_disorder", severity: "high", pattern: /\b(purge|starve myself|throw up after eating)\b/i },
  { category: "eating_disorder", severity: "medium", pattern: /\b(skip meals?|skipping meals?|afraid to eat|hate my body|too fat|calories? are scary|under ?500 calories|need to be skinny|lose weight fast without eating|without eating|don'?t eat|dont eat)\b/i },
  { category: "abuse_disclosure", severity: "high", pattern: /\b(abuse|molest|assaulted|hit me)\b/i },
  { category: "substance", severity: "high", pattern: /\b(overdose|too many pills|drunk and driving)\b/i },
  { category: "violence_to_others", severity: "critical", pattern: /\b(kill them|hurt someone|shoot|stab)\b/i }
];

const VALID_CATEGORIES = new Set<NonNullable<SafetyClassification["category"]>>([
  "suicide_ideation",
  "self_harm",
  "eating_disorder",
  "abuse_disclosure",
  "substance",
  "violence_to_others"
]);

const VALID_SEVERITIES = new Set<NonNullable<SafetyClassification["severity"]>>([
  "low",
  "medium",
  "high",
  "critical"
]);

const STANDARD_SAFETY_RESPONSE =
  "I'm really glad you said that out loud. This is bigger than a normal KAI coaching moment, and I want you with a real person right now. If you might hurt yourself or someone else, call emergency services now. In the U.S. or Canada, call or text 988. I can stay here while you reach out.";

const EATING_DISORDER_RESPONSE =
  "I can’t help you not eat or lose weight fast. Your body needs fuel, especially if you’re training, growing, or stressed.\n\nTell me what you ate today and what you’re trying to change, and I’ll help you make a safer plan.";

const ABUSE_RESPONSE =
  "I’m really glad you told me. If someone is hurting you or making you feel unsafe, this needs a real trusted adult involved now: a parent you trust, school counselor, coach, relative, or emergency services if you’re in immediate danger.\n\nYou don’t have to handle that alone.";

function safetyResponseFor(category: NonNullable<SafetyClassification["category"]>) {
  if (category === "eating_disorder") return EATING_DISORDER_RESPONSE;
  if (category === "abuse_disclosure") return ABUSE_RESPONSE;
  return STANDARD_SAFETY_RESPONSE;
}

export function classifySafety(text: string): SafetyClassification {
  const match = rules.find((rule) => rule.pattern.test(text));
  if (!match) return { safe: true };
  return {
    safe: false,
    category: match.category,
    severity: match.severity,
    response: safetyResponseFor(match.category)
  };
}

/**
 * Parse a model response into a SafetyClassification. Strict shape validation;
 * returns null on any malformed input so the caller can decide what to do.
 *
 * Treats `category: "none"` as `safe: true` (the model's way of saying "nothing
 * flagged").
 */
export function parseSafetyResponse(raw: string): SafetyClassification | null {
  const jsonText = extractJsonObject(raw);
  if (!jsonText) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const category = typeof obj.category === "string" ? obj.category : null;
  const severity = typeof obj.severity === "string" ? obj.severity : null;

  if (category === "none") {
    return { safe: true };
  }

  if (!category || !VALID_CATEGORIES.has(category as NonNullable<SafetyClassification["category"]>)) {
    return null;
  }
  if (!severity || !VALID_SEVERITIES.has(severity as NonNullable<SafetyClassification["severity"]>)) {
    return null;
  }

  return {
    safe: false,
    category: category as NonNullable<SafetyClassification["category"]>,
    severity: severity as NonNullable<SafetyClassification["severity"]>,
    response: safetyResponseFor(category as NonNullable<SafetyClassification["category"]>)
  };
}

const SAFETY_CLASSIFIER_PROMPT = [
  "You are a safety classifier for a teen wellness coaching app. Read the teen's message and return ONLY a single JSON object — no prose, no markdown, no preamble.",
  "",
  "JSON shape:",
  '{"category":"<one of: suicide_ideation, self_harm, eating_disorder, abuse_disclosure, substance, violence_to_others, none>","severity":"<low|medium|high|critical>","explanation":"<one short sentence>"}',
  "",
  "Severity rubric:",
  "- critical: explicit intent/plan, immediate danger, or disclosure of ongoing abuse",
  "- high: strong distress signals, recent active behavior, or vague intent",
  "- medium: at-risk language, patterns, or worrying disclosures without immediate intent",
  "- low: passing reference or hypothetical with no distress signal",
  "",
  "If nothing in the message rises to a safety concern, return:",
  '{"category":"none","severity":"low","explanation":"no safety signal"}',
  "",
  "Do NOT flag ordinary sadness, depression, anxiety, loneliness, low motivation, school stress, social drama, or phrases like \"I can't keep going like this\" unless the message also includes explicit self-harm, suicide, death, abuse, overdose, severe restriction/purging, or violence-to-others language.",
  "Only classify suicide_ideation when the teen explicitly mentions wanting to die, kill themselves, end their life, not be alive/not be here, suicide, or a specific plan/intent.",
  "Do not flag normal teen frustration, body-image complaints, school stress, sadness, depression, or social drama unless they cross into the categories above.",
  ""
].join("\n");

/**
 * Run the LLM-based safety classifier. Returns a SafetyClassification or
 * null if the model output couldn't be parsed.
 *
 * Latency: a Llama call adds ~500ms–2s. Callers should run the cheap regex
 * fast path first and only invoke this on misses.
 */
export async function classifySafetyLLM(env: Env, text: string): Promise<SafetyClassification | null> {
  if (!env.AI) return null;
  const model = env.AI_TEXT_MODEL || "@cf/meta/llama-3.1-8b-instruct";
  try {
    const prompt = `${SAFETY_CLASSIFIER_PROMPT}\nMessage: ${text}\n\nJSON:`;
    const result = (await withTimeout(
      env.AI.run(model, {
        prompt,
        max_tokens: 200,
        temperature: 0.1
      }),
      SAFETY_LLM_TIMEOUT_MS,
    )) as { response?: string; text?: string };
    const raw = result.response || result.text || "";
    return parseSafetyResponse(raw);
  } catch (err) {
    console.warn("safety LLM classifier failed; treating as no-signal", err);
    return null;
  }
}

/**
 * Full safety classification: regex fast path, then LLM fallback for the
 * paraphrases regex misses.
 *
 * Returns the existing-behavior `{safe: true}` if both pass — no regression
 * vs. the regex-only world. When the LLM flags something the regex misses,
 * that's the upgrade.
 */
export async function classifySafetyFull(env: Env, text: string): Promise<SafetyClassification> {
  const fast = classifySafety(text);
  if (!fast.safe) return fast;
  if (!needsLLMSafetyReview(text)) return { safe: true };
  const llm = await classifySafetyLLM(env, text);
  if (llm && !llm.safe) return llm;
  return { safe: true };
}

function needsLLMSafetyReview(text: string): boolean {
  return /\b(kill|suicide|die|dead|death|end (it|my life)|make it end|not be (alive|here)|not being here|hurt myself|harm myself|scratch myself|cut myself|cut to feel|self harm|burn myself|burn my|overdose|pills|vodka|drunk and driving|huffing|using every day|purge|starve|haven't eaten|restricting|throw up after|punish myself for eating|don't have to eat|without eating|lose weight fast|abuse|molest|assault|hit me|violent with me|locks me|touched me|not to tell|hurt them|shoot|stab|knife to school|make him pay|hurt someone)\b/i.test(text);
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
