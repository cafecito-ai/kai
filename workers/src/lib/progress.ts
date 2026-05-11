import type { EngineId } from "../types";

export async function createProgressEvent(
  db: D1Database,
  input: { userId: string; engine: EngineId | "kai"; eventType: string; eventValue: number; payload?: unknown }
) {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO progress_events (id, user_id, engine, event_type, event_value, payload)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, input.userId, input.engine, input.eventType, input.eventValue, JSON.stringify(input.payload ?? {}))
    .run();
  return { id, ...input, occurredAt: new Date().toISOString() };
}
