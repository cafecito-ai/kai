import { Hono } from "hono";
import { ensureUser } from "../lib/db";
import { logAppEvent } from "../lib/events";
import { extensionForContentType } from "../lib/food-analysis";
import type { AppVariables, Env } from "../types";

export const bodyScanRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const BODY_SCAN_MAX_BYTES = 8 * 1024 * 1024;

bodyScanRoutes.post("/body-scan-upload", async (c) => {
  const form = await c.req.parseBody();
  const photo = form.photo;

  if (photo !== undefined && !(photo instanceof File)) {
    return c.json({ error: "photo must be a file" }, 400);
  }
  if (photo instanceof File && !photo.type.startsWith("image/")) {
    return c.json({ error: "photo must be an image" }, 400);
  }
  if (photo instanceof File && photo.size > BODY_SCAN_MAX_BYTES) {
    return c.json({ error: "photo must be 8MB or smaller" }, 413);
  }

  const userId = c.get("userId");
  await ensureUser(c.env.DB, userId);

  const id = crypto.randomUUID();
  let r2Key: string | undefined;
  if (photo instanceof File) {
    const ext = extensionForContentType(photo.type);
    r2Key = `body-scans/${userId}/${id}${ext}`;
    await c.env.UPLOADS.put(r2Key, await photo.arrayBuffer(), {
      httpMetadata: { contentType: photo.type }
    });
  }

  const analysis = buildPrivateBodyScanAnalysis(Boolean(r2Key));
  const payload = {
    scanId: id,
    r2Key,
    analysis,
    privacy: "private_by_default",
    labels: ["body_scan", "posture", "mobility", "recovery", "no_body_score"]
  };

  await c.env.DB.prepare(
    `INSERT INTO engine_entries (id, user_id, engine, entry_type, title, payload, completed_at)
     VALUES (?, ?, 'physical', 'body_scan', 'Private body scan', ?, CURRENT_TIMESTAMP)`
  )
    .bind(id, userId, JSON.stringify(payload))
    .run();
  await logAppEvent(c.env.DB, { userId, eventName: "body_scan_saved", payload: { hasPhoto: Boolean(r2Key) } });

  return c.json({
    scan: { id, r2Key, analysis },
    entry: {
      id,
      engine: "physical",
      entryType: "body_scan",
      title: "Private body scan",
      payload,
      completedAt: new Date().toISOString()
    }
  });
});

function buildPrivateBodyScanAnalysis(hasPhoto: boolean) {
  return {
    status: "private_beta" as const,
    focus: ["posture", "alignment", "mobility", "readiness", "confidence"],
    guardrails: ["no body score", "no attractiveness rating", "no comparison", "teen-safe framing"],
    summary: hasPhoto
      ? "Private scan saved. Kai will use this as posture, mobility, and recovery context without scoring your body."
      : "Private scan check-in saved. Add a photo when you want Kai to track posture and mobility context over time.",
    nextMoves: ["Do one easy mobility reset.", "Notice breathing and shoulder tension.", "Compare patterns over time, not bodies."]
  };
}
