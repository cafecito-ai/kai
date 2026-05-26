import { Hono } from "hono";
import { extensionForContentType } from "../lib/food-analysis";
import { analyzePosturePhoto, type PostureResult } from "../lib/posture";
import type { Env } from "../types";

export const bodyScanRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

type BodyScanResponse = PostureResult & {
  scanId: string;
  r2Key?: string;
};

bodyScanRoutes.post("/body-scan", async (c) => {
  const body = await c.req.json<{ r2Key?: string }>();
  if (!body.r2Key) {
    return c.json({ error: "r2Key is required" }, 400);
  }
  return c.json(await analyzeAndSave(c.env, c.get("userId"), body.r2Key));
});

bodyScanRoutes.post("/body-scan-upload", async (c) => {
  const form = await c.req.parseBody();
  const photo = form.photo;
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
  const r2Key = `body-scans/${c.get("userId")}/${crypto.randomUUID()}${ext}`;
  await c.env.UPLOADS.put(r2Key, await photo.arrayBuffer(), {
    httpMetadata: { contentType: photo.type }
  });

  return c.json(await analyzeAndSave(c.env, c.get("userId"), r2Key));
});

async function analyzeAndSave(env: Env, userId: string, r2Key: string): Promise<BodyScanResponse> {
  const scanId = crypto.randomUUID();
  const analysis = await analyzePosturePhoto(env, r2Key);
  const result: PostureResult = analysis ?? {
    cues: [],
    confidence: "low",
    notes: "Scan saved. Kai could not generate posture cues this time — try again with the full body visible."
  };

  // Persist as an engine_entries row, NOT a separate "scans" table.
  // The body scan is fundamentally a Physical engine entry; reusing
  // the existing schema keeps history queries simple.
  await env.DB
    .prepare(
      "INSERT INTO engine_entries (id, user_id, engine, entry_type, title, payload, completed_at) VALUES (?, ?, 'physical', 'body_scan', 'Body scan', ?, CURRENT_TIMESTAMP)"
    )
    .bind(
      scanId,
      userId,
      JSON.stringify({
        r2Key,
        confidence: result.confidence,
        cueCount: result.cues.length,
        // Don't persist the full cue text in payload by default —
        // teens may not want raw posture notes sitting in their
        // history. They get them in the response. If we later add
        // a "scan history with cues" view, gate that on explicit
        // teen opt-in.
        focuses: result.cues.map((cue) => cue.focus)
      })
    )
    .run();

  return {
    scanId,
    r2Key,
    ...result
  };
}
