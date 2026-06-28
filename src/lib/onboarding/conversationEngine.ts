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

/** Pull a plausible first name out of a free-text answer ("hey, I'm Leo" -> "Leo"). */
function nameFromText(text: string): string {
  const cleaned = text
    .replace(/^(hi|hey|hello|yo|um+|uh+)[,!.\s]+/i, "")
    .replace(/^(i'?m|i am|my name'?s?|my name is|it'?s|its|call me|this is|name'?s)\s+/i, "")
    .trim();
  const first = cleaned.split(/[\s,.!?]+/)[0] ?? "";
  const word = first.replace(/[^A-Za-z'-]/g, "");
  return (word || cleaned).slice(0, 40);
}

/** Fill-if-empty local capture of the raw answer for the step being answered.
 *  This is the OFFLINE/extraction-unavailable safety net: without it, a backend
 *  outage would leave the draft empty and trap the user. The backend's extraction
 *  (applied later via mergeDelta) still refines/overrides these crude values. */
function captureLocal(stepId: string, text: string, draft: ProfileDraft): ProfileDraft {
  const clean = text.trim();
  if (!clean) return draft;
  const next = { ...draft };
  switch (stepId) {
    case "name":
      if (!next.firstName) next.firstName = nameFromText(clean);
      break;
    case "reason":
      if (!next.motivation) next.motivation = clean.slice(0, 200);
      break;
    case "vision":
      if (!next.primaryGoal) next.primaryGoal = clean.slice(0, 120);
      break;
    case "why":
      if (!next.emotionalMotivation) next.emotionalMotivation = clean.slice(0, 200);
      if (!next.originStory) next.originStory = clean.slice(0, 280);
      break;
    case "blocker":
      if (!next.blocker) next.blocker = clean.slice(0, 120);
      break;
    default:
      break;
  }
  return next;
}

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
      // Capture the raw answer locally (fill-if-empty) so the draft fills even if
      // backend extraction is unavailable; the backend delta refines it later.
      const draft = captureLocal(stepIdAt(state.stepIndex), action.text, state.draft);
      return {
        ...state,
        draft,
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
      // The last script entry is Kai's closing line, not a question — so "reached
      // the end" means we've advanced to that wrap step.
      const reachedEnd = state.stepIndex + 1 >= SCRIPT_LENGTH - 1;
      const hitCap = state.turnCount >= MAX_TURNS;
      // ALWAYS finish at the turn cap (never trap the user — a backend outage or a
      // missing field can't loop forever); otherwise finish once we have enough
      // AND either the backend says it's done or we've reached the wrap.
      const ready = hitCap || (complete && (action.done === true || reachedEnd));
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
