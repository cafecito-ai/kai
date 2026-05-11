export async function logAppEvent(db: D1Database, input: { userId?: string; eventName: string; payload?: unknown }) {
  const id = crypto.randomUUID();
  await db
    .prepare("INSERT INTO app_events (id, user_id, event_name, payload) VALUES (?, ?, ?, ?)")
    .bind(id, input.userId ?? null, input.eventName, JSON.stringify(input.payload ?? {}))
    .run();
  return { id };
}
