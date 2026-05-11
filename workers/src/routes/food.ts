import { Hono } from "hono";
import type { Env } from "../types";

export const foodRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

foodRoutes.post("/food-photo", async (c) => {
  const body = await c.req.json<{ r2Key?: string; note?: string }>();
  const id = crypto.randomUUID();
  const items = parseFoodItems(body.note);
  await c.env.DB.prepare("INSERT INTO meals (id, user_id, photo_r2_key, items, total_calories, total_protein) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, c.get("userId"), body.r2Key ?? null, JSON.stringify(items), null, null)
    .run();
  return c.json({
    mealId: id,
    items,
    totals: null,
    confidence: body.r2Key ? "photo_stub" : "manual_stub",
    notes: "Food photo analysis is descriptive in beta. Kai does not score meals or show calorie targets."
  });
});

foodRoutes.patch("/meals/:mealId", async (c) => {
  const body = await c.req.json<{ items: unknown; notes?: string }>();
  await c.env.DB.prepare("UPDATE meals SET items = ?, notes = ? WHERE id = ? AND user_id = ?")
    .bind(JSON.stringify(body.items), body.notes ?? null, c.req.param("mealId"), c.get("userId"))
    .run();
  return c.json({ meal: { id: c.req.param("mealId"), ...body } });
});

function parseFoodItems(note?: string) {
  const items = (note ?? "")
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);

  if (items.length === 0) return [{ name: "Meal item", source: "manual" }];
  return items.map((name) => ({ name, source: "manual" }));
}
