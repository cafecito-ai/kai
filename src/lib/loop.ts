import type { DailyLoop, DailyLoopStep, Goal, LoopStepId, LoopStepStatus } from "./types";

const STEP_IDS: LoopStepId[] = ["check_in", "body_action", "mind_action", "goal_action", "reflection"];
const STEP_STATUSES: LoopStepStatus[] = ["locked", "available", "completed", "skipped"];

export const DEFAULT_LOOP_STEPS: DailyLoopStep[] = [
  {
    id: "check_in",
    title: "Check in",
    subtitle: "How are you showing up right now?",
    status: "available"
  },
  {
    id: "body_action",
    title: "Body rep",
    subtitle: "Do one small thing your body will thank you for.",
    status: "locked"
  },
  {
    id: "mind_action",
    title: "Mind rep",
    subtitle: "Name it, reframe it, or breathe through it.",
    status: "locked"
  },
  {
    id: "goal_action",
    title: "Goal rep",
    subtitle: "Move one thing forward.",
    status: "locked"
  },
  {
    id: "reflection",
    title: "Close the loop",
    subtitle: "What changed, even a little?",
    status: "locked"
  }
];

export function todayIso(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function createDefaultLoop(goals: Goal[]): DailyLoop {
  const recommendedGoal = getRecommendedGoal(goals);
  return {
    dateIso: todayIso(),
    score: calculateLoopScore(DEFAULT_LOOP_STEPS),
    streak: 0,
    steps: DEFAULT_LOOP_STEPS.map((step) => ({ ...step })),
    recommendedGoalId: recommendedGoal?.id ?? null,
    kaiMessage: "Give the day a shape. Five tiny reps. Done is better than dramatic."
  };
}

export function normalizeLoop(value: unknown): DailyLoop | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const rawSteps = Array.isArray(obj.steps) ? obj.steps : [];
  const steps = rawSteps.map(normalizeLoopStep).filter((step): step is DailyLoopStep => Boolean(step));
  if (!stringValue(obj.dateIso) && !stringValue(obj.date_iso)) return null;
  if (steps.length === 0) return null;
  const normalizedSteps = reconcileSteps(steps);
  return {
    dateIso: stringValue(obj.dateIso) || stringValue(obj.date_iso),
    score: numberOrDefault(obj.score, calculateLoopScore(normalizedSteps)),
    streak: numberOrDefault(obj.streak, 0),
    steps: normalizedSteps,
    recommendedGoalId: nullableString(obj.recommendedGoalId ?? obj.recommended_goal_id),
    kaiMessage: stringValue(obj.kaiMessage) || stringValue(obj.kai_message) || "Give the day a shape."
  };
}

export function normalizeLoopStep(value: unknown): DailyLoopStep | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const id = normalizeStepId(obj.id);
  if (!id) return null;
  return {
    id,
    title: stringValue(obj.title) || defaultStep(id).title,
    subtitle: stringValue(obj.subtitle) || defaultStep(id).subtitle,
    status: normalizeStepStatus(obj.status),
    completedAt: nullableString(obj.completedAt ?? obj.completed_at),
    payload: recordOrUndefined(obj.payload)
  };
}

export function calculateLoopScore(steps: DailyLoopStep[]): number {
  const completed = new Set(steps.filter((step) => step.status === "completed").map((step) => step.id));
  let score = 20;
  if (completed.has("check_in")) score += 15;
  if (completed.has("body_action")) score += 20;
  if (completed.has("mind_action")) score += 20;
  if (completed.has("goal_action")) score += 20;
  if (completed.has("reflection")) score += 5;
  return Math.min(100, score);
}

export function getNextAvailableStep(steps: DailyLoopStep[]): DailyLoopStep | null {
  return steps.find((step) => step.status === "available") ?? null;
}

export function completeLoopStep(
  loop: DailyLoop,
  stepId: LoopStepId,
  payload?: Record<string, unknown>
): DailyLoop {
  const completedAt = new Date().toISOString();
  const nextSteps = loop.steps.map((step) =>
    step.id === stepId
      ? { ...step, status: "completed" as const, completedAt, payload: sanitizeLoopPayload(payload) }
      : step
  );
  return finalizeLoop({ ...loop, steps: unlockNext(nextSteps) });
}

export function skipLoopStep(loop: DailyLoop, stepId: LoopStepId): DailyLoop {
  const completedAt = new Date().toISOString();
  const nextSteps = loop.steps.map((step) =>
    step.id === stepId ? { ...step, status: "skipped" as const, completedAt } : step
  );
  return finalizeLoop({ ...loop, steps: unlockNext(nextSteps) });
}

export function getRecommendedGoal(goals: Goal[]): Goal | null {
  return goals.find((goal) => goal.status === "active") ?? null;
}

export function sanitizeLoopPayload(payload?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!payload) return undefined;
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (key.toLowerCase().includes("note") && typeof value === "string") {
      safe.noteLength = value.trim().length;
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value == null) {
      safe[key] = value;
    }
  }
  return safe;
}

function finalizeLoop(loop: DailyLoop): DailyLoop {
  return { ...loop, score: calculateLoopScore(loop.steps) };
}

function unlockNext(steps: DailyLoopStep[]): DailyLoopStep[] {
  let unlocked = false;
  return STEP_IDS.map((id) => {
    const existing = steps.find((step) => step.id === id) ?? defaultStep(id);
    if (existing.status === "completed" || existing.status === "skipped") return existing;
    if (!unlocked) {
      unlocked = true;
      return { ...existing, status: "available" };
    }
    return { ...existing, status: "locked" };
  });
}

function reconcileSteps(steps: DailyLoopStep[]): DailyLoopStep[] {
  const merged = STEP_IDS.map((id) => steps.find((step) => step.id === id) ?? defaultStep(id));
  return unlockNext(merged);
}

function defaultStep(id: LoopStepId): DailyLoopStep {
  return { ...DEFAULT_LOOP_STEPS.find((step) => step.id === id)! };
}

function normalizeStepId(value: unknown): LoopStepId | null {
  if (typeof value !== "string") return null;
  return STEP_IDS.includes(value as LoopStepId) ? (value as LoopStepId) : null;
}

function normalizeStepStatus(value: unknown): LoopStepStatus {
  if (typeof value !== "string") return "locked";
  return STEP_STATUSES.includes(value as LoopStepStatus) ? (value as LoopStepStatus) : "locked";
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value: unknown): string | null {
  if (value == null) return null;
  const normalized = stringValue(value);
  return normalized || null;
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function recordOrUndefined(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}
