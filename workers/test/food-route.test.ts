import { describe, expect, it } from "vitest";
import app from "../src/index";

describe("food routes", () => {
  it("ensures the user before saving a manual meal", async () => {
    const statements: Array<{ sql: string; values: unknown[] }> = [];
    const res = await app.fetch(
      new Request("https://worker.test/api/food-photo", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dev-user": "food-tester" },
        body: JSON.stringify({ note: "Turkey sandwich, apple, water" })
      }),
      makeEnv({ statements })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { mealId: string; items: Array<{ name: string }>; confidence: string };
    expect(body.mealId).toBeTruthy();
    expect(body.confidence).toBe("manual_stub");
    expect(body.items.map((item) => item.name)).toEqual(["Turkey sandwich", "apple", "water"]);

    expect(statements[0]?.sql).toContain("INSERT OR IGNORE INTO users");
    expect(statements[0]?.values[0]).toBe("food-tester");
    const mealInsert = statements.find((statement) => statement.sql.includes("INSERT INTO meals"));
    expect(mealInsert?.values[1]).toBe("food-tester");
    expect(mealInsert?.values[3]).toContain("Turkey sandwich");
  });
});

function makeEnv(opts: { statements?: Array<{ sql: string; values: unknown[] }> } = {}) {
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
                return null;
              },
              async all() {
                return { results: [] };
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
