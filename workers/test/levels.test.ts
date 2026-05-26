import { describe, expect, it } from "vitest";
import { computeBelt, computeLevel, computeStreak, summariseProgress } from "../src/lib/levels";

describe("computeLevel (Section 9 ladder)", () => {
  it("returns 1 for an empty or sub-100 total", () => {
    expect(computeLevel(0)).toBe(1);
    expect(computeLevel(99)).toBe(1);
  });

  it("steps through the cumulative thresholds", () => {
    expect(computeLevel(100)).toBe(2);
    expect(computeLevel(249)).toBe(2);
    expect(computeLevel(250)).toBe(3);
    expect(computeLevel(499)).toBe(3);
    expect(computeLevel(500)).toBe(4);
    expect(computeLevel(1000)).toBe(5);
    expect(computeLevel(1750)).toBe(6);
    expect(computeLevel(2750)).toBe(7);
    expect(computeLevel(4000)).toBe(8);
    expect(computeLevel(6000)).toBe(9);
    expect(computeLevel(9000)).toBe(10);
  });

  it("caps at level 10 above the top threshold", () => {
    expect(computeLevel(50_000)).toBe(10);
  });
});

describe("computeBelt", () => {
  it("returns none below the white threshold", () => {
    expect(computeBelt(0)).toBe("none");
    expect(computeBelt(9)).toBe("none");
  });

  it("ascends through belt tiers", () => {
    expect(computeBelt(10)).toBe("white");
    expect(computeBelt(24)).toBe("white");
    expect(computeBelt(25)).toBe("yellow");
    expect(computeBelt(50)).toBe("green");
    expect(computeBelt(100)).toBe("blue");
    expect(computeBelt(200)).toBe("black");
    expect(computeBelt(500)).toBe("black");
  });
});

describe("computeStreak", () => {
  it("counts consecutive days that meet the min-value bar", () => {
    const now = new Date("2026-05-12T12:00:00Z");
    const events = [
      { day: "2026-05-12", engine: "physical" as const, value: 20 },
      { day: "2026-05-11", engine: "mental" as const, value: 10 },
      { day: "2026-05-10", engine: "physical" as const, value: 8 }
    ];
    expect(computeStreak(events, { now })).toBe(3);
  });

  it("excludes days where every event was below the min-value bar", () => {
    const now = new Date("2026-05-12T12:00:00Z");
    const events = [
      { day: "2026-05-12", engine: "physical" as const, value: 20 },
      { day: "2026-05-11", engine: "mental" as const, value: 2 }, // below 5
      { day: "2026-05-10", engine: "physical" as const, value: 8 }
    ];
    expect(computeStreak(events, { now })).toBe(1);
  });

  it("filters by engine when requested", () => {
    const now = new Date("2026-05-12T12:00:00Z");
    const events = [
      { day: "2026-05-12", engine: "physical" as const, value: 20 },
      { day: "2026-05-11", engine: "mental" as const, value: 10 },
      { day: "2026-05-10", engine: "physical" as const, value: 20 }
    ];
    expect(computeStreak(events, { engine: "physical", now })).toBe(1);
    expect(computeStreak(events, { engine: "mental", now })).toBe(0);
  });

  it("returns 0 when today has no qualifying event", () => {
    const now = new Date("2026-05-12T12:00:00Z");
    const events = [{ day: "2026-05-11", engine: "physical" as const, value: 20 }];
    expect(computeStreak(events, { now })).toBe(0);
  });
});

describe("summariseProgress", () => {
  const now = new Date("2026-05-12T12:00:00Z");

  it("rolls up everything into one summary", () => {
    const rows = [
      { engine: "physical" as const, event_value: 80, occurred_at: "2026-05-12T08:00:00Z" },
      { engine: "physical" as const, event_value: 40, occurred_at: "2026-05-11T08:00:00Z" },
      { engine: "mental" as const, event_value: 60, occurred_at: "2026-05-11T19:00:00Z" },
      { engine: "superpower" as const, event_value: 80, occurred_at: "2026-05-10T08:00:00Z" }
    ];
    const summary = summariseProgress(rows, { now });
    expect(summary.totalScore).toBe(260);
    expect(summary.level).toBe(3); // crosses the 250 threshold
    expect(summary.streaks.overall).toBe(3);
    expect(summary.streaks.physical).toBe(2);
    expect(summary.streaks.superpower).toBe(0); // last superpower event was 2 days ago, no event today
    expect(summary.eventCountsByEngine).toEqual({ physical: 2, superpower: 1, mental: 1, kai: 0 });
    expect(summary.belts.physical).toBe("none");
  });

  it("handles empty input", () => {
    const summary = summariseProgress([], { now });
    expect(summary.level).toBe(1);
    expect(summary.totalScore).toBe(0);
    expect(summary.streaks).toEqual({ overall: 0, physical: 0, superpower: 0, mental: 0 });
    expect(summary.belts).toEqual({ physical: "none", superpower: "none", mental: "none" });
  });

  it("treats negative or null event_value as 0", () => {
    const summary = summariseProgress(
      [
        { engine: "physical" as const, event_value: -10, occurred_at: "2026-05-12T08:00:00Z" },
        { engine: "physical" as const, event_value: null, occurred_at: "2026-05-12T08:00:00Z" }
      ],
      { now }
    );
    expect(summary.totalScore).toBe(0);
  });
});
