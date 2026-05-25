import { describe, expect, it } from "vitest";
import {
  createGoalDraftFromText,
  deriveGoalCategory,
  deriveStarterAction,
  isUnsafeGoalText,
  normalizeGoal,
  normalizeGoalCategory,
  normalizeGoals,
  normalizeGoalStatus
} from "./goals";

describe("goal helpers", () => {
  it("normalizes empty and malformed goal responses safely", () => {
    expect(normalizeGoals(null)).toEqual([]);
    expect(normalizeGoals({ goals: [{ nope: true }, { id: "g1", title: "Practice", category: "instrument" }] })).toEqual([
      expect.objectContaining({ id: "g1", category: "music", status: "active", description: "" })
    ]);
    expect(normalizeGoal({ id: "missing title" })).toBeNull();
  });

  it("falls back unknown categories and statuses", () => {
    expect(normalizeGoalCategory("unknown")).toBe("custom");
    expect(normalizeGoalStatus("done")).toBe("active");
  });

  it("derives category and starter actions", () => {
    expect(deriveGoalCategory("Get stronger for basketball")).toBe("sport");
    expect(deriveGoalCategory("Stop procrastinating homework")).toBe("school");
    expect(deriveStarterAction("homework", "school")).toContain("10 minutes");
    expect(createGoalDraftFromText("Write music").category).toBe("music");
  });

  it("detects obvious unsafe goal text", () => {
    expect(isUnsafeGoalText("I want to starve myself.")).toBe(true);
    expect(isUnsafeGoalText("I want to hurt myself.")).toBe(true);
    expect(isUnsafeGoalText("I want to get blackout drunk every night.")).toBe(true);
    expect(isUnsafeGoalText("Get stronger for basketball")).toBe(false);
  });
});
