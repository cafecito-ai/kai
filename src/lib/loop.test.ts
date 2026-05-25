import { describe, expect, it } from "vitest";
import { KAI_LOOP_STEPS, loopCompletion, resetLoopIfNewDay, toggleLoopStep } from "./loop";

describe("daily loop helpers", () => {
  it("starts a new empty loop for a new day", () => {
    const state = resetLoopIfNewDay(
      { dateIso: "2026-05-23", completed: ["mental_check", "body_signal"] },
      new Date("2026-05-24T12:00:00Z")
    );

    expect(state).toEqual({ dateIso: "2026-05-24", completed: [] });
  });

  it("keeps only known unique steps for the same day", () => {
    const state = resetLoopIfNewDay(
      { dateIso: "2026-05-24", completed: ["mental_check", "mental_check", "body_signal"] },
      new Date("2026-05-24T12:00:00Z")
    );

    expect(state.completed).toEqual(["mental_check", "body_signal"]);
  });

  it("toggles completion and calculates progress", () => {
    let state = resetLoopIfNewDay(null, new Date("2026-05-24T12:00:00Z"));
    state = toggleLoopStep(state, "mental_check");
    state = toggleLoopStep(state, "body_signal");

    expect(state.completed).toEqual(["mental_check", "body_signal"]);
    expect(loopCompletion(state)).toBe(Math.round((2 / KAI_LOOP_STEPS.length) * 100));

    state = toggleLoopStep(state, "mental_check");
    expect(state.completed).toEqual(["body_signal"]);
  });
});
