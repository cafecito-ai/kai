// local-goal — the goal as DESTINATION: an AI-estimated timeline + progress
// driven by completed actions and consistency, not arbitrary weekly %.
//
// The AI estimate (weeks-to-goal) is fetched once and cached against a signature
// of the goal + current system, so we only re-call when those actually change.
// Progress and the projected finish date flex with the user's System Health:
// stay consistent and the finish line comes in; fall off and it slips.

import { addDays, daysBetween, localDateKey, parseLocalDate } from "./dates";
import { daysLabel, formatTime, getSchedule } from "./local-schedule";
import { getNorthStar } from "./local-northstar";
import { systemHealth } from "./local-system-health";
import { loadJSON, saveJSON } from "./local-storage";
import type { GoalTimeline } from "./types";

const TIMELINE_KEY = "kai_goal_timeline_v1";
const GOAL_STARTED_KEY = "kai_goal_started_v1";
/** Below this, projecting a finish date would explode — floor the consistency. */
const MIN_CONSISTENCY = 0.4;

type CachedTimeline = { sig: string; estimate: GoalTimeline };
type StartMap = Record<string, string>; // normalized goal -> YYYY-MM-DD it began

function normGoal(goal: string): string {
  return goal.trim().toLowerCase().slice(0, 160);
}

/** A signature of the goal + the FULL system (cadence + specifics, not just
 *  titles), so the cached estimate is reused only while the goal AND the system
 *  it depends on are unchanged — a workout moving 1→5 days re-estimates. */
export function goalSignature(goal: string): string {
  const items = getSchedule()
    // Use the FULL detail (not a 40-char prefix) so it matches what
    // systemSummary() actually sends to the estimate endpoint — a detail edit
    // past char 40 still invalidates the cache and re-estimates. The whole
    // signature is capped below, so this stays bounded.
    .map((i) => `${i.section}:${i.title}:${i.days.join(",")}:${i.time ?? ""}:${i.detail}`)
    .sort()
    .join("|");
  return `${normGoal(goal)}#${items}`.slice(0, 2000);
}

/** When the user started working toward THIS goal (stamped once, keyed by the
 *  goal text so editing the system re-estimates the timeline without resetting
 *  the clock). Read-only; the stamp is written when a timeline is first cached. */
function readGoalStart(goal: string, userId?: string | null): string | null {
  const map = loadJSON<StartMap>(GOAL_STARTED_KEY, userId, {});
  return map[normGoal(goal)] ?? null;
}

function ensureGoalStart(goal: string, userId: string | null | undefined, now: Date): void {
  const map = loadJSON<StartMap>(GOAL_STARTED_KEY, userId, {});
  const k = normGoal(goal);
  if (map[k]) return;
  // Credit the date the goal was actually SET, not the first time the timeline
  // was fetched — otherwise an existing user (e.g. their onboarding goal) would
  // reset to 0% on their first /schedule visit. The North Star carries that
  // createdAt; only use it when it's the same goal. A freshly set or switched
  // goal has createdAt = now (or doesn't match) → starts at 0%, as intended.
  // getNorthStar() reads the un-namespaced key, so it's only trustworthy for
  // the anonymous/local user; when a userId is present (shared device, multiple
  // signed-in accounts) skip it so we never inherit another user's start date.
  const ns = userId ? null : getNorthStar();
  let stamp = localDateKey(now);
  if (ns && normGoal(ns.goal) === k) {
    const setAt = new Date(ns.createdAt);
    if (!Number.isNaN(setAt.getTime())) stamp = localDateKey(setAt);
  }
  map[k] = stamp;
  saveJSON(GOAL_STARTED_KEY, userId, map);
}

/** A compact text summary of the system to send to the estimate endpoint.
 *  Includes cadence + specifics (days/time/detail) so a workload change — e.g.
 *  a workout moving from one day to five — actually changes the model's input
 *  and therefore the estimate, not just the cache key. */
export function systemSummary(): string {
  return getSchedule()
    .map((i) => {
      const cadence = i.days.length ? daysLabel(i.days) : "daily";
      const time = i.time ? `, ${formatTime(i.time)}` : "";
      const detail = i.detail ? ` — ${i.detail}` : "";
      return `- ${i.section}: ${i.title} (${cadence}${time})${detail}`;
    })
    .join("\n")
    .slice(0, 1200);
}

export function loadCachedTimeline(goal: string, userId?: string | null): GoalTimeline | null {
  const cached = loadJSON<CachedTimeline | null>(TIMELINE_KEY, userId, null);
  if (!cached || cached.sig !== goalSignature(goal)) return null;
  return cached.estimate;
}

export function saveCachedTimeline(goal: string, estimate: GoalTimeline, userId?: string | null): void {
  saveJSON(TIMELINE_KEY, userId, { sig: goalSignature(goal), estimate } satisfies CachedTimeline);
  // Start the goal's clock the first time we have an estimate for it.
  ensureGoalStart(goal, userId, new Date());
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

  // Stamp the goal's clock here too, not just in saveCachedTimeline — a timeline
  // cached before the start-map existed (or whose second write failed) would
  // otherwise have no start date and sit at 0% until the cache invalidated.
  ensureGoalStart(goal, userId, now);

  const consistency = Math.max(MIN_CONSISTENCY, Math.min(1, systemHealth(userId, now).overall / 100));
  // Elapsed time is scoped to THIS goal (stamped when its timeline was cached),
  // not the global app age — so a brand-new goal starts at zero, not inherited
  // progress from prior app usage.
  const startKey = readGoalStart(goal, userId);
  const start = startKey ? parseLocalDate(startKey) : null;
  const weeksElapsed = start ? Math.max(0, daysBetween(start, now)) / 7 : 0;
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
