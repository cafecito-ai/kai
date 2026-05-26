/**
 * Body scan vision pipeline. Mirrors the food-photo flow but with a
 * **strict posture-only** prompt that explicitly forbids the model
 * from commenting on body composition, weight, leanness, muscle
 * definition, attractiveness, or anything else that's an eating-
 * disorder risk vector for the teen audience.
 *
 * This is enforced two places:
 *   1. Prompt rules (below) — the model is told plainly what to
 *      avoid.
 *   2. Parser filter (`isSafePostureFocus`) — even if the model
 *      slips, any cue tagged with a forbidden focus is dropped on
 *      the way back through. Belt and suspenders.
 */

import type { Env } from "../types";
import { extractJsonObject } from "./json-utils";

export type PostureCue = { focus: string; suggestion: string };
export type PostureConfidence = "high" | "medium" | "low";

export type PostureResult = {
  cues: PostureCue[];
  confidence: PostureConfidence;
  notes: string;
};

const VALID_CONFIDENCE = new Set<PostureConfidence>(["high", "medium", "low"]);

// Words that, if they appear in a cue, mean the model strayed into
// body-composition / appearance territory. We DROP those cues, not
// just flag them — the teen never sees them. Lower-cased compare.
const FORBIDDEN_TOKENS = [
  "fat",
  "thin",
  "skinny",
  "lean",
  "muscle definition",
  "muscular",
  "tone",
  "toned",
  "weight",
  "lose",
  "gain",
  "shape",
  "physique",
  "attractive",
  "beautiful",
  "ugly",
  "size",
  "small",
  "large",
  "big",
  "skin",
  "complexion",
  "outfit",
  "clothing",
  "style"
];

const POSTURE_PROMPT = [
  "Analyze the photo for visible POSTURE and standing ALIGNMENT ONLY. Return ONLY a single JSON object — no prose, no markdown, no preamble.",
  "",
  "Schema:",
  '{"cues":[{"focus":"<posture topic>","suggestion":"<one supportive next move>"}],"confidence":"<high|medium|low>","notes":"<short remark>"}',
  "",
  "WHAT TO LOOK AT:",
  "- shoulder height and rotation (rounded forward? one higher than the other?)",
  "- head position relative to shoulders (head-forward? chin tucked?)",
  "- hip alignment (one higher? rotated?)",
  "- spine curve (over-arched lower back? rounded upper back?)",
  "- weight distribution between feet (one side dominant?)",
  "",
  "CUES MUST:",
  "- be short, supportive, plain language",
  "- suggest a stretch, mobility move, or awareness cue. Example: \"Try a doorway chest opener.\" / \"Notice if your head drifts forward when you relax.\"",
  "- be 1–3 cues maximum",
  "",
  "ABSOLUTE BANS — never comment on, never use the words:",
  "- body fat, weight, leanness, thinness, muscle definition, body shape, physique, size, attractiveness, beauty, clothing, skin",
  "- never score the body in any way",
  "- never compare to other bodies, to an ideal, or to a standard",
  "- never give medical claims, diagnose pain, or suggest weight loss/gain",
  "",
  'If no person visible, return {"cues":[],"confidence":"low","notes":"no person visible"}',
  "",
  "Confidence:",
  "- high: full body visible, posture clearly readable",
  "- medium: partial body or some angles unclear",
  "- low: obscured, distant, or partial"
].join("\n");

const VISION_TIMEOUT_MS = 12_000;

/**
 * Returns true if the cue focus/suggestion text steers clear of the
 * forbidden body-composition / appearance vocabulary. Lower-cases
 * before matching so capitalization can't bypass.
 */
export function isSafePostureCue(cue: PostureCue): boolean {
  const text = `${cue.focus} ${cue.suggestion}`.toLowerCase();
  for (const token of FORBIDDEN_TOKENS) {
    // word-boundary match so e.g. "shape" doesn't reject "shapely"
    // exactly — but it does reject any sentence containing "shape".
    // We err on the side of dropping the cue.
    if (text.includes(token)) return false;
  }
  return true;
}

export function parsePostureResponse(raw: string): PostureResult | null {
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

  const confidence = typeof obj.confidence === "string" ? obj.confidence : null;
  if (!confidence || !VALID_CONFIDENCE.has(confidence as PostureConfidence)) return null;

  const notes = typeof obj.notes === "string" ? obj.notes.slice(0, 200) : "";

  if (!Array.isArray(obj.cues)) return null;
  const cues: PostureCue[] = [];
  for (const raw of obj.cues) {
    if (!raw || typeof raw !== "object") continue;
    const cueObj = raw as Record<string, unknown>;
    const focus = typeof cueObj.focus === "string" ? cueObj.focus.trim() : "";
    const suggestion = typeof cueObj.suggestion === "string" ? cueObj.suggestion.trim() : "";
    if (!focus || !suggestion) continue;
    const cue: PostureCue = {
      focus: focus.slice(0, 60),
      suggestion: suggestion.slice(0, 200)
    };
    if (!isSafePostureCue(cue)) continue;
    cues.push(cue);
  }
  // Cap at 3 — anything beyond reads as a checklist, which the teen
  // shouldn't experience after a body scan.
  if (cues.length > 3) cues.length = 3;

  return { cues, confidence: confidence as PostureConfidence, notes };
}

/**
 * Call Cloudflare Workers AI vision model on a body-scan photo
 * stored in R2. Returns null if the binding is missing or the model
 * output can't be parsed — caller falls back to "scan saved, no cues
 * available right now."
 */
export async function analyzePosturePhoto(env: Env, r2Key: string): Promise<PostureResult | null> {
  if (!env.AI || !env.UPLOADS) return null;
  const model = env.AI_VISION_MODEL || "@cf/llava-hf/llava-1.5-7b-hf";

  let image: Uint8Array;
  try {
    const obj = await env.UPLOADS.get(r2Key);
    if (!obj) return null;
    const buffer = await obj.arrayBuffer();
    image = new Uint8Array(buffer);
  } catch (err) {
    console.warn("posture: R2 read failed", err);
    return null;
  }

  try {
    const result = (await withTimeout(
      env.AI.run(model, {
        image: Array.from(image),
        prompt: POSTURE_PROMPT,
        max_tokens: 350,
        temperature: 0.1
      }),
      VISION_TIMEOUT_MS
    )) as { response?: string; description?: string };
    const raw = result.response || result.description || "";
    return parsePostureResponse(raw);
  } catch (err) {
    console.warn("posture: model call failed", err);
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("posture timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
