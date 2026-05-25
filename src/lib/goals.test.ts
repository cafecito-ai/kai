import { describe, expect, it } from "vitest";
import {
  createGoalDraftFromText,
  defaultTargetDate,
  deriveGoalCategory,
  deriveStarterAction,
  formatGoalTargetDate,
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
    expect(createGoalDraftFromText("Write music").targetDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("detects obvious unsafe goal text", () => {
    expect(isUnsafeGoalText("I want to starve myself.")).toBe(true);
    expect(isUnsafeGoalText("I want to hurt myself.")).toBe(true);
    expect(isUnsafeGoalText("I want to get blackout drunk every night.")).toBe(true);
    expect(isUnsafeGoalText("Get stronger for basketball")).toBe(false);
  });

  it("formats target dates and creates a two-week default", () => {
    expect(defaultTargetDate(new Date("2026-05-01T12:00:00Z"))).toBe("2026-05-15");
    expect(formatGoalTargetDate("2026-05-15")).toBe("May 15");
    expect(formatGoalTargetDate(null)).toBe("No target date");
  });
});
