import { Hono } from "hono";
import { callAnthropic, OPUS_MODEL } from "../lib/claude";
import { buildKaiContext } from "../lib/context";
import { ensureUser } from "../lib/db";
import { MISSION_PILLARS, type MissionPillar } from "../lib/missions";
import { MISSION_COACHING_PROMPT } from "../lib/prompts/mission-coaching";
import type { AppVariables, Env } from "../types";

const VALID_PILLARS = new Set(["body", "mind", "purpose", "people"]);
const VALID_STATUSES = new Set(["active", "paused", "achieved", "released", "archived"]);

export const missionsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

export type MissionDraft = {
  pillar: MissionPillar;
  statement: string;
  why: string;
};

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

missionsRoutes.post("/missions/coaching", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ answers?: Partial<Record<MissionPillar, string>> }>().catch(() => ({ answers: {} }));
  const answers = normaliseAnswers(body.answers ?? {});
  const context = await buildKaiContext(c.env, userId);
  const prompt = [
    `Teen display name: ${context.displayName}`,
    `Kai name: ${context.kaiName}`,
    `Kai tone: ${context.kaiTone}`,
    `Age: ${context.age ?? "unknown"}`,
    `Intake summary: ${context.intakeSummary ?? "(none)"}`,
    `Memory summary: ${context.memorySummary ?? "(none)"}`,
    "Mission coaching answers:",
    ...MISSION_PILLARS.map((pillar) => `${pillar.label}: ${answers[pillar.id] || "(skipped)"}`)
  ].join("\n");

  const generated = await callAnthropic(c.env, MISSION_COACHING_PROMPT, prompt, {
    model: OPUS_MODEL,
    maxTokens: 700,
    temperature: 0.35
  });
  return c.json({ drafts: parseMissionDrafts(generated, answers) });
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

function normaliseAnswers(answers: Partial<Record<MissionPillar, string>>): Record<MissionPillar, string> {
  return {
    body: cleanText(answers.body, 600),
    mind: cleanText(answers.mind, 600),
    purpose: cleanText(answers.purpose, 600),
    people: cleanText(answers.people, 600)
  };
}

export function parseMissionDrafts(raw: string | null, answers: Record<MissionPillar, string>): MissionDraft[] {
  const parsed = raw ? parseJsonObject(raw) : null;
  const missions = parsed && typeof parsed === "object" ? (parsed as { missions?: unknown }).missions : null;
  return MISSION_PILLARS.map((pillar) => {
    const value = missions && typeof missions === "object" ? (missions as Record<string, unknown>)[pillar.id] : null;
    const statement = value && typeof value === "object" ? cleanText((value as Record<string, unknown>).statement, 180) : "";
    const why = value && typeof value === "object" ? cleanText((value as Record<string, unknown>).why, 260) : "";
    return {
      pillar: pillar.id,
      statement: statement || fallbackStatement(pillar.id, answers[pillar.id]),
      why: why || fallbackWhy(pillar.id, answers[pillar.id])
    };
  });
}

function parseJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced || trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

function fallbackStatement(pillar: MissionPillar, answer: string): string {
  const hint = answer ? answer.replace(/[.?!]+$/, "") : "";
  if (pillar === "body") return hint ? `I am building a body that can support ${hint}.` : "I am building a body that feels steady enough for my real life.";
  if (pillar === "mind") return hint ? `I am learning how to stay with myself when ${hint}.` : "I am learning how to notice what I feel without getting swallowed by it.";
  if (pillar === "purpose") return hint ? `I am building a life that makes room for ${hint}.` : "I am building the version of me that is actually mine.";
  return hint ? `I am practicing relationships where ${hint} can be real.` : "I am practicing relationships that feel honest, kind, and not performative.";
}

function fallbackWhy(pillar: MissionPillar, answer: string): string {
  if (answer) return `Because this came up in your own words: ${answer.slice(0, 180)}`;
  if (pillar === "body") return "Because your body is the base layer for how the day feels.";
  if (pillar === "mind") return "Because your thoughts and feelings deserve a place to land.";
  if (pillar === "purpose") return "Because your goals should sound like you, not someone else's plan.";
  return "Because the people around you shape how safe and real life feels.";
}
