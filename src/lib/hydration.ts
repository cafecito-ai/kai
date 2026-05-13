/**
 * Hydration tracking helpers. Local-only daily cup counter with soft
 * guidance — no anxiety-inducing "you missed your goal!" copy.
 *
 * Voice rules:
 *   - "Drink before you feel thirsty" framing from the body-literacy
 *     hydration article. Not a math problem.
 *   - Pee color is the real signal, not a number on a tracker.
 *   - Daily count is a *prompt to keep sipping*, not a goal to crush.
 *   - No "streak" mechanic — chronic-tracking apps cause guilt spirals.
 *
 * Storage layout (localStorage, user-namespaced via local-storage.ts):
 *   kai.hydration.today.v1 → { dateIso: string (LOCAL date), cups: number,
 *                              firstCupLoggedFor?: string }
 * `firstCupLoggedFor` is the date for which the soft "first cup" event
 * has been sent. Re-incrementing past zero on the same date no longer
 * re-fires the event (Codex P2 fix).
 *
 * On day change, the count auto-resets.
 */

import { localDateKey } from "./dates";

export type HydrationToday = {
  dateIso: string;
  cups: number;
  /** Date for which the soft "first cup" event was already sent. Prevents
   * tap-spam farming if the user decrements back to 0 and re-increments. */
  firstCupLoggedFor?: string;
};

/** ~8oz cups. Soft floor for an average teen on an average day. Real
 * needs are higher for athletes, on hot days, etc. — covered in copy. */
export const DAILY_CUP_FLOOR = 8;
export const DAILY_CUP_CEILING = 16; // anything above this is overdoing it for a teen

/** Today's date as YYYY-MM-DD in the user's LOCAL timezone. Codex flagged
 * that the previous toISOString().slice(0,10) rolled the day over at UTC
 * midnight, which in US time zones happened in the late afternoon. */
export function todayIso(): string {
  return localDateKey(new Date());
}

/**
 * If the stored count is from a previous day, reset it to today.
 * Pure: caller decides whether to persist the result.
 */
export function resetIfNewDay(state: HydrationToday | null, now: Date = new Date()): HydrationToday {
  const today = localDateKey(now);
  if (!state || state.dateIso !== today) {
    return { dateIso: today, cups: 0 };
  }
  return state;
}

/**
 * Increment cup count, capped at DAILY_CUP_CEILING. Caller persists.
 */
export function incrementCups(state: HydrationToday, by: number = 1): HydrationToday {
  return { ...state, cups: Math.max(0, Math.min(DAILY_CUP_CEILING, state.cups + by)) };
}

export type HydrationCue = {
  level: "below_floor" | "in_range" | "near_top" | "at_cap";
  message: string;
};

/**
 * Pure mapping from cup count to a soft cue message. NEVER guilt-shaped.
 */
export function cueFor(cups: number): HydrationCue {
  if (cups < 3) {
    return {
      level: "below_floor",
      message: "Take a sip when you can. No alarm — just a nudge."
    };
  }
  if (cups < DAILY_CUP_FLOOR) {
    return {
      level: "below_floor",
      message: "Building up. Light yellow pee is the goal, not a number."
    };
  }
  if (cups < DAILY_CUP_CEILING) {
    return {
      level: "in_range",
      message: "Solid. Keep sipping if you're moving, sweating, or in heat."
    };
  }
  return {
    level: "at_cap",
    message: "That's a lot for one day. More isn't always better — check the pee-color article."
  };
}
