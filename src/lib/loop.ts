export type LoopStepId = "mental_check" | "body_signal" | "goal_rep" | "close_loop";

export interface LoopStep {
  id: LoopStepId;
  label: string;
  title: string;
  copy: string;
  route: string;
  engine: "mental" | "physical" | "kai";
  eventType: string;
  eventValue: number;
}

export interface DailyLoopState {
  dateIso: string;
  completed: LoopStepId[];
}

export const KAI_LOOP_STEPS: readonly LoopStep[] = [
  {
    id: "mental_check",
    label: "Mind",
    title: "Name what is loud.",
    copy: "Start with a check-in or guide lens so the day has context before advice.",
    route: "/mental?module=checkin",
    engine: "mental",
    eventType: "loop_mental_check",
    eventValue: 18
  },
  {
    id: "body_signal",
    label: "Body",
    title: "Add one body signal.",
    copy: "Log food, scan posture, stretch / move, or log sleep so Kai can read recovery.",
    route: "/health?module=food",
    engine: "physical",
    eventType: "loop_body_signal",
    eventValue: 18
  },
  {
    id: "goal_rep",
    label: "Goal",
    title: "Do one small rep.",
    copy: "Make the goal small enough to actually start today.",
    route: "/goal",
    engine: "mental",
    eventType: "loop_goal_rep",
    eventValue: 22
  },
  {
    id: "close_loop",
    label: "Close",
    title: "Close the loop.",
    copy: "Save what changed and choose the next best route.",
    route: "/progress",
    engine: "kai",
    eventType: "loop_closed",
    eventValue: 16
  }
];

export function todayIso(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function resetLoopIfNewDay(state: DailyLoopState | null | undefined, date = new Date()): DailyLoopState {
  const dateIso = todayIso(date);
  if (!state || state.dateIso !== dateIso) return { dateIso, completed: [] };
  return { dateIso, completed: uniqueSteps(state.completed) };
}

export function toggleLoopStep(state: DailyLoopState, stepId: LoopStepId): DailyLoopState {
  const completed = state.completed.includes(stepId)
    ? state.completed.filter((id) => id !== stepId)
    : [...state.completed, stepId];
  return { ...state, completed: uniqueSteps(completed) };
}

export function loopCompletion(state: DailyLoopState): number {
  return Math.round((uniqueSteps(state.completed).length / KAI_LOOP_STEPS.length) * 100);
}

function uniqueSteps(stepIds: LoopStepId[]): LoopStepId[] {
  const valid = new Set(KAI_LOOP_STEPS.map((step) => step.id));
  return Array.from(new Set(stepIds.filter((id) => valid.has(id))));
}
