import { describe, expect, it } from "vitest";
import { localSafetyCheck } from "./safety";

describe("localSafetyCheck", () => {
  it("passes ordinary text", () => {
    expect(localSafetyCheck("I want help with sleep").safe).toBe(true);
  });

  it("flags crisis text", () => {
    const result = localSafetyCheck("I want to kill myself");
    expect(result.safe).toBe(false);
    expect(result.category).toBe("suicide_ideation");
  });
});
