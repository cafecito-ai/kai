// local-goal — the goal as DESTINATION: an AI-estimated timeline + progress
// driven by completed actions and consistency, not arbitrary weekly %.
//
// The AI estimate (weeks-to-goal) is fetched once and cached against a signature
// of the goal + current system, so we only re-call when those actually change.
// Progress and the projected finish date flex with the user's System Health:
// stay consistent and the finish line comes in; fall off and it slips.

import { addDays, localDateKey } from "./dates";
import { daysBuilding } from "./local-identity";
import { getSchedule } from "./local-schedule";
import { systemHealth } from "./local-system-health";
import { loadJSON, saveJSON } from "./local-storage";
import type { GoalTimeline } from "./types";

const TIMELINE_KEY = "kai_goal_timeline_v1";
/** Below this, projecting a finish date would explode — floor the consistency. */
const MIN_CONSISTENCY = 0.4;

type CachedTimeline = { sig: string; estimate: GoalTimeline };

/** A signature of the goal + system, so a cached estimate is reused until the
 *  goal or the system meaningfully changes. */
export function goalSignature(goal: string): string {
  const items = getSchedule()
    .map((i) => `${i.section}:${i.title}`)
    .sort()
    .join("|");
  return `${goal.trim().toLowerCase()}#${items}`.slice(0, 600);
}

/** A compact text summary of the system to send to the estimate endpoint. */
export function systemSummary(): string {
  return getSchedule()
    .map((i) => `- ${i.section}: ${i.title}`)
    .join("\n")
    .slice(0, 800);
}

export function loadCachedTimeline(goal: string, userId?: string | null): GoalTimeline | null {
  const cached = loadJSON<CachedTimeline | null>(TIMELINE_KEY, userId, null);
  if (!cached || cached.sig !== goalSignature(goal)) return null;
  return cached.estimate;
}

export function saveCachedTimeline(goal: string, estimate: GoalTimeline, userId?: string | null): void {
  saveJSON(TIMELINE_KEY, userId, { sig: goalSignature(goal), estimate } satisfies CachedTimeline);
}

export type GoalProgress = {
  pct: number; // 0–100 toward the goal
  estimatedWeeks: number;
  projectedFinishISO: string; // YYYY-MM-DD
  rationale: string;
  factors: string[];
};

/**
 * Progress toward the goal, driven by consistency rather than the calendar.
 * `consistency` = System Health overall (floored at MIN_CONSISTENCY so a finish
 * date is always projectable). Effective progress = weeks-elapsed × consistency,
 * so falling off slows progress and pushes the projected finish out.
 */
export function goalProgress(goal: string, now: Date = new Date(), userId?: string | null): GoalProgress | null {
  const estimate = loadCachedTimeline(goal, userId);
  if (!estimate) return null;

  const consistency = Math.max(MIN_CONSISTENCY, Math.min(1, systemHealth(userId, now).overall / 100));
  const weeksElapsed = daysBuilding(now) / 7;
  const effectiveWeeks = weeksElapsed * consistency;
  const pct = Math.max(0, Math.min(100, Math.round((effectiveWeeks / estimate.weeks) * 100)));

  const remainingEffective = Math.max(0, estimate.weeks - effectiveWeeks);
  const calendarWeeksLeft = remainingEffective / consistency; // at the current pace
  const finish = addDays(now, Math.round(calendarWeeksLeft * 7));

  return {
    pct,
    estimatedWeeks: estimate.weeks,
    projectedFinishISO: localDateKey(finish),
    rationale: estimate.rationale,
    factors: estimate.factors,
  };
}
