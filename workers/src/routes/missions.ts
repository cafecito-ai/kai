import { Hono } from "hono";
import { ensureUser } from "../lib/db";
import type { AppVariables, Env } from "../types";

const VALID_PILLARS = new Set(["body", "mind", "purpose", "people"]);
const VALID_STATUSES = new Set(["active", "paused", "achieved", "released", "archived"]);

export const missionsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

missionsRoutes.get("/missions", async (c) => {
  const { results } = await c.env.DB
    .prepare("SELECT * FROM missions WHERE user_id = ? ORDER BY status = 'active' DESC, created_at DESC")
    .bind(c.get("userId"))
    .all();
  return c.json({ missions: (results as Array<Record<string, unknown>>).map(serializeMission) });
});

missionsRoutes.post("/missions", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ pillar: string; statement: string; why?: string }>();
  const pillar = VALID_PILLARS.has(body.pillar) ? body.pillar : "";
  const statement = body.statement?.trim().slice(0, 280);
  if (!pillar || !statement) return c.json({ error: "pillar and statement are required" }, 400);
  await ensureUser(c.env.DB, userId);

  await c.env.DB
    .prepare("UPDATE missions SET status = 'archived', archived_at = CURRENT_TIMESTAMP WHERE user_id = ? AND pillar = ? AND status = 'active'")
    .bind(userId, pillar)
    .run();

  const id = crypto.randomUUID();
  await c.env.DB
    .prepare("INSERT INTO missions (id, user_id, pillar, statement, why, status) VALUES (?, ?, ?, ?, ?, 'active')")
    .bind(id, userId, pillar, statement, body.why?.trim().slice(0, 500) || null)
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM missions WHERE id = ? AND user_id = ?").bind(id, userId).first<Record<string, unknown>>();
  return c.json({ mission: serializeMission(row) });
});

missionsRoutes.patch("/missions/:missionId", async (c) => {
  const userId = c.get("userId");
  const missionId = c.req.param("missionId");
  const body = await c.req.json<{ statement?: string; why?: string | null; status?: string }>();
  const current = await c.env.DB.prepare("SELECT * FROM missions WHERE id = ? AND user_id = ?").bind(missionId, userId).first<Record<string, unknown>>();
  if (!current) return c.json({ error: "Mission not found" }, 404);
  const status = body.status && VALID_STATUSES.has(body.status) ? body.status : String(current.status);
  const archivedAt = status === "archived" || status === "released" ? "CURRENT_TIMESTAMP" : "archived_at";
  await c.env.DB
    .prepare(
      `UPDATE missions
       SET statement = ?, why = ?, status = ?, archived_at = ${archivedAt}
       WHERE id = ? AND user_id = ?`
    )
    .bind(
      body.statement?.trim().slice(0, 280) || current.statement,
      body.why === undefined ? current.why : body.why?.trim().slice(0, 500) || null,
      status,
      missionId,
      userId
    )
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM missions WHERE id = ? AND user_id = ?").bind(missionId, userId).first<Record<string, unknown>>();
  return c.json({ mission: serializeMission(row) });
});

missionsRoutes.delete("/missions/:missionId", async (c) => {
  await c.env.DB
    .prepare("UPDATE missions SET status = 'archived', archived_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?")
    .bind(c.req.param("missionId"), c.get("userId"))
    .run();
  return c.json({ ok: true });
});

function serializeMission(row: Record<string, unknown> | null | undefined) {
  return {
    id: String(row?.id ?? ""),
    pillar: row?.pillar,
    statement: row?.statement,
    why: row?.why ?? null,
    status: row?.status ?? "active",
    createdAt: row?.created_at,
    archivedAt: row?.archived_at ?? null
  };
}
