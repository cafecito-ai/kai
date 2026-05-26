import { describe, expect, it, vi } from "vitest";
import { getConversationMessages } from "../src/lib/conversations";

/**
 * Tests for the safety-event re-hydration added in PR-following-#108.
 * Worker now joins safety_events into the conversation fetch so the
 * Crisis card re-renders when a teen reloads a conversation that
 * previously triggered a safety event.
 *
 * We mock D1 by hand here — a real Miniflare run is overkill for
 * what's really a "shape this row, exercise that join" assertion.
 */

type Row = Record<string, unknown>;

function fakeDb({
  conversationRow,
  messageRows,
  safetyRows
}: {
  conversationRow: Row | null;
  messageRows: Row[];
  safetyRows: Row[];
}) {
  let callIndex = 0;
  // The function makes calls in this order:
  //   1. SELECT conversation by id+user → returns conversationRow
  //   2. SELECT messages WHERE conversation_id → returns messageRows
  //   3. SELECT safety_events WHERE id IN (...) → returns safetyRows
  //      (skipped if no message has safetyEventId metadata)
  return {
    prepare: vi.fn(() => ({
      bind: vi.fn(function bindAndChain(this: unknown) {
        return {
          first: vi.fn(async () => {
            const i = callIndex++;
            return i === 0 ? conversationRow : null;
          }),
          all: vi.fn(async () => {
            const i = callIndex++;
            if (i === 1) return { results: messageRows };
            if (i === 2) return { results: safetyRows };
            return { results: [] };
          }),
          run: vi.fn()
        };
      })
    }))
  } as unknown as Parameters<typeof getConversationMessages>[0];
}

describe("getConversationMessages — safety event re-hydration", () => {
  it("returns null when the conversation doesn't exist or belongs to another user", async () => {
    const db = fakeDb({ conversationRow: null, messageRows: [], safetyRows: [] });
    const result = await getConversationMessages(db, { conversationId: "c1", userId: "u1" });
    expect(result).toBeNull();
  });

  it("returns plain messages when none have safety metadata", async () => {
    const db = fakeDb({
      conversationRow: { id: "c1" },
      messageRows: [
        { id: "m1", role: "user", content: "hey", metadata: "{}", created_at: "2026-05-26T00:00:00Z" },
        { id: "m2", role: "assistant", content: "hello", metadata: null, created_at: "2026-05-26T00:00:01Z" }
      ],
      safetyRows: []
    });
    const result = await getConversationMessages(db, { conversationId: "c1", userId: "u1" });
    expect(result?.length).toBe(2);
    expect(result?.[0]).not.toHaveProperty("safetyEvent");
    expect(result?.[1]).not.toHaveProperty("safetyEvent");
  });

  it("hydrates the safetyEvent field on history messages that triggered the safety layer", async () => {
    const db = fakeDb({
      conversationRow: { id: "c1" },
      messageRows: [
        { id: "m1", role: "user", content: "trigger", metadata: "{}", created_at: "2026-05-26T00:00:00Z" },
        {
          id: "m2",
          role: "assistant",
          content: "Hey. I hear you.",
          metadata: JSON.stringify({ safetyEventId: "evt-1" }),
          created_at: "2026-05-26T00:00:01Z"
        }
      ],
      safetyRows: [{ id: "evt-1", trigger_category: "suicide_ideation", severity: "critical" }]
    });
    const result = await getConversationMessages(db, { conversationId: "c1", userId: "u1" });
    expect(result?.length).toBe(2);
    expect(result?.[0]).not.toHaveProperty("safetyEvent");
    expect(result?.[1]).toMatchObject({
      id: "m2",
      role: "assistant",
      safetyEvent: { category: "suicide_ideation", severity: "critical" }
    });
  });

  it("tolerates malformed JSON metadata (single bad row doesn't break the rest)", async () => {
    const db = fakeDb({
      conversationRow: { id: "c1" },
      messageRows: [
        { id: "m1", role: "user", content: "ok", metadata: "{not json", created_at: "2026-05-26T00:00:00Z" },
        { id: "m2", role: "assistant", content: "fine", metadata: "{}", created_at: "2026-05-26T00:00:01Z" }
      ],
      safetyRows: []
    });
    const result = await getConversationMessages(db, { conversationId: "c1", userId: "u1" });
    expect(result?.length).toBe(2);
    expect(result?.[0]).not.toHaveProperty("safetyEvent");
    expect(result?.[1]).not.toHaveProperty("safetyEvent");
  });

  it("skips the safety_events lookup entirely when no messages reference one", async () => {
    const prepareSpy = vi.fn();
    const db = {
      prepare: (sql: string) => {
        prepareSpy(sql);
        return {
          bind: () => ({
            first: async () => ({ id: "c1" }),
            all: async () =>
              sql.startsWith("SELECT id, role")
                ? {
                    results: [{ id: "m1", role: "user", content: "x", metadata: "{}", created_at: "now" }]
                  }
                : { results: [] }
          })
        };
      }
    } as unknown as Parameters<typeof getConversationMessages>[0];
    await getConversationMessages(db, { conversationId: "c1", userId: "u1" });
    // Should have prepared the conversation lookup + the messages
    // lookup, but NOT the safety_events lookup (no safetyEventIds).
    const sqls = prepareSpy.mock.calls.map(([sql]) => sql as string);
    expect(sqls.some((s) => s.includes("safety_events"))).toBe(false);
  });
});
