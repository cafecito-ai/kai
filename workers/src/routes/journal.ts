// Journal (T-016).
//
//   POST /api/journal  body: { content: string }
//
//   - Safety classifier runs on the full entry. Flag → crisis handoff,
//     entry IS still saved but marked, never silently dropped.
//   - score_input ingestion with source=journal, value carries a rough
//     sentiment estimate (-1..+1) + char count for downstream calc.
//   - Mind agent reflects in 1–3 sentences max.

import { Hono } from "hono";
import { renderMindPrompt } from "../lib/agent-prompts";
import { callClaude } from "../lib/claude";
import { buildKaiContext } from "../lib/context";
import { sendSafetyAlert } from "../lib/email";
import { rateLimit, rateLimitedResponse } from "../lib/rate-limit";
import { classifySafetyFull, logSafetyEvent } from "../lib/safety";
import { recordScoreInput } from "../lib/score-store";
import type { AppVariables, Env } from "../types";

const JOURNAL_RATE_LIMIT = {
  route: "journal",
  limit: 10,
  periodSeconds: 60,
} as const;
const MAX_CHARS = 5000;

export const journalRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

journalRoutes.post("/journal", async (c) => {
  const userId = c.get("userId");
  const limit = await rateLimit(c.env, userId, JOURNAL_RATE_LIMIT);
  if (!limit.allowed) return rateLimitedResponse(limit, JOURNAL_RATE_LIMIT);

  const body = await c.req.json<{ content: string }>();
  const content = (body.content ?? "").trim();
  if (!content) return c.json({ error: "Empty journal" }, 400);
  if (content.length > MAX_CHARS) {
    return c.json({ error: `Max ${MAX_CHARS} characters` }, 400);
  }

  // Safety classifier on every journal entry. Per AGENT_PLAN T-016:
  // "if journal entry triggers safety classifier, response is replaced
  // with crisis handoff; entry is still saved but flagged".
  const safety = await classifySafetyFull(c.env, content);
  if (!safety.safe) {
    const event = await logSafetyEvent(c.env, {
      userId,
      conversationId: undefined,
      messageId: undefined,
      rawText: content,
      classification: safety,
    });
    if (event && safety.category && safety.severity) {
      await sendSafetyAlert(c.env, {
        eventId: event.id,
        category: safety.category,
        severity: safety.severity,
      });
    }
    // Save the entry with the flag so it's not silently dropped.
    await recordScoreInput(c.env.DB, {
      userId,
      source: "journal",
      value: {
        sentiment: 0,
        chars: content.length,
        safetyFlagged: true,
      },
    });
    return c.json({ safetyEvent: event, reflection: safety.response });
  }

  const sentiment = estimateSentiment(content);

  const { score } = await recordScoreInput(c.env.DB, {
    userId,
    source: "journal",
    value: { sentiment, chars: content.length },
  });

  const context = await buildKaiContext(c.env, userId);
  const system = renderMindPrompt(context);
  const userMessage = formatJournalForAgent(content, sentiment);
  const reflection = await callClaude(c.env, system, [
    { role: "user", content: userMessage },
  ]);

  return c.json({ score, reflection, sentiment });
});

// Cheap heuristic sentiment. Real version uses Haiku — that's a Phase B
// follow-up since it adds latency. The heuristic is good enough to power
// the local fallback's score deltas.
export function estimateSentiment(text: string): number {
  const lower = text.toLowerCase();
  const pos =
    countMatches(lower, [
      "good", "great", "happy", "grateful", "love", "excited",
      "proud", "calm", "okay", "fine", "better", "won", "win",
      "hopeful", "easy", "relief",
    ]);
  const neg =
    countMatches(lower, [
      "bad", "sad", "anxious", "angry", "afraid", "scared",
      "lonely", "tired", "exhausted", "hate", "stressed", "stress",
      "overwhelmed", "lost", "worried", "stuck", "hard",
    ]);
  if (pos + neg === 0) return 0;
  // Map (-1, +1). Mild damping so a single word doesn't pin to ±1.
  const raw = (pos - neg) / (pos + neg);
  return Math.max(-1, Math.min(1, raw * 0.7));
}

function countMatches(text: string, words: string[]): number {
  let n = 0;
  for (const w of words) {
    const re = new RegExp(`\\b${w}\\b`, "g");
    const m = text.match(re);
    if (m) n += m.length;
  }
  return n;
}

function formatJournalForAgent(content: string, sentiment: number): string {
  const tone =
    sentiment <= -0.4
      ? "sounds heavy"
      : sentiment >= 0.4
        ? "sounds lighter"
        : "mixed";
  return [
    `[Journal · ${tone}]`,
    content,
    "",
    "Respond as KAI's Mind side — 1 to 3 short sentences max. No lists. No fixing. Reflect back what you heard, and only offer a next move if it feels invited.",
  ].join("\n");
}
