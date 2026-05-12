import type { Env } from "../types";
import { STRENGTHS_DISCOVERY_QUESTIONS, STRENGTHS_SUMMARY_PROMPT } from "./prompts/strengths";

export type StrengthsResponses = Record<string, string>;

/**
 * Build the prompt block of teen answers, dropping empties.
 */
function formatResponses(responses: StrengthsResponses): string {
  const lines: string[] = [];
  for (const question of STRENGTHS_DISCOVERY_QUESTIONS) {
    const answer = responses[question.id]?.trim();
    if (!answer) continue;
    lines.push(`Q: ${question.prompt}\nA: ${answer}`);
  }
  return lines.join("\n\n");
}

/**
 * LLM-generated Kai-voiced summary of the teen's strengths-discovery
 * answers. Returns null if no AI binding, empty input, or model failure
 * so the caller can fall back to a deterministic summary.
 */
export async function summarizeStrengths(env: Env, responses: StrengthsResponses): Promise<string | null> {
  if (!env.AI) return null;
  const formatted = formatResponses(responses);
  if (!formatted) return null;
  const model = env.AI_TEXT_MODEL || "@cf/meta/llama-3.1-8b-instruct";
  try {
    const prompt = `${STRENGTHS_SUMMARY_PROMPT}\n\nAnswers:\n${formatted}\n\nSummary:`;
    const result = (await env.AI.run(model, {
      prompt,
      max_tokens: 320,
      temperature: 0.4
    })) as { response?: string; text?: string };
    const raw = (result.response || result.text || "").trim();
    if (!raw) return null;
    return raw.slice(0, 1200);
  } catch (err) {
    console.warn("strengths summary LLM failed; falling back to deterministic", err);
    return null;
  }
}

/**
 * Deterministic fallback summary: concatenate the first 3 non-empty answers.
 * Same shape as the intake fallback so downstream UI can render it the same
 * way.
 */
export function deterministicStrengthsSummary(responses: StrengthsResponses): string {
  const answered = STRENGTHS_DISCOVERY_QUESTIONS
    .map((q) => responses[q.id]?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
  if (answered.length === 0) return "";
  return `A few patterns to keep playing with: ${answered.join("; ")}. Working draft — refine as you learn.`;
}

/**
 * How many of the 15 questions did the teen answer? Used for analytics +
 * for the UI to know whether to show the result page or push the teen
 * back to finish.
 */
export function countAnswered(responses: StrengthsResponses): number {
  let count = 0;
  for (const q of STRENGTHS_DISCOVERY_QUESTIONS) {
    if (responses[q.id]?.trim()) count++;
  }
  return count;
}
