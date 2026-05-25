import { describe, expect, it } from "vitest";
import {
  describeFoodPhotoResult,
  formatFoodNutrition,
  getFoodPhotoFollowups,
  getFoodPhotoConfidenceLabel,
  getNutritionEstimateCaption
} from "./food-photo";
import type { FoodPhotoResult } from "./types";

const baseResult: FoodPhotoResult = {
  mealId: "meal-1",
  items: [],
  totals: null,
  confidence: "manual_stub",
  notes: "Food photo analysis is descriptive in beta."
};

describe("food-photo framing", () => {
  it("describes empty / no-food results as manual-review, not failure", () => {
    const result = describeFoodPhotoResult({ ...baseResult, confidence: "low", notes: "no food detected" });
    expect(result).toMatch(/couldn't confidently read food/i);
    expect(result).toMatch(/type the items/i);
  });

  it("frames detected items as reviewable estimates", () => {
    const result = describeFoodPhotoResult({
      ...baseResult,
      confidence: "medium",
      items: [
        { name: "rice bowl", source: "vision", estimatedGrams: 320 },
        { name: "water", source: "vision" }
      ]
    });
    expect(result).toMatch(/Kai saw 2 items/i);
    expect(result).toMatch(/edit/i);
    expect(result).not.toMatch(/good|bad|target/i);
  });

  it("frames manual meal notes as real fuel logs", () => {
    const result = describeFoodPhotoResult({
      ...baseResult,
      confidence: "manual_stub",
      items: [
        { name: "turkey sandwich", source: "manual" },
        { name: "apple", source: "manual" }
      ]
    });
    expect(result).toMatch(/saved 2 items/i);
    expect(result).toMatch(/descriptive fuel log/i);
    expect(result).not.toMatch(/stub|grade/i);
  });

  it("formats nutrition as an estimate without daily target language", () => {
    const label = formatFoodNutrition({ calories: 540, protein: 31.2, carbs: 62, fat: 12.6 });
    expect(label).toBe("540 kcal est. • 31g protein • 62g carbs • 13g fat");
    expect(label).not.toMatch(/goal|target|remaining|allowed/i);
  });

  it("uses clear confidence labels", () => {
    expect(getFoodPhotoConfidenceLabel("high")).toBe("clear read");
    expect(getFoodPhotoConfidenceLabel("photo_stub")).toBe("photo saved");
  });

  it("keeps the nutrition caption explicitly non-judgmental", () => {
    const caption = getNutritionEstimateCaption();
    expect(caption).toMatch(/estimate/i);
    expect(caption).toMatch(/not a goal/i);
    expect(caption).not.toMatch(/good food|bad food|diet/i);
  });

  it("turns meal context into useful follow-up questions", () => {
    const prompts = getFoodPhotoFollowups(
      {
        ...baseResult,
        confidence: "high",
        items: [{ name: "pasta", source: "vision", estimatedGrams: 220 }]
      },
      "before_practice"
    );
    expect(prompts[0]).toMatch(/sit well/i);
    expect(prompts).toContain("How did your energy feel 60-90 minutes later?");
  });

  it("asks for correction when confidence is low", () => {
    const prompts = getFoodPhotoFollowups({ ...baseResult, confidence: "low" }, "school_lunch");
    expect(prompts).toContain("What should Kai fix about the read?");
  });
});
