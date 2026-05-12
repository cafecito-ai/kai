import type { EngineId, Env } from "../types";
import { ENGINE_ROUTING_PROMPT, INTAKE_SUMMARY_PROMPT } from "./prompts/intake";

const VALID_ENGINES = new Set<EngineId>(["physical", "potential", "mental"]);

/**
 * Pull the first balanced {...} JSON object out of a model response. Llama
 * 3.1 8B often prefixes JSON with chatty preamble or wraps it in a markdown
 * code fence. Duplicated here so this PR is independent of P1-1; consolidate
 * into a shared util when both land.
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

export type EngineRouting = { engine: EngineId; reasoning: string };

/**
 * Parse a model response into an EngineRouting decision. Strict validation;
 * returns null on any malformed input so the caller can fall back to a
 * deterministic router.
 */
export function parseEngineRouting(raw: string): EngineRouting | null {
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
  const engine = typeof obj.engine === "string" ? obj.engine : null;
  const reasoning = typeof obj.reasoning === "string" ? obj.reasoning.trim() : null;
  if (!engine || !VALID_ENGINES.has(engine as EngineId)) return null;
  if (!reasoning) return null;
  return { engine: engine as EngineId, reasoning };
}

/**
 * Deterministic keyword fallback when the LLM is unavailable or returns
 * something we can't parse. Lifted from the previous regex router so we
 * never regress on the no-AI case.
 */
export function keywordRouteEngine(responses: Record<string, string>): EngineRouting {
  const text = Object.values(responses).join(" ").toLowerCase();
  if (/goal|school|sport|business|future|music|instrument|practice|build|learn|charity/.test(text)) {
    return { engine: "potential", reasoning: "There's a goal or skill in here you're working toward — let's start there." };
  }
  if (/stress|sad|anxious|friend|social|identity|emotion|pressure|overwhelm|lonely|tired of/.test(text)) {
    return { engine: "mental", reasoning: "There's a lot going on emotionally — let's start with how you're feeling, then build out." };
  }
  return { engine: "physical", reasoning: "Body is the foundation everything else sits on — sleep, food, movement — start there." };
}

/**
 * Build a single text block from the 6 intake responses for the LLM.
 */
function formatResponses(responses: Record<string, string>): string {
  return Object.entries(responses)
    .filter(([, value]) => value && value.trim())
    .map(([key, value]) => `${key}: ${value.trim()}`)
    .join("\n");
}

/**
 * Generate a 3-sentence Kai-voiced summary of the teen's intake answers.
 * Returns null if the model is unavailable or returns empty output, so the
 * caller can fall back to a deterministic summary.
 */
export async function summarizeIntake(env: Env, responses: Record<string, string>): Promise<string | null> {
  if (!env.AI) return null;
  const model = env.AI_TEXT_MODEL || "@cf/meta/llama-3.1-8b-instruct";
  try {
    const prompt = `${INTAKE_SUMMARY_PROMPT}\n\nIntake answers:\n${formatResponses(responses)}\n\nSummary:`;
    const result = (await env.AI.run(model, {
      prompt,
      max_tokens: 200,
      temperature: 0.4
    })) as { response?: string; text?: string };
    const raw = (result.response || result.text || "").trim();
    if (!raw) return null;
    // Cap to a reasonable length — guards against the model rambling past 3 sentences.
    return raw.slice(0, 800);
  } catch (err) {
    console.warn("intake summary LLM failed; will fall back to deterministic summary", err);
    return null;
  }
}

/**
 * Route the teen to a starting engine based on the intake summary. Returns
 * null on LLM failure so the caller can fall back to keyword routing.
 */
export async function routeEngineFromSummary(env: Env, summary: string): Promise<EngineRouting | null> {
  if (!env.AI) return null;
  const model = env.AI_TEXT_MODEL || "@cf/meta/llama-3.1-8b-instruct";
  try {
    const prompt = `${ENGINE_ROUTING_PROMPT}\n\nIntake summary: ${summary}\n\nJSON:`;
    const result = (await env.AI.run(model, {
      prompt,
      max_tokens: 150,
      temperature: 0.2
    })) as { response?: string; text?: string };
    const raw = result.response || result.text || "";
    return parseEngineRouting(raw);
  } catch (err) {
    console.warn("engine routing LLM failed; will fall back to keyword router", err);
    return null;
  }
}

/**
 * Deterministic 3-line summary used when the LLM is unavailable. Just
 * concatenates the first three non-empty answers — matches the prior route
 * behavior so the no-AI fallback is unchanged.
 */
export function deterministicSummary(responses: Record<string, string>): string {
  return Object.values(responses).filter((v) => v && v.trim()).slice(0, 3).join(" ");
}
