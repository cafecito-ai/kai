// T-029 + T-030 — Body scan vision orchestration.
//
// What this file does:
//   1. Takes raw front/side/back image bytes
//   2. Calls Claude vision with the constrained scan prompt (already
//      authored in workers/src/lib/prompts/body-scan-prompt.ts)
//   3. Runs the response through the forbidden-language filter
//   4. Regenerates up to 3 times with a stricter system prompt
//   5. Parses the [OBSERVATION_N]:/[ACTION_N]:/[SUMMARY]:/[ERROR]: format
//   6. Returns a clean ScanAnalysis or a structured fallback
//
// SAFETY INVARIANTS (Gate 5 verifies these):
//   - Forbidden-language filter applied post-generation, max 3 regens
//   - If filter cannot be satisfied → return ERROR fallback, never a
//     "best effort" response with leaked forbidden words
//   - disable_training: true MUST be passed to the vision call
//   - Image bytes only live in Worker memory for the duration of the
//     request; never written to D1, never logged
//   - Only the parsed text observations are persisted

import {
  findForbidden,
  passesBodyLanguageFilter,
} from "./body-language-filter";
import { BODY_SCAN_VISION_PROMPT } from "./prompts/body-scan-prompt";
import type { Env } from "../types";

const MAX_REGENERATIONS = 3;

export const SCAN_RETAKE_ERROR =
  "The lighting or angle makes it hard to see clearly. Try retaking with better lighting and a plain background.";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

export type ScanObservation = {
  index: 1 | 2 | 3;
  text: string;
  action: string;
};

export type ScanAnalysis = {
  ok: true;
  observations: ScanObservation[];   // 1-3 entries
  summary: string;
  /** Number of vision calls that were made (1-3, 1 if happy path). */
  attempts: number;
  /** Any forbidden hits we saw during regens — for telemetry / audit. */
  filterHitsDuringRegens: string[][];
};

export type ScanAnalysisError = {
  ok: false;
  /** Free-text "try again" guidance shown to the user. */
  message: string;
  /** Why we ended up here. Useful for /api/scan/analyze logs. */
  reason: "filter_failed" | "vision_error" | "parse_failed" | "model_returned_error";
  attempts: number;
};

export type ScanAnalysisResult = ScanAnalysis | ScanAnalysisError;

// ─────────────────────────────────────────────────────────────────────
// Parser — turns raw model text into structured observations
// ─────────────────────────────────────────────────────────────────────

const TAG_PATTERN =
  /\[(OBSERVATION_[123]|ACTION_[123]|SUMMARY|ERROR)\]\s*:\s*([^[]+)/g;

/** Extract the structured fields from a raw vision response. */
export function parseScanOutput(raw: string):
  | { kind: "ok"; observations: ScanObservation[]; summary: string }
  | { kind: "error"; message: string }
  | { kind: "unparseable" } {
  const fields: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = TAG_PATTERN.exec(raw)) !== null) {
    fields[m[1]] = m[2].trim();
  }

  if (fields.ERROR) {
    return { kind: "error", message: fields.ERROR };
  }

  const observations: ScanObservation[] = [];
  for (const i of [1, 2, 3] as const) {
    const obsKey = `OBSERVATION_${i}`;
    const actKey = `ACTION_${i}`;
    if (fields[obsKey] && fields[actKey]) {
      observations.push({
        index: i,
        text: fields[obsKey],
        action: fields[actKey],
      });
    }
  }

  if (observations.length === 0 || !fields.SUMMARY) {
    return { kind: "unparseable" };
  }

  return {
    kind: "ok",
    observations,
    summary: fields.SUMMARY,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Vision call adapter
// ─────────────────────────────────────────────────────────────────────

/** What `runVisionModel` expects. Keeping this slim so the env binding
 *  details stay isolated and the function is easy to test. */
export type VisionCallFn = (input: {
  systemPrompt: string;
  images: Array<{ mime: string; bytesB64: string }>;
}) => Promise<string>;

const SCAN_VISION_TIMEOUT_MS = 20_000;

/**
 * Default vision call for the body scan.
 *
 * Prefers Claude vision via the **direct Anthropic API** (Sonnet tier —
 * posture/alignment reads need the quality), exactly mirroring the food-photo
 * path in vision.ts which moved off the Workers-AI gateway because the gateway
 * Claude model ids are unreliable. Falls back to Workers-AI llava only if no
 * Anthropic key is configured or the Anthropic call fails.
 *
 * PRIVACY (Gate 5 verifies):
 *   - Anthropic path: Anthropic's API does NOT train on API inputs by default
 *     (commercial terms) — this is the equivalent of `disable_training` for the
 *     direct API. Image bytes are sent for inference only, never persisted.
 *   - Workers-AI fallback: passes `disable_training: true` explicitly.
 *   - Either way, bytes live only in Worker memory for the request.
 */
export function defaultVisionCall(env: Env): VisionCallFn {
  return async ({ systemPrompt, images }) => {
    // Preferred: direct Anthropic Claude vision.
    if (env.ANTHROPIC_API_KEY) {
      const text = await anthropicScanVision(env, systemPrompt, images);
      if (text) return text;
      // fall through to Workers-AI if Anthropic failed
    }

    if (!env.AI) throw new Error("no vision backend configured");
    // Fallback: Workers AI gateway. Keep disable_training set per T-030.
    const model = env.AI_VISION_MODEL || "@cf/llava-hf/llava-1.5-7b-hf";
    const content: Array<Record<string, unknown>> = [
      { type: "text", text: systemPrompt },
    ];
    for (const img of images) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mime,
          data: img.bytesB64,
        },
      });
    }
    const result = (await env.AI.run(model, {
      messages: [{ role: "user", content }],
      max_tokens: 1000,
      temperature: 0.2,
      // T-030 spec: MUST be set. Gate 5 verifies.
      disable_training: true,
    } as Record<string, unknown>)) as { response?: string; text?: string; content?: string };
    return result.response || result.text || result.content || "";
  };
}

/** Direct Anthropic Claude vision read for the body scan. Returns the raw
 *  model text, or "" on any failure so the caller can fall back. */
async function anthropicScanVision(
  env: Env,
  systemPrompt: string,
  images: Array<{ mime: string; bytesB64: string }>,
): Promise<string> {
  // Sonnet for the quality read; the physical tier var points at Sonnet 4.6.
  const model = env.ANTHROPIC_MODEL_PHYSICAL || env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const labels = ["front", "side", "back"];
  const content: Array<Record<string, unknown>> = [];
  images.forEach((img, i) => {
    content.push({ type: "text", text: `Photo ${i + 1} (${labels[i] ?? "view"}):` });
    content.push({
      type: "image",
      source: { type: "base64", media_type: img.mime, data: img.bytesB64 },
    });
  });
  content.push({
    type: "text",
    text: "Analyze the three photos above (front, side, back) per your instructions. Return only the [OBSERVATION_N]/[ACTION_N]/[SUMMARY] format, or [ERROR] if the images are unusable.",
  });

  try {
    const response = await withScanTimeout(
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1000,
          temperature: 0.2,
          system: systemPrompt,
          messages: [{ role: "user", content }],
        }),
      }),
      SCAN_VISION_TIMEOUT_MS,
    );
    if (!response.ok) {
      console.warn("scan-vision: Anthropic non-ok", response.status);
      return "";
    }
    const json = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
    return json.content?.find((b) => b.type === "text" && b.text)?.text ?? "";
  } catch (err) {
    console.warn("scan-vision: Anthropic call failed", err);
    return "";
  }
}

function withScanTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("scan vision timeout")), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

// ─────────────────────────────────────────────────────────────────────
// Orchestration — call → filter → parse → return
// ─────────────────────────────────────────────────────────────────────

export type ScanImages = {
  front: { mime: string; bytesB64: string };
  side: { mime: string; bytesB64: string };
  back: { mime: string; bytesB64: string };
};

/**
 * Full scan analysis pipeline.
 *
 * Returns ScanAnalysisResult — always safe to render. If filter cannot
 * be satisfied within MAX_REGENERATIONS, returns a structured error
 * with `reason: "filter_failed"` and the SCAN_RETAKE_ERROR message.
 */
export async function analyzeScan(
  images: ScanImages,
  visionCall: VisionCallFn,
): Promise<ScanAnalysisResult> {
  const imgs = [images.front, images.side, images.back];
  const filterHitsDuringRegens: string[][] = [];

  let raw = "";
  let attempts = 0;
  let systemPrompt = BODY_SCAN_VISION_PROMPT;

  // Try, regen on filter fail, max 3.
  for (let attempt = 0; attempt < MAX_REGENERATIONS; attempt++) {
    attempts += 1;
    try {
      raw = await visionCall({ systemPrompt, images: imgs });
    } catch {
      return {
        ok: false,
        reason: "vision_error",
        message: SCAN_RETAKE_ERROR,
        attempts,
      };
    }

    if (passesBodyLanguageFilter(raw)) {
      break;
    }
    filterHitsDuringRegens.push(findForbidden(raw).map((h) => h.word));
    // Tighten the prompt for the next pass.
    systemPrompt = `${BODY_SCAN_VISION_PROMPT}

REJECTED: a previous response used forbidden language. Strictly avoid any size, shape, weight, body-fat, or aesthetic terms. Return ONLY posture / alignment observations and stretch / exercise actions. If you cannot do this, return the [ERROR] format.`;
  }

  // After the loop, raw is either filter-clean OR we ran out of attempts.
  if (!passesBodyLanguageFilter(raw)) {
    return {
      ok: false,
      reason: "filter_failed",
      message: SCAN_RETAKE_ERROR,
      attempts,
    };
  }

  // Filter passed. Parse.
  const parsed = parseScanOutput(raw);
  if (parsed.kind === "error") {
    return {
      ok: false,
      reason: "model_returned_error",
      message: parsed.message || SCAN_RETAKE_ERROR,
      attempts,
    };
  }
  if (parsed.kind === "unparseable") {
    return {
      ok: false,
      reason: "parse_failed",
      message: SCAN_RETAKE_ERROR,
      attempts,
    };
  }

  return {
    ok: true,
    observations: parsed.observations,
    summary: parsed.summary,
    attempts,
    filterHitsDuringRegens,
  };
}
