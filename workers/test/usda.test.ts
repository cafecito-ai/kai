import { describe, expect, it } from "vitest";
import { addNutrition, emptyNutrition, parseFdcFood, scaleNutritionToGrams } from "../src/lib/usda";

describe("parseFdcFood", () => {
  it("extracts the four nutrients we care about", () => {
    const result = parseFdcFood({
      description: "Chicken, breast, grilled",
      foodNutrients: [
        { nutrientId: 1008, amount: 165 },
        { nutrientId: 1003, amount: 31 },
        { nutrientId: 1005, amount: 0 },
        { nutrientId: 1004, amount: 3.6 },
        { nutrientId: 1062, amount: 691 } // energy in kJ, ignored
      ]
    });
    expect(result).toEqual({ calories: 165, protein: 31, carbs: 0, fat: 3.6 });
  });

  it("accepts the `value` field as a fallback for `amount`", () => {
    const result = parseFdcFood({
      foodNutrients: [{ nutrientId: 1008, value: 100 }]
    });
    expect(result?.calories).toBe(100);
    expect(result?.protein).toBe(0);
  });

  it("returns null when none of the four nutrients are present", () => {
    expect(parseFdcFood({ foodNutrients: [{ nutrientId: 99999, amount: 1 }] })).toBeNull();
    expect(parseFdcFood({})).toBeNull();
  });
});

describe("scaleNutritionToGrams", () => {
  const per100g = { calories: 200, protein: 30, carbs: 10, fat: 5 };

  it("scales linearly by grams", () => {
    expect(scaleNutritionToGrams(per100g, 50)).toEqual({ calories: 100, protein: 15, carbs: 5, fat: 2.5 });
    expect(scaleNutritionToGrams(per100g, 200)).toEqual({ calories: 400, protein: 60, carbs: 20, fat: 10 });
  });

  it("clamps negative grams to 0", () => {
    expect(scaleNutritionToGrams(per100g, -10)).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it("rounds to one decimal", () => {
    const result = scaleNutritionToGrams({ calories: 100, protein: 10, carbs: 10, fat: 1 }, 33);
    expect(result.calories).toBe(33);
    expect(result.protein).toBe(3.3);
  });
});

describe("addNutrition", () => {
  it("sums and rounds", () => {
    const a = { calories: 100.13, protein: 5.55, carbs: 10, fat: 2 };
    const b = { calories: 50.07, protein: 3.45, carbs: 4, fat: 1 };
    expect(addNutrition(a, b)).toEqual({ calories: 150.2, protein: 9, carbs: 14, fat: 3 });
  });

  it("empty + anything = anything", () => {
    const meal = { calories: 200, protein: 20, carbs: 30, fat: 4 };
    expect(addNutrition(emptyNutrition(), meal)).toEqual(meal);
  });
});
