// What KIND of moment is the user in right now? This drives whether KAI should
// reach for the heavier emotional tools — calling back to the day-one origin
// story, or planting an open loop. We deliberately keep "struggle" and
// "milestone" rare so those callbacks land instead of becoming daily filler.

import { detectVaultResurfaceSignals } from "./local-vault";
import { currentLocalStreak } from "./local-streak-milestones";

export type KaiMoment = "milestone" | "struggle" | "routine";

const MILESTONE_DAYS = new Set([7, 14, 30, 60, 90, 180, 365]);

export function classifyMoment(now: Date = new Date()): KaiMoment {
  // Struggle wins — if they're drifting or low, that's the moment that matters,
  // even on a milestone day.
  const signals = detectVaultResurfaceSignals(now);
  if (signals.includes("low_mood") || signals.includes("streak_just_broke")) {
    return "struggle";
  }
  if (MILESTONE_DAYS.has(currentLocalStreak(now))) {
    return "milestone";
  }
  return "routine";
}
