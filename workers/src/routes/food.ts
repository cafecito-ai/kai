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

type FoodPhotoResponse = {
  mealId: string;
  r2Key?: string;
  items: AnalyzedItem[];
  totals: Nutrition | null;
  confidence: "high" | "medium" | "low" | "photo_stub" | "manual_stub";
  notes: string;
};

foodRoutes.post("/food-photo", async (c) => {
  const body = await c.req.json<{ r2Key?: string; note?: string }>();
  return c.json(await analyzeAndSaveMeal(c.env, c.get("userId"), { r2Key: body.r2Key, note: body.note }));
});

foodRoutes.post("/food-photo-upload", async (c) => {
  const form = await c.req.parseBody();
  const photo = form.photo;
  const note = typeof form.note === "string" ? form.note : undefined;

  if (!(photo instanceof File)) {
    return c.json({ error: "photo file is required" }, 400);
  }
  if (!photo.type.startsWith("image/")) {
    return c.json({ error: "photo must be an image" }, 400);
  }
  if (photo.size > 8 * 1024 * 1024) {
    return c.json({ error: "photo must be 8MB or smaller" }, 413);
  }

  const ext = extensionForContentType(photo.type);
  const r2Key = `food-photos/${c.get("userId")}/${crypto.randomUUID()}${ext}`;
  await c.env.UPLOADS.put(r2Key, await photo.arrayBuffer(), {
    httpMetadata: { contentType: photo.type }
  });

  return c.json(await analyzeAndSaveMeal(c.env, c.get("userId"), { r2Key, note }));
});

foodRoutes.patch("/meals/:mealId", async (c) => {
  const body = await c.req.json<{ items: unknown; notes?: string }>();
  await c.env.DB
    .prepare("UPDATE meals SET items = ?, notes = ? WHERE id = ? AND user_id = ?")
    .bind(JSON.stringify(body.items), body.notes ?? null, c.req.param("mealId"), c.get("userId"))
    .run();
  return c.json({ meal: { id: c.req.param("mealId"), ...body } });
});

async function analyzeAndSaveMeal(env: Env, userId: string, body: { r2Key?: string; note?: string }): Promise<FoodPhotoResponse> {
  const id = crypto.randomUUID();

  let items: AnalyzedItem[] = [];
  let confidence: "high" | "medium" | "low" | "photo_stub" | "manual_stub" = "manual_stub";
  let visionNotes = "";

  if (body.r2Key) {
    const vision = await analyzeFoodPhoto(env, body.r2Key);
    if (vision) {
      confidence = vision.confidence;
      visionNotes = vision.notes;
      items = await enrichItemsWithNutrition(env, vision.items);
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

  await env.DB
    .prepare(
      "INSERT INTO meals (id, user_id, photo_r2_key, items, total_calories, total_protein) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(
      id,
      userId,
      body.r2Key ?? null,
      JSON.stringify(items),
      totals ? totals.calories : null,
      totals ? totals.protein : null
    )
    .run();

  return {
    mealId: id,
    r2Key: body.r2Key,
    items,
    totals,
    confidence,
    notes: visionNotes ? `${visionNotes} ${DESCRIPTIVE_NOTE}` : DESCRIPTIVE_NOTE
  };
}

function extensionForContentType(contentType: string) {
  if (contentType === "image/png") return ".png";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "image/heic") return ".heic";
  return ".jpg";
}

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
