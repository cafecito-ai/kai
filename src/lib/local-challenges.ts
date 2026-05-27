// Time-bound challenges (Rawz/6).
//
// Per Rawz vision doc: "7-day morning routine challenge / 30 days of
// meditation." Opt-in, with completion badges.
//
// Per D-021 soft-gamification policy:
//   - Missing a day NEVER resets the challenge or removes progress
//   - Completion = X out of Y days (not consecutive), so a missed day
//     never disqualifies you
//   - Leaving a challenge is silent, no notification, no shame
//   - Copy uses "days you've logged" never "days missed"
//
// Progress is DERIVED from the input log (no separate counter to drift).
// Only "joined" state + the join timestamp are stored.

import { readLocalInputs, type LocalInput } from "./local-score";

export type ChallengeCategory = "morning" | "evening" | "body" | "mind" | "anchor";

export type Challenge = {
  id: string;
  title: string;
  blurb: string;
  /** Total days the challenge spans. */
  durationDays: number;
  /** How many days the user needs to hit to complete it. */
  targetDays: number;
  category: ChallengeCategory;
  /** What activity counts as "hit" for a day. */
  metric:
    | "check_in"
    | "sleep_log"
    | "workout"
    | "journal"
    | "energy_check_in"
    | "any";
};

// ─────────────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────────────

export const CHALLENGE_CATALOG: ReadonlyArray<Challenge> = [
  {
    id: "morning-7",
    title: "7 morning check-ins",
    blurb: "Start the day with a quick read for one week.",
    durationDays: 7,
    targetDays: 7,
    category: "morning",
    metric: "check_in",
  },
  {
    id: "sleep-week",
    title: "Sleep tracking week",
    blurb: "Log your sleep for seven nights — see what you actually average.",
    durationDays: 7,
    targetDays: 7,
    category: "evening",
    metric: "sleep_log",
  },
  {
    id: "move-14",
    title: "14 days of movement",
    blurb: "Log a workout — any kind, even a walk — fourteen times in three weeks.",
    durationDays: 21,
    targetDays: 14,
    category: "body",
    metric: "workout",
  },
  {
    id: "journal-14",
    title: "Two weeks of pages",
    blurb: "Write something — even one line — fourteen days out of three weeks.",
    durationDays: 21,
    targetDays: 14,
    category: "mind",
    metric: "journal",
  },
  {
    id: "show-up-30",
    title: "30-day show-up",
    blurb: "Log SOMETHING on 25 days out of the next month. Showing up = the whole thing.",
    durationDays: 30,
    targetDays: 25,
    category: "anchor",
    metric: "any",
  },
  {
    id: "energy-week",
    title: "Energy awareness week",
    blurb: "A quick 1–5 energy read for seven days — find your patterns.",
    durationDays: 7,
    targetDays: 7,
    category: "morning",
    metric: "energy_check_in",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Joined-state storage
// ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "kai_challenges_v1";

export type ChallengeJoinState = {
  challengeId: string;
  joinedAt: string; // ISO timestamp
};

type Stored = {
  active: ChallengeJoinState[];
  completed: { challengeId: string; completedAt: string }[];
};

function readStored(): Stored {
  if (typeof localStorage === "undefined") return { active: [], completed: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { active: [], completed: [] };
    const parsed = JSON.parse(raw);
    return {
      active: Array.isArray(parsed.active) ? parsed.active : [],
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
    };
  } catch {
    return { active: [], completed: [] };
  }
}

function writeStored(s: Stored): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* no-op */
  }
}

// ─────────────────────────────────────────────────────────────────────
// Progress computation
// ─────────────────────────────────────────────────────────────────────

export type ChallengeProgress = {
  challenge: Challenge;
  joinedAt: string;
  /** How many unique days the user has hit the metric since joining. */
  daysHit: number;
  /** How many days have elapsed since joining (capped at durationDays). */
  daysElapsed: number;
  /** Days remaining in the window (>= 0). */
  daysRemaining: number;
  /** True if daysHit >= targetDays. */
  completed: boolean;
  completedAt: string | null;
  /** 0..1 progress toward target. */
  progress: number;
};

function countDaysHit(
  inputs: LocalInput[],
  challenge: Challenge,
  sinceIso: string,
  untilIso: string,
): number {
  const since = sinceIso.slice(0, 10);
  const until = untilIso.slice(0, 10);
  const hitDates = new Set<string>();
  for (const i of inputs) {
    if (i.date < since || i.date > until) continue;
    if (challenge.metric === "any" || i.source === challenge.metric) {
      hitDates.add(i.date);
    }
  }
  return hitDates.size;
}

function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso.slice(0, 10) + "T00:00:00Z").getTime();
  const b = new Date(bIso.slice(0, 10) + "T00:00:00Z").getTime();
  return Math.max(0, Math.floor((b - a) / (24 * 60 * 60 * 1000)));
}

/** Get all active challenges with current progress. */
export function getActiveChallenges(): ChallengeProgress[] {
  const stored = readStored();
  const inputs = readLocalInputs();
  const today = new Date().toISOString();
  const out: ChallengeProgress[] = [];
  for (const join of stored.active) {
    const challenge = CHALLENGE_CATALOG.find((c) => c.id === join.challengeId);
    if (!challenge) continue;
    const daysHit = countDaysHit(inputs, challenge, join.joinedAt, today);
    const elapsed = Math.min(challenge.durationDays, daysBetween(join.joinedAt, today));
    const remaining = Math.max(0, challenge.durationDays - elapsed);
    const completed = daysHit >= challenge.targetDays;
    const completedAt =
      stored.completed.find((c) => c.challengeId === challenge.id)?.completedAt ??
      (completed ? today : null);
    out.push({
      challenge,
      joinedAt: join.joinedAt,
      daysHit,
      daysElapsed: elapsed,
      daysRemaining: remaining,
      completed,
      completedAt,
      progress: Math.min(1, daysHit / challenge.targetDays),
    });

    // If newly completed AND not yet stored, persist that fact.
    if (completed && !stored.completed.find((c) => c.challengeId === challenge.id)) {
      stored.completed.push({ challengeId: challenge.id, completedAt: today });
    }
  }
  writeStored(stored);
  return out;
}

/** Catalog with each challenge tagged as joined / completed / available. */
export type ChallengeListing = {
  challenge: Challenge;
  state: "available" | "active" | "completed";
};

export function getChallengeListings(): ChallengeListing[] {
  const stored = readStored();
  const activeIds = new Set(stored.active.map((a) => a.challengeId));
  const completedIds = new Set(stored.completed.map((c) => c.challengeId));
  return CHALLENGE_CATALOG.map((c) => ({
    challenge: c,
    state: completedIds.has(c.id)
      ? "completed"
      : activeIds.has(c.id)
        ? "active"
        : "available",
  }));
}

// ─────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────

export function joinChallenge(id: string): void {
  const challenge = CHALLENGE_CATALOG.find((c) => c.id === id);
  if (!challenge) return;
  const stored = readStored();
  if (stored.active.find((a) => a.challengeId === id)) return;
  stored.active.push({ challengeId: id, joinedAt: new Date().toISOString() });
  writeStored(stored);
}

export function leaveChallenge(id: string): void {
  const stored = readStored();
  stored.active = stored.active.filter((a) => a.challengeId !== id);
  writeStored(stored);
}

/** How many active + completed total? Used for Profile chip. */
export function challengeSummary(): { active: number; completed: number } {
  const s = readStored();
  return { active: s.active.length, completed: s.completed.length };
}
