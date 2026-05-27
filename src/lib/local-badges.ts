// Achievement badges (Rawz/4).
//
// Per D-021 — every badge is MILESTONE-based, never comparative.
//   - "30 check-ins" ✓
//   - "Top 10% of users" ✗
//   - "Get 10 workouts in 7 days" ✗ (time-pressure = shame surface)
//
// Like XP, badge state is DERIVED from the input log (no separate
// counter). Earned-at timestamps and "last seen" are cached for the
// new-badge toast.

import { readLocalInputs, type LocalInput } from "./local-score";

export type BadgeCategory =
  | "consistency"
  | "wellness"
  | "strength"
  | "reflection"
  | "mindful"
  | "exploration";

export type Badge = {
  id: string;
  title: string;
  description: string;
  /** What the user needs to do — phrased positively, never "you haven't yet". */
  criterion: string;
  category: BadgeCategory;
  /** lucide-react icon name (looked up by the component) */
  icon: "Heart" | "Moon" | "Dumbbell" | "Sparkles" | "NotebookPen" | "GlassWater" | "ScanLine" | "Brain" | "Flame" | "Target" | "Sun" | "Map";
  tint: string;
};

export type BadgeProgress = {
  badge: Badge;
  /** 0..1 — how close they are. 1.0 = earned. */
  progress: number;
  /** Earned timestamp ISO string (null if not yet earned). */
  earnedAt: string | null;
  /** Current count toward the badge (for display). */
  current: number;
  /** Target count to earn it. */
  target: number;
};

// ─────────────────────────────────────────────────────────────────────
// Badge catalog
// ─────────────────────────────────────────────────────────────────────

export const BADGE_CATALOG: ReadonlyArray<Badge> = [
  // Consistency — showing up over time
  {
    id: "first-checkin",
    title: "First read",
    description: "Your first emotional check-in.",
    criterion: "Tap 'Check in' once.",
    category: "consistency",
    icon: "Heart",
    tint: "bg-accent-cool-soft text-accent-cool",
  },
  {
    id: "week-strong",
    title: "Week steady",
    description: "Seven check-ins logged.",
    criterion: "Check in seven times — any pace.",
    category: "consistency",
    icon: "Heart",
    tint: "bg-accent-cool-soft text-accent-cool",
  },
  {
    id: "month-in",
    title: "Thirty in",
    description: "Thirty check-ins logged.",
    criterion: "Check in thirty times. Stack them up.",
    category: "consistency",
    icon: "Heart",
    tint: "bg-accent-cool-soft text-accent-cool",
  },
  {
    id: "first-streak",
    title: "First streak",
    description: "Three days in a row showing up.",
    criterion: "Log something on three consecutive days.",
    category: "consistency",
    icon: "Flame",
    tint: "bg-accent-warm-soft text-accent-warm",
  },
  {
    id: "two-week-streak",
    title: "Two-week mark",
    description: "Fourteen days running.",
    criterion: "Show up fourteen days in a row.",
    category: "consistency",
    icon: "Flame",
    tint: "bg-accent-warm-soft text-accent-warm",
  },

  // Wellness — sleep, hydration
  {
    id: "first-sleep",
    title: "First sleep read",
    description: "Logged a night of sleep.",
    criterion: "Log one night of sleep.",
    category: "wellness",
    icon: "Moon",
    tint: "bg-accent-soft text-accent",
  },
  {
    id: "sleep-tracker",
    title: "Sleep tracker",
    description: "Thirty sleep logs.",
    criterion: "Log sleep thirty times.",
    category: "wellness",
    icon: "Moon",
    tint: "bg-accent-soft text-accent",
  },
  {
    id: "first-hydration-goal",
    title: "First glass hit",
    description: "Reached your daily hydration goal once.",
    criterion: "Hit your hydration goal on any day.",
    category: "wellness",
    icon: "GlassWater",
    tint: "bg-accent-soft text-accent",
  },
  {
    id: "hydration-habit",
    title: "Seven full days",
    description: "Hit your hydration goal seven days total.",
    criterion: "Reach your hydration target on seven days.",
    category: "wellness",
    icon: "GlassWater",
    tint: "bg-accent-soft text-accent",
  },

  // Strength — workouts
  {
    id: "first-workout",
    title: "First move",
    description: "Logged your first workout.",
    criterion: "Log one workout — any kind, even a walk.",
    category: "strength",
    icon: "Dumbbell",
    tint: "bg-accent-warm-soft text-accent-warm",
  },
  {
    id: "ten-workouts",
    title: "Ten in",
    description: "Ten workouts logged.",
    criterion: "Log ten workouts.",
    category: "strength",
    icon: "Dumbbell",
    tint: "bg-accent-warm-soft text-accent-warm",
  },
  {
    id: "thirty-workouts",
    title: "Real practice",
    description: "Thirty workouts.",
    criterion: "Log thirty workouts.",
    category: "strength",
    icon: "Dumbbell",
    tint: "bg-accent-warm-soft text-accent-warm",
  },

  // Reflection — journaling
  {
    id: "first-journal",
    title: "First page",
    description: "Wrote your first journal entry.",
    criterion: "Write one journal entry.",
    category: "reflection",
    icon: "NotebookPen",
    tint: "bg-accent-cool-soft text-accent-cool",
  },
  {
    id: "two-weeks-journal",
    title: "Two weeks of pages",
    description: "Fourteen journal entries.",
    criterion: "Write fourteen journal entries.",
    category: "reflection",
    icon: "NotebookPen",
    tint: "bg-accent-cool-soft text-accent-cool",
  },

  // Mindful — mobility, breath, energy
  {
    id: "first-stretch",
    title: "First stretch",
    description: "Finished one mobility routine.",
    criterion: "Complete one mobility routine.",
    category: "mindful",
    icon: "Sparkles",
    tint: "bg-accent-soft text-accent",
  },
  {
    id: "ten-stretches",
    title: "Movement practice",
    description: "Ten mobility sessions done.",
    criterion: "Finish ten mobility routines.",
    category: "mindful",
    icon: "Sparkles",
    tint: "bg-accent-soft text-accent",
  },

  // Exploration — trying things
  {
    id: "met-kai",
    title: "Met KAI",
    description: "Finished onboarding.",
    criterion: "Complete onboarding (you did this already).",
    category: "exploration",
    icon: "Sun",
    tint: "bg-success-soft text-success",
  },
  {
    id: "strengths",
    title: "Got personal",
    description: "Finished strengths discovery.",
    criterion: "Complete the 15-question strengths flow.",
    category: "exploration",
    icon: "Map",
    tint: "bg-success-soft text-success",
  },
  {
    id: "first-scan",
    title: "Body read",
    description: "Completed a body scan.",
    criterion: "Take your first 3-photo body scan.",
    category: "exploration",
    icon: "ScanLine",
    tint: "bg-success-soft text-success",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Progress computation
// ─────────────────────────────────────────────────────────────────────

function countBy(inputs: LocalInput[], source: LocalInput["source"]): number {
  return inputs.filter((i) => i.source === source).length;
}

function uniqueDates(inputs: LocalInput[]): Set<string> {
  return new Set(inputs.map((i) => i.date));
}

/** Longest consecutive day streak ending on or before today. */
function longestRecentStreak(inputs: LocalInput[]): number {
  const dates = uniqueDates(inputs);
  if (dates.size === 0) return 0;
  // Walk back from today; longest run we touched in the trailing window.
  let best = 0;
  let current = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      // If we haven't hit any day yet, keep walking; otherwise the streak
      // for THIS lookup (trailing) is broken.
      if (current > 0) break;
    }
  }
  return best;
}

/** Hydration-goal-hit days — proxy via the "kai_hydration_celebrated_v1"
 *  store isn't ideal because that's a single date. Instead we look at
 *  the energy_check_in inputs we write when goal is hit (note contains
 *  "hydration goal hit"). */
function hydrationGoalDays(inputs: LocalInput[]): number {
  const dates = new Set<string>();
  for (const i of inputs) {
    if (i.source !== "energy_check_in") continue;
    const v = i.value as { note?: string } | null;
    if (v?.note === "hydration goal hit") dates.add(i.date);
  }
  return dates.size;
}

/** Returns per-badge progress for every badge in the catalog. */
export function getBadgeProgress(): BadgeProgress[] {
  const inputs = readLocalInputs();
  const checkIns = countBy(inputs, "check_in");
  const sleepLogs = countBy(inputs, "sleep_log");
  const workouts = countBy(inputs, "workout");
  const journals = countBy(inputs, "journal");
  const streak = longestRecentStreak(inputs);
  const hydroDays = hydrationGoalDays(inputs);

  // Earned-at timestamps from localStorage. We compute when each badge
  // is first "earned" and stamp it the first time we observe progress=1.
  const earnedAt = readEarnedAtMap();

  function build(b: Badge, current: number, target: number): BadgeProgress {
    const progress = Math.min(1, current / target);
    const earned = progress >= 1;
    if (earned && !earnedAt[b.id]) {
      earnedAt[b.id] = new Date().toISOString();
    }
    return {
      badge: b,
      progress,
      current,
      target,
      earnedAt: earnedAt[b.id] ?? null,
    };
  }

  // Read other completion flags (strengths, body scan, onboarding) from
  // their respective localStorage keys.
  const onboardingDone =
    typeof localStorage !== "undefined" &&
    !!localStorage.getItem("kai-user-onboarding-completed");
  const strengthsDone =
    typeof localStorage !== "undefined" &&
    !!localStorage.getItem("kai_strengths_responses_v1") &&
    Object.keys(safeJsonParse(localStorage.getItem("kai_strengths_responses_v1")) || {}).length > 0;
  const scanDone =
    typeof localStorage !== "undefined" &&
    !!localStorage.getItem("kai_scans_v1") &&
    ((safeJsonParse(localStorage.getItem("kai_scans_v1")) as unknown[] | null)?.length ?? 0) > 0;

  const result: BadgeProgress[] = [];
  for (const b of BADGE_CATALOG) {
    switch (b.id) {
      case "first-checkin":     result.push(build(b, checkIns, 1)); break;
      case "week-strong":       result.push(build(b, checkIns, 7)); break;
      case "month-in":          result.push(build(b, checkIns, 30)); break;
      case "first-streak":      result.push(build(b, streak, 3)); break;
      case "two-week-streak":   result.push(build(b, streak, 14)); break;
      case "first-sleep":       result.push(build(b, sleepLogs, 1)); break;
      case "sleep-tracker":     result.push(build(b, sleepLogs, 30)); break;
      case "first-hydration-goal": result.push(build(b, hydroDays, 1)); break;
      case "hydration-habit":   result.push(build(b, hydroDays, 7)); break;
      case "first-workout":     result.push(build(b, workouts, 1)); break;
      case "ten-workouts":      result.push(build(b, workouts, 10)); break;
      case "thirty-workouts":   result.push(build(b, workouts, 30)); break;
      case "first-journal":     result.push(build(b, journals, 1)); break;
      case "two-weeks-journal": result.push(build(b, journals, 14)); break;
      case "first-stretch":     result.push(build(b, 0, 1)); break; // TODO: track mobility completions
      case "ten-stretches":     result.push(build(b, 0, 10)); break;
      case "met-kai":           result.push(build(b, onboardingDone ? 1 : 0, 1)); break;
      case "strengths":         result.push(build(b, strengthsDone ? 1 : 0, 1)); break;
      case "first-scan":        result.push(build(b, scanDone ? 1 : 0, 1)); break;
      default:                  result.push(build(b, 0, 1));
    }
  }

  // Persist any newly-stamped earned-at values.
  writeEarnedAtMap(earnedAt);
  return result;
}

// ─────────────────────────────────────────────────────────────────────
// New-badge toast detection (fires once per newly-earned badge)
// ─────────────────────────────────────────────────────────────────────

const SEEN_KEY = "kai_badges_seen_v1";

/** Returns badges that became earned since last call. Marks them as
 *  "seen" so they won't fire again. */
export function checkAndConsumeNewBadges(): BadgeProgress[] {
  const progress = getBadgeProgress();
  if (typeof localStorage === "undefined") return [];
  const seen = readSeenSet();
  const newlyEarned: BadgeProgress[] = [];
  for (const p of progress) {
    if (p.earnedAt && !seen.has(p.badge.id)) {
      newlyEarned.push(p);
      seen.add(p.badge.id);
    }
  }
  if (newlyEarned.length > 0) {
    writeSeenSet(seen);
  }
  return newlyEarned;
}

export function resetBadgeSeen(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(SEEN_KEY);
}

// ─────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────

const EARNED_AT_KEY = "kai_badges_earned_at_v1";

function readEarnedAtMap(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(EARNED_AT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeEarnedAtMap(map: Record<string, string>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(EARNED_AT_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function readSeenSet(): Set<string> {
  if (typeof localStorage === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeSeenSet(set: Set<string>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

function safeJsonParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Counts for the summary chip ("3 of 19 badges")
// ─────────────────────────────────────────────────────────────────────

export function badgeSummary(): { earned: number; total: number } {
  const all = getBadgeProgress();
  return {
    earned: all.filter((p) => p.earnedAt != null).length,
    total: all.length,
  };
}
