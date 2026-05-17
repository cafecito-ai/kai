import { Hono } from "hono";
import {
  analyzeMeal,
  extensionForContentType,
  type AnalyzedItem,
  type MealAnalysis
} from "../lib/food-analysis";
import type { Env } from "../types";

export const foodRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

type FoodPhotoResponse = MealAnalysis & {
  mealId: string;
  r2Key?: string;
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

async function analyzeAndSaveMeal(
  env: Env,
  userId: string,
  body: { r2Key?: string; note?: string }
): Promise<FoodPhotoResponse> {
  const id = crypto.randomUUID();
  const analysis = await analyzeMeal(env, body);

  await env.DB
    .prepare(
      "INSERT INTO meals (id, user_id, photo_r2_key, items, total_calories, total_protein) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(
      id,
      userId,
      body.r2Key ?? null,
      JSON.stringify(analysis.items as AnalyzedItem[]),
      analysis.totals ? analysis.totals.calories : null,
      analysis.totals ? analysis.totals.protein : null
    )
    .run();

  return {
    mealId: id,
    r2Key: body.r2Key,
    ...analysis
  };
}
