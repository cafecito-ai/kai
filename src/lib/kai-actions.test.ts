import { describe, expect, it } from "vitest";
import { buildKaiPromptChips, inferKaiAction, KAI_ACTIONS, topKaiActions } from "./kai-actions";

describe("kai action routing", () => {
  it("routes body fuel language to food logging", () => {
    expect(inferKaiAction("I forgot to eat and need protein")).toMatchObject({
      id: "food",
      route: "/task/food"
    });
  });

  it("routes tired recovery language to sleep", () => {
    expect(inferKaiAction("I feel wired and exhausted and need better sleep")).toMatchObject({
      id: "sleep",
      route: "/task/sleep"
    });
  });

  it("routes procrastination and discipline language to goals", () => {
    expect(inferKaiAction("I keep procrastinating and need to lock in for school")).toMatchObject({
      id: "goal",
      route: "/task/goal"
    });
  });

  it("routes posture checks to body scan instead of generic stretching", () => {
    expect(inferKaiAction("Can Kai check my posture and alignment?")).toMatchObject({
      id: "scan",
      route: "/task/scan"
    });
  });

  it("keeps soreness and tightness on stretch", () => {
    expect(inferKaiAction("My hips are tight and my back hurts")).toMatchObject({
      id: "stretch",
      route: "/task/stretch"
    });
  });

  it("routes insecurity and self-worth language to confidence", () => {
    expect(inferKaiAction("I feel insecure and not good enough")).toMatchObject({
      id: "confidence",
      route: "/task/confidence"
    });
  });

  it("routes social pressure to the social check-in", () => {
    expect(inferKaiAction("The group chat drama made me feel left out")).toMatchObject({
      id: "social",
      route: "/task/social"
    });
  });

  it("routes doomscrolling and comparison to screen reset", () => {
    expect(inferKaiAction("I keep doomscrolling and comparing myself on my phone")).toMatchObject({
      id: "screen",
      route: "/task/screen"
    });
  });

  it("falls back to talking it out", () => {
    expect(inferKaiAction("I do not know what is going on").id).toBe("talk");
  });

  it("keeps the curated actions compact", () => {
    expect(topKaiActions().map((action) => action.id)).toEqual(["talk", "food", "goal", "reset", "scan", "sleep", "stretch", "confidence", "social", "screen"]);
  });

  it("promotes Kai's current read ahead of default prompt chips", () => {
    const chips = buildKaiPromptChips({
      nextAction: KAI_ACTIONS.scan,
      messages: [
        { role: "assistant", content: "Say it messy." },
        { role: "user", content: "I need to eat before practice" }
      ]
    });

    expect(chips[0]).toMatchObject({
      actionId: "scan",
      source: "read",
      prompt: "Use what I just said and open Body scan."
    });
    expect(chips.map((chip) => chip.actionId)).toContain("food");
  });

  it("uses recent user messages to make chips feel contextual", () => {
    const chips = buildKaiPromptChips({
      messages: [
        { role: "assistant", content: "Say it messy." },
        { role: "user", content: "The group chat made me feel left out" },
        { role: "user", content: "I keep doomscrolling after that" }
      ]
    });

    expect(chips.slice(0, 2).map((chip) => chip.actionId)).toEqual(["screen", "social"]);
    expect(chips[0].source).toBe("recent");
  });

  it("keeps mental mode focused on mind and goal actions", () => {
    const chips = buildKaiPromptChips({
      mentalOnly: true,
      nextAction: KAI_ACTIONS.food,
      messages: [{ role: "user", content: "I need food but also feel insecure" }]
    });

    expect(chips.map((chip) => chip.actionId)).not.toContain("food");
    expect(chips[0].actionId).toBe("confidence");
  });
});
