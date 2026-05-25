import { describe, expect, it } from "vitest";
import app from "../src/index";

describe("goal routes", () => {
  it("persists a normalized target date when creating a goal", async () => {
    const statements: Array<{ sql: string; values: unknown[] }> = [];
    const res = await app.fetch(
      new Request("https://worker.test/api/goals", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dev-user": "goal-tester" },
        body: JSON.stringify({
          category: "school",
          title: " Finish homework ",
          description: "One assignment at a time.",
          targetDate: "2026-06-02"
        })
      }),
      makeEnv({ statements })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { goal: { title: string; targetDate: string } };
    expect(body.goal.title).toBe("Finish homework");
    expect(body.goal.targetDate).toBe("2026-06-02");
    const insert = statements.find((statement) => statement.sql.includes("INSERT INTO goals"));
    expect(insert?.values[7]).toBe("2026-06-02");
  });

  it("can clear a next action when releasing a goal", async () => {
    const statements: Array<{ sql: string; values: unknown[] }> = [];
    const res = await app.fetch(
      new Request("https://worker.test/api/goals/g1", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-dev-user": "goal-tester" },
        body: JSON.stringify({ status: "released", nextAction: null, description: "This goal is not mine anymore." })
      }),
      makeEnv({
        statements,
        firstRows: [
          {
            id: "g1",
            user_id: "goal-tester",
            category: "school",
            title: "Homework",
            description: "Old",
            why_it_matters: "Keep one promise.",
            next_action: "Do ten minutes.",
            target_date: "2026-06-02",
            status: "active",
            confidence: null,
            created_at: "2026-05-24T00:00:00Z",
            updated_at: "2026-05-24T00:00:00Z",
            achieved_at: null
          },
          {
            id: "g1",
            user_id: "goal-tester",
            category: "school",
            title: "Homework",
            description: "This goal is not mine anymore.",
            why_it_matters: "Keep one promise.",
            next_action: null,
            target_date: "2026-06-02",
            status: "released",
            confidence: null,
            created_at: "2026-05-24T00:00:00Z",
            updated_at: "2026-05-24T00:00:00Z",
            achieved_at: null
          }
        ]
      })
    );

    expect(res.status).toBe(200);
    const update = statements.find((statement) => statement.sql.includes("UPDATE goals"));
    expect(update?.values[0]).toBe("released");
    expect(update?.values[4]).toBeNull();
    const body = (await res.json()) as { goal: { status: string; nextAction: string | null } };
    expect(body.goal.status).toBe("released");
    expect(body.goal.nextAction).toBeNull();
  });
});

function makeEnv(opts: {
  statements?: Array<{ sql: string; values: unknown[] }>;
  firstRows?: Array<Record<string, unknown>>;
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
                return { results: [] };
              }
            };
          }
        };
      }
    },
    SESSION_KV: {
      get: async () => null,
      put: async () => undefined
    },
    PROGRESS_KV: {
      get: async () => null,
      put: async () => undefined
    }
  };
}
