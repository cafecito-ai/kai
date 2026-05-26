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

/**
 * Parses the JSON metadata column on a messages row. Tolerates
 * missing / invalid / empty values — returns null instead of
 * throwing so a single bad row doesn't break a whole conversation
 * fetch.
 */
function parseMessageMetadata(raw: unknown): { safetyEventId?: string } | null {
  if (raw == null || raw === "") return null;
  try {
    const parsed = JSON.parse(String(raw)) as { safetyEventId?: unknown } | null;
    if (!parsed || typeof parsed !== "object") return null;
    const safetyEventId = typeof parsed.safetyEventId === "string" ? parsed.safetyEventId : undefined;
    if (!safetyEventId) return null;
    return { safetyEventId };
  } catch {
    return null;
  }
}

export async function getConversationMessages(db: D1Database, input: { conversationId: string; userId: string; limit?: number }) {
  const conversation = await db
    .prepare("SELECT id FROM conversations WHERE id = ? AND user_id = ?")
    .bind(input.conversationId, input.userId)
    .first<{ id: string }>();
  if (!conversation) return null;

  const { results } = await db
    .prepare("SELECT id, role, content, metadata, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?")
    .bind(input.conversationId, input.limit ?? 50)
    .all();

  // Collect every safety_event_id referenced by these messages so we
  // can hydrate { category, severity } in one extra query — keeps the
  // crisis card renderable on session reload (was a gap flagged in
  // PR #86's "known follow-ups"). Conversations rarely have more
  // than 1 safety event, so this is cheap.
  const rows = results as Array<Record<string, unknown>>;
  const safetyEventIds: string[] = [];
  for (const row of rows) {
    const metadata = parseMessageMetadata(row.metadata);
    if (metadata?.safetyEventId) safetyEventIds.push(metadata.safetyEventId);
  }

  const safetyById = new Map<string, { category: string; severity: string }>();
  if (safetyEventIds.length > 0) {
    const placeholders = safetyEventIds.map(() => "?").join(",");
    const { results: safetyRows } = await db
      .prepare(`SELECT id, trigger_category, severity FROM safety_events WHERE id IN (${placeholders})`)
      .bind(...safetyEventIds)
      .all();
    for (const row of safetyRows as Array<Record<string, unknown>>) {
      safetyById.set(String(row.id), {
        category: String(row.trigger_category),
        severity: String(row.severity)
      });
    }
  }

  return rows.map((row) => {
    const metadata = parseMessageMetadata(row.metadata);
    const safetyEvent = metadata?.safetyEventId ? safetyById.get(metadata.safetyEventId) : undefined;
    return {
      id: String(row.id),
      role: row.role,
      content: String(row.content),
      createdAt: row.created_at,
      ...(safetyEvent ? { safetyEvent } : {})
    };
  });
}

/**
 * Like getConversationMessages, but returns the MOST RECENT N rows in
 * ascending (chat) order. The base helper does `ORDER BY created_at ASC
 * LIMIT N`, which returns the OLDEST N — fine for "show me the whole
 * conversation, capped at 50" but wrong for "what's the recent context
 * for the model right now." Once a conversation grows past the limit
 * the chat handler would otherwise keep sending the model the same
 * stale opening window forever (Codex review of #130, P1).
 *
 * Shape and safety-event hydration match getConversationMessages so the
 * two are interchangeable from the caller's perspective.
 */
export async function getRecentConversationMessages(
  db: D1Database,
  input: { conversationId: string; userId: string; limit?: number }
) {
  const conversation = await db
    .prepare("SELECT id FROM conversations WHERE id = ? AND user_id = ?")
    .bind(input.conversationId, input.userId)
    .first<{ id: string }>();
  if (!conversation) return null;

  const { results } = await db
    .prepare("SELECT id, role, content, metadata, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?")
    .bind(input.conversationId, input.limit ?? 12)
    .all();

  // Walk newest-first to collect safety event IDs, then reverse for
  // the final return so the caller can use the array as a chat history
  // in chronological order.
  const rows = (results as Array<Record<string, unknown>>).reverse();
  const safetyEventIds: string[] = [];
  for (const row of rows) {
    const metadata = parseMessageMetadata(row.metadata);
    if (metadata?.safetyEventId) safetyEventIds.push(metadata.safetyEventId);
  }

  const safetyById = new Map<string, { category: string; severity: string }>();
  if (safetyEventIds.length > 0) {
    const placeholders = safetyEventIds.map(() => "?").join(",");
    const { results: safetyRows } = await db
      .prepare(`SELECT id, trigger_category, severity FROM safety_events WHERE id IN (${placeholders})`)
      .bind(...safetyEventIds)
      .all();
    for (const row of safetyRows as Array<Record<string, unknown>>) {
      safetyById.set(String(row.id), {
        category: String(row.trigger_category),
        severity: String(row.severity)
      });
    }
  }

  return rows.map((row) => {
    const metadata = parseMessageMetadata(row.metadata);
    const safetyEvent = metadata?.safetyEventId ? safetyById.get(metadata.safetyEventId) : undefined;
    return {
      id: String(row.id),
      role: row.role,
      content: String(row.content),
      createdAt: row.created_at,
      ...(safetyEvent ? { safetyEvent } : {})
    };
  });
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
