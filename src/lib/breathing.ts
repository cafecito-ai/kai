/**
 * Section 6 (Physical engine) and Section 12 Phase 4 Task 6 (Mental engine
 * contextual breathing) both reference these four patterns. Each phase is a
 * (label, durationSeconds) tuple. Patterns loop until the user stops or the
 * session timer expires.
 */
export type BreathPhase = { label: "Inhale" | "Hold" | "Exhale" | "Rest"; seconds: number };

export type BreathPattern = {
  id: "4-7-8" | "box" | "calming" | "energizing";
  name: string;
  description: string;
  bestFor: string;
  phases: ReadonlyArray<BreathPhase>;
};

export const BREATH_PATTERNS: ReadonlyArray<BreathPattern> = [
  {
    id: "4-7-8",
    name: "4-7-8",
    description: "Inhale 4 · Hold 7 · Exhale 8",
    bestFor: "Hard to fall asleep, racing thoughts at night.",
    phases: [
      { label: "Inhale", seconds: 4 },
      { label: "Hold", seconds: 7 },
      { label: "Exhale", seconds: 8 }
    ]
  },
  {
    id: "box",
    name: "Box breath",
    description: "Inhale 4 · Hold 4 · Exhale 4 · Hold 4",
    bestFor: "Steadying before a test, performance, or hard conversation.",
    phases: [
      { label: "Inhale", seconds: 4 },
      { label: "Hold", seconds: 4 },
      { label: "Exhale", seconds: 4 },
      { label: "Rest", seconds: 4 }
    ]
  },
  {
    id: "calming",
    name: "Calming",
    description: "Inhale 4 · Exhale 8",
    bestFor: "Anxiety spiking, body feels too charged.",
    phases: [
      { label: "Inhale", seconds: 4 },
      { label: "Exhale", seconds: 8 }
    ]
  },
  {
    id: "energizing",
    name: "Energizing",
    description: "Inhale 4 · Exhale 2",
    bestFor: "Tired but need to focus for the next 15 minutes.",
    phases: [
      { label: "Inhale", seconds: 4 },
      { label: "Exhale", seconds: 2 }
    ]
  }
];

/**
 * Given a pattern and an elapsed time in seconds, return the current phase
 * and the seconds remaining in that phase. Pure function; testable in
 * isolation. Patterns cycle forever — the caller decides when to stop.
 */
export function currentPhase(pattern: BreathPattern, elapsedSeconds: number): { phase: BreathPhase; remaining: number; cycle: number } {
  const cycleTotal = pattern.phases.reduce((sum, phase) => sum + phase.seconds, 0);
  if (cycleTotal === 0) {
    return { phase: pattern.phases[0], remaining: 0, cycle: 0 };
  }
  const cycle = Math.floor(elapsedSeconds / cycleTotal);
  let inCycle = elapsedSeconds % cycleTotal;
  for (const phase of pattern.phases) {
    if (inCycle < phase.seconds) {
      return { phase, remaining: phase.seconds - inCycle, cycle };
    }
    inCycle -= phase.seconds;
  }
  // Defensive: shouldn't reach here unless rounding is weird.
  return { phase: pattern.phases[pattern.phases.length - 1], remaining: 0, cycle };
}

/**
 * Default session length per spec — 4 minutes is enough for a real reset
 * without committing to a meditation-scale block.
 */
export const DEFAULT_SESSION_SECONDS = 240;
