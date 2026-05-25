import { Hono } from "hono";
import { ensureUser } from "../lib/db";
import { createProgressEvent } from "../lib/progress";
import type { AppVariables, Env, EngineId } from "../types";

type LoopStepId = "check_in" | "body_action" | "mind_action" | "goal_action" | "reflection";
type LoopStepStatus = "locked" | "available" | "completed" | "skipped";
type DailyLoopStep = {
  id: LoopStepId;
  title: string;
  subtitle: string;
  status: LoopStepStatus;
  completedAt?: string | null;
  payload?: Record<string, unknown>;
};
type DailyLoop = {
  dateIso: string;
  score: number;
  streak: number;
  steps: DailyLoopStep[];
  recommendedGoalId?: string | null;
  kaiMessage: string;
};

const STEP_IDS: LoopStepId[] = ["check_in", "body_action", "mind_action", "goal_action", "reflection"];
const DEFAULT_STEPS: DailyLoopStep[] = [
  { id: "check_in", title: "Check in", subtitle: "How are you showing up right now?", status: "available" },
  { id: "body_action", title: "Body rep", subtitle: "Do one small thing your body will thank you for.", status: "locked" },
  { id: "mind_action", title: "Mind rep", subtitle: "Name it, reframe it, or breathe through it.", status: "locked" },
  { id: "goal_action", title: "Goal rep", subtitle: "Move one thing forward.", status: "locked" },
  { id: "reflection", title: "Close the loop", subtitle: "What changed, even a little?", status: "locked" }
];

export const loopRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

loopRoutes.get("/loop/today", async (c) => {
  const userId = c.get("userId");
  await ensureUser(c.env.DB, userId);
  const loop = await getOrCreateLoop(c.env.DB, userId);
  return c.json({ loop });
});

loopRoutes.post("/loop/step", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ stepId?: string; payload?: Record<string, unknown> }>().catch(() => null);
  const stepId = normalizeStepId(body?.stepId);
  if (!stepId) return c.json({ error: "Invalid stepId" }, 422);

  await ensureUser(c.env.DB, userId);
  const current = await getOrCreateLoop(c.env.DB, userId);
  const payload = sanitizePayload(body?.payload);
  const loop = completeStep(current, stepId, payload);
  await saveLoop(c.env.DB, userId, loop);
  await createProgressEvent(c.env, {
    userId,
    engine: engineForStep(stepId),
    eventType: `loop_${stepId}`,
    eventValue: valueForStep(stepId),
    payload: { ...(payload ?? {}), source: "loop" }
  });
  return c.json({ loop });
});

loopRoutes.post("/loop/sync", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ events?: Array<Record<string, unknown>> }>().catch(() => null);
  const events = Array.isArray(body?.events) ? body.events.slice(0, 20) : [];
  await ensureUser(c.env.DB, userId);
  for (const event of events) {
    const eventType = typeof event.eventType === "string" ? event.eventType : "";
    if (!eventType.startsWith("loop_")) continue;
    const engine = normalizeEngine(event.engine);
    if (!engine) continue;
    await createProgressEvent(c.env, {
      userId,
      engine,
      eventType,
      eventValue: typeof event.eventValue === "number" ? event.eventValue : 1,
      payload: sanitizePayload(event.payload)
    });
  }
  const loop = await getOrCreateLoop(c.env.DB, userId);
  return c.json({ loop });
});

async function getOrCreateLoop(db: D1Database, userId: string): Promise<DailyLoop> {
  const dateIso = todayIso();
  const existing = await db.prepare("SELECT * FROM daily_loops WHERE user_id = ? AND date_iso = ?").bind(userId, dateIso).first<Record<string, unknown>>();
  if (existing) return rowToLoop(existing);

  const recommendedGoalId = await getRecommendedGoalId(db, userId);
  const loop = createDefaultLoop(recommendedGoalId);
  await db
    .prepare("INSERT INTO daily_loops (id, user_id, date_iso, steps, score, streak, recommended_goal_id, kai_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), userId, loop.dateIso, JSON.stringify(loop.steps), loop.score, loop.streak, loop.recommendedGoalId, loop.kaiMessage)
    .run();
  return loop;
}

async function saveLoop(db: D1Database, userId: string, loop: DailyLoop) {
  await db
    .prepare("UPDATE daily_loops SET steps = ?, score = ?, recommended_goal_id = ?, kai_message = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND date_iso = ?")
    .bind(
      JSON.stringify(loop.steps),
      loop.score,
      loop.recommendedGoalId ?? null,
      loop.kaiMessage,
      loop.steps.every((step) => step.status === "completed") ? new Date().toISOString() : null,
      userId,
      loop.dateIso
    )
    .run();
}

async function getRecommendedGoalId(db: D1Database, userId: string): Promise<string | null> {
  const row = await db.prepare("SELECT id FROM goals WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1").bind(userId).first<{ id: string }>();
  return row?.id ?? null;
}

function createDefaultLoop(recommendedGoalId: string | null): DailyLoop {
  return {
    dateIso: todayIso(),
    score: 20,
    streak: 0,
    steps: DEFAULT_STEPS.map((step) => ({ ...step })),
    recommendedGoalId,
    kaiMessage: "Give the day a shape. Five tiny reps. Done is better than dramatic."
  };
}

function completeStep(loop: DailyLoop, stepId: LoopStepId, payload?: Record<string, unknown>): DailyLoop {
  const completedAt = new Date().toISOString();
  const steps = loop.steps.map((step) =>
    step.id === stepId ? { ...step, status: "completed" as const, completedAt, payload } : step
  );
  const unlocked = unlockNext(steps);
  return { ...loop, steps: unlocked, score: calculateScore(unlocked) };
}

function unlockNext(steps: DailyLoopStep[]): DailyLoopStep[] {
  let opened = false;
  return STEP_IDS.map((id) => {
    const step = steps.find((item) => item.id === id) ?? DEFAULT_STEPS.find((item) => item.id === id)!;
    if (step.status === "completed" || step.status === "skipped") return step;
    if (!opened) {
      opened = true;
      return { ...step, status: "available" };
    }
    return { ...step, status: "locked" };
  });
}

function rowToLoop(row: Record<string, unknown>): DailyLoop {
  const steps = parseSteps(row.steps);
  return {
    dateIso: String(row.date_iso ?? todayIso()),
    score: typeof row.score === "number" ? row.score : calculateScore(steps),
    streak: typeof row.streak === "number" ? row.streak : 0,
    steps: unlockNext(steps),
    recommendedGoalId: typeof row.recommended_goal_id === "string" ? row.recommended_goal_id : null,
    kaiMessage: typeof row.kai_message === "string" ? row.kai_message : "Give the day a shape."
  };
}

function parseSteps(value: unknown): DailyLoopStep[] {
  if (typeof value !== "string") return DEFAULT_STEPS.map((step) => ({ ...step }));
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_STEPS.map((step) => ({ ...step }));
    const steps = parsed.filter(isLoopStep);
    return steps.length ? steps : DEFAULT_STEPS.map((step) => ({ ...step }));
  } catch {
    return DEFAULT_STEPS.map((step) => ({ ...step }));
  }
}

function isLoopStep(value: unknown): value is DailyLoopStep {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return normalizeStepId(obj.id) !== null;
}

function calculateScore(steps: DailyLoopStep[]) {
  const complete = new Set(steps.filter((step) => step.status === "completed").map((step) => step.id));
  return Math.min(
    100,
    20 +
      (complete.has("check_in") ? 15 : 0) +
      (complete.has("body_action") ? 20 : 0) +
      (complete.has("mind_action") ? 20 : 0) +
      (complete.has("goal_action") ? 20 : 0) +
      (complete.has("reflection") ? 5 : 0)
  );
}

function sanitizePayload(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const safe: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (key.toLowerCase().includes("note") && typeof raw === "string") {
      safe.noteLength = raw.trim().length;
    } else if (["string", "number", "boolean"].includes(typeof raw) || raw == null) {
      safe[key] = raw;
    }
  }
  return safe;
}

function normalizeStepId(value: unknown): LoopStepId | null {
  return typeof value === "string" && STEP_IDS.includes(value as LoopStepId) ? (value as LoopStepId) : null;
}

function normalizeEngine(value: unknown): EngineId | "kai" | null {
  return value === "physical" || value === "potential" || value === "mental" || value === "kai" ? value : null;
}

function engineForStep(stepId: LoopStepId): EngineId | "kai" {
  if (stepId === "body_action") return "physical";
  if (stepId === "goal_action") return "potential";
  if (stepId === "reflection") return "kai";
  return "mental";
}

function valueForStep(stepId: LoopStepId) {
  if (stepId === "check_in") return 15;
  if (stepId === "reflection") return 5;
  return 20;
}

function todayIso(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
