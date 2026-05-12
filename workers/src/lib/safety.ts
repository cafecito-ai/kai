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
  "Hey. I hear you. That's a lot. What you're carrying is bigger than what I can help with directly. If you're in immediate danger, call 911 now. In the U.S. or Canada, call or text 988. You can also text HOME to 741741 for Crisis Text Line. I can stay here while you reach out.";

export function classifySafety(text: string): SafetyClassification {
  const match = rules.find((rule) => rule.pattern.test(text));
  if (!match) return { safe: true };
  return {
    safe: false,
    category: match.category,
    severity: match.severity,
    response: STANDARD_SAFETY_RESPONSE
  };
}

/**
 * Pull the first balanced {...} JSON object out of a model response. Llama
 * 3.1 8B often prefixes JSON with chatty preamble or wraps it in a markdown
 * code fence; this finds the JSON regardless.
 *
 * Returns the JSON substring or null if nothing balanced was found.
 */
export function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < raw.length; i++) {
    const char = raw[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\" && inString) {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
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
    response: STANDARD_SAFETY_RESPONSE
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
  "Be paraphrase-aware: \"I can't keep going like this\", \"everything would be easier without me\", \"I'm done\" all map to suicide_ideation with severity high or critical depending on specificity.",
  "Do not flag normal teen frustration, body-image complaints, school stress, or social drama unless they cross into the categories above.",
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
    const result = (await env.AI.run(model, {
      prompt,
      max_tokens: 200,
      temperature: 0.1
    })) as { response?: string; text?: string };
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
  const llm = await classifySafetyLLM(env, text);
  if (llm && !llm.safe) return llm;
  return { safe: true };
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
