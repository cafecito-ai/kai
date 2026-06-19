// Progress the user can't see for themselves. Rather than snapshot a baseline
// going forward (which misses everyone with existing history), we compute it
// retroactively from the input log: their FIRST 7 days of activity vs their
// LATEST 7 days. That powers "you sleep 1.5h more than when you started" and
// the 60–90 day reflection screen.

import { daysBuilding } from "./local-identity";
import { readLocalInputs, type LocalInput } from "./local-score";

export type ProgressDeltas = {
  daysBuilding: number;
  workoutsLifetime: number;
  /** recent-week avg sleep minus first-week avg sleep; null if either window
   *  has no sleep logs to compare. */
  sleepHoursDelta: number | null;
  activeDaysFirstWeek: number;
  activeDaysRecentWeek: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function avgSleepHours(inputs: LocalInput[]): number | null {
  const hrs: number[] = [];
  for (const i of inputs) {
    if (i.source !== "sleep_log") continue;
    const h = (i.value as { hours?: number })?.hours;
    if (typeof h === "number") hrs.push(h);
  }
  if (hrs.length === 0) return null;
  return hrs.reduce((a, b) => a + b, 0) / hrs.length;
}

export function progressDeltas(now: Date = new Date()): ProgressDeltas {
  const inputs = readLocalInputs();
  const base: ProgressDeltas = {
    daysBuilding: daysBuilding(now),
    workoutsLifetime: inputs.filter((i) => i.source === "workout").length,
    sleepHoursDelta: null,
    activeDaysFirstWeek: 0,
    activeDaysRecentWeek: 0,
  };
  if (inputs.length === 0) return base;

  // First 7 days starting at the earliest logged date.
  const firstDate = inputs.reduce((a, b) => (a.date < b.date ? a : b)).date;
  const firstStartMs = new Date(firstDate).getTime();
  const firstWeek = inputs.filter((i) => {
    const ms = new Date(i.date).getTime();
    return ms >= firstStartMs && ms < firstStartMs + 7 * DAY_MS;
  });

  // Latest 7 days ending today.
  const recentStartKey = dateKey(new Date(now.getTime() - 6 * DAY_MS));
  const todayKey = dateKey(now);
  const recentWeek = inputs.filter((i) => i.date >= recentStartKey && i.date <= todayKey);

  base.activeDaysFirstWeek = new Set(firstWeek.map((i) => i.date)).size;
  base.activeDaysRecentWeek = new Set(recentWeek.map((i) => i.date)).size;

  const firstAvg = avgSleepHours(firstWeek);
  const recentAvg = avgSleepHours(recentWeek);
  if (firstAvg != null && recentAvg != null) {
    base.sleepHoursDelta = recentAvg - firstAvg;
  }

  return base;
}
