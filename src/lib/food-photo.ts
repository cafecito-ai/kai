import type { FoodNutrition, FoodPhotoConfidence, FoodPhotoResult } from "./types";

export type MealContextId = "school_lunch" | "before_practice" | "after_practice" | "late_snack" | "recovery_day";

export const MEAL_CONTEXTS: ReadonlyArray<{ id: MealContextId; label: string; prompt: string }> = [
  { id: "school_lunch", label: "school lunch", prompt: "Was this enough to get through the next class or practice?" },
  { id: "before_practice", label: "before practice", prompt: "Did it sit well before you moved?" },
  { id: "after_practice", label: "after practice", prompt: "Did this help you feel rebuilt after training?" },
  { id: "late_snack", label: "late snack", prompt: "Was this hunger, habit, stress, or just needing something easy?" },
  { id: "recovery_day", label: "recovery day", prompt: "Did this help your body feel less run down?" }
];

export function getFoodPhotoConfidenceLabel(confidence: FoodPhotoConfidence): string {
  if (confidence === "high") return "clear read";
  if (confidence === "medium") return "review portions";
  if (confidence === "low") return "low confidence";
  if (confidence === "photo_stub") return "photo saved";
  return "manual note";
}

export function describeFoodPhotoResult(result: FoodPhotoResult): string {
  if (result.items.length === 0) {
    return "Kai couldn't confidently read food in this photo. Type the items you remember and keep the note descriptive.";
  }
  const itemWord = result.items.length === 1 ? "item" : "items";
  if (result.confidence === "low") {
    return `Kai saw ${result.items.length} ${itemWord}, but confidence is low. Treat this as a draft and edit anything that looks off.`;
  }
  return `Kai saw ${result.items.length} ${itemWord}. Treat portions and nutrition as estimates you can edit, not a score.`;
}

export function formatFoodNutrition(nutrition: FoodNutrition): string {
  return [
    `${formatNumber(nutrition.calories)} kcal est.`,
    `${formatNumber(nutrition.protein)}g protein`,
    `${formatNumber(nutrition.carbs)}g carbs`,
    `${formatNumber(nutrition.fat)}g fat`
  ].join(" • ");
}

export function getNutritionEstimateCaption(): string {
  return "Nutrition is an estimate for context, not a goal, grade, or daily target.";
}

export function getFoodPhotoFollowups(result: FoodPhotoResult, contextId?: MealContextId): string[] {
  const prompts: string[] = [];
  const context = MEAL_CONTEXTS.find((item) => item.id === contextId);
  if (context) prompts.push(context.prompt);

  if (result.confidence === "low" || result.confidence === "photo_stub") {
    prompts.push("What should Kai fix about the read?");
  } else if (result.items.some((item) => !item.estimatedGrams)) {
    prompts.push("Any portion that looks missing or off?");
  } else {
    prompts.push("How did your energy feel 60-90 minutes later?");
  }

  prompts.push("Anything worth remembering for next time?");
  return prompts.slice(0, 3);
}

function formatNumber(value: number): string {
  const rounded = Math.round(value);
  return Number.isFinite(rounded) ? String(rounded) : "0";
}
