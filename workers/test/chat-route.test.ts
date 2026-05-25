import { describe, expect, it } from "vitest";
import app from "../src/index";

describe("chat routes", () => {
  it("persists tool completions into the Kai conversation", async () => {
    const statements: Array<{ sql: string; values: unknown[] }> = [];
    const res = await app.fetch(
      new Request("https://worker.test/api/conversations/tool-completion", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dev-user": "chat-tester" },
        body: JSON.stringify({
          conversationId: "kai-conv",
          title: "Log sleep",
          summary: "Recovery is logged. Protect tonight before adding more effort.",
          nextActionId: "sleep"
        })
      }),
      makeEnv({
        statements,
        firstRows: [{ id: "kai-conv" }]
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { conversationId: string; message: { content: string }; nextAction: { id: string; route: string } };
    expect(body.conversationId).toBe("kai-conv");
    expect(body.message.content).toBe("Log sleep saved. Recovery is logged. Protect tonight before adding more effort.");
    expect(body.nextAction).toMatchObject({ id: "sleep", route: "/health?module=movement&action=sleep" });

    const messageInsert = statements.find((statement) => statement.sql.includes("INSERT INTO messages"));
    expect(messageInsert?.values[2]).toBe("assistant");
    expect(messageInsert?.values[3]).toBe(body.message.content);
    expect(String(messageInsert?.values[4])).toContain("\"source\":\"tool_completion\"");
    expect(String(messageInsert?.values[4])).toContain("\"id\":\"sleep\"");
  });

  it("returns the latest persisted next action when hydrating a conversation", async () => {
    const res = await app.fetch(
      new Request("https://worker.test/api/conversations/current?engine=kai", {
        headers: { "x-dev-user": "chat-tester" }
      }),
      makeEnv({
        firstRows: [
          { id: "kai-conv", engine: "kai", last_message_at: "2026-05-25T12:00:00Z" },
          { id: "kai-conv" }
        ],
        allResults: [
          {
            id: "m1",
            role: "assistant",
            content: "Body scan saved. No body score, no comparison.",
            metadata: JSON.stringify({ source: "tool_completion", nextAction: { id: "scan" } }),
            created_at: "2026-05-25T12:00:00Z"
          }
        ]
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { conversationId: string; messages: Array<{ content: string }>; nextAction: { id: string; route: string } };
    expect(body.conversationId).toBe("kai-conv");
    expect(body.messages[0]?.content).toBe("Body scan saved. No body score, no comparison.");
    expect(body.nextAction).toMatchObject({ id: "scan", route: "/health?module=scan&action=scan" });
  });
});

function makeEnv(opts: {
  statements?: Array<{ sql: string; values: unknown[] }>;
  firstRows?: Array<Record<string, unknown>>;
  allResults?: Array<Record<string, unknown>>;
} = {}) {
  const firstRows = [...(opts.firstRows ?? [])];
  return {
    APP_ENV: "staging",
    DB: {
      prepare(sql: string) {
        return {
          bind(...values: unknown[]) {
            return {
              async run() {
                opts.statements?.push({ sql, values });
                return {};
              },
              async first() {
                return firstRows.shift() ?? null;
              },
              async all() {
                return { results: opts.allResults ?? [] };
              }
            };
          }
        };
      }
    },
    PROGRESS_KV: {
      get: async () => null,
      put: async () => undefined
    },
    SESSIONS_KV: {
      get: async () => null,
      put: async () => undefined
    }
  };
}
