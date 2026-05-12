import type { EngineId } from "../types";

export type Belt = "none" | "white" | "yellow" | "green" | "blue" | "black";

/**
 * Section 9 cumulative-score thresholds for the evolving character.
 * Level 1 starts at 0; each successive level kicks in when cumulative
 * eventValue meets the threshold. Capped at 10.
 */
const LEVEL_THRESHOLDS: ReadonlyArray<number> = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 6000, 9000];

/**
 * Per-engine event-count thresholds for belts. Spec Section 9 has a more
 * elaborate matrix (e.g. "physical green = 50 workouts + 30 breathing
 * sessions"), but that requires event_type taxonomy locked first. For v1
 * we use a uniform count-based ladder so the surface lights up; the spec
 * matrix is a follow-up after event_type values are finalized in Phase 2.
 */
const BELT_THRESHOLDS: ReadonlyArray<{ belt: Belt; count: number }> = [
  { belt: "black", count: 200 },
  { belt: "blue", count: 100 },
  { belt: "green", count: 50 },
  { belt: "yellow", count: 25 },
  { belt: "white", count: 10 }
];

const STREAK_DAY_MIN_VALUE = 5;

export function computeLevel(totalScore: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalScore >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(10, Math.max(1, level));
}

export function computeBelt(engineEventCount: number): Belt {
  for (const tier of BELT_THRESHOLDS) {
    if (engineEventCount >= tier.count) return tier.belt;
  }
  return "none";
}

type DayEvent = { day: string; engine: EngineId | "kai"; value: number };

/**
 * Compute the current streak — the count of consecutive UTC days ending
 * today on which the user had at least one event with eventValue >=
 * STREAK_DAY_MIN_VALUE. Optionally filter to a single engine.
 *
 * Today is the comparison anchor. If `now` is provided, it's used as
 * "today" (lets tests pin the date).
 */
export function computeStreak(events: DayEvent[], opts: { engine?: EngineId; now?: Date } = {}): number {
  const days = new Set<string>();
  for (const ev of events) {
    if (opts.engine && ev.engine !== opts.engine) continue;
    if (ev.value < STREAK_DAY_MIN_VALUE) continue;
    days.add(ev.day);
  }

  let streak = 0;
  const cursor = opts.now ? new Date(opts.now) : new Date();
  for (let i = 0; i < 365; i++) {
    const day = cursor.toISOString().slice(0, 10);
    if (!days.has(day)) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export type ProgressSummary = {
  level: number;
  totalScore: number;
  streaks: { overall: number; physical: number; potential: number; mental: number };
  belts: { physical: Belt; potential: Belt; mental: Belt };
  eventCountsByEngine: { physical: number; potential: number; mental: number; kai: number };
};

type ProgressRow = {
  engine: EngineId | "kai";
  event_value: number | null;
  occurred_at: string | null;
};

/**
 * Reduce a list of progress_event rows into the full summary the
 * /api/progress endpoint returns. Pure function for testability.
 */
export function summariseProgress(rows: ProgressRow[], opts: { now?: Date } = {}): ProgressSummary {
  let totalScore = 0;
  const engineCounts = { physical: 0, potential: 0, mental: 0, kai: 0 };
  const dayEvents: DayEvent[] = [];

  for (const row of rows) {
    const value = Math.max(0, row.event_value ?? 0);
    totalScore += value;
    engineCounts[row.engine] = (engineCounts[row.engine] ?? 0) + 1;
    if (row.occurred_at) {
      dayEvents.push({
        day: row.occurred_at.slice(0, 10),
        engine: row.engine,
        value
      });
    }
  }

  return {
    level: computeLevel(totalScore),
    totalScore,
    streaks: {
      overall: computeStreak(dayEvents, { now: opts.now }),
      physical: computeStreak(dayEvents, { engine: "physical", now: opts.now }),
      potential: computeStreak(dayEvents, { engine: "potential", now: opts.now }),
      mental: computeStreak(dayEvents, { engine: "mental", now: opts.now })
    },
    belts: {
      physical: computeBelt(engineCounts.physical),
      potential: computeBelt(engineCounts.potential),
      mental: computeBelt(engineCounts.mental)
    },
    eventCountsByEngine: engineCounts
  };
}

export const LEVEL_THRESHOLDS_PUBLIC = LEVEL_THRESHOLDS;
