// T-034 — Voice webhook + session management.
//
// Bland AI calls our webhook with transcript chunks during a live call.
// We:
//   1. Verify the signature (BLAND_WEBHOOK_SECRET)
//   2. Persist / update the voice_sessions row
//   3. Run each user utterance through the safety classifier
//   4. If safety fires: tell Bland to play the crisis handoff line and
//      end the call, mark the session ended_by_safety, send alert email
//
// Bland's webhook protocol varies by integration — we accept a generic
// shape and document the required fields. Production wiring may need
// adjustment depending on Bland's exact callback format.
//
// Other endpoints in this file:
//   GET  /api/voice/eligibility  — returns { allowed, reason?, message? }
//                                  for the client to gate the "Call KAI"
//                                  button (under-16 nighttime check)
//   GET  /api/voice/recent       — last N voice sessions for the user
//                                  (transcript view in the app)
//   POST /api/voice/start        — kicks off a Bland call FROM the server.
//                                  Returns the dial-out number / call_id
//                                  so the client can show a "Connecting…"
//                                  state. Requires BLAND_API_KEY.

import { Hono } from "hono";
import { checkVoiceEligibility } from "../lib/voice-eligibility";
import { sendSafetyAlert } from "../lib/email";
import { classifySafetyFull, logSafetyEvent } from "../lib/safety";
import {
  VOICE_OPENING_LINE,
  VOICE_TEN_MIN_HARD_END,
} from "../lib/voice-prompts";
import type { AppVariables, Env } from "../types";

export const voiceRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// ─────────────────────────────────────────────────────────────────────
// Eligibility check (client uses this to gate the call button)
// ─────────────────────────────────────────────────────────────────────

voiceRoutes.get("/voice/eligibility", async (c) => {
  const userId = c.get("userId");
  // Get age from user record.
  const user = await c.env.DB
    .prepare("SELECT age FROM users WHERE id = ?")
    .bind(userId)
    .first<{ age: number | null }>()
    .catch(() => null);

  // Caller passes their LOCAL hour. The Worker can't infer this on its
  // own — Workers run in some Cloudflare region with no TZ info.
  const hourRaw = c.req.query("localHour");
  const localHour = Number(hourRaw);
  if (!Number.isFinite(localHour) || localHour < 0 || localHour > 23) {
    return c.json({ error: "localHour query param required (0-23)" }, 400);
  }

  const eligibility = checkVoiceEligibility({
    age: user?.age ?? null,
    localHour,
  });
  return c.json(eligibility);
});

// ─────────────────────────────────────────────────────────────────────
// Start a call — dials FROM Bland TO the user's phone
// ─────────────────────────────────────────────────────────────────────

voiceRoutes.post("/voice/start", async (c) => {
  if (!c.env.BLAND_API_KEY || !c.env.BLAND_PHONE_NUMBER) {
    return c.json(
      { error: "Voice mode isn't configured yet. Check back soon." },
      503,
    );
  }
  const userId = c.get("userId");
  const body = await c.req.json<{ toNumber: string; localHour: number }>();
  if (!body.toNumber || !/^\+\d{10,15}$/.test(body.toNumber)) {
    return c.json(
      { error: "toNumber must be E.164 format (e.g. +15555550100)" },
      400,
    );
  }

  // Eligibility gate (defense-in-depth — client also checks).
  const user = await c.env.DB
    .prepare("SELECT age FROM users WHERE id = ?")
    .bind(userId)
    .first<{ age: number | null }>()
    .catch(() => null);
  const eligibility = checkVoiceEligibility({
    age: user?.age ?? null,
    localHour: body.localHour,
  });
  if (!eligibility.allowed) {
    return c.json(eligibility, 403);
  }

  // Bland AI's typical start-call API. Exact shape may need adjustment
  // when Ratner shares the real integration spec.
  const blandResp = await fetch("https://api.bland.ai/v1/calls", {
    method: "POST",
    headers: {
      "Authorization": c.env.BLAND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone_number: body.toNumber,
      from: c.env.BLAND_PHONE_NUMBER,
      task: VOICE_OPENING_LINE,
      max_duration: 10, // minutes
      // Webhook target — Bland will POST transcript chunks here.
      webhook: `${new URL(c.req.url).origin}/api/voice/webhook`,
      metadata: { userId },
    }),
  }).catch(() => null);

  if (!blandResp || !blandResp.ok) {
    return c.json({ error: "Voice provider unavailable, try again." }, 502);
  }
  const data = (await blandResp.json().catch(() => ({}))) as {
    call_id?: string;
  };

  // Seed the session row so transcript chunks have somewhere to land.
  const callId = data.call_id ?? `call_${crypto.randomUUID()}`;
  await c.env.DB
    .prepare(
      "INSERT INTO voice_sessions (id, user_id, started_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
    )
    .bind(callId, userId)
    .run()
    .catch(() => {
      /* migration not run yet — webhook will UPSERT */
    });

  return c.json({ callId, status: "dialing" });
});

// ─────────────────────────────────────────────────────────────────────
// Webhook — Bland AI posts transcript chunks here in real time
// ─────────────────────────────────────────────────────────────────────

// Bland's webhook payload shape (best-effort union — exact fields may
// vary by integration; only documented fields are required).
type BlandWebhookPayload = {
  /** Their call_id; same one returned from /v1/calls. */
  call_id?: string;
  /** Whose turn it is — user (caller) vs assistant (KAI). */
  speaker?: "user" | "assistant";
  /** New transcript text just spoken by speaker. */
  text?: string;
  /** Event kind. We mainly care about "transcript" and "call_ended". */
  event?: "transcript" | "call_started" | "call_ended" | "warning";
  /** Metadata we attached on /v1/calls — should include our userId. */
  metadata?: { userId?: string };
  /** Final transcript when event=call_ended. */
  full_transcript?: string;
  duration_seconds?: number;
};

voiceRoutes.post("/voice/webhook", async (c) => {
  // Signature verification — defense-in-depth. Skip if no secret in
  // dev, but in production this must be set.
  if (c.env.BLAND_WEBHOOK_SECRET) {
    const sig = c.req.header("X-Bland-Signature");
    if (sig !== c.env.BLAND_WEBHOOK_SECRET) {
      return c.json({ error: "bad signature" }, 401);
    }
  }

  const payload = await c.req.json<BlandWebhookPayload>().catch(() => null);
  if (!payload?.call_id) {
    return c.json({ error: "call_id required" }, 400);
  }

  const userId = payload.metadata?.userId;
  if (!userId) {
    return c.json({ error: "metadata.userId required" }, 400);
  }

  // ─── Call started ───────────────────────────────────────────────
  if (payload.event === "call_started") {
    await c.env.DB
      .prepare(
        "INSERT INTO voice_sessions (id, user_id, started_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING",
      )
      .bind(payload.call_id, userId)
      .run()
      .catch(() => {
        /* migration not run; non-fatal */
      });
    return c.json({ ok: true });
  }

  // ─── Call ended ─────────────────────────────────────────────────
  if (payload.event === "call_ended") {
    await c.env.DB
      .prepare(
        `UPDATE voice_sessions
           SET ended_at = CURRENT_TIMESTAMP,
               duration_sec = ?,
               transcript = COALESCE(?, transcript)
         WHERE id = ? AND user_id = ?`,
      )
      .bind(
        payload.duration_seconds ?? null,
        payload.full_transcript ?? null,
        payload.call_id,
        userId,
      )
      .run()
      .catch(() => {});
    return c.json({ ok: true });
  }

  // ─── Transcript chunk ───────────────────────────────────────────
  // Only safety-check USER utterances. The assistant's output is
  // already constrained by the system prompt.
  if (payload.event === "transcript" && payload.text && payload.speaker === "user") {
    const text = payload.text.trim();

    // 1. Append to transcript log
    await c.env.DB
      .prepare(
        `UPDATE voice_sessions
           SET transcript = transcript || ?
         WHERE id = ? AND user_id = ?`,
      )
      .bind(`User: ${text}\n`, payload.call_id, userId)
      .run()
      .catch(() => {});

    // 2. Safety classify
    const safety = await classifySafetyFull(c.env, text);
    if (!safety.safe) {
      // Log the safety event
      const event = await logSafetyEvent(c.env, {
        userId,
        conversationId: payload.call_id,
        messageId: undefined,
        rawText: text,
        classification: safety,
      });
      // Mark the session
      await c.env.DB
        .prepare(
          `UPDATE voice_sessions
             SET safety_flagged = 1,
                 safety_category = ?,
                 ended_by_safety = 1,
                 ended_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
        )
        .bind(safety.category ?? null, payload.call_id, userId)
        .run()
        .catch(() => {});
      // Alert ops
      if (event && safety.category && safety.severity) {
        await sendSafetyAlert(c.env, {
          eventId: event.id,
          category: safety.category,
          severity: safety.severity,
        });
      }
      // Return the crisis handoff phrase + end-call directive. Bland
      // reads `response` as the next assistant utterance and respects
      // `end_call: true` to disconnect after speaking.
      return c.json({
        response:
          "I want to make sure you're okay. I'm going to ask you to reach out to someone who can really help — you can call or text 988 right now. Take care of yourself.",
        end_call: true,
      });
    }
  }

  // ─── 10-min hard end check ──────────────────────────────────────
  if (payload.event === "warning") {
    return c.json({
      response: VOICE_TEN_MIN_HARD_END,
      end_call: true,
    });
  }

  return c.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────
// Recent sessions — for the in-app transcript view
// ─────────────────────────────────────────────────────────────────────

voiceRoutes.get("/voice/recent", async (c) => {
  const userId = c.get("userId");
  const limit = Math.min(20, Math.max(1, Number(c.req.query("limit") ?? 10)));
  const result = await c.env.DB
    .prepare(
      `SELECT id, agent, started_at, ended_at, duration_sec, safety_flagged
         FROM voice_sessions
        WHERE user_id = ?
        ORDER BY started_at DESC
        LIMIT ?`,
    )
    .bind(userId, limit)
    .all<{
      id: string;
      agent: string | null;
      started_at: string;
      ended_at: string | null;
      duration_sec: number | null;
      safety_flagged: number;
    }>()
    .catch(() => ({ results: [] as never[] }));
  return c.json({
    sessions: (result.results ?? []).map((r) => ({
      id: r.id,
      agent: r.agent,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      durationSec: r.duration_sec,
      safetyFlagged: !!r.safety_flagged,
    })),
  });
});
