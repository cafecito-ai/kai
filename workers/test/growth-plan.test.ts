import { describe, expect, it } from "vitest";
import { detectGrowthPlanSuggestion } from "../src/lib/growth-plan";

describe("detectGrowthPlanSuggestion", () => {
  it("turns girlfriend language into a healthy relationship goal", () => {
    const suggestion = detectGrowthPlanSuggestion("I want a girlfriend but I have no confidence talking to girls", "chat");

    expect(suggestion?.title).toBe("Build meaningful relationships");
    expect(suggestion?.description).toContain("confidence");
    expect(suggestion?.title).not.toMatch(/get a girl|girlfriend/i);
  });

  it("turns wanting more friends into meeting new people", () => {
    const suggestion = detectGrowthPlanSuggestion("I wish I had more friends at school", "check_in");

    expect(suggestion).toMatchObject({
      title: "Meet new people",
      category: "growth",
      source: "check_in",
    });
  });

  it("detects confidence and social skill language", () => {
    expect(detectGrowthPlanSuggestion("I feel awkward and want better confidence", "chat")?.title).toBe("Improve confidence");
    expect(detectGrowthPlanSuggestion("I need a better social life and conversation skills", "chat")?.title).toBe("Strengthen social skills");
  });

  it("does not suggest a growth plan for unrelated check-ins", () => {
    expect(detectGrowthPlanSuggestion("I slept badly and need water", "check_in")).toBeNull();
  });
});
