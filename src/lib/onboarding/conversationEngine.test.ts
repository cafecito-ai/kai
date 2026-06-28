import { describe, expect, it } from "vitest";
import {
  type ConversationState,
  createInitialState,
  isComplete,
  MAX_TURNS,
  reducer,
} from "./conversationEngine";
import { EMPTY_DRAFT, type ProfileDraft } from "./types";

function withDraft(state: ConversationState, draft: Partial<ProfileDraft>): ConversationState {
  return { ...state, draft: { ...state.draft, ...draft } };
}

describe("conversationEngine reducer", () => {
  it("begins by pushing Kai's first scripted line", () => {
    const s = reducer(createInitialState("voice"), { type: "begin" });
    expect(s.phase).toBe("conversation");
    expect(s.status).toBe("awaiting-user");
    expect(s.transcript).toHaveLength(1);
    expect(s.transcript[0].role).toBe("kai");
  });

  it("records the user turn and advances the step on a Kai response", () => {
    let s = reducer(createInitialState("voice"), { type: "begin" });
    s = reducer(s, { type: "userMessage", text: "I'm Leo", ts: 1 });
    expect(s.status).toBe("kai-thinking");
    expect(s.turnCount).toBe(1);
    s = reducer(s, { type: "kaiResponse", kaiLine: "Hey Leo.", delta: { firstName: "Leo" }, ts: 2 });
    expect(s.stepIndex).toBe(1);
    expect(s.draft.firstName).toBe("Leo");
    expect(s.transcript[s.transcript.length - 1]).toMatchObject({ role: "kai", text: "Hey Leo." });
  });

  it("falls back to the scripted line when the backend line is empty", () => {
    let s = reducer(createInitialState("voice"), { type: "begin" });
    s = reducer(s, { type: "userMessage", text: "hi", ts: 1 });
    s = reducer(s, { type: "kaiResponse", kaiLine: "", ts: 2 });
    // Non-empty fallback line came from the script, not the (empty) backend line.
    expect(s.transcript[s.transcript.length - 1]?.text.length).toBeGreaterThan(0);
  });

  it("ignores user input while in a safety hold", () => {
    let s = reducer(createInitialState("voice"), { type: "begin" });
    s = reducer(s, { type: "safety", response: "Please reach out — 988.", ts: 1 });
    expect(s.status).toBe("safety-hold");
    const after = reducer(s, { type: "userMessage", text: "ok", ts: 2 });
    expect(after).toBe(s); // unchanged
  });

  it("flags readyForPlan only once the required floor is met", () => {
    let s = createInitialState("voice");
    s = reducer(s, { type: "begin" });
    s = reducer(s, { type: "userMessage", text: "go", ts: 1 });
    // done=true but draft is empty → not ready.
    s = reducer(s, { type: "kaiResponse", kaiLine: "ok", done: true, ts: 2 });
    expect(s.readyForPlan).toBe(false);

    // Now provide the full floor in one delta with done=true → ready.
    s = reducer(s, { type: "userMessage", text: "more", ts: 3 });
    s = reducer(s, {
      type: "kaiResponse",
      kaiLine: "got it",
      done: true,
      delta: { firstName: "Leo", primaryGoal: "get stronger", motivation: "football" },
      ts: 4,
    });
    expect(s.readyForPlan).toBe(true);
  });

  it("enterPlan only transitions from the conversation phase", () => {
    const welcome = createInitialState("voice");
    expect(reducer(welcome, { type: "enterPlan" }).phase).toBe("welcome");
    const convo = reducer(welcome, { type: "begin" });
    expect(reducer(convo, { type: "enterPlan" }).phase).toBe("plan");
  });
});

describe("isComplete", () => {
  it("requires name + goal/focus + a why", () => {
    expect(isComplete(EMPTY_DRAFT)).toBe(false);
    expect(isComplete({ ...EMPTY_DRAFT, firstName: "Leo" })).toBe(false);
    expect(isComplete({ ...EMPTY_DRAFT, firstName: "Leo", primaryGoal: "get stronger" })).toBe(false);
    expect(
      isComplete({ ...EMPTY_DRAFT, firstName: "Leo", primaryGoal: "get stronger", motivation: "football" }),
    ).toBe(true);
    // focusAreas can stand in for an explicit goal.
    expect(
      isComplete({ ...EMPTY_DRAFT, firstName: "Leo", focusAreas: ["getting_stronger"], originStory: "tired of feeling stuck" }),
    ).toBe(true);
  });
});

describe("turn cap", () => {
  it("treats the step list as exhausted at MAX_TURNS", () => {
    let s = withDraft(createInitialState("voice"), {
      firstName: "Leo",
      primaryGoal: "get stronger",
      motivation: "football",
    });
    s = reducer(s, { type: "begin" });
    s = { ...s, turnCount: MAX_TURNS };
    s = reducer(s, { type: "userMessage", text: "rambling", ts: 1 });
    s = reducer(s, { type: "kaiResponse", kaiLine: "ok", ts: 2 });
    expect(s.readyForPlan).toBe(true);
  });
});
