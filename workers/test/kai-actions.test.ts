import { describe, expect, it } from "vitest";
import { inferKaiNextAction } from "../src/lib/kai-actions";

describe("inferKaiNextAction", () => {
  it("routes food and fuel messages to food logging", () => {
    expect(inferKaiNextAction("I forgot to eat and need protein after practice")).toMatchObject({
      id: "food",
      label: "Log food",
      route: "/health?module=food"
    });
  });

  it("routes sleep and recovery messages to sleep protection", () => {
    expect(inferKaiNextAction("I am wired and exhausted and need sleep")).toMatchObject({
      id: "sleep",
      label: "Protect sleep"
    });
  });

  it("routes stuck productivity messages to reset before pressure", () => {
    expect(inferKaiNextAction("I am overwhelmed and stuck doomscrolling")).toMatchObject({
      id: "reset",
      route: "/loop"
    });
  });
});
