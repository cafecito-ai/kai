import type { EngineId, Env } from "../types";
import { ensureUser } from "./db";
import { summariseProgress, type ProgressSummary } from "./levels";

const SUMMARY_CACHE_TTL_SECONDS = 5 * 60;

function summaryCacheKey(userId: string): string {
  return `progress:${userId}:summary`;
}

export async function createProgressEvent(
  env: Env,
  input: { userId: string; engine: EngineId | "kai"; eventType: string; eventValue: number; payload?: unknown }
) {
  const db = env.DB;
  await ensureUser(db, input.userId);
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO progress_events (id, user_id, engine, event_type, event_value, payload)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, input.userId, input.engine, input.eventType, input.eventValue, JSON.stringify(input.payload ?? {}))
    .run();

  // Invalidate the cached summary so the next /api/progress fetch recomputes
  // with this event included. Streak KV keys are managed by the summary path
  // itself — no need to touch them here.
  if (env.PROGRESS_KV) {
    try {
      await env.PROGRESS_KV.delete(summaryCacheKey(input.userId));
    } catch (err) {
      console.warn("progress summary cache invalidation failed", err);
    }
  }

  return { id, ...input, occurredAt: new Date().toISOString() };
}

/**
 * Compute the live progress summary for a user from D1, with a 5-minute KV
 * cache to keep dashboard hits cheap. Cache is invalidated on event insert.
 */
export async function computeProgressSummary(env: Env, userId: string): Promise<ProgressSummary> {
  if (env.PROGRESS_KV) {
    try {
      const cached = await env.PROGRESS_KV.get(summaryCacheKey(userId));
      if (cached) {
        const parsed = JSON.parse(cached) as ProgressSummary;
        return parsed;
      }
    } catch {
      // ignore — recompute below
    }
  }

  const { results } = await env.DB
    .prepare("SELECT engine, event_value, occurred_at FROM progress_events WHERE user_id = ?")
    .bind(userId)
    .all<{ engine: EngineId | "kai"; event_value: number | null; occurred_at: string | null }>();

  const summary = summariseProgress(results ?? []);

  if (env.PROGRESS_KV) {
    try {
      await env.PROGRESS_KV.put(summaryCacheKey(userId), JSON.stringify(summary), {
        expirationTtl: SUMMARY_CACHE_TTL_SECONDS
      });
      // Mirror the headline numbers into the standalone KV keys the spec
      // (Section 5) calls out — buildKaiContext reads streak:{userId}:overall
      // from here when rendering the system prompt.
      await env.PROGRESS_KV.put(`streak:${userId}:overall`, String(summary.streaks.overall), {
        expirationTtl: SUMMARY_CACHE_TTL_SECONDS
      });
      await env.PROGRESS_KV.put(`progress:${userId}:level`, String(summary.level), {
        expirationTtl: SUMMARY_CACHE_TTL_SECONDS
      });
    } catch (err) {
      console.warn("progress summary cache write failed; serving uncached", err);
    }
  }

  return summary;
}
