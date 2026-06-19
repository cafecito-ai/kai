// Comeback detection — when the user returns after a gap, KAI welcomes them
// back instead of shaming a broken streak. Device-local, read from the
// activity log. Pairs with src/components/ComebackMoment.tsx.

import { daysBetween, localDateKey, parseLocalDate } from "./dates";
import { readLocalInputs } from "./local-score";

const SEEN_KEY = "kai_comeback_seen_v1";
const GAP_DAYS = 7;

/** Most recent local activity date (YYYY-MM-DD), or null if none logged. */
function lastActivityDate(): string | null {
  let max: string | null = null;
  for (const i of readLocalInputs()) {
    if (!max || i.date > max) max = i.date;
  }
  return max;
}

/** Calendar days since the last logged activity, or null if no activity yet. */
export function daysSinceLastActivity(now: Date = new Date()): number | null {
  const last = lastActivityDate();
  if (!last) return null;
  const d = parseLocalDate(last);
  if (!d) return null;
  return daysBetween(d, now);
}

/** True when the user is back after a 7+ day gap AND we haven't already shown
 *  the comeback for THIS gap. Anchored to the last-activity date so it fires
 *  once per gap (not every day they stay away), and clears naturally once they
 *  log something (the gap closes). */
export function shouldShowComeback(now: Date = new Date()): boolean {
  const last = lastActivityDate();
  if (!last) return false;
  const gap = daysSinceLastActivity(now);
  if (gap == null || gap < GAP_DAYS) return false;
  try {
    return localStorage.getItem(SEEN_KEY) !== last;
  } catch {
    return false;
  }
}

/** Mark the current comeback handled so it won't re-show until a new gap. */
export function markComebackSeen(): void {
  const last = lastActivityDate();
  if (!last) return;
  try {
    localStorage.setItem(SEEN_KEY, last);
  } catch {
    /* ignore */
  }
}

export type ComebackInfo = { daysAway: number; lastDate: string | null };

export function comebackInfo(now: Date = new Date()): ComebackInfo {
  return { daysAway: daysSinceLastActivity(now) ?? 0, lastDate: lastActivityDate() };
}

// Exposed for tests / consistency with the rest of the date stack.
export { localDateKey };
