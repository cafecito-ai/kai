// Agent router — classifies a user message and picks which agent's system
// prompt should answer.
//
// Per CLAUDE.md v2 §4 + AGENT_PLAN T-006:
//   1. Safety classifier and routing classifier run in PARALLEL on every
//      message (handled at the route layer in chat.ts — see T-007/T-008).
//   2. Safety always wins. If safety fires, this router's output is ignored
//      and the safety flow takes over.
//   3. Routing classifier returns "mental" | "physical" | "unclear".
//      "unclear" collapses to "mental" (more general-purpose voice).
//   4. The routing classifier never reads the safety classifier output —
//      a malicious message can't manipulate routing to escape safety.
//
// The prompt itself lives in workers/src/lib/prompts/routing-classifier.ts
// and is fed to whatever model env.AI is bound to (Workers AI Llama 3.1 8b
// in dev; configurable via env.AI_TEXT_MODEL).

import {
  buildRoutingRequest,
  parseRoutingResult,
  type RoutingResult,
} from "./prompts/routing-classifier";
import type { Env } from "../types";

/**
 * The decision the router emits to the chat handler. "unclear" is collapsed
 * to "mental" before reaching this type so the caller never has to think
 * about defaulting.
 */
export type AgentDecision = "mental" | "physical";

/**
 * Call the LLM with the routing classifier prompt and return its raw
 * three-value result. Exposed for testing; production code should use
 * `pickAgent` instead.
 */
export async function classifyRoute(
  env: Env,
  userMessage: string,
): Promise<RoutingResult> {
  if (!env.AI) {
    // No model bound (e.g., local dev without AI binding) — default safe.
    return "unclear";
  }
  try {
    const prompt = buildRoutingRequest(userMessage);
    const result = (await env.AI.run(
      env.AI_TEXT_MODEL || "@cf/meta/llama-3.1-8b-instruct",
      {
        prompt,
        max_tokens: 8,
        // Tight temperature — we want one word, deterministic.
        temperature: 0,
      },
    )) as { response?: string; text?: string };
    const raw = result.response || result.text || "";
    return parseRoutingResult(raw);
  } catch {
    // If the classifier errors out, the conservative default is "unclear"
    // → which the caller collapses to "mental". Never break the chat
    // path because the router hiccuped.
    return "unclear";
  }
}

/**
 * The function chat.ts calls to pick which agent answers a user message.
 * Always returns a concrete agent ("mental" or "physical") — never "unclear".
 */
export async function pickAgent(
  env: Env,
  userMessage: string,
): Promise<AgentDecision> {
  if (isObviousPhysicalMessage(userMessage)) return "physical";
  const result = await classifyRoute(env, userMessage);
  // "unclear" defaults to "mental" per AGENT_PLAN T-006 §4 ("more
  // general-purpose voice").
  return result === "physical" ? "physical" : "mental";
}

function isObviousPhysicalMessage(userMessage: string): boolean {
  return /\b(bulk|bulking|muscle|gain muscle|muscle gain|meal plan|diet|protein|macros?|workout|lift|lifting|gym|basketball|training|strength|exercise|food|eat|nutrition|hydration|recovery|sore|stretch)\b/i.test(userMessage);
}
