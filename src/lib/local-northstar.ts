// North Star goal + AUTO goal-aligned progress (client design, 2026-06-06).
//
// THE big goal shown next to the Daily Score, derived from onboarding focus
// areas. Its ring fills AUTOMATICALLY from the daily things the user already
// logs (workouts, meals, sleep, hydration, journals, check-ins) — weighted by
// how much each action actually correlates with THIS goal. No extra taps.
//
//   "daily logs like workouts, meals, sleep ... automatically contribute
//    progress toward those personalized goals without extra taps. The stronger
//    the correlation between the daily action and the long-term goal, the more
//    progress is awarded."
//
// A workout moves a "build muscle" goal a lot and a "fix sleep" goal a little;
// a sleep log is the reverse. Generic actions with no correlation add nothing.

import { readLocalInputs, type LocalSource } from "./local-score";

const GOAL_KEY = "kai_northstar_v1";

// Weighted "aligned actions" to fill the ring — a weeks-to-months arc.
export const NORTH_STAR_TARGET = 40;

export type GoalTheme =
  | "strength"
  | "fitness"
  | "sleep"
  | "nutrition"
  | "mind"
  | "school"
  | "general";

export type NorthStar = {
  goal: string;
  theme: GoalTheme;
  source: "derived" | "custom";
  createdAt: string;
};

// Focus area → long-term goal phrase + theme.
const FOCUS_GOAL: Record<string, { goal: string; theme: GoalTheme }> = {
  getting_stronger: { goal: "Get genuinely stronger", theme: "strength" },
  eating_better: { goal: "Build eating habits that actually last", theme: "nutrition" },
  better_sleep: { goal: "Fix my sleep for good", theme: "sleep" },
  energy: { goal: "Have real energy every day", theme: "fitness" },
  body_image: { goal: "Feel at home in my body", theme: "mind" },
  confidence: { goal: "Build real, steady confidence", theme: "mind" },
  anxiety: { goal: "Get a handle on my anxiety", theme: "mind" },
  managing_stress: { goal: "Keep stress from running me", theme: "mind" },
  mood: { goal: "Feel steadier day to day", theme: "mind" },
  mental_clarity: { goal: "Think clearer, feel lighter", theme: "mind" },
  motivation: { goal: "Find drive that sticks", theme: "mind" },
  focus: { goal: "Lock in my focus", theme: "school" },
  finding_purpose: { goal: "Figure out what I'm really about", theme: "mind" },
  school_pressure: { goal: "Stay on top of school without burning out", theme: "school" },
  social_life: { goal: "Build a social life that fills me up", theme: "mind" },
  friendships: { goal: "Grow friendships that matter", theme: "mind" },
  family_stuff: { goal: "Find more peace at home", theme: "mind" },
};

const FOCUS_PRIORITY: string[] = [
  "getting_stronger", "finding_purpose", "confidence", "school_pressure",
  "anxiety", "better_sleep", "eating_better", "energy", "friendships",
  "social_life", "motivation", "focus", "mood", "managing_stress",
  "mental_clarity", "body_image", "family_stuff",
];

// How much each logged action correlates with each goal theme (0–1). Only
// sources with weight > 0 contribute. This is the "correlation" the client
// asked for: aligned action earns progress, unrelated action earns ~none.
const RELEVANCE: Record<GoalTheme, Partial<Record<LocalSource, number>>> = {
  strength:  { workout: 1.0, food_log: 0.6, sleep_log: 0.4, hydration_goal_hit: 0.3, energy_check_in: 0.2 },
  fitness:   { workout: 1.0, energy_check_in: 0.4, sleep_log: 0.4, food_log: 0.4, hydration_goal_hit: 0.3 },
  sleep:     { sleep_log: 1.0, energy_check_in: 0.4, check_in: 0.3, workout: 0.2, hydration_goal_hit: 0.2 },
  nutrition: { food_log: 1.0, hydration_goal_hit: 0.5, workout: 0.3, sleep_log: 0.2 },
  mind:      { journal: 1.0, check_in: 0.8, goal_progress: 0.6, workout: 0.4, sleep_log: 0.4, energy_check_in: 0.3 },
  school:    { goal_progress: 0.8, journal: 0.5, sleep_log: 0.5, check_in: 0.4, energy_check_in: 0.4 },
  general:   { check_in: 0.5, journal: 0.5, food_log: 0.5, workout: 0.5, sleep_log: 0.5, energy_check_in: 0.4, goal_progress: 0.5, hydration_goal_hit: 0.4 },
};

// Friendly labels for the "what builds this" links on the goal card.
const SOURCE_ACTION: Partial<Record<LocalSource, { label: string; to: string }>> = {
  workout: { label: "Log a workout", to: "/workout/log" },
  sleep_log: { label: "Log sleep", to: "/sleep/log" },
  food_log: { label: "Log a meal", to: "/food/log" },
  journal: { label: "Write a journal", to: "/journal" },
  check_in: { label: "Check in", to: "/check-in" },
  energy_check_in: { label: "Energy read", to: "/energy" },
};

export function deriveNorthStar(focusAreas: string[]): { goal: string; theme: GoalTheme } {
  for (const id of FOCUS_PRIORITY) {
    if (focusAreas.includes(id) && FOCUS_GOAL[id]) return FOCUS_GOAL[id];
  }
  for (const id of focusAreas) if (FOCUS_GOAL[id]) return FOCUS_GOAL[id];
  return { goal: "Become who I'm working toward", theme: "general" };
}

/** Classify a free-text goal into a theme (for custom goals). */
export function classifyTheme(text: string): GoalTheme {
  const t = text.toLowerCase();
  if (/\b(muscle|stronger|strength|gym|lift|bulk|gains|jacked|build)\b/.test(t)) return "strength";
  if (/\b(box|boxing|run|running|sport|soccer|basketball|football|cardio|fit|fitness|athlet|team|tryout|train)\b/.test(t)) return "fitness";
  if (/\b(sleep|rest|insomnia|tired|bed)\b/.test(t)) return "sleep";
  if (/\b(eat|eating|food|diet|nutrition|meal|weight|leaner)\b/.test(t)) return "nutrition";
  if (/\b(school|grade|gpa|study|exam|college|class|homework)\b/.test(t)) return "school";
  if (/\b(confiden|anx|stress|mood|happy|purpose|focus|motivat|friend|social|girl|relationship|mental|calm|depress|self)\b/.test(t)) return "mind";
  return "general";
}

function read(): NorthStar | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<NorthStar>;
    if (!p || typeof p.goal !== "string" || !p.goal.trim()) return null;
    const goal = p.goal.trim().slice(0, 80);
    return {
      goal,
      theme: (p.theme as GoalTheme) || classifyTheme(goal),
      source: p.source === "custom" ? "custom" : "derived",
      createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function getNorthStar(): NorthStar | null {
  return read();
}

function write(ns: NorthStar): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(GOAL_KEY, JSON.stringify(ns));
    window.dispatchEvent(new Event("kai:state-changed"));
  } catch {
    /* ignore */
  }
}

export function setNorthStar(goal: string, source: NorthStar["source"], theme?: GoalTheme): void {
  const clean = goal.trim().slice(0, 80);
  if (!clean) return;
  write({ goal: clean, theme: theme ?? classifyTheme(clean), source, createdAt: new Date().toISOString() });
}

/** Seed from onboarding focus areas, unless the teen already set a custom goal. */
export function seedNorthStarFromFocus(focusAreas: string[]): void {
  const existing = read();
  if (existing && existing.source === "custom") return;
  const { goal, theme } = deriveNorthStar(focusAreas);
  setNorthStar(goal, "derived", theme);
}

/** Ring fill 0–100, earned automatically from correlated daily logs. */
export function northStarProgress(): { pct: number; points: number; target: number } {
  const ns = read();
  if (!ns) return { pct: 0, points: 0, target: NORTH_STAR_TARGET };
  const weights = RELEVANCE[ns.theme] ?? RELEVANCE.general;
  let points = 0;
  for (const input of readLocalInputs()) {
    points += weights[input.source] ?? 0;
  }
  const pct = Math.max(0, Math.min(100, Math.round((points / NORTH_STAR_TARGET) * 100)));
  return { pct, points: Math.round(points), target: NORTH_STAR_TARGET };
}

/** The aligned daily actions that move THIS goal — for the "what builds this"
 *  links on the goal card. Returns the top few by correlation. */
export function whatBuildsGoal(): Array<{ label: string; to: string }> {
  const ns = read();
  const weights = RELEVANCE[ns?.theme ?? "general"] ?? RELEVANCE.general;
  return (Object.entries(weights) as Array<[LocalSource, number]>)
    .filter(([src, w]) => w >= 0.5 && SOURCE_ACTION[src])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([src]) => SOURCE_ACTION[src]!);
}
