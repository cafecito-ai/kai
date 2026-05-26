import type { Env } from "../types";
import { HAIKU_MODEL, callAnthropic } from "./claude";
import { MEMORY_REFRESH_PROMPT } from "./prompts/memory";

const MEMORY_TTL_SECONDS = 60 * 60 * 24;

function memoryKey(userId: string) {
  return `kai_memory:${userId}`;
}

export async function getKaiMemory(env: Env, userId: string): Promise<string | null> {
  if (env.SESSIONS_KV) {
    try {
      const cached = await env.SESSIONS_KV.get(memoryKey(userId));
      if (cached) return cached;
    } catch {
      // ignore
    }
  }
  const row = await env.DB
    .prepare("SELECT summary FROM kai_memory WHERE user_id = ?")
    .bind(userId)
    .first<{ summary: string | null }>()
    .catch(() => null);
  if (row?.summary && env.SESSIONS_KV) {
    try {
      await env.SESSIONS_KV.put(memoryKey(userId), row.summary, { expirationTtl: MEMORY_TTL_SECONDS });
    } catch {
      // ignore
    }
  }
  return row?.summary ?? null;
}

export async function deleteKaiMemory(env: Env, userId: string): Promise<void> {
  await env.DB.prepare("DELETE FROM kai_memory WHERE user_id = ?").bind(userId).run();
  if (env.SESSIONS_KV) {
    try {
      await env.SESSIONS_KV.delete(memoryKey(userId));
    } catch {
      // ignore
    }
  }
}

export async function refreshMemory(env: Env, userId: string): Promise<string | null> {
  const [existing, intake, messages, progress, messageCount] = await Promise.all([
    getKaiMemory(env, userId),
    env.DB.prepare("SELECT summary FROM user_intake WHERE user_id = ?").bind(userId).first<{ summary: string | null }>().catch(() => null),
    env.DB
      .prepare(
        `SELECT m.role, m.content, m.created_at, c.engine
         FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
         WHERE c.user_id = ?
         ORDER BY m.created_at DESC
         LIMIT 100`
      )
      .bind(userId)
      .all<{ role: string; content: string; created_at: string; engine: string }>()
      .catch(() => ({ results: [] })),
    env.DB
      .prepare("SELECT engine, event_type, event_value, payload, occurred_at FROM progress_events WHERE user_id = ? ORDER BY occurred_at DESC LIMIT 30")
      .bind(userId)
      .all<{ engine: string; event_type: string; event_value: number | null; payload: string | null; occurred_at: string }>()
      .catch(() => ({ results: [] })),
    countUserMessages(env, userId)
  ]);

  const transcript = (messages.results ?? [])
    .reverse()
    .map((row) => `${row.created_at} ${row.engine} ${row.role}: ${String(row.content).slice(0, 800)}`)
    .join("\n");
  const eventLines = (progress.results ?? [])
    .map((row) => `${row.occurred_at} ${row.engine}/${row.event_type} value=${row.event_value ?? 0} payload=${String(row.payload ?? "{}").slice(0, 240)}`)
    .join("\n");

  const prompt = [
    `Existing memory:\n${existing ?? "(none yet)"}`,
    `Intake summary:\n${intake?.summary ?? "(none)"}`,
    `Recent progress events:\n${eventLines || "(none)"}`,
    `Recent chat transcript:\n${transcript || "(none)"}`
  ].join("\n\n");

  const summary = await callAnthropic(env, MEMORY_REFRESH_PROMPT, prompt, {
    model: HAIKU_MODEL,
    maxTokens: 420,
    temperature: 0.25
  });
  if (!summary) return null;

  await env.DB
    .prepare(
      `INSERT INTO kai_memory (user_id, summary, message_count_at_refresh, refreshed_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         summary = excluded.summary,
         message_count_at_refresh = excluded.message_count_at_refresh,
         refreshed_at = CURRENT_TIMESTAMP`
    )
    .bind(userId, summary, messageCount)
    .run();
  if (env.SESSIONS_KV) {
    try {
      await env.SESSIONS_KV.put(memoryKey(userId), summary, { expirationTtl: MEMORY_TTL_SECONDS });
    } catch {
      // ignore
    }
  }
  return summary;
}

export async function shouldRefreshMemory(env: Env, userId: string, every = 20): Promise<boolean> {
  const [messageCount, row] = await Promise.all([
    countUserMessages(env, userId),
    env.DB.prepare("SELECT message_count_at_refresh FROM kai_memory WHERE user_id = ?").bind(userId).first<{ message_count_at_refresh: number | null }>().catch(() => null)
  ]);
  return messageCount > 0 && messageCount - (row?.message_count_at_refresh ?? 0) >= every;
}

export async function refreshMemoriesForActiveUsers(env: Env): Promise<{ total: number; refreshed: number; skipped: number; failed: number }> {
  const { results } = await env.DB
    .prepare(
      `SELECT c.user_id
       FROM conversations c
       JOIN messages m ON m.conversation_id = c.id AND m.role = 'user'
       GROUP BY c.user_id`
    )
    .all<{ user_id: string }>();
  let refreshed = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of results ?? []) {
    try {
      if (!(await shouldRefreshMemory(env, row.user_id, 1))) {
        skipped += 1;
        continue;
      }
      const summary = await refreshMemory(env, row.user_id);
      if (summary) refreshed += 1;
      else skipped += 1;
    } catch (err) {
      failed += 1;
      console.warn("kai memory refresh failed", row.user_id, err);
    }
  }
  return { total: results?.length ?? 0, refreshed, skipped, failed };
}

async function countUserMessages(env: Env, userId: string): Promise<number> {
  const row = await env.DB
    .prepare(
      `SELECT COUNT(*) AS count
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE c.user_id = ? AND m.role = 'user'`
    )
    .bind(userId)
    .first<{ count: number }>()
    .catch(() => ({ count: 0 }));
  return Number(row?.count ?? 0);
}
