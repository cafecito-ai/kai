// T-022 — Body agent comment on a logged meal.
//
// Takes the existing meal analysis (vision items + USDA nutrition) and
// returns a 1–2 sentence Body-agent comment. Filtered through the
// forbidden-language guard with up to 3 regen attempts before falling
// back to a safe canned string.
//
// HARD RULES per CLAUDE.md v2 §3 + AGENT_PLAN T-022:
//   - 1-2 sentences. No more.
//   - Never give a "calorie target", "deficit", "ideal weight" etc.
//   - Never shame ("you should have...", "lazy", "no excuse")
//   - Specific, observational, energy/recovery-focused
//   - Filter via passesBodyLanguageFilter; regen up to 3x then fallback

import {
  passesBodyLanguageFilter,
} from "./body-language-filter";
import { callClaude } from "./claude";
import type { KaiContext } from "./context";
import type { MealAnalysis } from "./food-analysis";
import type { Env } from "../types";

const MAX_REGENERATIONS = 3;

export const FOOD_COMMENT_FALLBACK =
  "Logged. Eat regularly today and notice how your energy holds — that's the read that matters more than any single meal.";

export const FOOD_COMMENT_UNCLEAR_PHOTO =
  "Photo saved. I couldn't read the food clearly from that image, so add a quick note and I'll make the next read more useful.";

/**
 * Build the focused Body-agent system prompt for a one-shot food comment.
 *
 * NOT the full body chat prompt — this is a constrained mini-prompt
 * for a single 1-2 sentence observational comment. Kept narrow on purpose
 * to make the body-language filter less likely to fire.
 */
function buildFoodCommentPrompt(context: KaiContext, analysis: MealAnalysis): string {
  const items = analysis.items
    .map((i) => {
      const grams = i.estimatedGrams ? ` ~${Math.round(i.estimatedGrams)}g` : "";
      return `- ${i.name}${grams}`;
    })
    .join("\n");

  const totals = analysis.totals
    ? `Roughly: ${Math.round(analysis.totals.calories)} cal, ${Math.round(
        analysis.totals.protein,
      )}g protein.`
    : "(No reliable nutrition data — comment on the meal qualitatively.)";

  const age = context.age ?? 16;

  return `You are KAI's physical health side, commenting on a meal ${context.displayName} just logged.

MEAL:
${items}
${totals}

YOU MUST:
- Respond in 1-2 sentences. No more.
- Be specific and observational. Reference the actual food when useful.
- Frame around energy, recovery, performance, or how it'll feel — never appearance.
- Never give a calorie target, deficit, or "ideal" anything.
- Never shame. Never use "you should have..." or "lazy" or "no excuse".
- Never use words like fat, skinny, lean (as aesthetic), toned, ripped, BMI, body fat.
- Never compare to other teens or to averages.
- Speak naturally — like a knowledgeable older sibling, not a nutrition app.

The user is ${age} years old. Tone preference: ${context.kaiTone}.

Return only the 1-2 sentence comment. No preamble, no signoff.`;
}

/**
 * Generate the Body-agent comment for a logged meal, applying the
 * forbidden-language filter and a regen loop.
 *
 * Returns a single 1-2 sentence string. Always safe to render — falls back
 * to FOOD_COMMENT_FALLBACK if the filter can't be satisfied within 3 tries
 * or if the AI binding isn't available.
 */
export async function generateFoodComment(
  env: Env,
  context: KaiContext,
  analysis: MealAnalysis,
): Promise<{ comment: string; usedFallback: boolean; attempts: number }> {
  if (isUnclearPhotoAnalysis(analysis)) {
    return { comment: FOOD_COMMENT_UNCLEAR_PHOTO, usedFallback: false, attempts: 0 };
  }
  // If we don't have AI at all, return the static fallback. (Same shape as
  // the rest of the local-first behaviour — never block the user on AI.)
  if (!env.AI) {
    return { comment: FOOD_COMMENT_FALLBACK, usedFallback: true, attempts: 0 };
  }

  const userMessage = "Comment on the meal I just logged.";
  let comment = "";
  let attempts = 0;

  // First pass.
  const baseSystem = buildFoodCommentPrompt(context, analysis);
  comment = await callClaude(env, baseSystem, [
    { role: "user", content: userMessage },
  ]);
  attempts += 1;

  while (!passesBodyLanguageFilter(comment) && attempts < MAX_REGENERATIONS) {
    const stricter = `${baseSystem}

IMPORTANT: A previous response was rejected by the post-generation filter for using forbidden body-language. Try again, focusing only on energy, recovery, and how the food will fuel performance. Do not describe size, shape, or appearance.`;
    comment = await callClaude(env, stricter, [
      { role: "user", content: userMessage },
    ]);
    attempts += 1;
  }

  if (!passesBodyLanguageFilter(comment)) {
    return { comment: FOOD_COMMENT_FALLBACK, usedFallback: true, attempts };
  }

  // Trim to ~2 sentences as a defensive cap. The prompt asks for 1-2 but
  // small models sometimes pad.
  const trimmed = trimToTwoSentences(comment.trim());
  return { comment: trimmed, usedFallback: false, attempts };
}

function isUnclearPhotoAnalysis(analysis: MealAnalysis): boolean {
  return analysis.confidence === "photo_stub" ||
    (analysis.confidence === "low" && analysis.items.every((item) => item.source !== "vision"));
}

/** Keep at most the first 2 sentences. Never returns empty. */
function trimToTwoSentences(s: string): string {
  // Split on .?!  followed by a space or end. Naive but fine for short
  // 1-2 sentence outputs.
  const parts = s.split(/(?<=[.?!])\s+/).filter(Boolean);
  if (parts.length <= 2) return s;
  return parts.slice(0, 2).join(" ");
}
