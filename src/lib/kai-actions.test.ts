import { describe, expect, it } from "vitest";
import { inferKaiAction, topKaiActions } from "./kai-actions";

describe("kai action routing", () => {
  it("routes body fuel language to food logging", () => {
    expect(inferKaiAction("I forgot to eat and need protein")).toMatchObject({
      id: "food",
      route: "/health?module=food&action=food"
    });
  });

  it("routes tired recovery language to sleep", () => {
    expect(inferKaiAction("I feel wired and exhausted and need better sleep")).toMatchObject({
      id: "sleep",
      route: "/health?module=movement&action=sleep"
    });
  });

  it("routes procrastination and discipline language to goals", () => {
    expect(inferKaiAction("I keep procrastinating and need to lock in for school")).toMatchObject({
      id: "goal",
      route: "/goal?action=goal"
    });
  });

  it("routes posture checks to body scan instead of generic stretching", () => {
    expect(inferKaiAction("Can Kai check my posture and alignment?")).toMatchObject({
      id: "scan",
      route: "/health?module=scan&action=scan"
    });
  });

  it("keeps soreness and tightness on stretch", () => {
    expect(inferKaiAction("My hips are tight and my back hurts")).toMatchObject({
      id: "stretch",
      route: "/health?module=movement&action=stretch"
    });
  });

  it("falls back to talking it out", () => {
    expect(inferKaiAction("I do not know what is going on").id).toBe("talk");
  });

  it("keeps the curated actions compact", () => {
    expect(topKaiActions().map((action) => action.id)).toEqual(["talk", "food", "goal", "reset", "scan", "sleep", "stretch"]);
  });
});
