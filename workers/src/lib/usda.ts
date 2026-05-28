import type { Env } from "../types";

export type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

// USDA FoodData Central nutrient IDs.
const NUTRIENT_IDS = {
  calories: 1008, // Energy (kcal)
  protein: 1003,
  carbs: 1005, // Carbohydrate, by difference
  fat: 1004 // Total lipid (fat)
} as const;

type FdcNutrient = {
  nutrientId?: number;
  amount?: number;
  value?: number;
};

type FdcFood = {
  description?: string;
  foodNutrients?: FdcNutrient[];
};

type FdcSearchResponse = {
  foods?: FdcFood[];
};

/**
 * Extract a per-100g nutrition profile from a USDA FoodData Central food
 * record. Most "Foundation" and "SR Legacy" records report nutrients on a
 * per-100g basis. Returns null when none of the four nutrients we care
 * about are present.
 */
export function parseFdcFood(food: FdcFood): Nutrition | null {
  const nutrients = food.foodNutrients ?? [];
  let calories: number | null = null;
  let protein: number | null = null;
  let carbs: number | null = null;
  let fat: number | null = null;
  for (const n of nutrients) {
    const value = typeof n.amount === "number" ? n.amount : typeof n.value === "number" ? n.value : null;
    if (value == null) continue;
    if (n.nutrientId === NUTRIENT_IDS.calories) calories = value;
    else if (n.nutrientId === NUTRIENT_IDS.protein) protein = value;
    else if (n.nutrientId === NUTRIENT_IDS.carbs) carbs = value;
    else if (n.nutrientId === NUTRIENT_IDS.fat) fat = value;
  }
  if (calories == null && protein == null && carbs == null && fat == null) return null;
  return {
    calories: calories ?? 0,
    protein: protein ?? 0,
    carbs: carbs ?? 0,
    fat: fat ?? 0
  };
}

/**
 * Scale a per-100g nutrition profile by an arbitrary portion size in grams.
 */
export function scaleNutritionToGrams(per100g: Nutrition, grams: number): Nutrition {
  const factor = Math.max(0, grams) / 100;
  return {
    calories: round(per100g.calories * factor),
    protein: round(per100g.protein * factor),
    carbs: round(per100g.carbs * factor),
    fat: round(per100g.fat * factor)
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Hit USDA FoodData Central /foods/search and return per-100g nutrition for
 * the top match, scaled to the given grams. Returns null on miss / error.
 *
 * USDA's API allows `DEMO_KEY` for low-volume use. Production should set
 * USDA_API_KEY, but the demo path still enriches with DEMO_KEY so client
 * testers can verify nutrition lookup without another secret.
 */
export async function lookupNutritionForItem(
  env: Env,
  name: string,
  grams: number
): Promise<Nutrition | null> {
  if (!name.trim()) return null;

  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", env.USDA_API_KEY || "DEMO_KEY");
  url.searchParams.set("query", name);
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("dataType", "Foundation,SR Legacy");

  try {
    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) {
      console.warn(`USDA lookup failed for "${name}": HTTP ${res.status}`);
      return null;
    }
    const body = (await res.json()) as FdcSearchResponse;
    const top = body.foods?.[0];
    if (!top) return null;
    const per100g = parseFdcFood(top);
    if (!per100g) return null;
    return scaleNutritionToGrams(per100g, grams);
  } catch (err) {
    console.warn(`USDA lookup threw for "${name}"`, err);
    return null;
  }
}

export function emptyNutrition(): Nutrition {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function addNutrition(a: Nutrition, b: Nutrition): Nutrition {
  return {
    calories: round(a.calories + b.calories),
    protein: round(a.protein + b.protein),
    carbs: round(a.carbs + b.carbs),
    fat: round(a.fat + b.fat)
  };
}
