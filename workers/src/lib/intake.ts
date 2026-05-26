import type { EngineId, Env } from "../types";
import { callAnthropicCompletion } from "./claude";
import { extractJsonObject } from "./json-utils";
import { ENGINE_ROUTING_PROMPT, INTAKE_SUMMARY_PROMPT } from "./prompts/intake";

const VALID_ENGINES = new Set<EngineId>(["physical", "mental"]);

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
  if (/goal|school|sport|business|future|music|instrument|practice|build|learn|charity|confidence|discipline|purpose|habit/.test(text)) {
    return { engine: "mental", reasoning: "There's a goal or skill in here you're working toward — let's build the system around it." };
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
  const prompt = `${INTAKE_SUMMARY_PROMPT}\n\nIntake answers:\n${formatResponses(responses)}\n\nSummary:`;

  // Prefer Anthropic so the summary that becomes every future Kai turn's
  // grounding context is rich and on-voice. Falls back to Workers AI when
  // no key is configured.
  const anthropicReply = await callAnthropicCompletion(env, prompt, { maxTokens: 200, temperature: 0.4 });
  if (anthropicReply) return anthropicReply.slice(0, 800);

  if (!env.AI) return null;
  const model = env.AI_TEXT_MODEL || "@cf/meta/llama-3.1-8b-instruct";
  try {
    const result = (await env.AI.run(model, {
      prompt,
      max_tokens: 200,
      temperature: 0.4
    })) as { response?: string; text?: string };
    const raw = (result.response || result.text || "").trim();
    if (!raw) return null;
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
  const prompt = `${ENGINE_ROUTING_PROMPT}\n\nIntake summary: ${summary}\n\nJSON:`;

  const anthropicReply = await callAnthropicCompletion(env, prompt, { maxTokens: 150, temperature: 0.2 });
  if (anthropicReply) {
    const routed = parseEngineRouting(anthropicReply);
    if (routed) return routed;
  }

  if (!env.AI) return null;
  const model = env.AI_TEXT_MODEL || "@cf/meta/llama-3.1-8b-instruct";
  try {
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
