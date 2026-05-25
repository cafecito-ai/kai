import { describe, expect, it } from "vitest";
import app from "../src/index";

describe("body scan route", () => {
  it("saves a private scan entry and ensures the user", async () => {
    const statements: Array<{ sql: string; values: unknown[] }> = [];
    const res = await app.fetch(
      new Request("https://worker.test/api/body-scan-upload", {
        method: "POST",
        headers: { "x-dev-user": "scan-tester" },
        body: new FormData()
      }),
      makeEnv({ statements })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { scan: { analysis: { guardrails: string[] } }; entry: { entryType: string; payload: { labels: string[] } } };
    expect(body.entry.entryType).toBe("body_scan");
    expect(body.scan.analysis.guardrails).toContain("no body score");
    expect(body.entry.payload.labels).toContain("no_body_score");
    expect(statements[0]?.sql).toContain("INSERT OR IGNORE INTO users");
    expect(statements[0]?.values[0]).toBe("scan-tester");
    expect(statements.some((statement) => statement.sql.includes("INSERT INTO engine_entries"))).toBe(true);
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
    UPLOADS: {
      put: async () => undefined
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
