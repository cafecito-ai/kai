import { Hono } from "hono";
import type { Env } from "../types";

export const foodRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

foodRoutes.post("/food-photo", async (c) => {
  const body = await c.req.json<{ r2Key?: string }>();
  const id = crypto.randomUUID();
  const items = [
    { name: "Detected meal item", calories: 320, protein: 18, carbs: 34, fat: 12 }
  ];
  await c.env.DB.prepare("INSERT INTO meals (id, user_id, photo_r2_key, items, total_calories, total_protein) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, c.get("userId"), body.r2Key ?? null, JSON.stringify(items), 320, 18)
    .run();
  return c.json({ mealId: id, items, totals: { calories: 320, protein: 18, carbs: 34, fat: 12 }, confidence: 0.68 });
});

foodRoutes.patch("/meals/:mealId", async (c) => {
  const body = await c.req.json<{ items: unknown; notes?: string }>();
  await c.env.DB.prepare("UPDATE meals SET items = ?, notes = ? WHERE id = ? AND user_id = ?")
    .bind(JSON.stringify(body.items), body.notes ?? null, c.req.param("mealId"), c.get("userId"))
    .run();
  return c.json({ meal: { id: c.req.param("mealId"), ...body } });
});
