// Chat-history END-TO-END test. Drives the real chat route handlers
// (workers/src/routes/chat.ts) for list / open / delete against an in-memory
// D1 stand-in, with a test middleware that sets c.get("userId") from a header
// (exactly what requireAuth does in prod). Covers user-scoping, title
// derivation, ownership 404s, and the /conversations/current route-order guard.

import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { chatRoutes } from "../src/routes/chat";

type Conv = {
  id: string;
  user_id: string;
  engine: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
};
type Msg = { id: string; conversation_id: string; role: string; content: string; rid: number; created_at: string };

function makeDb() {
  const conversations: Conv[] = [];
  const messages: Msg[] = [];
  let rid = 0;
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const newestFirst = (a: Conv, b: Conv) => (a.last_message_at < b.last_message_at ? 1 : -1);

  function first(sql: string, b: unknown[]) {
    if (sql.includes("SELECT id FROM conversations WHERE id = ? AND user_id = ?")) {
      const c = conversations.find((x) => x.id === b[0] && x.user_id === b[1]);
      return c ? { id: c.id } : null;
    }
    if (sql.includes("FROM conversations WHERE user_id = ? AND engine = ? ORDER BY last_message_at DESC LIMIT 1")) {
      const c = conversations.filter((x) => x.user_id === b[0] && x.engine === b[1]).sort(newestFirst)[0];
      return c ? { id: c.id, engine: c.engine, last_message_at: c.last_message_at } : null;
    }
    return null;
  }
  function all(sql: string, b: unknown[]) {
    if (sql.includes("FROM conversations c")) {
      const rows = conversations
        .filter((x) => x.user_id === b[0] && x.engine === b[1])
        .sort(newestFirst)
        .slice(0, Number(b[2]))
        .map((c) => {
          const firstUser = messages
            .filter((m) => m.conversation_id === c.id && m.role === "user")
            .sort((m1, m2) => m1.rid - m2.rid)[0];
          return {
            id: c.id,
            engine: c.engine,
            started_at: c.started_at,
            last_message_at: c.last_message_at,
            message_count: c.message_count,
            first_user_message: firstUser ? firstUser.content : null,
          };
        });
      return { results: rows };
    }
    if (sql.includes("FROM messages WHERE conversation_id = ?")) {
      const rows = messages
        .filter((m) => m.conversation_id === b[0])
        .sort((a, c) => a.rid - c.rid)
        .slice(-Number(b[1]))
        .map((m) => ({ id: m.id, role: m.role, content: m.content, created_at: m.created_at }));
      return { results: rows };
    }
    return { results: [] };
  }
  function run(sql: string, b: unknown[]) {
    if (sql.includes("DELETE FROM conversations WHERE id = ? AND user_id = ?")) {
      const keep = conversations.filter((x) => !(x.id === b[0] && x.user_id === b[1]));
      const changes = conversations.length - keep.length;
      conversations.length = 0;
      conversations.push(...keep);
      const km = messages.filter((m) => m.conversation_id !== b[0]);
      messages.length = 0;
      messages.push(...km);
      return { meta: { changes } };
    }
    return { meta: { changes: 0 } };
  }

  const DB = {
    prepare(sqlRaw: string) {
      const sql = norm(sqlRaw);
      let bound: unknown[] = [];
      const q = {
        bind(...a: unknown[]) {
          bound = a;
          return q;
        },
        first: () => Promise.resolve(first(sql, bound)),
        all: () => Promise.resolve(all(sql, bound)),
        run: () => Promise.resolve(run(sql, bound)),
      };
      return q;
    },
  };

  return {
    DB,
    seedConv(c: Partial<Conv> & { id: string; user_id: string; last_message_at: string }) {
      conversations.push({
        engine: "kai",
        started_at: c.last_message_at,
        message_count: 0,
        ...c,
      } as Conv);
    },
    seedMsg(m: { id: string; conversation_id: string; role: string; content: string }) {
      messages.push({ rid: ++rid, created_at: "2026-06-19 12:00:00", ...m });
    },
  };
}

function makeClient(db: ReturnType<typeof makeDb>) {
  const app = new Hono<{ Variables: { userId: string } }>();
  app.use("*", async (c, next) => {
    c.set("userId", c.req.header("x-test-user") ?? "");
    await next();
  });
  app.route("/api", chatRoutes);
  return (user: string, path: string, init: RequestInit = {}) =>
    app.request(
      path,
      { ...init, headers: { "content-type": "application/json", "x-test-user": user, ...(init.headers ?? {}) } },
      { DB: db.DB } as unknown as Record<string, unknown>,
    );
}

async function body<T>(r: Response): Promise<T> {
  return (await r.json()) as T;
}

describe("chat history routes", () => {
  it("lists a user's conversations newest-first with derived titles, scoped to the user", async () => {
    const db = makeDb();
    db.seedConv({ id: "c1", user_id: "u1", last_message_at: "2026-06-10 10:00:00" });
    db.seedMsg({ id: "m1", conversation_id: "c1", role: "user", content: "Can't sleep lately" });
    db.seedConv({ id: "c2", user_id: "u1", last_message_at: "2026-06-12 10:00:00" });
    db.seedMsg({ id: "m2", conversation_id: "c2", role: "user", content: "leg day plan?" });
    db.seedConv({ id: "c3", user_id: "u2", last_message_at: "2026-06-13 10:00:00" }); // other user
    const req = makeClient(db);

    const r = await req("u1", "/api/conversations?engine=kai");
    expect(r.status).toBe(200);
    const { conversations } = await body<{ conversations: Array<{ id: string; title: string }> }>(r);
    expect(conversations.map((c) => c.id)).toEqual(["c2", "c1"]); // newest first, u2 absent
    expect(conversations[0].title).toBe("leg day plan?");
    expect(conversations[1].title).toBe("Can't sleep lately");
  });

  it("labels a message-less conversation 'New chat'", async () => {
    const db = makeDb();
    db.seedConv({ id: "c1", user_id: "u1", last_message_at: "2026-06-10 10:00:00" });
    const req = makeClient(db);
    const { conversations } = await body<{ conversations: Array<{ title: string }> }>(
      await req("u1", "/api/conversations"),
    );
    expect(conversations[0].title).toBe("New chat");
  });

  it("opens a conversation for its owner and 404s for everyone else", async () => {
    const db = makeDb();
    db.seedConv({ id: "c1", user_id: "u1", last_message_at: "2026-06-10 10:00:00" });
    db.seedMsg({ id: "m1", conversation_id: "c1", role: "user", content: "hi" });
    const req = makeClient(db);

    const owner = await req("u1", "/api/conversations/c1");
    expect(owner.status).toBe(200);
    expect((await body<{ messages: unknown[] }>(owner)).messages.length).toBe(1);

    expect((await req("u2", "/api/conversations/c1")).status).toBe(404);
    expect((await req("u1", "/api/conversations/nope")).status).toBe(404);
  });

  it("deletes only the owner's conversation; non-owner and repeat are 404", async () => {
    const db = makeDb();
    db.seedConv({ id: "c1", user_id: "u1", last_message_at: "2026-06-10 10:00:00" });
    const req = makeClient(db);

    expect((await req("u2", "/api/conversations/c1", { method: "DELETE" })).status).toBe(404);
    const ok = await req("u1", "/api/conversations/c1", { method: "DELETE" });
    expect(ok.status).toBe(200);
    expect((await req("u1", "/api/conversations/c1", { method: "DELETE" })).status).toBe(404);
  });

  it("still routes /conversations/current to the current handler (not :id)", async () => {
    const db = makeDb();
    db.seedConv({ id: "c1", user_id: "u1", last_message_at: "2026-06-10 10:00:00" });
    const req = makeClient(db);
    const r = await req("u1", "/api/conversations/current?engine=kai");
    expect(r.status).toBe(200);
    const data = await body<{ conversationId: string | null }>(r);
    expect(data.conversationId).toBe("c1"); // resolved as "current", not a 404 from :id
  });
});
