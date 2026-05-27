// Daily missions (Rawz/2).
//
// "Do these 3 things today" — a small, AI-curated checklist that shows
// up on /home. Different from goals (long-term identity) and check-ins
// (mood snapshots). Missions are TODAY-only, regenerate every morning.
//
// Per D-021: incomplete missions never penalize — only completed ones
// reward (small XP bump). The "you skipped" framing is forbidden.
//
// Generation is heuristic, not LLM-driven — fast, free, and works
// without a backend. We look at what the user has and hasn't logged
// today and pick 3 actions that move the needle.

import { readLocalInputs, type LocalInput } from "./local-score";
import { profileKey, type OnboardingProfile } from "./onboarding-profile";

export type MissionId =
  | "check_in"
  | "log_sleep"
  | "log_workout"
  | "log_food"
  | "journal"
  | "hydrate"
  | "stretch"
  | "energy_check";

export type Mission = {
  id: MissionId;
  title: string;
  subtitle: string;
  /** Lucide icon name as a string — caller maps to the actual icon. */
  icon: "Heart" | "Moon" | "Dumbbell" | "Camera" | "NotebookPen" | "GlassWater" | "Sparkles" | "Zap";
  tint: string;
  to: string;
  completed: boolean;
};

const STORAGE_KEY = "kai_missions_v1";
type StoredState = {
  date: string; // YYYY-MM-DD when last generated
  missionIds: MissionId[];
  completed: MissionId[];
  profileKey?: string;
};

// ─────────────────────────────────────────────────────────────────────
// Catalog — every possible mission, looked up by id
// ─────────────────────────────────────────────────────────────────────

const CATALOG: Record<MissionId, Omit<Mission, "completed">> = {
  check_in: {
    id: "check_in",
    title: "Check in",
    subtitle: "30-second mood read",
    icon: "Heart",
    tint: "bg-accent-cool-soft text-accent-cool",
    to: "/check-in",
  },
  log_sleep: {
    id: "log_sleep",
    title: "Log last night's sleep",
    subtitle: "Even a guess is fine",
    icon: "Moon",
    tint: "bg-accent-soft text-accent",
    to: "/sleep/log",
  },
  log_workout: {
    id: "log_workout",
    title: "Log a workout",
    subtitle: "A walk counts",
    icon: "Dumbbell",
    tint: "bg-accent-warm-soft text-accent-warm",
    to: "/workout/log",
  },
  log_food: {
    id: "log_food",
    title: "Log a meal",
    subtitle: "Photo or quick note",
    icon: "Camera",
    tint: "bg-accent-warm-soft text-accent-warm",
    to: "/food/log",
  },
  journal: {
    id: "journal",
    title: "Write one line",
    subtitle: "Whatever's on your mind",
    icon: "NotebookPen",
    tint: "bg-accent-cool-soft text-accent-cool",
    to: "/journal",
  },
  hydrate: {
    id: "hydrate",
    title: "Drink some water",
    subtitle: "Then tap the + on home",
    icon: "GlassWater",
    tint: "bg-accent-soft text-accent",
    to: "/home",
  },
  stretch: {
    id: "stretch",
    title: "Take 3 minutes to stretch",
    subtitle: "Any quick routine",
    icon: "Sparkles",
    tint: "bg-accent-soft text-accent",
    to: "/mobility",
  },
  energy_check: {
    id: "energy_check",
    title: "Quick energy read",
    subtitle: "1–5 on how today feels",
    icon: "Zap",
    tint: "bg-accent-warm-soft text-accent-warm",
    to: "/energy",
  },
};

// ─────────────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readState(): StoredState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed.date || !Array.isArray(parsed.missionIds)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeState(state: StoredState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* no-op */
  }
}

// ─────────────────────────────────────────────────────────────────────
// Selection — which 3 missions today?
// ─────────────────────────────────────────────────────────────────────

/**
 * Pick today's 3 missions based on what the user HASN'T logged yet today.
 * Heuristic priority:
 *   1. Always offer a check-in if no check-in today
 *   2. Sleep log if none yet today (morning relevance)
 *   3. Workout / Energy / Journal / Stretch / Food / Hydrate — round-robin
 *      to fill remaining slots, avoiding duplicates with #1-2
 *
 * If user has somehow logged everything, the priority falls back to
 * lighter actions (stretch, hydrate, energy check) so there are always
 * 3 things on the board.
 */
function selectMissionIds(inputs: LocalInput[], profile: OnboardingProfile | null): MissionId[] {
  const today = todayKey();
  const todayInputs = inputs.filter((i) => i.date === today);
  const hasCheckIn = todayInputs.some((i) => i.source === "check_in");
  const hasSleep = todayInputs.some((i) => i.source === "sleep_log");
  const hasWorkout = todayInputs.some((i) => i.source === "workout");
  const hasJournal = todayInputs.some((i) => i.source === "journal");
  const hasEnergy = todayInputs.some((i) => i.source === "energy_check_in");
  const hasFood = todayInputs.some((i) => i.source === "food_log");

  const picks: MissionId[] = [];
  const tryAdd = (id: MissionId) => {
    if (!picks.includes(id) && picks.length < 3) picks.push(id);
  };

  const plan = planFromProfile(profile);
  for (const id of plan.priority) {
    tryAdd(id);
  }

  // Priority 1 — emotional check-in always first if missing
  if (!hasCheckIn) tryAdd("check_in");
  // Priority 2 — sleep log
  if (!hasSleep) tryAdd("log_sleep");
  // Priority 3 — energy if no other "how do you feel" yet
  if (!hasEnergy && !hasCheckIn) tryAdd("energy_check");
  // Round out
  if (!hasWorkout) tryAdd("log_workout");
  if (!hasFood) tryAdd("log_food");
  if (!hasJournal) tryAdd("journal");
  tryAdd("stretch");
  tryAdd("hydrate");
  tryAdd("energy_check");
  // Failsafe — fill any remaining slots with the lighter catalog items
  while (picks.length < 3) {
    const remaining: MissionId[] = ["stretch", "hydrate", "energy_check", "journal"];
    const filler = remaining.find((id) => !picks.includes(id));
    if (filler) picks.push(filler);
    else break;
  }
  return picks.slice(0, 3);
}

// ─────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────

/** Get today's missions. Regenerates the list if last stored set is from
 *  a different date. Completion is the UNION of:
 *    - Explicit ticks via completeMission() (for stretch / hydrate / etc.)
 *    - Inferred completions from today's score_inputs (anything logged
 *      via the normal flows — check-in, sleep, workout, journal, food,
 *      energy — auto-ticks its mission without the user having to do
 *      anything extra).
 *  This way every existing submit handler "just works" — no edits to
 *  CheckIn.tsx / SleepLog.tsx / etc. needed. */
export function getTodayMissions(profile: OnboardingProfile | null = null): Mission[] {
  const today = todayKey();
  const key = profileKey(profile);
  let state = readState();
  if (!state || state.date !== today || state.profileKey !== key) {
    const inputs = readLocalInputs();
    state = {
      date: today,
      missionIds: selectMissionIds(inputs, profile),
      completed: [],
      profileKey: key,
    };
    writeState(state);
  }
  const inputs = readLocalInputs();
  const todayInputs = inputs.filter((i) => i.date === today);
  const inferredDone = new Set<MissionId>();
  for (const i of todayInputs) {
    const m = sourceToMission(i.source);
    if (m) inferredDone.add(m);
  }
  return state.missionIds.map((id) => ({
    ...personalizeMission(id, profile),
    completed: state!.completed.includes(id) || inferredDone.has(id),
  }));
}

/** Map a score-input source to the mission it satisfies. */
function sourceToMission(source: string): MissionId | null {
  switch (source) {
    case "check_in":
      return "check_in";
    case "sleep_log":
      return "log_sleep";
    case "workout":
      return "log_workout";
    case "food_log":
      return "log_food";
    case "journal":
      return "journal";
    case "energy_check_in":
      return "energy_check";
    default:
      return null;
  }
}

/** Mark a mission as completed. Returns the new mission list. */
export function completeMission(id: MissionId, profile: OnboardingProfile | null = null): Mission[] {
  const today = todayKey();
  const key = profileKey(profile);
  let state = readState();
  if (!state || state.date !== today || state.profileKey !== key) {
    state = {
      date: today,
      missionIds: selectMissionIds(readLocalInputs(), profile),
      completed: [],
      profileKey: key,
    };
  }
  if (!state.completed.includes(id)) {
    state.completed = [...state.completed, id];
    writeState(state);
  }
  return state.missionIds.map((mid) => ({
    ...personalizeMission(mid, profile),
    completed: state!.completed.includes(mid),
  }));
}

export function missionPlanLabel(profile: OnboardingProfile | null) {
  const plan = planFromProfile(profile);
  return plan.label;
}

function personalizeMission(id: MissionId, profile: OnboardingProfile | null): Omit<Mission, "completed"> {
  const plan = planFromProfile(profile);
  const override = plan.overrides[id];
  return {
    ...CATALOG[id],
    ...(override ?? {}),
  };
}

function planFromProfile(profile: OnboardingProfile | null): {
  label: string;
  priority: MissionId[];
  overrides: Partial<Record<MissionId, Partial<Omit<Mission, "id" | "completed">>>>;
} {
  const text = [
    ...(profile?.focusAreas ?? []),
    profile?.hardestLately ?? "",
    ...Object.values(profile?.followUps ?? {}),
    profile?.summary ?? "",
  ].join(" ").toLowerCase();

  if (matches(text, ["mood", "sad", "depressed", "anxiety", "stress", "overthinking", "mental_clarity", "confidence", "lonely"])) {
    return {
      label: "Built from what you told KAI",
      priority: ["check_in", "journal", "stretch"],
      overrides: {
        check_in: {
          title: "Name the feeling",
          subtitle: "No fixing yet — just clarity",
        },
        journal: {
          title: "Write the real sentence",
          subtitle: "What is actually weighing on you?",
        },
        stretch: {
          title: "3-minute nervous system reset",
          subtitle: "Move first, think second",
        },
      },
    };
  }

  if (matches(text, ["focus", "motivation", "procrastination", "school_pressure", "workload", "phone", "screens", "distracted"])) {
    return {
      label: "Built for focus today",
      priority: ["journal", "energy_check", "stretch"],
      overrides: {
        journal: {
          title: "Pick the first tiny rep",
          subtitle: "One task, ten minutes, no drama",
        },
        energy_check: {
          title: "Check your focus level",
          subtitle: "KAI needs the real read",
        },
        stretch: {
          title: "Phone-down reset",
          subtitle: "Three minutes before the next sprint",
        },
      },
    };
  }

  if (matches(text, ["better_sleep", "sleep", "tired", "before bed", "under 5", "5–6", "6-7"])) {
    return {
      label: "Built around recovery",
      priority: ["log_sleep", "hydrate", "journal"],
      overrides: {
        log_sleep: {
          title: "Log last night's sleep",
          subtitle: "So KAI stops guessing",
        },
        hydrate: {
          title: "Start recovery with water",
          subtitle: "Small body signal, big mood signal",
        },
        journal: {
          title: "Plan tonight's shutdown",
          subtitle: "One cue that protects sleep",
        },
      },
    };
  }

  if (matches(text, ["getting_stronger", "gym", "sport", "training", "better shape", "energy", "eating_better", "food"])) {
    return {
      label: "Built for body momentum",
      priority: ["log_workout", "log_food", "stretch"],
      overrides: {
        log_workout: {
          title: "Move for 10 minutes",
          subtitle: "Walk, lift, practice — count it",
        },
        log_food: {
          title: "Log one fuel choice",
          subtitle: "Energy data, not judgment",
        },
        stretch: {
          title: "Protect the machine",
          subtitle: "Mobility keeps momentum alive",
        },
      },
    };
  }

  return {
    label: "Built for a clean start",
    priority: [],
    overrides: {},
  };
}

function matches(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

/** How many of today's missions are done? Returns {done, total}. */
export function missionProgress(): { done: number; total: number } {
  const today = todayKey();
  const state = readState();
  if (!state || state.date !== today) return { done: 0, total: 3 };
  return { done: state.completed.length, total: state.missionIds.length };
}

/** Reset today's missions (rare — for testing / "start over"). */
export function resetTodayMissions(): Mission[] {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  return getTodayMissions();
}
