// T-023 — Body agent comment on a logged workout.
//
// 2-3 sentence focused output. Filtered through the forbidden-language
// guard with up to 3 regens then a safe canned fallback.
//
// HARD RULES per CLAUDE.md v2 §3 + AGENT_PLAN T-023:
//   - Encouraging, specific, action-oriented (never generic praise)
//   - For users under 16: never recommend specific weights or barbell
//     lifts without form coaching; default to bodyweight movements
//   - No size/shape/aesthetic talk; energy + recovery + performance only
//   - No supplements/powders/products
//   - Never push training through pain
//   - Filtered via passesBodyLanguageFilter; 3 regens then fallback

import {
  passesBodyLanguageFilter,
} from "./body-language-filter";
import { callClaude } from "./claude";
import type { KaiContext } from "./context";
import type { Env } from "../types";

const MAX_REGENERATIONS = 3;
const UNDER_AGE_THRESHOLD = 16;

export type WorkoutPayload = {
  // "strength" covers both weight training and bodyweight work — we don't
  // ask teens to self-classify, and the under-16 safety rule defaults to
  // bodyweight regardless of what the user logged.
  type: "run" | "strength" | "yoga" | "sport" | "other";
  durationMin: number;
  intensity: 1 | 2 | 3 | 4 | 5;
  notes?: string;
};

export const WORKOUT_COMMENT_FALLBACK =
  "Move logged. Hydrate, eat something with protein in the next hour, and notice how you feel tomorrow morning — that's the read.";

/**
 * Build the focused Body-agent system prompt for a one-shot workout
 * comment. Tighter than the full chat prompt — narrow scope reduces the
 * filter regen rate.
 */
function buildWorkoutCommentPrompt(
  context: KaiContext,
  payload: WorkoutPayload,
): string {
  const age = context.age ?? 16;
  const isUnderAge = age < UNDER_AGE_THRESHOLD;

  const intensityLabel = [
    "easy / recovery",
    "comfortable",
    "moderate / sustainable",
    "hard / pushed",
    "max effort",
  ][payload.intensity - 1];

  // The strength bucket covers both weighted work and bodyweight. For
  // users under 16, we always steer toward bodyweight regardless of what
  // they self-logged — they may have done barbell work, but we don't
  // coach specific weights for that age without form review.
  const ageRule = isUnderAge
    ? `\nIMPORTANT: ${context.displayName} is ${age} — under 16. DO NOT recommend specific weights, barbell lifts, or one-rep-max work, even if they logged "strength". Default your suggestions to bodyweight movements, mobility, and aerobic conditioning. Form coaching always comes first.`
    : "";

  return `You are KAI's physical health side, responding to a workout ${context.displayName} just logged.

WORKOUT:
- Type: ${payload.type}
- Duration: ${payload.durationMin} minutes
- Intensity: ${payload.intensity}/5 (${intensityLabel})
- Notes: ${payload.notes ?? "(none)"}

YOU MUST:
- Respond in 2-3 sentences. No more.
- Be specific and action-oriented — reference the actual type/duration/intensity. Never generic "great job!"
- Frame around energy, recovery, sleep, performance — never appearance.
- Suggest one concrete next step (hydration, food window, mobility, sleep, next session's focus).
- Never recommend supplements, powders, or products.
- Never use words like fat, skinny, lean (as aesthetic), toned, ripped, shredded, BMI, body fat.
- Never compare to other teens or to averages.
- Never push training through pain.
- Speak naturally — like a knowledgeable older sibling, not a fitness app.
${ageRule}

Tone preference: ${context.kaiTone}.

Return only the 2-3 sentence comment. No preamble, no signoff.`;
}

export async function generateWorkoutComment(
  env: Env,
  context: KaiContext,
  payload: WorkoutPayload,
): Promise<{ comment: string; usedFallback: boolean; attempts: number }> {
  if (!env.AI) {
    return { comment: WORKOUT_COMMENT_FALLBACK, usedFallback: true, attempts: 0 };
  }

  const userMessage = "Comment on the workout I just logged.";
  let attempts = 0;

  const baseSystem = buildWorkoutCommentPrompt(context, payload);
  let comment = await callClaude(env, baseSystem, [
    { role: "user", content: userMessage },
  ]);
  attempts += 1;

  while (!passesBodyLanguageFilter(comment) && attempts < MAX_REGENERATIONS) {
    const stricter = `${baseSystem}

IMPORTANT: A previous response was rejected by the post-generation filter for using forbidden body-language. Try again, focusing only on energy, recovery, and how the work will translate to performance. Do not describe size, shape, or appearance.`;
    comment = await callClaude(env, stricter, [
      { role: "user", content: userMessage },
    ]);
    attempts += 1;
  }

  if (!passesBodyLanguageFilter(comment)) {
    return {
      comment: WORKOUT_COMMENT_FALLBACK,
      usedFallback: true,
      attempts,
    };
  }

  return {
    comment: trimToThreeSentences(comment.trim()),
    usedFallback: false,
    attempts,
  };
}

function trimToThreeSentences(s: string): string {
  const parts = s.split(/(?<=[.?!])\s+/).filter(Boolean);
  if (parts.length <= 3) return s;
  return parts.slice(0, 3).join(" ");
}
