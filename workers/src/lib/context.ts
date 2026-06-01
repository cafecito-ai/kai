import { getRecentPatterns } from "./patterns-store";
import type { EngineId, Env } from "../types";

export type KaiTone = "warm" | "balanced" | "direct";

export type KaiContext = {
  userId: string;
  displayName: string;
  age: number | null;
  kaiName: string;
  kaiTone: KaiTone;
  primaryEngine: EngineId;
  intakeSummary: string | null;
  streakOverall: number;
  /** T-021 — abstracted observations from the pattern engine, capped at 5.
   *  Empty array if no patterns or the patterns table isn't migrated yet. */
  recentPatterns: string[];
  /** Rawz/8 — KAI memory. Optional client-supplied snapshot of what
   *  the user has been doing day-to-day. Lets the agent reference
   *  recent activity, today's score, hydration, missing logs. Undefined /
   *  null when the client doesn't ship one (older clients, server-
   *  rendered tests, voice-mode prompts that don't take a client ctx). */
  clientContext?: KaiClientContext | null;
};

/** Mirrors the frontend's KaiClientContext shape. We don't trust the
 *  client values for safety-critical things (this is just background
 *  context for tone, not authorization). */
export type KaiClientContext = {
  todayScore: {
    final: number | null;
    mental: number | null;
    sleep: number | null;
    mood: number | null;
  };
  recentActivity: { source: string; count: number }[];
  missingLogs: string[];
  activeGoals: { title: string; identityFrame: string; streakDays: number }[];
  activeChallenges: { title: string; daysHit: number; target: number; daysRemaining: number }[];
  hydration: { todayGlasses: number; todayTarget: number; goalHitsLast7Days: number };
  level: { current: number; label: string };
  latestCheckIn: {
    mood: number;
    moodLabel: string;
    mind: string;
    better: string;
    reflection: string;
    window: "morning" | "evening" | "other";
    createdAt: string;
  } | null;
};

const FALLBACK_CONTEXT: Omit<KaiContext, "userId"> = {
  displayName: "friend",
  age: null,
  kaiName: "Kai",
  kaiTone: "balanced",
  primaryEngine: "physical",
  intakeSummary: null,
  streakOverall: 0,
  recentPatterns: [],
  clientContext: null,
};

function normaliseTone(value: unknown): KaiTone {
  if (value === "warm" || value === "balanced" || value === "direct") return value;
  return "balanced";
}

function normaliseEngine(value: unknown): EngineId {
  if (value === "physical" || value === "potential" || value === "mental") return value;
  return "physical";
}

/**
 * Build the Kai context for a chat turn: user record from D1, intake summary
 * (KV cache first, D1 fallback), and overall streak from KV. All reads fail
 * open — a missing user record returns a sensible default so chat keeps
 * working through the no-AI-no-data path used in dev.
 */
export async function buildKaiContext(env: Env, userId: string): Promise<KaiContext> {
  const user = await env.DB
    .prepare("SELECT display_name, age, kai_name, kai_tone, primary_engine FROM users WHERE id = ?")
    .bind(userId)
    .first<{
      display_name: string | null;
      age: number | null;
      kai_name: string | null;
      kai_tone: string | null;
      primary_engine: string | null;
    }>()
    .catch(() => null);

  // Intake summary: try KV first (cheap), then D1 (authoritative).
  let intakeSummary: string | null = null;
  if (env.SESSIONS_KV) {
    try {
      intakeSummary = await env.SESSIONS_KV.get(`intake:${userId}`);
    } catch {
      // ignore
    }
  }
  if (!intakeSummary) {
    const row = await env.DB
      .prepare("SELECT summary FROM user_intake WHERE user_id = ?")
      .bind(userId)
      .first<{ summary: string | null }>()
      .catch(() => null);
    intakeSummary = row?.summary ?? null;
  }

  let streakOverall = 0;
  if (env.PROGRESS_KV) {
    try {
      const raw = await env.PROGRESS_KV.get(`streak:${userId}:overall`);
      if (raw) streakOverall = Number.parseInt(raw, 10) || 0;
    } catch {
      // ignore
    }
  }

  // T-021 — load any recent abstracted patterns. Fails open: if the
  // table doesn't exist yet (migration not run) or the query errors,
  // we just pass an empty array and the Mind prompt renders fine.
  let recentPatterns: string[] = [];
  try {
    const rows = await getRecentPatterns(env.DB, userId);
    recentPatterns = rows.map((r) => r.observation);
  } catch {
    recentPatterns = [];
  }

  return {
    userId,
    displayName: user?.display_name?.trim() || FALLBACK_CONTEXT.displayName,
    age: typeof user?.age === "number" ? user.age : FALLBACK_CONTEXT.age,
    kaiName: user?.kai_name?.trim() || FALLBACK_CONTEXT.kaiName,
    kaiTone: normaliseTone(user?.kai_tone),
    primaryEngine: normaliseEngine(user?.primary_engine),
    intakeSummary,
    streakOverall,
    recentPatterns,
    clientContext: null,
  };
}
