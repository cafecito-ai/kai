// React hook bridging the pure conversation engine to the backend.
//
// Holds the reducer state, sends each user utterance to /api/onboarding/converse,
// and folds the response (safety / next line / extraction delta) back into the
// machine. On any backend failure it dispatches an empty kaiResponse so the
// reducer falls back to the next scripted line — the conversation never stalls.

import { useCallback, useReducer, useRef } from "react";
import { api } from "../api";
import {
  type ConversationState,
  createInitialState,
  currentStepId,
  reducer,
} from "./conversationEngine";

export interface ConversationEngineApi {
  state: ConversationState;
  begin: () => void;
  setInputMode: (mode: "voice" | "typed") => void;
  sendUtterance: (text: string) => Promise<void>;
  enterPlan: () => void;
  enterComplete: () => void;
}

export function useConversationEngine(initialMode: "voice" | "typed" = "voice"): ConversationEngineApi {
  const [state, dispatch] = useReducer(reducer, initialMode, createInitialState);

  // A live ref to state so sendUtterance reads the latest transcript without
  // being re-created every turn.
  const stateRef = useRef(state);
  stateRef.current = state;

  const begin = useCallback(() => dispatch({ type: "begin" }), []);
  const setInputMode = useCallback((mode: "voice" | "typed") => dispatch({ type: "setInputMode", mode }), []);
  const enterPlan = useCallback(() => dispatch({ type: "enterPlan" }), []);
  const enterComplete = useCallback(() => dispatch({ type: "enterComplete" }), []);

  const sendUtterance = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    // Snapshot the transcript BEFORE adding this message (the engine adds the
    // user turn itself); the backend gets prior context + the latest line.
    const transcript = stateRef.current.transcript.map((t) => ({ role: t.role, text: t.text }));
    const stepId = currentStepId(stateRef.current);
    dispatch({ type: "userMessage", text: clean, ts: Date.now() });

    try {
      const res = await api.onboardingConverse({ transcript, latestUserMessage: clean, stepId });
      if (res.safety && res.safety.safe === false) {
        dispatch({
          type: "safety",
          response:
            res.safety.response ||
            res.kaiLine ||
            "Let's pause here — please reach out to someone who can help. Call or text 988.",
          ts: Date.now(),
        });
        return;
      }
      dispatch({ type: "kaiResponse", kaiLine: res.kaiLine, delta: res.delta, done: res.done, ts: Date.now() });
    } catch {
      // Backend unavailable — fall back to the scripted next line.
      dispatch({ type: "kaiResponse", kaiLine: "", ts: Date.now() });
    }
  }, []);

  return { state, begin, setInputMode, sendUtterance, enterPlan, enterComplete };
}
