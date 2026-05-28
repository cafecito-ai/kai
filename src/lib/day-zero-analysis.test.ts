import { describe, expect, it } from "vitest";

import { analyzeDayZero } from "./day-zero-analysis";

describe("analyzeDayZero", () => {
  it("creates athlete-specific mission from Day 0 and onboarding context", () => {
    const analysis = analyzeDayZero(
      {
        id: "d0",
        createdAt: new Date().toISOString(),
        durationMs: 30_000,
        quote: "I want to improve at basketball and stop waiting to feel ready.",
      },
      {
        focusAreas: ["getting_stronger"],
        followUps: { training: "shooting practice" },
        hardestLately: "Consistency after school",
        updatedAt: new Date().toISOString(),
      },
    );

    expect(analysis?.desiredIdentity).toBe("Disciplined competitor");
    expect(analysis?.homePriorities).toContain("Training reps");
  });
});
