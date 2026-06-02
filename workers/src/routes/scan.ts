// T-030 — Body scan analyze route.
//
// POST /api/scan/analyze
//   multipart/form-data:
//     sessionId: string (client-supplied)
//     front: image file
//     side:  image file
//     back:  image file
//   →
//   200: { ok: true, observations: [{index,text,action}], summary, attempts }
//   200: { ok: false, reason, message, attempts }  // structured error, render to user
//
// GET /api/scan/observations/:sessionId
//   → the persisted observation row, if any
//
// GET /api/scan/observations
//   → user's last N sessions' observations (newest first) for the history view
//
// SECURITY (Gate 5 verifies):
//   - disable_training=true on every vision call (defaultVisionCall enforces)
//   - Image bytes only exist in Worker memory for the request duration
//   - We never log image bytes or persist them outside the client
//   - Only the parsed observation text reaches D1
//   - Forbidden-language filter applied with 3-regen-then-error fallback

import { Hono } from "hono";
import {
  analyzeScan,
  defaultVisionCall,
  type ScanAnalysis,
} from "../lib/scan-vision";
import type { AppVariables, Env } from "../types";

export const scanRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

scanRoutes.post("/scan/analyze", async (c) => {
  const userId = c.get("userId");

  const form = await c.req.parseBody();
  const sessionId = typeof form.sessionId === "string" ? form.sessionId : null;
  const frontFile = form.front;
  const sideFile = form.side;
  const backFile = form.back;

  if (!sessionId) {
    return c.json({ ok: false, reason: "validation", message: "sessionId required" }, 400);
  }
  if (
    !(frontFile instanceof File) ||
    !(sideFile instanceof File) ||
    !(backFile instanceof File)
  ) {
    return c.json(
      { ok: false, reason: "validation", message: "front, side, and back files all required" },
      400,
    );
  }
  for (const f of [frontFile, sideFile, backFile]) {
    if (!f.type.startsWith("image/")) {
      return c.json(
        { ok: false, reason: "validation", message: "files must be images" },
        400,
      );
    }
    if (f.size > 12 * 1024 * 1024) {
      return c.json(
        { ok: false, reason: "validation", message: "each image must be 12MB or smaller" },
        413,
      );
    }
  }

  // Convert each File to base64 in memory only. We never persist these bytes.
  const front = {
    mime: frontFile.type,
    bytesB64: await fileToB64(frontFile),
  };
  const side = {
    mime: sideFile.type,
    bytesB64: await fileToB64(sideFile),
  };
  const back = {
    mime: backFile.type,
    bytesB64: await fileToB64(backFile),
  };

  const result = await analyzeScan(
    { front, side, back },
    defaultVisionCall(c.env),
  );

  // Persist ok results only. Errors are returned but not stored — the
  // user retakes and we get a fresh attempt.
  if (result.ok) {
    await persistObservations(c.env, userId, sessionId, result);
  }

  return c.json(result);
});

scanRoutes.get("/scan/observations/:sessionId", async (c) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("sessionId");
  const row = await c.env.DB
    .prepare(
      "SELECT id, session_id, observations, summary, attempts, created_at FROM scan_observations WHERE user_id = ? AND session_id = ?",
    )
    .bind(userId, sessionId)
    .first<{
      id: string;
      session_id: string;
      observations: string;
      summary: string;
      attempts: number;
      created_at: string;
    }>()
    .catch(() => null);
  if (!row) return c.json({ observation: null });
  return c.json({
    observation: {
      id: row.id,
      sessionId: row.session_id,
      observations: safeParse(row.observations),
      summary: row.summary,
      attempts: row.attempts,
      createdAt: row.created_at,
    },
  });
});

scanRoutes.get("/scan/observations", async (c) => {
  const userId = c.get("userId");
  const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") ?? 10)));
  const result = await c.env.DB
    .prepare(
      "SELECT id, session_id, observations, summary, attempts, created_at FROM scan_observations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    )
    .bind(userId, limit)
    .all<{
      id: string;
      session_id: string;
      observations: string;
      summary: string;
      attempts: number;
      created_at: string;
    }>()
    .catch(() => ({ results: [] as never[] }));
  return c.json({
    observations: (result.results ?? []).map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      observations: safeParse(r.observations),
      summary: r.summary,
      attempts: r.attempts,
      createdAt: r.created_at,
    })),
  });
});

scanRoutes.delete("/scan/observations/:sessionId", async (c) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("sessionId");
  await c.env.DB
    .prepare(
      "DELETE FROM scan_observations WHERE user_id = ? AND session_id = ?",
    )
    .bind(userId, sessionId)
    .run();
  return c.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

async function fileToB64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  // btoa works on binary strings in Workers runtime. For files > a few MB
  // this is fine — we cap at 12MB above.
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

async function persistObservations(
  env: Env,
  userId: string,
  sessionId: string,
  result: ScanAnalysis,
): Promise<void> {
  const id = `obs_${crypto.randomUUID()}`;
  await env.DB
    .prepare(
      `INSERT INTO scan_observations
         (id, user_id, session_id, observations, summary, attempts, filter_hits)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, session_id) DO UPDATE SET
         observations = excluded.observations,
         summary = excluded.summary,
         attempts = excluded.attempts,
         filter_hits = excluded.filter_hits,
         created_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      id,
      userId,
      sessionId,
      JSON.stringify(result.observations),
      result.summary,
      result.attempts,
      JSON.stringify(result.filterHitsDuringRegens),
    )
    .run()
    .catch(() => {
      // Schema not migrated yet — don't fail the user-facing response.
      // Phase E deploy will run the migration; until then the route still
      // returns the analysis but doesn't persist.
    });
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
