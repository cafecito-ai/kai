import { describe, expect, it } from "vitest";
import { beltForLevel, calculateLevel, calculateStreak } from "./tracker";

describe("tracker", () => {
  it("calculates level from normalized progress", () => {
    expect(calculateLevel([{ id: "1", engine: "physical", eventType: "workout", eventValue: 250, occurredAt: "2026-05-11T00:00:00Z" }])).toBe(3);
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
});
