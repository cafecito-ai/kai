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

  it("flags risky food and body language", () => {
    const result = localSafetyCheck("I hate my body and I am skipping meals");
    expect(result.safe).toBe(false);
    expect(result.category).toBe("eating_disorder");
  });
});
