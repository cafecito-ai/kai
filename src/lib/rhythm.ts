/**
 * Daily-rhythm builder. Pure schedule math + a default school-day
 * template. Local-only state via the host component (same pattern as
 * CycleTracker / HydrationTracker).
 *
 * Voice rules:
 *   - "Default" is a starting point, not a prescription.
 *   - Names like "homework" and "school" are common enough that
 *     summer / homeschool / non-school-week teens can rename or drop
 *     them.
 *   - The wake → sleep distance is checked against TEEN_SLEEP_HOURS;
 *     copy in the host can say something like "this leaves you 7 hours
 *     of sleep — teens usually do better with 8-10." No alarm bells.
 */

/** Inclusive 24-hour minute count, e.g. "07:30" → 450. */
export function minutesFromHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((part) => Number.parseInt(part, 10) || 0);
  return h * 60 + m;
}

/** 450 → "07:30" */
export function hhmmFromMinutes(total: number): string {
  const m = ((total % 1440) + 1440) % 1440; // wrap negatives
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

export type RhythmBlock = {
  id: string;
  label: string;
  /** Minutes — caller can tweak. */
  durationMinutes: number;
};

export type ScheduledBlock = RhythmBlock & {
  startMinutes: number;
  endMinutes: number;
};

/**
 * Place an ordered list of blocks starting at `wakeMinutes`. Caller
 * supplies the labels and durations; we just walk the day.
 */
export function buildSchedule(blocks: ReadonlyArray<RhythmBlock>, wakeMinutes: number): ScheduledBlock[] {
  let cursor = wakeMinutes;
  return blocks.map((block) => {
    const start = cursor;
    const end = cursor + block.durationMinutes;
    cursor = end;
    return { ...block, startMinutes: start, endMinutes: end };
  });
}

/**
 * Total minutes consumed by the block list.
 */
export function totalScheduledMinutes(blocks: ReadonlyArray<RhythmBlock>): number {
  return blocks.reduce((sum, b) => sum + Math.max(0, b.durationMinutes), 0);
}

/**
 * Compute hours-of-sleep implied by a wake time + scheduled minutes
 * before sleep. If the schedule wraps past midnight, the math still
 * works (we treat sleep duration as 24h - waking hours).
 *
 * Returns hours as a decimal (e.g. 8.5).
 */
export function sleepHoursFromWake(wakeMinutes: number, scheduledMinutes: number): number {
  const wakingMinutes = Math.max(0, scheduledMinutes);
  const sleepMinutes = Math.max(0, 1440 - wakingMinutes);
  return Math.round((sleepMinutes / 60) * 10) / 10;
}

/**
 * Default school-day template. Sums to ~15h45m of "awake" time when
 * wake = 07:00 → sleep at ~22:45.
 *
 * Source: rough averages from teen-targeted sleep + scheduling
 * literature. Reasonable defaults, not a prescription.
 */
export const DEFAULT_SCHOOL_DAY: ReadonlyArray<RhythmBlock> = [
  { id: "morning", label: "Morning routine + breakfast", durationMinutes: 45 },
  { id: "commute_to_school", label: "Get to school", durationMinutes: 30 },
  { id: "school", label: "School", durationMinutes: 7 * 60 },
  { id: "after_school", label: "Snack + decompress", durationMinutes: 30 },
  { id: "movement", label: "Movement / sport", durationMinutes: 60 },
  { id: "homework", label: "Homework", durationMinutes: 90 },
  { id: "dinner", label: "Dinner + family time", durationMinutes: 60 },
  { id: "downtime", label: "Downtime / hobbies", durationMinutes: 90 },
  { id: "wind_down", label: "Wind down", durationMinutes: 30 }
];

/**
 * Default weekend template — more sleep, less commute, more flex.
 */
export const DEFAULT_WEEKEND: ReadonlyArray<RhythmBlock> = [
  { id: "morning_slow", label: "Slow morning + breakfast", durationMinutes: 90 },
  { id: "movement", label: "Movement / sport", durationMinutes: 90 },
  { id: "lunch", label: "Lunch + decompress", durationMinutes: 60 },
  { id: "creative", label: "Project / hobby / friends", durationMinutes: 180 },
  { id: "errands", label: "Errands / chores", durationMinutes: 60 },
  { id: "dinner", label: "Dinner + family", durationMinutes: 90 },
  { id: "downtime", label: "Downtime", durationMinutes: 120 },
  { id: "wind_down", label: "Wind down", durationMinutes: 30 }
];
