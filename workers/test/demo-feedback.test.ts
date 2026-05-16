import { describe, expect, it } from "vitest";
import app from "../src/index";
import { parseDemoFeedback } from "../src/routes/demo";

const validPayload = {
  sessionId: "demo-session",
  choices: {
    ui: "Calm Coach",
    habit: "Food Camera",
    onboarding: "Fast Start",
    parent: "Safety-only"
  },
  summary: "Build Kai as Calm Coach with Food Camera."
};

describe("parseDemoFeedback", () => {
  it("accepts the guided sprint payload", () => {
    const parsed = parseDemoFeedback(validPayload);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.choices.habit).toBe("Food Camera");
  });

  it("rejects unknown choices", () => {
    const parsed = parseDemoFeedback({
      ...validPayload,
      choices: { ...validPayload.choices, habit: "Calorie scoreboard" }
    });
    expect(parsed).toEqual({ ok: false, error: "Invalid habit choice" });
  });
});

describe("demo feedback routes", () => {
  it("lets public demo visitors save structured feedback", async () => {
    const statements: Array<{ sql: string; values: unknown[] }> = [];
    const env = makeEnv({ statements });
    const res = await app.fetch(
      new Request("https://worker.test/api/demo-feedback", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "content-type": "application/json" }
      }),
      env
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; id: string };
    expect(body.ok).toBe(true);
    expect(body.id).toBeTruthy();
    const insert = statements.find((statement) => statement.sql.includes("INSERT INTO demo_feedback"));
    expect(insert).toBeTruthy();
    expect(insert?.values[1]).toBeNull();
    expect(insert?.values[2]).toBe("demo-session");
  });

  it("rejects invalid public feedback before writing", async () => {
    const statements: Array<{ sql: string; values: unknown[] }> = [];
    const res = await app.fetch(
      new Request("https://worker.test/api/demo-feedback", {
        method: "POST",
        body: JSON.stringify({ ...validPayload, summary: "" }),
        headers: { "content-type": "application/json" }
      }),
      makeEnv({ statements })
    );

    expect(res.status).toBe(400);
    expect(statements).toHaveLength(0);
  });

  it("lists feedback for ops users", async () => {
    const env = makeEnv({
      rows: [
        {
          id: "feedback-1",
          user_id: null,
          session_id: "demo-session",
          choices_json: JSON.stringify(validPayload.choices),
          summary: validPayload.summary,
          user_agent: "vitest",
          created_at: "2026-05-16 10:00:00"
        }
      ]
    });

    const res = await app.fetch(
      new Request("https://worker.test/api/ops/demo-feedback", {
        headers: { "x-dev-user": "ops" }
      }),
      env
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { feedback: Array<{ choices: { ui: string } }> };
    expect(body.feedback[0].choices.ui).toBe("Calm Coach");
  });
});

function makeEnv(opts: { statements?: Array<{ sql: string; values: unknown[] }>; rows?: Array<Record<string, unknown>> } = {}) {
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
              async all() {
                return { results: opts.rows ?? [] };
              }
            };
          },
          async run() {
            opts.statements?.push({ sql, values: [] });
            return {};
          },
          async all() {
            return { results: opts.rows ?? [] };
          }
        };
      }
    }
  } as never;
}
