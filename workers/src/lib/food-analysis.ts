/**
 * Shared food-photo analysis pipeline.
 *
 * Both `/api/food-photo` (auth'd, persists to D1) and `/api/demo-food-photo`
 * (anonymous, no persistence) feed through `analyzeMeal()` so the framing
 * rules from CLAUDE.md Section 10 stay in one place:
 *   - descriptive, not evaluative ("Kai never invents numbers")
 *   - confidence surfaced honestly
 *   - graceful fallback to manual entry when vision returns nothing
 */

import type { Env } from "../types";
import { addNutrition, emptyNutrition, lookupNutritionForItem, type Nutrition } from "./usda";
import { analyzeFoodPhoto, type VisionItem } from "./vision";

export type AnalyzedItem = {
  name: string;
  source: "vision" | "manual";
  estimatedGrams?: number;
  nutrition?: Nutrition;
  nutritionSource?: "usda" | null;
};

export type MealAnalysisConfidence = "high" | "medium" | "low" | "photo_stub" | "manual_stub";

export type MealAnalysis = {
  items: AnalyzedItem[];
  totals: Nutrition | null;
  confidence: MealAnalysisConfidence;
  notes: string;
};

export const DESCRIPTIVE_NOTE =
  "Food photo analysis is descriptive in beta. Kai does not score meals or show daily targets unless you ask.";

/**
 * Analyze a meal — either via vision on an uploaded R2 photo, or manual text
 * fallback. Pure: no DB writes, no side effects beyond the vision/USDA calls.
 */
export async function analyzeMeal(env: Env, body: { r2Key?: string; note?: string }): Promise<MealAnalysis> {
  let items: AnalyzedItem[] = [];
  let confidence: MealAnalysisConfidence = "manual_stub";
  let visionNotes = "";

  if (body.r2Key) {
    const vision = await analyzeFoodPhoto(env, body.r2Key);
    if (vision) {
      confidence = vision.confidence;
      visionNotes = vision.notes;
      items = await enrichItemsWithNutrition(env, vision.items);
    } else {
      // Vision failed or returned nothing parseable. Stable shape, manual-edit
      // fallback so the user can still log this meal.
      confidence = "photo_stub";
      items = [{ name: "Meal photo logged", source: "manual" }];
    }
  } else {
    items = parseManualItems(body.note);
  }

  const totals = aggregateTotals(items);
  const notes = visionNotes ? `${visionNotes} ${DESCRIPTIVE_NOTE}` : DESCRIPTIVE_NOTE;

  return { items, totals, confidence, notes };
}

/** JPG by default; matches what iOS Safari produces from camera capture. */
export function extensionForContentType(contentType: string): string {
  if (contentType === "image/png") return ".png";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "image/heic") return ".heic";
  return ".jpg";
}

async function enrichItemsWithNutrition(env: Env, visionItems: VisionItem[]): Promise<AnalyzedItem[]> {
  return Promise.all(
    visionItems.map(async (item): Promise<AnalyzedItem> => {
      const nutrition = await lookupNutritionForItem(env, item.name, item.estimated_grams);
      return {
        name: item.name,
        source: "vision",
        estimatedGrams: item.estimated_grams,
        nutrition: nutrition ?? undefined,
        nutritionSource: nutrition ? "usda" : null
      };
    })
  );
}

function parseManualItems(note?: string): AnalyzedItem[] {
  const items = (note ?? "")
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
  if (items.length === 0) return [{ name: "Meal item", source: "manual" }];
  return items.map((name) => ({ name, source: "manual" as const }));
}

/** Don't fabricate totals — only sum when at least one item has real data. */
function aggregateTotals(items: AnalyzedItem[]): Nutrition | null {
  const withNutrition = items.filter((item) => item.nutrition);
  if (withNutrition.length === 0) return null;
  return withNutrition.reduce<Nutrition>(
    (acc, item) => addNutrition(acc, item.nutrition as Nutrition),
    emptyNutrition()
  );
}
