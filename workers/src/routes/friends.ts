import { Hono } from "hono";
import type { Env } from "../types";

export const friendsRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

friendsRoutes.get("/friends", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM friendships WHERE user_a = ? OR user_b = ?").bind(c.get("userId"), c.get("userId")).all();
  return c.json({ accepted: results.filter((row) => row.status === "accepted"), pending: results.filter((row) => row.status === "pending") });
});

friendsRoutes.post("/friends/request", async (c) => {
  const body = await c.req.json<{ targetUserEmail: string }>();
  const id = crypto.randomUUID();
  await c.env.DB.prepare("INSERT INTO friendships (id, user_a, user_b, status) VALUES (?, ?, ?, 'pending')")
    .bind(id, c.get("userId"), body.targetUserEmail)
    .run();
  return c.json({ friendship: { id, status: "pending" } });
});

friendsRoutes.post("/friends/:friendshipId/accept", async (c) => {
  await c.env.DB.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").bind(c.req.param("friendshipId")).run();
  return c.json({ friendship: { id: c.req.param("friendshipId"), status: "accepted" } });
});
