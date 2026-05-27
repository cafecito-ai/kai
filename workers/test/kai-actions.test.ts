import { describe, expect, it } from "vitest";
import { inferKaiNextAction } from "../src/lib/kai-actions";

describe("inferKaiNextAction", () => {
  it("routes food and fuel messages to food logging", () => {
    expect(inferKaiNextAction("I forgot to eat and need protein after practice")).toMatchObject({
      id: "food",
      label: "Log food",
      route: "/task/food"
    });
  });

  it("routes sleep and recovery messages to sleep protection", () => {
    expect(inferKaiNextAction("I am wired and exhausted and need sleep")).toMatchObject({
      id: "sleep",
      label: "Protect sleep",
      route: "/task/sleep"
    });
  });

  it("routes stuck productivity messages to reset before pressure", () => {
    expect(inferKaiNextAction("I am overwhelmed and stuck doomscrolling")).toMatchObject({
      id: "screen",
      route: "/task/screen"
    });
  });

  it("routes posture checks to body scan instead of stretch", () => {
    expect(inferKaiNextAction("Can Kai check my posture and alignment?")).toMatchObject({
      id: "scan",
      route: "/task/scan"
    });
  });

  it("routes school procrastination to goal creation", () => {
    expect(inferKaiNextAction("I keep procrastinating on school and need a habit")).toMatchObject({
      id: "goal",
      route: "/task/goal"
    });
  });

  it("routes confidence, social pressure, and screen time to focused mental actions", () => {
    expect(inferKaiNextAction("I feel insecure and not good enough")).toMatchObject({
      id: "confidence",
      route: "/task/confidence"
    });
    expect(inferKaiNextAction("The group chat made me feel left out")).toMatchObject({
      id: "social",
      route: "/task/social"
    });
    expect(inferKaiNextAction("I keep scrolling on TikTok and comparing myself")).toMatchObject({
      id: "screen",
      route: "/task/screen"
    });
  });
});
