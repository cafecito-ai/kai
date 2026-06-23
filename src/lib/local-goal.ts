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
/** Cap the system summary at the SAME length the worker feeds the model
 *  (`body.system.slice(0, 800)` in workers/src/routes/goal-timeline.ts). Keeping
 *  these in lockstep means the cache key (derived from this summary) changes
 *  exactly when the model's actual input does — edits past the cap can't change
 *  the estimate, so they must not invalidate the cache. */
const SUMMARY_MAX = 800;

type CachedTimeline = { sig: string; estimate: GoalTimeline };
type StartMap = Record<string, string>; // normalized goal -> YYYY-MM-DD it began

function normGoal(goal: string): string {
  return goal.trim().toLowerCase().slice(0, 160);
}

/** A signature of the goal + the system it depends on, used to reuse the cached
 *  estimate only while the goal AND that system are unchanged. Derived from the
 *  SAME capped summary the estimate endpoint receives (systemSummary), so the
 *  key changes exactly when the model's input changes — no stale reuse, and no
 *  wasted re-estimate on edits the prompt never sees (e.g. detail past the
 *  summary's length cap). */
export function goalSignature(goal: string): string {
  return `${normGoal(goal)}#${systemSummary()}`;
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
  // createdAt; use it only when its goal matches the goal being measured. A
  // freshly set or switched goal has createdAt = now (or doesn't match) →
  // starts at 0%, as intended — and this preserves the set date for a
  // signed-in user whose first estimate lands days after they set the goal.
  //
  // NOTE: getNorthStar() reads an un-namespaced key, so on a shared device the
  // matched North Star is the device's, not strictly this userId's. Complete
  // per-user isolation would require namespacing the North Star store itself
  // (app-wide change, out of scope here); the goal-text match is a sufficient
  // guard for this local progress heuristic, and onboarding rewrites the North
  // Star per user, so in practice the matched goal is the current user's.
  const ns = getNorthStar();
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
    .slice(0, SUMMARY_MAX);
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
