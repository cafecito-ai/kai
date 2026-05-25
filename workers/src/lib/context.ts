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
  intakeDetails: string | null;
  streakOverall: number;
};

const FALLBACK_CONTEXT: Omit<KaiContext, "userId"> = {
  displayName: "friend",
  age: null,
  kaiName: "Kai",
  kaiTone: "balanced",
  primaryEngine: "physical",
  intakeSummary: null,
  intakeDetails: null,
  streakOverall: 0
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

  // Intake summary: try KV first (cheap), then D1 (authoritative). D1 also
  // carries structured onboarding answers that make Kai's replies less generic.
  let intakeSummary: string | null = null;
  let intakeDetails: string | null = null;
  if (env.SESSIONS_KV) {
    try {
      intakeSummary = await env.SESSIONS_KV.get(`intake:${userId}`);
    } catch {
      // ignore
    }
  }
  const intakeRow = await env.DB
    .prepare("SELECT summary, raw_responses FROM user_intake WHERE user_id = ?")
    .bind(userId)
    .first<{ summary: string | null; raw_responses: string | null }>()
    .catch(() => null);
  intakeSummary = intakeSummary || intakeRow?.summary || null;
  intakeDetails = formatIntakeDetails(intakeRow?.raw_responses);

  let streakOverall = 0;
  if (env.PROGRESS_KV) {
    try {
      const raw = await env.PROGRESS_KV.get(`streak:${userId}:overall`);
      if (raw) streakOverall = Number.parseInt(raw, 10) || 0;
    } catch {
      // ignore
    }
  }

  return {
    userId,
    displayName: user?.display_name?.trim() || FALLBACK_CONTEXT.displayName,
    age: typeof user?.age === "number" ? user.age : FALLBACK_CONTEXT.age,
    kaiName: user?.kai_name?.trim() || FALLBACK_CONTEXT.kaiName,
    kaiTone: normaliseTone(user?.kai_tone),
    primaryEngine: normaliseEngine(user?.primary_engine),
    intakeSummary,
    intakeDetails,
    streakOverall
  };
}

function formatIntakeDetails(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return Object.entries(parsed as Record<string, unknown>)
      .filter(([, value]) => typeof value === "string" && value.trim())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}: ${String(value).trim().replace(/\s+/g, " ").slice(0, 420)}`)
      .join("\n")
      .slice(0, 1800) || null;
  } catch {
    return null;
  }
}
