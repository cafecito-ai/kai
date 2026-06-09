import { describe, expect, it } from "vitest";
import app from "../src/index";

describe("worker auth routing", () => {
  it("keeps API health public for the production route binding", async () => {
    const res = await app.fetch(new Request("https://worker.test/api/health"), { APP_ENV: "production" } as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, service: "kai-api" });
  });

  it("keeps parent consent links public", async () => {
    const res = await app.fetch(new Request("https://worker.test/api/parent/consent"), {} as never);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("missing a token");
  });

  it("protects normal API routes without a session", async () => {
    const res = await app.fetch(new Request("https://worker.test/api/user/me"), { APP_ENV: "production" } as never);
    expect(res.status).toBe(401);
  });

  it("rejects x-dev-user header in production", async () => {
    const res = await app.fetch(new Request("https://worker.test/api/ops/safety-events", { headers: { "x-dev-user": "demo-teen" } }), {
      APP_ENV: "production"
    } as never);
    expect(res.status).toBe(401);
  });

  it("rejects x-dev-user header when APP_ENV is unset (defaults to safe)", async () => {
    const res = await app.fetch(new Request("https://worker.test/api/user/me", { headers: { "x-dev-user": "demo-teen" } }), {} as never);
    expect(res.status).toBe(401);
  });

  it("accepts x-dev-user header in non-production (auth gate passes through)", async () => {
    // Target a 404 route so the auth gate is the only middleware that runs.
    const res = await app.fetch(new Request("https://worker.test/api/nonexistent", { headers: { "x-dev-user": "demo-teen" } }), {
      APP_ENV: "staging"
    } as never);
    expect(res.status).toBe(404);
  });

  it("does not mark under-18 profile updates as pending consent", async () => {
    const statements: Array<{ sql: string; values: unknown[] }> = [];
    const res = await app.fetch(
      new Request("https://worker.test/api/user/me", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-dev-user": "demo-teen"
        },
        body: JSON.stringify({ age: 15, onboardingCompleted: true })
      }),
      makeEnv({ statements })
    );

    expect(res.status).toBe(200);
    const update = statements.find((statement) =>
      statement.sql.includes("INSERT INTO users")
    );
    expect(update?.sql).toContain("'not_required'");
    expect(update?.sql).not.toContain("THEN 'pending'");
    expect(update?.values).toEqual([
      "demo-teen",
      null,
      null,
      15,
      null,
      null,
      null,
      null,
      1,
      1
    ]);
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
              }
            };
          }
        };
      }
    }
  } as never;
}
