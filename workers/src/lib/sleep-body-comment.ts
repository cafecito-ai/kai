// T-024 — Body agent comment on a logged sleep entry.
//
// Fires in addition to the existing Mind reflective comment when context
// suggests the Body angle adds value:
//
//   - A workout was logged in the last 48 hours (recovery is relevant)
//   - The user's notes mention training / soreness / recovery / energy
//
// Otherwise we don't fire — sleep is primarily a Mind surface; we only
// add the Body voice when there's a real physical context.
//
// 1-2 sentences focused on recovery & energy. Filtered through the
// forbidden-language guard with up to 3 regens then a safe fallback.

import {
  passesBodyLanguageFilter,
} from "./body-language-filter";
import { callClaude } from "./claude";
import type { KaiContext } from "./context";
import { getScoreInputs } from "./score-store";
import type { Env } from "../types";

const MAX_REGENERATIONS = 3;
const RECENT_WORKOUT_WINDOW_HOURS = 48;

export const SLEEP_BODY_FALLBACK =
  "If yesterday felt heavy, a short walk and protein-forward meals today will help your body settle.";

/** Keyword check — does the user's note suggest a physical context? */
export function notesSuggestPhysical(notes: string | undefined): boolean {
  if (!notes) return false;
  const lower = notes.toLowerCase();
  // Be conservative — only fire on clear training/recovery signals.
  return (
    /\btrain(ing|ed)?\b/.test(lower) ||
    /\bsore\b/.test(lower) ||
    /\brecovery\b/.test(lower) ||
    /\bworkout\b/.test(lower) ||
    /\blifted?\b/.test(lower) ||
    /\bran\b/.test(lower) ||
    /\bpractice\b/.test(lower) ||
    /\bgame\b/.test(lower) ||
    /\bmatch\b/.test(lower) ||
    /\btired from\b/.test(lower) ||
    /\bheavy legs\b/.test(lower)
  );
}

/**
 * Decide whether the Body agent should comment on this sleep log. Returns
 * a reason string so the route can decide whether/how to call the LLM.
 */
export async function shouldBodyCommentOnSleep(
  env: Env,
  userId: string,
  notes: string | undefined,
  now: Date = new Date(),
): Promise<{ should: boolean; reason: "recent_workout" | "notes" | null }> {
  if (notesSuggestPhysical(notes)) {
    return { should: true, reason: "notes" };
  }
  // Look back 2 days for any workout input.
  for (let i = 0; i < 2; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const inputs = await getScoreInputs(env.DB, userId, date);
    const workout = inputs.find((x) => x.source === "workout");
    if (workout) {
      const ageHours =
        (now.getTime() - new Date(workout.createdAt).getTime()) /
        (1000 * 60 * 60);
      if (ageHours <= RECENT_WORKOUT_WINDOW_HOURS) {
        return { should: true, reason: "recent_workout" };
      }
    }
  }
  return { should: false, reason: null };
}

function buildSleepBodyPrompt(
  context: KaiContext,
  hours: number,
  quality: number | undefined,
  reason: "recent_workout" | "notes" | null,
): string {
  const age = context.age ?? 16;
  const contextLine =
    reason === "recent_workout"
      ? "They've logged a workout in the last 48 hours, so recovery is the relevant frame."
      : reason === "notes"
        ? "Their note mentions training or recovery, so the recovery frame is the right one."
        : "";

  const qualityLine =
    typeof quality === "number" ? `Sleep quality (self-rated): ${quality}/5.` : "";

  return `You are KAI's physical health side, commenting on a sleep log ${context.displayName} just submitted.

SLEEP:
- Hours: ${hours}
${qualityLine}

WHY YOU'RE COMMENTING:
${contextLine}

YOU MUST:
- Respond in 1-2 sentences. No more.
- Focus on RECOVERY and ENERGY — how this sleep load lands for tomorrow's
  training / movement / focus.
- Be specific. Reference the hours.
- Suggest one concrete recovery move if useful (hydrate, light movement, eat early protein, easy day tomorrow).
- Never recommend supplements, melatonin, or sleep medication.
- Never push training through fatigue.
- Never use size/shape words (fat, skinny, lean as aesthetic, ripped, etc.).
- Speak naturally — knowledgeable older sibling, not a fitness app.

The user is ${age} years old. Tone preference: ${context.kaiTone}.

Return only the 1-2 sentence comment. No preamble, no signoff.`;
}

export async function generateSleepBodyComment(
  env: Env,
  context: KaiContext,
  hours: number,
  quality: number | undefined,
  reason: "recent_workout" | "notes" | null,
): Promise<{ comment: string; usedFallback: boolean; attempts: number }> {
  if (!env.AI) {
    return { comment: SLEEP_BODY_FALLBACK, usedFallback: true, attempts: 0 };
  }

  const baseSystem = buildSleepBodyPrompt(context, hours, quality, reason);
  const userMessage = "Comment on the sleep I just logged.";
  let attempts = 0;

  let comment = await callClaude(env, baseSystem, [
    { role: "user", content: userMessage },
  ]);
  attempts += 1;

  while (!passesBodyLanguageFilter(comment) && attempts < MAX_REGENERATIONS) {
    const stricter = `${baseSystem}

IMPORTANT: A previous response was rejected by the post-generation filter for using forbidden body-language. Try again, focusing only on energy, recovery, and how tomorrow will feel. Do not describe size, shape, or appearance.`;
    comment = await callClaude(env, stricter, [
      { role: "user", content: userMessage },
    ]);
    attempts += 1;
  }

  if (!passesBodyLanguageFilter(comment)) {
    return { comment: SLEEP_BODY_FALLBACK, usedFallback: true, attempts };
  }

  return {
    comment: trimToTwoSentences(comment.trim()),
    usedFallback: false,
    attempts,
  };
}

function trimToTwoSentences(s: string): string {
  const parts = s.split(/(?<=[.?!])\s+/).filter(Boolean);
  if (parts.length <= 2) return s;
  return parts.slice(0, 2).join(" ");
}
