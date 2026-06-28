// The conversation engine — a pure, UI-agnostic state machine. No React, no DOM.
// VoiceConversation and the typed fallback are thin views over this, which is
// what lets the cinematic plan-gen and guided-tour follow-up PRs drop in cleanly.
//
// Hybrid turns: the OPENING of each step is scripted (instant, offline-safe);
// the warm "understanding" reply comes from the backend. The reducer prefers the
// backend line and falls back to the next scripted line when it's empty — so the
// conversation never stalls.

import { mergeDelta } from "./profileBuilder";
import { SCRIPT_LENGTH, scriptedLineFor, stepIdAt } from "./conversationScript";
import { EMPTY_DRAFT, type ConversationPhase, type ProfileDelta, type ProfileDraft, type Turn } from "./types";

/** Hard cap so a rambling session always wraps with whatever we have. */
export const MAX_TURNS = 10;

export type EngineStatus = "idle" | "kai-thinking" | "awaiting-user" | "safety-hold";

export interface ConversationState {
  phase: ConversationPhase;
  stepIndex: number;
  transcript: Turn[];
  draft: ProfileDraft;
  status: EngineStatus;
  safety: { triggered: boolean; response: string } | null;
  inputMode: "voice" | "typed";
  turnCount: number;
  /** True once we have enough to build the system — the hook moves to "plan". */
  readyForPlan: boolean;
}

export type EngineAction =
  | { type: "begin" }
  | { type: "setInputMode"; mode: "voice" | "typed" }
  | { type: "userMessage"; text: string; ts: number }
  | { type: "kaiResponse"; kaiLine: string; delta?: ProfileDelta; done?: boolean; ts: number }
  | { type: "safety"; response: string; ts: number }
  | { type: "enterPlan" }
  | { type: "enterComplete" };

export function createInitialState(inputMode: "voice" | "typed" = "voice"): ConversationState {
  return {
    phase: "welcome",
    stepIndex: 0,
    transcript: [],
    draft: { ...EMPTY_DRAFT, focusAreas: [] },
    status: "idle",
    safety: null,
    inputMode,
    turnCount: 0,
    readyForPlan: false,
  };
}

/** The required floor: enough to build a real system. Name + something they're
 *  here for + why it matters. Everything else is enriching but optional. */
export function isComplete(draft: ProfileDraft): boolean {
  const hasName = !!draft.firstName.trim();
  const hasGoal = !!draft.primaryGoal.trim() || draft.focusAreas.length > 0;
  const hasWhy = !!draft.motivation.trim() || !!draft.emotionalMotivation.trim() || !!draft.originStory.trim();
  return hasName && hasGoal && hasWhy;
}

function kaiTurn(text: string, ts: number): Turn {
  return { role: "kai", text, ts };
}

export function reducer(state: ConversationState, action: EngineAction): ConversationState {
  switch (action.type) {
    case "setInputMode":
      return { ...state, inputMode: action.mode };

    case "begin": {
      if (state.phase !== "welcome") return state;
      const line = scriptedLineFor(0, state.draft);
      return {
        ...state,
        phase: "conversation",
        status: "awaiting-user",
        transcript: [kaiTurn(line, Date.now())],
      };
    }

    case "userMessage": {
      if (state.status === "safety-hold") return state;
      return {
        ...state,
        status: "kai-thinking",
        turnCount: state.turnCount + 1,
        transcript: [...state.transcript, { role: "user", text: action.text, ts: action.ts }],
      };
    }

    case "kaiResponse": {
      const draft = mergeDelta(state.draft, action.delta);
      const nextStep = Math.min(state.stepIndex + 1, SCRIPT_LENGTH - 1);
      // Prefer the backend's warm line; fall back to the scripted opener so the
      // conversation never stalls on a model failure/timeout.
      const line = action.kaiLine?.trim() || scriptedLineFor(nextStep, draft);
      const complete = isComplete(draft);
      const exhausted = state.stepIndex + 1 >= SCRIPT_LENGTH || state.turnCount >= MAX_TURNS;
      const ready = complete && (action.done === true || exhausted);
      return {
        ...state,
        draft,
        stepIndex: nextStep,
        status: "awaiting-user",
        readyForPlan: ready,
        transcript: [...state.transcript, kaiTurn(line, action.ts)],
      };
    }

    case "safety":
      return {
        ...state,
        status: "safety-hold",
        safety: { triggered: true, response: action.response },
        readyForPlan: false,
        transcript: [...state.transcript, kaiTurn(action.response, action.ts)],
      };

    case "enterPlan":
      if (state.phase !== "conversation") return state;
      return { ...state, phase: "plan" };

    case "enterComplete":
      return { ...state, phase: "complete" };

    default:
      return state;
  }
}

/** The logical step id for the current cursor — useful for the backend hint and
 *  for tests/labels. */
export function currentStepId(state: ConversationState): string {
  return stepIdAt(state.stepIndex);
}
