// Rawz/7 — streak milestone detection for the group activity feed.
//
// "Did the user just cross 7 / 30 / 100 days?" lives here as a single
// helper, mirroring the checkAndConsumeLevelUp / checkAndConsumeNewBadges
// pattern in local-xp + local-badges. Idempotent: returns each crossing
// exactly once per current streak run.
//
// Reset rule (per D-021 — "fresh start, no shame"):
//   When the streak drops to 0, we clear the announced set. If the user
//   builds back up to 7, we DO announce it again — coming back counts.
//   We don't re-announce within the same run (so 8 → 9 → 10 isn't spam).

import { readLocalInputs } from "./local-score";

/** Day-count milestones we celebrate. Order matters for catch-up logic. */
export const STREAK_MILESTONES = [7, 30, 100] as const;
export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

const STORAGE_KEY = "kai_streak_milestones_announced_v1";

type Stored = {
  /** Milestones already fired for the current run. */
  announced: number[];
  /** Streak value at last check — used to detect resets. */
  lastStreak: number;
};

function readStored(): Stored {
  if (typeof localStorage === "undefined") return { announced: [], lastStreak: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { announced: [], lastStreak: 0 };
    const parsed = JSON.parse(raw) as Partial<Stored>;
    return {
      announced: Array.isArray(parsed.announced)
        ? parsed.announced.filter((n): n is number => typeof n === "number")
        : [],
      lastStreak:
        typeof parsed.lastStreak === "number" ? parsed.lastStreak : 0,
    };
  } catch {
    return { announced: [], lastStreak: 0 };
  }
}

function writeStored(s: Stored): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** Compute the current streak the same way local-score does — count of
 *  consecutive UTC days ending today with at least one logged input. */
export function currentLocalStreak(now: Date = new Date()): number {
  const dates = new Set(readLocalInputs().map((i) => i.date));
  let streak = 0;
  const d = new Date(now);
  for (let i = 0; i < 365; i += 1) {
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) streak += 1;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/**
 * Returns every milestone the user just crossed for the first time this
 * streak run. Marks them announced so subsequent calls return [].
 *
 * Examples:
 *   streak=6, announced=[]      → []           (not there yet)
 *   streak=7, announced=[]      → [7]          (first cross)
 *   streak=8, announced=[7]     → []           (already had 7)
 *   streak=30, announced=[7]    → [30]         (next milestone)
 *   streak=35, announced=[]     → [7, 30]      (cold-start catch-up)
 *   streak=0,  announced=[7,30] → []           (reset — announced cleared)
 *
 * Why catch up multiple milestones: a user who installs the app and has
 * a 12-day check-in habit from before (or who's testing with seed data)
 * should still see the 7-day moment land — once.
 */
export function checkAndConsumeStreakMilestones(
  now: Date = new Date(),
): StreakMilestone[] {
  const streak = currentLocalStreak(now);
  const stored = readStored();

  // Streak reset — clear announced list. Day 0 itself is never a
  // milestone, so nothing to fire.
  if (streak === 0) {
    if (stored.announced.length > 0 || stored.lastStreak !== 0) {
      writeStored({ announced: [], lastStreak: 0 });
    }
    return [];
  }

  // Detect implicit reset: streak went DOWN from one call to the next
  // (e.g. yesterday=8, today=1 because they missed a day). Treat as a
  // new run.
  let announced = stored.announced;
  if (streak < stored.lastStreak) {
    announced = [];
  }

  const crossings: StreakMilestone[] = [];
  for (const m of STREAK_MILESTONES) {
    if (streak >= m && !announced.includes(m)) {
      crossings.push(m);
      announced = [...announced, m];
    }
  }

  if (crossings.length > 0 || streak !== stored.lastStreak) {
    writeStored({ announced, lastStreak: streak });
  }
  return crossings;
}
