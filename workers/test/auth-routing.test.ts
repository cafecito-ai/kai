import { describe, expect, it } from "vitest";
import app from "../src/index";

describe("worker auth routing", () => {
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
});
