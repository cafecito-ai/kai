import { describe, expect, it } from "vitest";
import { inferKaiAction, topKaiActions } from "./kai-actions";

describe("kai action routing", () => {
  it("routes body fuel language to food logging", () => {
    expect(inferKaiAction("I forgot to eat and need protein").id).toBe("food");
  });

  it("routes tired recovery language to sleep", () => {
    expect(inferKaiAction("I feel wired and exhausted and need better sleep").id).toBe("sleep");
  });

  it("routes procrastination and discipline language to goals", () => {
    expect(inferKaiAction("I keep procrastinating and need to lock in for school").id).toBe("goal");
  });

  it("falls back to talking it out", () => {
    expect(inferKaiAction("I do not know what is going on").id).toBe("talk");
  });

  it("keeps the curated actions compact", () => {
    expect(topKaiActions().map((action) => action.id)).toEqual(["talk", "food", "goal", "reset", "scan", "sleep", "stretch"]);
  });
});
