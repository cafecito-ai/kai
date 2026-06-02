// Local goals store — same browser-only fallback pattern as local-score.
// Goals on the Worker are managed via /api/goals (existing v0 route);
// this module lets the UI work offline + before the Worker is wired.
//
// Per CLAUDE.md v2 §5 + AGENT_PLAN T-019: identity-based, max 3 active.
// Status: active / paused / completed / abandoned — no judgment language.

import { appendLocalInput, readLocalInputs } from "./local-score";

const STORAGE_KEY = "kai_local_goals_v1";

export type GoalStatus = "active" | "paused" | "completed" | "abandoned";

export type LocalGoal = {
  id: string;
  title: string;
  category: "mind" | "body" | "growth";
  identityFrame: string;       // "You're becoming a person who…"
  createdAt: string;
  status: GoalStatus;
};

export const MAX_ACTIVE = 3;

// ─────────────────────────────────────────────────────────────────────
// Reads / writes
// ─────────────────────────────────────────────────────────────────────

export function readLocalGoals(): LocalGoal[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LocalGoal[]) : [];
  } catch {
    return [];
  }
}

function writeLocalGoals(goals: LocalGoal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {
    /* quota — fine */
  }
}

export function createLocalGoal(args: {
  title: string;
  category: LocalGoal["category"];
}): LocalGoal | { error: string } {
  const all = readLocalGoals();
  if (all.filter((g) => g.status === "active").length >= MAX_ACTIVE) {
    return {
      error: `Three active goals is the cap — finish one, pause one, or set a new one later.`,
    };
  }
  const goal: LocalGoal = {
    id: `g_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    title: args.title.trim(),
    category: args.category,
    identityFrame: identityFor(args.title, args.category),
    createdAt: new Date().toISOString(),
    status: "active",
  };
  writeLocalGoals([...all, goal]);
  return goal;
}

export function updateGoalStatus(id: string, status: GoalStatus) {
  const all = readLocalGoals();
  const idx = all.findIndex((g) => g.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], status };
  writeLocalGoals(all);
}

// Mark progress today — fires a score_input(goal_progress) so the Daily
// Score reflects today's effort.
export function markGoalProgressToday(goalId: string): void {
  const all = readLocalGoals();
  const goal = all.find((g) => g.id === goalId);
  if (!goal) return;
  appendLocalInput({
    date: new Date().toISOString().slice(0, 10),
    source: "goal_progress",
    value: { goalId, title: goal.title, delta: 1 },
  });
}

// ─────────────────────────────────────────────────────────────────────
// Streak compute
// ─────────────────────────────────────────────────────────────────────

export function goalStreak(goalId: string): number {
  const inputs = readLocalInputs().filter(
    (i) =>
      i.source === "goal_progress" &&
      (i.value as { goalId?: string }).goalId === goalId,
  );
  const dates = new Set(inputs.map((i) => i.date));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 60; i += 1) {
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak += 1;
    } else {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function markedToday(goalId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return readLocalInputs().some(
    (i) =>
      i.source === "goal_progress" &&
      i.date === today &&
      (i.value as { goalId?: string }).goalId === goalId,
  );
}

// Identity reframe at day 7 / 14 / 30 per AGENT_PLAN T-020.
export function identityMilestone(streak: number): string | null {
  if (streak >= 30)
    return "30 days. You're not 'trying' anymore — this is who you are.";
  if (streak >= 14) return "Two weeks. This is starting to feel like you.";
  if (streak >= 7)
    return "A week of showing up. The version of you that does this exists now.";
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Identity-frame helper
// ─────────────────────────────────────────────────────────────────────

// Identity-based reframe per James Clear (internal scaffolding only — never
// named). "You're becoming a person who…" beats "I want to do X." Tries to
// shape the title into a present-tense identity statement.
function identityFor(
  title: string,
  category: LocalGoal["category"],
): string {
  const t = title.toLowerCase().trim();
  if (/read|book|page/.test(t)) return "Someone who reads daily.";
  if (/run|jog|miles?|5k|10k/.test(t)) return "A runner.";
  if (/lift|gym|workout|train/.test(t)) return "Someone who shows up at the gym.";
  if (/journal|write/.test(t)) return "Someone who writes, even messy.";
  if (/sleep|bed/.test(t)) return "Someone who protects their sleep.";
  if (/meditat|breath|calm/.test(t)) return "Someone who finds their breath.";
  if (/water|hydrat/.test(t)) return "Someone who keeps themselves hydrated.";
  if (/guitar|piano|instrument|music/.test(t))
    return "A musician — at any skill level.";
  if (/draw|paint|sketch|art/.test(t)) return "An artist who keeps a practice.";
  // Generic category fallbacks.
  if (category === "body") return "Someone who takes their body seriously.";
  if (category === "growth")
    return "Someone who chooses growth over comfort.";
  return "Someone who shows up for themselves.";
}
