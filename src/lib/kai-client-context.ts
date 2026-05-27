// Build the "client context" payload we send to the backend on every
// chat message. This is what gives KAI a sense of what the user has
// been DOING — not just who they are from onboarding.
//
// Why client-side: most of this data lives in localStorage (the local-
// first architecture). The backend has user profile + daily score in
// D1, but doesn't have the day-by-day activity log or hydration data.
// Cleanest move is to roll it up here and ship the summary with each
// chat turn.
//
// Privacy + safety:
//   - We send AGGREGATES + COUNTS, not raw content. KAI never sees the
//     literal text of your journal entries — just "you've journaled 3
//     times this week."
//   - Total payload capped under ~2KB to keep prompts fast.

import { getActiveChallenges } from "./local-challenges";
import { getCurrentLevel, labelForLevel } from "./local-xp";
import { getRecentHydration, getTodayHydration } from "./local-hydration";
import { readLocalGoals, goalStreak } from "./local-goals";
import {
  computeLocalScore,
  readLocalInputs,
  type LocalSource,
} from "./local-score";

export type KaiClientContext = {
  /** Today's daily score breakdown (0-100 per pillar). */
  todayScore: {
    final: number | null;
    mental: number | null;
    sleep: number | null;
    mood: number | null;
  };
  /** Last 7 days: how many of each kind of input got logged. */
  recentActivity: { source: LocalSource; count: number }[];
  /** Days since user last logged each "expected" daily thing. */
  missingLogs: string[];
  /** Active goals — title + identity framing. */
  activeGoals: { title: string; identityFrame: string; streakDays: number }[];
  /** Active challenges — progress. */
  activeChallenges: { title: string; daysHit: number; target: number; daysRemaining: number }[];
  /** Hydration snapshot — today's progress + how often goal got hit lately. */
  hydration: {
    todayGlasses: number;
    todayTarget: number;
    goalHitsLast7Days: number;
  };
  /** Where they are in the XP system. */
  level: { current: number; label: string };
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function buildKaiClientContext(now: Date = new Date()): KaiClientContext {
  const allInputs = readLocalInputs();
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS);
  const sevenDayCutoff = sevenDaysAgo.toISOString().slice(0, 10);
  const recentInputs = allInputs.filter((i) => i.date >= sevenDayCutoff);

  // Activity counts — group by source so we can say "3 check-ins, 1
  // workout" instead of dumping the raw log.
  const countMap = new Map<LocalSource, number>();
  for (const i of recentInputs) {
    countMap.set(i.source, (countMap.get(i.source) ?? 0) + 1);
  }
  const recentActivity: { source: LocalSource; count: number }[] = [];
  for (const [source, count] of countMap.entries()) {
    recentActivity.push({ source, count });
  }
  recentActivity.sort((a, b) => b.count - a.count);

  // Missing-log detection — KAI's most valuable nudges come from
  // noticing what HASN'T happened. Each pillar gets a "last seen" check.
  const missingLogs: string[] = [];
  const sinceLastByType: Record<string, number | null> = {
    check_in: daysSinceLast(allInputs, "check_in", now),
    sleep_log: daysSinceLast(allInputs, "sleep_log", now),
    journal: daysSinceLast(allInputs, "journal", now),
  };
  if ((sinceLastByType.check_in ?? 99) >= 2) {
    missingLogs.push(`no check-in for ${sinceLastByType.check_in} days`);
  }
  if ((sinceLastByType.sleep_log ?? 99) >= 3) {
    missingLogs.push(`no sleep log for ${sinceLastByType.sleep_log} days`);
  }
  if ((sinceLastByType.journal ?? 99) >= 5) {
    missingLogs.push(`no journal entry for ${sinceLastByType.journal} days`);
  }

  // Today's score breakdown — gives KAI a number to reference if useful
  // ("your score is 38 today — let's not stack pressure on top").
  const todayScore = computeLocalScore(allInputs);

  // Active goals — only ACTIVE status. Cap to 3 to keep payload small;
  // teens can have max 3 anyway per spec.
  const activeGoals = readLocalGoals()
    .filter((g) => g.status === "active")
    .slice(0, 3)
    .map((g) => ({
      title: g.title,
      identityFrame: g.identityFrame,
      streakDays: goalStreak(g.id),
    }));

  // Active challenges — Rawz/6 data.
  const activeChallenges = getActiveChallenges()
    .filter((p) => !p.completed)
    .slice(0, 3)
    .map((p) => ({
      title: p.challenge.title,
      daysHit: p.daysHit,
      target: p.challenge.targetDays,
      daysRemaining: p.daysRemaining,
    }));

  // Hydration: today's number + how many days in the last 7 the user
  // actually crossed their daily target. The "didn't hit your water
  // goal much this week" nudge is the canonical use case the user
  // asked for ("kai should be able to say up your goal to 12").
  const todayHydration = getTodayHydration(now);
  const recentHydration = getRecentHydration(7, now);
  const goalHitsLast7Days = recentHydration.filter(
    (e) => e.glasses >= e.target,
  ).length;

  const levelInfo = getCurrentLevel();

  return {
    todayScore: {
      final: todayScore.final,
      mental: todayScore.mental,
      sleep: todayScore.sleep,
      mood: todayScore.mood,
    },
    recentActivity,
    missingLogs,
    activeGoals,
    activeChallenges,
    hydration: {
      todayGlasses: todayHydration.glasses,
      todayTarget: todayHydration.target,
      goalHitsLast7Days,
    },
    level: {
      current: levelInfo.level,
      label: labelForLevel(levelInfo.level),
    },
  };
}

/** Days since the user last logged the given source. Returns null if
 *  they've never logged it. Returns 0 if logged today. */
function daysSinceLast(
  inputs: ReturnType<typeof readLocalInputs>,
  source: LocalSource,
  now: Date,
): number | null {
  const filtered = inputs.filter((i) => i.source === source);
  if (filtered.length === 0) return null;
  const latest = filtered.reduce((a, b) => (a.date > b.date ? a : b));
  const latestMs = new Date(latest.date).getTime();
  const todayMs = new Date(now.toISOString().slice(0, 10)).getTime();
  return Math.floor((todayMs - latestMs) / (24 * 60 * 60 * 1000));
}
