import type { EngineId } from "../types";
import { ensureUser } from "./db";

export async function getOrCreateConversation(db: D1Database, input: { id?: string; userId: string; engine: EngineId | "kai" }) {
  await ensureUser(db, input.userId);
  if (input.id) {
    const existing = await db
      .prepare("SELECT id FROM conversations WHERE id = ? AND user_id = ? AND engine = ?")
      .bind(input.id, input.userId, input.engine)
      .first<{ id: string }>();
    if (existing) return existing.id;
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO conversations (id, user_id, engine)
       VALUES (?, ?, ?)`
    )
    .bind(id, input.userId, input.engine)
    .run();
  return id;
}

export async function getLatestConversation(db: D1Database, input: { userId: string; engine: EngineId | "kai" }) {
  return db
    .prepare("SELECT id, engine, last_message_at FROM conversations WHERE user_id = ? AND engine = ? ORDER BY last_message_at DESC LIMIT 1")
    .bind(input.userId, input.engine)
    .first<{ id: string; engine: EngineId | "kai"; last_message_at: string }>();
}

export async function getConversationMessages(db: D1Database, input: { conversationId: string; userId: string; limit?: number }) {
  const conversation = await db
    .prepare("SELECT id FROM conversations WHERE id = ? AND user_id = ?")
    .bind(input.conversationId, input.userId)
    .first<{ id: string }>();
  if (!conversation) return null;

  // Return the MOST RECENT `limit` messages, in chronological order. The old
  // `ORDER BY created_at ASC LIMIT ?` returned the OLDEST messages, so once a
  // conversation passed the limit the current turn fell out of the window —
  // the model answered stale messages and the array could start on an assistant
  // turn (Anthropic 400 → fallback). Order by rowid (monotonic insertion order)
  // because created_at is only second-granularity and ties are non-deterministic.
  const { results } = await db
    .prepare(
      `SELECT id, role, content, created_at FROM (
         SELECT id, role, content, created_at, rowid AS rid
         FROM messages WHERE conversation_id = ?
         ORDER BY rid DESC LIMIT ?
       ) ORDER BY rid ASC`,
    )
    .bind(input.conversationId, input.limit ?? 50)
    .all();

  return (results as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    role: row.role,
    content: String(row.content),
    createdAt: row.created_at
  }));
}

export async function createMessage(
  db: D1Database,
  input: { conversationId: string; role: "user" | "assistant" | "system"; content: string; metadata?: unknown }
) {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO messages (id, conversation_id, role, content, metadata)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, input.conversationId, input.role, input.content, JSON.stringify(input.metadata ?? {}))
    .run();
  await db
    .prepare("UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP, message_count = message_count + 1 WHERE id = ?")
    .bind(input.conversationId)
    .run();
  return { id };
}
