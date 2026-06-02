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
  if (!env.UPLOADS) return null;

  let image: Uint8Array;
  let mediaType = "image/jpeg";
  try {
    const obj = await env.UPLOADS.get(r2Key);
    if (!obj) return null;
    const buffer = await obj.arrayBuffer();
    image = new Uint8Array(buffer);
    const ct = obj.httpMetadata?.contentType;
    if (ct && /^image\/(jpeg|png|webp|gif)$/.test(ct)) mediaType = ct;
  } catch (err) {
    console.warn("vision: R2 read failed", err);
    return null;
  }

  // Prefer Claude vision — far more accurate than llava at reading a real meal.
  // Uses the cheap Haiku tier (food logging is high-volume). Falls back to
  // Workers-AI llava, then manual entry.
  if (env.ANTHROPIC_API_KEY) {
    const claude = await analyzeFoodPhotoAnthropic(env, image, mediaType);
    if (claude) return claude;
  }

  if (!env.AI) return null;
  const model = env.AI_VISION_MODEL || "@cf/llava-hf/llava-1.5-7b-hf";
  try {
    const result = (await withTimeout(
      env.AI.run(model, {
        image: Array.from(image),
        prompt: VISION_PROMPT,
        max_tokens: 400,
        temperature: 0.1
      }),
      VISION_TIMEOUT_MS
    )) as { response?: string; description?: string };
    const raw = result.response || result.description || "";
    return parseVisionResponse(raw);
  } catch (err) {
    console.warn("vision: model call failed", err);
    return null;
  }
}

/** Base64-encode image bytes in chunks (avoids call-stack blowup on big files). */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Claude vision food read. Same prompt + parser as the Workers-AI path. */
async function analyzeFoodPhotoAnthropic(env: Env, image: Uint8Array, mediaType: string): Promise<VisionResult | null> {
  try {
    const response = await withTimeout(
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: env.ANTHROPIC_MODEL_FAST || "claude-haiku-4-5-20251001",
          max_tokens: 400,
          temperature: 0.1,
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: toBase64(image) } },
                { type: "text", text: VISION_PROMPT },
              ],
            },
          ],
        }),
      }),
      VISION_TIMEOUT_MS,
    );
    if (!response.ok) return null;
    const json = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
    const raw = json.content?.find((b) => b.type === "text" && b.text)?.text ?? "";
    return parseVisionResponse(raw);
  } catch (err) {
    console.warn("vision: Anthropic call failed", err);
    return null;
  }
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
