import type { EngineId } from "../types";
import { ensureUser } from "./db";

export async function getOrCreateConversation(db: D1Database, input: { id?: string; userId: string; engine: EngineId | "kai" }) {
  await ensureUser(db, input.userId);
  const id = input.id || crypto.randomUUID();
  await db
    .prepare(
      `INSERT OR IGNORE INTO conversations (id, user_id, engine)
       VALUES (?, ?, ?)`
    )
    .bind(id, input.userId, input.engine)
    .run();
  return id;
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
