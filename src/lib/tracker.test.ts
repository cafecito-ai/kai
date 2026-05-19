import { describe, expect, it } from "vitest";
import { beltForLevel, calculateLevel, calculateStreak, engineTotals, eventDisplayName, lastNDays } from "./tracker";

describe("tracker", () => {
  it("calculates level from normalized progress (Section 9 ladder)", () => {
    expect(calculateLevel([{ id: "1", engine: "physical", eventType: "workout", eventValue: 250, occurredAt: "2026-05-11T00:00:00Z" }])).toBe(3);
    // 100 is the first threshold past level 1; under the old flat 120/level math this would still be 1.
    expect(calculateLevel([{ id: "2", engine: "physical", eventType: "workout", eventValue: 100, occurredAt: "2026-05-11T00:00:00Z" }])).toBe(2);
    // 240 is below the 250 threshold; under flat 120/level it would be 3.
    expect(calculateLevel([{ id: "3", engine: "physical", eventType: "workout", eventValue: 240, occurredAt: "2026-05-11T00:00:00Z" }])).toBe(2);
  });

  it("excludes sub-5 days from streak per Section 9", () => {
    expect(
      calculateStreak(
        [
          { id: "1", engine: "physical", eventType: "workout", eventValue: 20, occurredAt: "2026-05-12T00:00:00Z" },
          { id: "2", engine: "physical", eventType: "noop", eventValue: 2, occurredAt: "2026-05-11T00:00:00Z" }
        ],
        new Date("2026-05-12T12:00:00Z")
      )
    ).toBe(1);
  });

  it("calculates current streak", () => {
    expect(
      calculateStreak(
        [
          { id: "1", engine: "physical", eventType: "workout", eventValue: 20, occurredAt: "2026-05-11T00:00:00Z" },
          { id: "2", engine: "mental", eventType: "breath", eventValue: 20, occurredAt: "2026-05-10T00:00:00Z" }
        ],
        new Date("2026-05-11T12:00:00Z")
      )
    ).toBe(2);
  });

  it("maps belts", () => {
    expect(beltForLevel(1)).toBe("white");
    expect(beltForLevel(9)).toBe("black");
  });

  it("sums progress by engine", () => {
    expect(
      engineTotals([
        { id: "1", engine: "physical", eventType: "workout", eventValue: 20, occurredAt: "2026-05-11T00:00:00Z" },
        { id: "2", engine: "mental", eventType: "breath", eventValue: 15, occurredAt: "2026-05-11T00:00:00Z" },
        { id: "3", engine: "physical", eventType: "sleep", eventValue: 10, occurredAt: "2026-05-10T00:00:00Z" }
      ])
    ).toEqual({ physical: 30, potential: 0, mental: 15, kai: 0 });
  });

  it("rolls events into the last n days", () => {
    const days = lastNDays(
      [
        { id: "1", engine: "physical", eventType: "workout", eventValue: 20, occurredAt: "2026-05-10T00:00:00Z" },
        { id: "2", engine: "mental", eventType: "breath", eventValue: 15, occurredAt: "2026-05-11T00:00:00Z" }
      ],
      2,
      new Date("2026-05-11T12:00:00Z")
    );
    expect(days).toEqual([
      { day: "2026-05-10", value: 20 },
      { day: "2026-05-11", value: 15 }
    ]);
  });

  it("formats activity names for teens", () => {
    expect(eventDisplayName({ id: "1", engine: "potential", eventType: "goal_hit", eventValue: 40, occurredAt: "2026-05-11T00:00:00Z" })).toBe("Mental: goal hit");
  });
});
