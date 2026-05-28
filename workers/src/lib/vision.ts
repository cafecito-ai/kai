import type { Env } from "../types";
import { extractJsonObject } from "./json-utils";

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

const VISION_TIMEOUT_MS = 12_000;

export function parseVisionResponse(raw: string): VisionResult | null {
  const fallback = parseVisionDescription(raw);
  const jsonText = extractJsonObject(raw);
  if (!jsonText) return fallback;
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return fallback;
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

const DESCRIPTION_FOOD_MAP: Array<{ terms: string[]; name: string; grams: number }> = [
  { terms: ["sandwich", "submarine", "hoagie", "sub"], name: "sandwich", grams: 180 },
  { terms: ["apple"], name: "apple", grams: 150 },
  { terms: ["banana"], name: "banana", grams: 120 },
  { terms: ["rice"], name: "rice", grams: 150 },
  { terms: ["chicken"], name: "chicken", grams: 140 },
  { terms: ["salad"], name: "salad", grams: 120 },
  { terms: ["pizza"], name: "pizza", grams: 120 },
  { terms: ["burger", "hamburger"], name: "burger", grams: 180 },
  { terms: ["egg", "eggs"], name: "egg", grams: 50 },
  { terms: ["yogurt"], name: "yogurt", grams: 170 },
  { terms: ["oatmeal", "oats"], name: "oatmeal", grams: 180 },
  { terms: ["broccoli"], name: "broccoli", grams: 90 },
];

export function parseVisionDescription(raw: string): VisionResult | null {
  const text = raw.toLowerCase();
  if (!text.trim() || /\b(no food|not food|does not contain food)\b/.test(text)) {
    return null;
  }
  const items: VisionItem[] = [];
  for (const entry of DESCRIPTION_FOOD_MAP) {
    if (entry.terms.some((term) => new RegExp(`\\b${term}\\b`, "i").test(text))) {
      items.push({ name: entry.name, estimated_grams: entry.grams });
    }
    if (items.length >= 6) break;
  }
  if (items.length === 0) return null;
  return {
    items,
    confidence: "low",
    notes: "recognized from vision description",
  };
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
    const result = await withTimeout(
      runVisionModel(env, model, image),
      VISION_TIMEOUT_MS
    );
    const raw = visionTextFromResult(result);
    return parseVisionResponse(raw);
  } catch (err) {
    console.warn("vision: model call failed", err);
    return null;
  }
}

function visionTextFromResult(result: unknown): string {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  const record = result as Record<string, unknown>;
  for (const key of ["response", "description", "result", "text", "output"]) {
    const value = record[key];
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      const nested = visionTextFromResult(value);
      if (nested) return nested;
    }
  }
  return JSON.stringify(result);
}

function runVisionModel(env: Env, model: string, image: Uint8Array) {
  if (model.includes("llama-3.2-11b-vision-instruct")) {
    return env.AI!.run(model, {
      messages: [
        { role: "system", content: "Return only the requested food-analysis JSON." },
        { role: "user", content: VISION_PROMPT },
      ],
      image: `data:image/jpeg;base64,${bytesToBase64(image)}`,
      max_tokens: 400,
      temperature: 0.1,
    });
  }

  return env.AI!.run(model, {
    image: Array.from(image),
    prompt: VISION_PROMPT,
    max_tokens: 400,
    temperature: 0.1
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("vision timeout")), ms);
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
