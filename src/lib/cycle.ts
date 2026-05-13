/**
 * Cycle math helpers. Pure functions, no I/O.
 *
 * Privacy / scope rules:
 *   - This data lives on-device only (localStorage, user-namespaced).
 *     It is NEVER sent to the Worker / D1. Sensitive minor health data
 *     needs legal+privacy review before any server storage.
 *   - We never *predict* ovulation or fertility windows. Teens get the
 *     phase information (early / mid / late) and that's it.
 *   - Cycles in the first few years after menarche are commonly
 *     irregular. The helper acknowledges that — no anxiety-inducing
 *     "your cycle is X days late" warnings.
 *
 * Date semantics:
 *   - All date math uses LOCAL midnight boundaries via `localDateKey` +
 *     `parseLocalDate` from `dates.ts`. Codex flagged the previous
 *     UTC-based math: in west-of-UTC zones the day-of-cycle would
 *     increment after 5pm Pacific instead of midnight local.
 */

import { localDateKey, parseLocalDate } from "./dates";

/** A single period log: a start date and an optional end date. */
export type PeriodEntry = {
  /** ISO date string YYYY-MM-DD (LOCAL date, not UTC). */
  startDate: string;
  /** ISO date string YYYY-MM-DD, optional. */
  endDate?: string;
};

export type CyclePhase = "menstrual" | "early" | "mid" | "late" | "unknown";

export type CyclePhaseInfo = {
  phase: CyclePhase;
  dayOfCycle: number | null;
  /** Average cycle length over the entries we have, or null if not enough data. */
  averageCycleLength: number | null;
};

/** Today's date as a YYYY-MM-DD string in the user's LOCAL timezone. */
export function todayIso(): string {
  return localDateKey(new Date());
}

/** Validates a YYYY-MM-DD string and rejects future dates. Returns the
 *  trimmed/normalized form on success, or null on failure.
 *  Codex flagged that empty `<input type="date">` values could be saved
 *  as empty startDates, producing NaN dates downstream. */
export function validatePeriodStart(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = parseLocalDate(trimmed);
  if (!parsed) return null;
  // Reject future dates — you can't log a period that hasn't happened yet.
  const now = new Date();
  if (parsed.getTime() > new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
    return null;
  }
  return trimmed;
}

/** Convert YYYY-MM-DD strings to day counts (local-day epoch). */
function dateToLocalDay(iso: string): number | null {
  const date = parseLocalDate(iso);
  if (!date) return null;
  return Math.floor(date.getTime() / 86_400_000);
}

/**
 * Compute the average cycle length from the gap between consecutive
 * period start dates. Returns null if fewer than 2 entries.
 *
 * Codex P2 fix: short-gap entries (< 10 days) are treated as duplicate /
 * mis-entered logs and removed from BOTH the gap calculation AND the
 * anchor chain for the next gap. The original implementation skipped
 * the gap calculation but still used the short-gap entry as the
 * previous-entry anchor, which compounded misentries.
 */
export function computeAverageCycleLength(entries: PeriodEntry[]): number | null {
  if (entries.length < 2) return null;
  const sortedAll = [...entries].sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  // Build a filtered list of anchors: drop entries whose gap to the
  // previous accepted anchor is unreasonably short (mis-entry).
  const anchors: PeriodEntry[] = [];
  for (const entry of sortedAll) {
    if (anchors.length === 0) {
      anchors.push(entry);
      continue;
    }
    const prevDay = dateToLocalDay(anchors[anchors.length - 1].startDate);
    const curDay = dateToLocalDay(entry.startDate);
    if (prevDay === null || curDay === null) continue;
    const gap = curDay - prevDay;
    if (gap >= 10) {
      anchors.push(entry);
    }
    // gap < 10: probable duplicate/mis-entry, ignored as anchor.
  }
  if (anchors.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < anchors.length; i++) {
    const prevDay = dateToLocalDay(anchors[i - 1].startDate);
    const curDay = dateToLocalDay(anchors[i].startDate);
    if (prevDay === null || curDay === null) continue;
    const gap = curDay - prevDay;
    if (gap > 10 && gap < 90) {
      // Filter out clearly-wrong gaps (very irregular teen cycles outside
      // 10-90 days). The remaining valid gaps still span normal teen
      // variability (~21-45 days).
      gaps.push(gap);
    }
  }
  if (gaps.length === 0) return null;
  const avg = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  return Math.round(avg);
}

/**
 * Compute the current cycle phase based on the most recent period start
 * and (optionally) end. Phases are quartile-style:
 *   - menstrual: during the period itself (start through end, default 5 days)
 *   - early: post-period through cycle mid-point
 *   - mid: around the cycle midpoint
 *   - late: from ~5 days before next expected period through the start
 *   - unknown: no recent data or data is too old
 *
 * Day of cycle = days since the most recent period started, 1-indexed.
 * Uses local-day boundaries, not UTC.
 */
export function computePhase(
  entries: PeriodEntry[],
  now: Date = new Date()
): CyclePhaseInfo {
  if (entries.length === 0) {
    return { phase: "unknown", dayOfCycle: null, averageCycleLength: null };
  }

  const sorted = [...entries].sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  const latest = sorted[sorted.length - 1];
  const latestStart = dateToLocalDay(latest.startDate);
  if (latestStart === null) {
    return { phase: "unknown", dayOfCycle: null, averageCycleLength: null };
  }
  // "today" in local-day units
  const today = Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86_400_000
  );
  const daysSinceStart = today - latestStart;

  // If most recent entry is older than 60 days, treat as unknown.
  if (daysSinceStart > 60) {
    return { phase: "unknown", dayOfCycle: null, averageCycleLength: computeAverageCycleLength(entries) };
  }

  const dayOfCycle = daysSinceStart + 1; // day 1 = start day
  const averageCycleLength = computeAverageCycleLength(entries);
  const effectiveCycleLength = averageCycleLength ?? 28; // teen-typical default
  const periodEndDay = latest.endDate ? dateToLocalDay(latest.endDate) : null;
  const periodEnd = periodEndDay ?? latestStart + 4; // assume 5-day period
  const periodLength = Math.max(3, periodEnd - latestStart + 1);

  let phase: CyclePhase;
  if (daysSinceStart < periodLength) {
    phase = "menstrual";
  } else if (dayOfCycle < effectiveCycleLength * 0.4) {
    phase = "early";
  } else if (dayOfCycle < effectiveCycleLength * 0.7) {
    phase = "mid";
  } else if (dayOfCycle <= effectiveCycleLength + 5) {
    phase = "late";
  } else {
    // Past expected next period without a new log → cycle is "late"
    // but we don't display alarm bells, just stay in late phase.
    phase = "late";
  }

  return { phase, dayOfCycle, averageCycleLength };
}

export const PHASE_NOTES: Record<CyclePhase, { label: string; energyNote: string }> = {
  menstrual: {
    label: "Menstrual phase",
    energyNote: "Energy is often lower. Lean into rest, gentle movement, iron-rich food. Cramps respond well to walking and heat."
  },
  early: {
    label: "Early follicular",
    energyNote: "Energy usually climbs across this week. Good time for harder workouts or new things."
  },
  mid: {
    label: "Mid-cycle",
    energyNote: "Energy and mood typically peak. Use this window for hard training, performance, social plans you've been putting off."
  },
  late: {
    label: "Late / luteal",
    energyNote: "Energy may dip, mood can shift. Plan lower-stakes work where possible. PMS is real; PMS is not weakness."
  },
  unknown: {
    label: "No recent data",
    energyNote: "Log a period start to see phase information."
  }
};
