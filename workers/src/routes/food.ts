import { Hono } from "hono";
import { addNutrition, emptyNutrition, lookupNutritionForItem, type Nutrition } from "../lib/usda";
import { analyzeFoodPhoto, type VisionItem } from "../lib/vision";
import type { Env } from "../types";

export const foodRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

const DESCRIPTIVE_NOTE =
  "Food photo analysis is descriptive in beta. Kai does not score meals or show daily targets unless you ask.";

type AnalyzedItem = {
  name: string;
  source: "vision" | "manual";
  estimatedGrams?: number;
  nutrition?: Nutrition;
  nutritionSource?: "usda" | null;
};

foodRoutes.post("/food-photo", async (c) => {
  const body = await c.req.json<{ r2Key?: string; note?: string }>();
  const id = crypto.randomUUID();

  let items: AnalyzedItem[] = [];
  let confidence: "high" | "medium" | "low" | "photo_stub" | "manual_stub" = "manual_stub";
  let visionNotes = "";

  if (body.r2Key) {
    const vision = await analyzeFoodPhoto(c.env, body.r2Key);
    if (vision) {
      confidence = vision.confidence;
      visionNotes = vision.notes;
      items = await enrichItemsWithNutrition(c.env, vision.items);
    } else {
      // Vision failed or returned nothing parseable. Fall back to the
      // photo_stub behavior so callers get a stable response shape, and
      // the teen can still log the meal manually.
      confidence = "photo_stub";
      items = [{ name: "Meal photo logged", source: "manual" }];
    }
  } else {
    // Manual entry path. Don't auto-fetch USDA for every typed note — only
    // do it on opt-in (a future PATCH /meals/:id with explicit grams).
    items = parseManualItems(body.note);
  }

  const totals = aggregateTotals(items);

  await c.env.DB
    .prepare(
      "INSERT INTO meals (id, user_id, photo_r2_key, items, total_calories, total_protein) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(
      id,
      c.get("userId"),
      body.r2Key ?? null,
      JSON.stringify(items),
      totals ? totals.calories : null,
      totals ? totals.protein : null
    )
    .run();

  return c.json({
    mealId: id,
    items,
    totals,
    confidence,
    notes: visionNotes ? `${visionNotes} ${DESCRIPTIVE_NOTE}` : DESCRIPTIVE_NOTE
  });
});

foodRoutes.patch("/meals/:mealId", async (c) => {
  const body = await c.req.json<{ items: unknown; notes?: string }>();
  await c.env.DB
    .prepare("UPDATE meals SET items = ?, notes = ? WHERE id = ? AND user_id = ?")
    .bind(JSON.stringify(body.items), body.notes ?? null, c.req.param("mealId"), c.get("userId"))
    .run();
  return c.json({ meal: { id: c.req.param("mealId"), ...body } });
});

async function enrichItemsWithNutrition(env: Env, visionItems: VisionItem[]): Promise<AnalyzedItem[]> {
  const enriched = await Promise.all(
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
  return enriched;
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

/**
 * Return aggregate totals only when at least one item has nutrition data.
 * Per spec Section 10: don't show totals when we have no signal — Kai
 * never invents numbers.
 */
function aggregateTotals(items: AnalyzedItem[]): Nutrition | null {
  const withNutrition = items.filter((item) => item.nutrition);
  if (withNutrition.length === 0) return null;
  return withNutrition.reduce<Nutrition>((acc, item) => addNutrition(acc, item.nutrition as Nutrition), emptyNutrition());
}
