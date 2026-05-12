import type { Env } from "../types";

export type VisionItem = { name: string; estimated_grams: number };
export type VisionConfidence = "high" | "medium" | "low";

export type VisionResult = {
  items: VisionItem[];
  confidence: VisionConfidence;
  notes: string;
};

const VALID_CONFIDENCE = new Set<VisionConfidence>(["high", "medium", "low"]);

const VISION_PROMPT = [
  "Analyze the food photo. Return ONLY a single JSON object — no prose, no markdown, no preamble.",
  "",
  "Schema:",
  '{"items":[{"name":"<food item>","estimated_grams":<number>}],"confidence":"<high|medium|low>","notes":"<short remark>"}',
  "",
  "Rules:",
  "- List visible foods only. Don't invent items you don't see.",
  "- Estimate portion size in grams to the nearest 10g. Better to under-estimate than guess high.",
  "- Confidence: high if the photo is clear and items are recognizable; medium if portions are ambiguous; low if the photo is unclear or partial.",
  "- If the photo does NOT contain food, return: {\"items\":[],\"confidence\":\"low\",\"notes\":\"no food detected\"}",
  "- Names should be everyday plain language (\"grilled chicken\", \"white rice\", \"broccoli\") not brand or recipe names."
].join("\n");

/**
 * Pull the first balanced {...} JSON object out of a model response.
 * Duplicated from P1-1; consolidate to a shared util once both land.
 */
function extractJsonObject(raw: string): string | null {
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

export function parseVisionResponse(raw: string): VisionResult | null {
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
  if (!confidence || !VALID_CONFIDENCE.has(confidence as VisionConfidence)) return null;

  const notes = typeof obj.notes === "string" ? obj.notes.slice(0, 200) : "";

  if (!Array.isArray(obj.items)) return null;
  const items: VisionItem[] = [];
  for (const raw of obj.items) {
    if (!raw || typeof raw !== "object") continue;
    const itemObj = raw as Record<string, unknown>;
    const name = typeof itemObj.name === "string" ? itemObj.name.trim() : "";
    const grams = typeof itemObj.estimated_grams === "number" ? itemObj.estimated_grams : null;
    if (!name || grams == null || !Number.isFinite(grams) || grams < 0) continue;
    items.push({ name: name.slice(0, 80), estimated_grams: Math.min(2000, Math.round(grams)) });
  }
  if (items.length > 12) items.length = 12;

  return { items, confidence: confidence as VisionConfidence, notes };
}

/**
 * Call Cloudflare Workers AI vision model on a photo stored in R2.
 * Returns null if the binding is missing or the model output can't be
 * parsed — caller falls back to manual entry.
 */
export async function analyzeFoodPhoto(env: Env, r2Key: string): Promise<VisionResult | null> {
  if (!env.AI || !env.UPLOADS) return null;
  const model = env.AI_VISION_MODEL || "@cf/llava-hf/llava-1.5-7b-hf";

  let image: Uint8Array;
  try {
    const obj = await env.UPLOADS.get(r2Key);
    if (!obj) return null;
    const buffer = await obj.arrayBuffer();
    image = new Uint8Array(buffer);
  } catch (err) {
    console.warn("vision: R2 read failed", err);
    return null;
  }

  try {
    const result = (await env.AI.run(model, {
      image: Array.from(image),
      prompt: VISION_PROMPT,
      max_tokens: 400,
      temperature: 0.1
    })) as { response?: string; description?: string };
    const raw = result.response || result.description || "";
    return parseVisionResponse(raw);
  } catch (err) {
    console.warn("vision: model call failed", err);
    return null;
  }
}
