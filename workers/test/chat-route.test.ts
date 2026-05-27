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
    expect(body.nextAction).toMatchObject({ id: "sleep", route: "/task/sleep" });

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
    expect(body.nextAction).toMatchObject({ id: "scan", route: "/task/scan" });
  });

  it("tightens generic model fallback when the user clearly needs an action", async () => {
    const aiReplies = [
      '{"category":"none","severity":"low","explanation":"no safety signal"}',
      "Want to talk it out or pick a reset? If you want to talk it out, I'm here to listen."
    ];
    const res = await app.fetch(
      new Request("https://worker.test/api/kai/chat", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dev-user": "chat-tester" },
        body: JSON.stringify({ message: "The group chat made me feel left out" })
      }),
      makeEnv({
        firstRows: [{}, {}, {}],
        aiRun: async () => ({ response: aiReplies.shift() ?? "" })
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { reply: string; nextAction: { id: string; route: string } };
    expect(body.nextAction).toMatchObject({ id: "social", route: "/task/social" });
    expect(body.reply).toContain("A calm social boundary is the move.");
    expect(body.reply).not.toContain("Want to talk it out or pick a reset?");
    expect(body.reply).toContain("Open Social");
  });

  it("replaces off-topic clear-intent replies with the matching action copy", async () => {
    const aiReplies = [
      '{"category":"none","severity":"low","explanation":"no safety signal"}',
      "Group chat and social pressure can be tough to deal with. Maybe set a boundary."
    ];
    const res = await app.fetch(
      new Request("https://worker.test/api/kai/chat", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dev-user": "chat-tester" },
        body: JSON.stringify({ message: "I keep doomscrolling and comparing myself" })
      }),
      makeEnv({
        firstRows: [{}, {}, {}],
        aiRun: async () => ({ response: aiReplies.shift() ?? "" })
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { reply: string; nextAction: { id: string; route: string } };
    expect(body.nextAction).toMatchObject({ id: "screen", route: "/task/screen" });
    expect(body.reply).toContain("Screen reset is the move.");
    expect(body.reply).toContain("Open Screen reset.");
  });

  it("replaces topical but non-actionable clear-intent replies", async () => {
    const aiReplies = [
      '{"category":"none","severity":"low","explanation":"no safety signal"}',
      "Practice is coming up, and you're wondering about food. What's your current fuel situation like? Did you eat something yet?"
    ];
    const res = await app.fetch(
      new Request("https://worker.test/api/kai/chat", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dev-user": "chat-tester" },
        body: JSON.stringify({ message: "I have practice later and do not know what to eat" })
      }),
      makeEnv({
        firstRows: [{}, {}, {}],
        aiRun: async () => ({ response: aiReplies.shift() ?? "" })
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { reply: string; nextAction: { id: string; route: string } };
    expect(body.nextAction).toMatchObject({ id: "food", route: "/task/food" });
    expect(body.reply).toContain("Fuel check is the move.");
    expect(body.reply).toContain("Open Food");
    expect(body.reply).not.toContain("What's your current fuel situation");
  });

  it("does not treat naming the action as enough to route the teen", async () => {
    const aiReplies = [
      '{"category":"none","severity":"low","explanation":"no safety signal"}',
      "Body scan makes sense here. This is about comfort and confidence, not body judgment."
    ];
    const res = await app.fetch(
      new Request("https://worker.test/api/kai/chat", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dev-user": "chat-tester" },
        body: JSON.stringify({ message: "Can Kai check my posture and alignment?" })
      }),
      makeEnv({
        firstRows: [{}, {}, {}],
        aiRun: async () => ({ response: aiReplies.shift() ?? "" })
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { reply: string; nextAction: { id: string; route: string } };
    expect(body.nextAction).toMatchObject({ id: "scan", route: "/task/scan" });
    expect(body.reply).toContain("Private body scan is the move.");
    expect(body.reply).toContain("Open Body scan");
  });

  it("adds action-specific guide concepts to the model prompt", async () => {
    let capturedPrompt = "";
    const aiReplies = [
      '{"category":"none","severity":"low","explanation":"no safety signal"}',
      "Confidence proof is the move. Pick one tiny rep that gives you evidence."
    ];
    const res = await app.fetch(
      new Request("https://worker.test/api/kai/chat", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dev-user": "chat-tester" },
        body: JSON.stringify({ message: "I feel insecure and not good enough" })
      }),
      makeEnv({
        firstRows: [{}, {}, {}],
        aiRun: async (_model, input) => {
          const prompt = typeof input === "object" && input && "prompt" in input ? String((input as { prompt?: unknown }).prompt ?? "") : "";
          if (prompt.includes("GUIDE CONCEPTS FOR THIS TURN")) capturedPrompt = prompt;
          return { response: aiReplies.shift() ?? "" };
        }
      })
    );

    expect(res.status).toBe(200);
    expect(capturedPrompt).toContain("GUIDE CONCEPTS FOR THIS TURN");
    expect(capturedPrompt).toContain("confidence comes from repeated evidence");
    expect(capturedPrompt).toContain("Viktor Frankl");
    expect(capturedPrompt).toContain("Do not dump the list");
    expect(capturedPrompt).not.toContain("posture and alignment are private signals");
  });

  it("understands common emotional typos before safety and routing", async () => {
    let capturedChatPrompt = "";
    const aiReplies = [
      '{"category":"none","severity":"low","explanation":"no safety signal"}',
      "I read that as depressed. That is heavy. What has been driving it most lately?"
    ];
    const res = await app.fetch(
      new Request("https://worker.test/api/kai/chat", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dev-user": "chat-tester" },
        body: JSON.stringify({ message: "I’m delressed" })
      }),
      makeEnv({
        firstRows: [{}, {}, {}],
        aiRun: async (_model, input) => {
          const prompt = typeof input === "object" && input && "prompt" in input ? String((input as { prompt?: unknown }).prompt ?? "") : "";
          if (prompt.includes("Conversation:")) capturedChatPrompt = prompt;
          return { response: aiReplies.shift() ?? "" };
        }
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { reply: string; nextAction: { id: string; route: string } };
    expect(body.nextAction).toMatchObject({ id: "talk", route: "/task/talk" });
    expect(body.reply).toContain("depressed");
    expect(capturedChatPrompt).toContain("depressed");
    expect(capturedChatPrompt).toContain("I’m delressed");
    expect(capturedChatPrompt).toContain("Kai note");
  });
});

function makeEnv(opts: {
  statements?: Array<{ sql: string; values: unknown[] }>;
  firstRows?: Array<Record<string, unknown>>;
  allResults?: Array<Record<string, unknown>>;
  aiRun?: (model: string, input: unknown) => Promise<{ response?: string; text?: string }>;
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
    },
    AI_TEXT_MODEL: "@cf/test",
    AI: {
      run: opts.aiRun ?? (async () => ({ response: "" }))
    }
  };
}
