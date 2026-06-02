// North Star goal (client request, 2026-06-02).
//
// A single long-term goal shown next to the Daily Score on Home. Unlike the
// daily score (resets each day) or the challenges (weeks), the North Star is
// THE big one — the weeks-to-months thing the teen is really working toward.
// Its ring fills from cumulative engagement (total XP), so "the more you do,
// the more it fills." Reaching the fill takes ~2-3 months of showing up, which
// is the point: it's the long game.
//
// Source: derived from the focus areas they pick in onboarding (a real
// onboarding answer), and editable on Home so it can become truly theirs.

import { getCurrentLevel, thresholdForLevel } from "./local-xp";

const STORAGE_KEY = "kai_northstar_v1";

// Full fill = the Level 10 threshold (~2-3 months of consistent engagement per
// the XP tuning). Sized so the ring is a genuine long-term arc, not a quick win.
export const NORTH_STAR_TARGET_XP = thresholdForLevel(10); // 2250

export type NorthStar = {
  goal: string;
  /** "derived" = seeded from onboarding focus areas; "custom" = the teen set it. */
  source: "derived" | "custom";
  createdAt: string;
};

// Focus area → a long-term goal phrased as something to become / build. Keep
// these aspirational and weeks-to-months in scope, never a daily task.
const GOAL_BY_FOCUS: Record<string, string> = {
  getting_stronger: "Get genuinely stronger",
  eating_better: "Build eating habits that actually last",
  better_sleep: "Fix my sleep for good",
  energy: "Have real energy every day",
  body_image: "Feel at home in my body",
  confidence: "Build real, steady confidence",
  anxiety: "Get a handle on my anxiety",
  managing_stress: "Keep stress from running me",
  mood: "Feel steadier day to day",
  mental_clarity: "Think clearer, feel lighter",
  motivation: "Find drive that sticks",
  focus: "Lock in my focus",
  finding_purpose: "Figure out what I'm really about",
  school_pressure: "Stay on top of school without burning out",
  social_life: "Build a social life that fills me up",
  friendships: "Grow friendships that matter",
  family_stuff: "Find more peace at home",
};

// Priority when several focus areas are picked — lead with the most concrete,
// motivating long-term goal.
const FOCUS_PRIORITY: string[] = [
  "getting_stronger",
  "finding_purpose",
  "confidence",
  "school_pressure",
  "anxiety",
  "better_sleep",
  "eating_better",
  "energy",
  "friendships",
  "social_life",
  "motivation",
  "focus",
  "mood",
  "managing_stress",
  "mental_clarity",
  "body_image",
  "family_stuff",
];

/** Turn the picked focus areas into one long-term goal phrase. */
export function deriveNorthStar(focusAreas: string[]): string {
  for (const id of FOCUS_PRIORITY) {
    if (focusAreas.includes(id) && GOAL_BY_FOCUS[id]) return GOAL_BY_FOCUS[id];
  }
  // Any focus area we have a phrase for, else a warm default.
  for (const id of focusAreas) {
    if (GOAL_BY_FOCUS[id]) return GOAL_BY_FOCUS[id];
  }
  return "Become who I'm working toward";
}

export function getNorthStar(): NorthStar | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<NorthStar>;
    if (!parsed || typeof parsed.goal !== "string" || !parsed.goal.trim()) return null;
    return {
      goal: parsed.goal.trim().slice(0, 80),
      source: parsed.source === "custom" ? "custom" : "derived",
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function setNorthStar(goal: string, source: NorthStar["source"]): void {
  if (typeof localStorage === "undefined") return;
  const clean = goal.trim().slice(0, 80);
  if (!clean) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ goal: clean, source, createdAt: new Date().toISOString() }),
    );
    window.dispatchEvent(new Event("kai:state-changed"));
  } catch {
    /* ignore */
  }
}

/** Seed the North Star from onboarding focus areas, but never overwrite a goal
 *  the teen set themselves. */
export function seedNorthStarFromFocus(focusAreas: string[]): void {
  const existing = getNorthStar();
  if (existing && existing.source === "custom") return;
  setNorthStar(deriveNorthStar(focusAreas), "derived");
}

/** Cumulative progress toward the North Star, 0–100. "The more you do, the more
 *  it fills." Driven by total XP (every logged action), so it only ever grows. */
export function northStarProgress(): { pct: number; totalXp: number; target: number } {
  const totalXp = getCurrentLevel().totalXp;
  const pct = Math.max(0, Math.min(100, Math.round((totalXp / NORTH_STAR_TARGET_XP) * 100)));
  return { pct, totalXp, target: NORTH_STAR_TARGET_XP };
}
