import { describe, expect, it } from "vitest";
import { computeLevelLocal, computeOverallStreakLocal } from "../src/routes/friends";

describe("computeLevelLocal (friends-route local helper)", () => {
  it("matches Section 9 thresholds", () => {
    expect(computeLevelLocal(0)).toBe(1);
    expect(computeLevelLocal(99)).toBe(1);
    expect(computeLevelLocal(100)).toBe(2);
    expect(computeLevelLocal(250)).toBe(3);
    expect(computeLevelLocal(9000)).toBe(10);
    expect(computeLevelLocal(100_000)).toBe(10);
  });
});

describe("computeOverallStreakLocal", () => {
  const now = new Date("2026-05-12T12:00:00Z");

  it("counts consecutive qualifying days", () => {
    const days = [
      { day: "2026-05-12", value: 20 },
      { day: "2026-05-11", value: 12 },
      { day: "2026-05-10", value: 8 }
    ];
    expect(computeOverallStreakLocal(days, now)).toBe(3);
  });

  it("excludes sub-5 days from the streak", () => {
    const days = [
      { day: "2026-05-12", value: 20 },
      { day: "2026-05-11", value: 3 }
    ];
    expect(computeOverallStreakLocal(days, now)).toBe(1);
  });

  it("returns 0 when today has no qualifying event", () => {
    const days = [{ day: "2026-05-11", value: 20 }];
    expect(computeOverallStreakLocal(days, now)).toBe(0);
  });
});
