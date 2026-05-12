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

  it("allows production review users without ops access", async () => {
    const res = await app.fetch(new Request("https://worker.test/api/ops/safety-events", { headers: { "x-dev-user": "demo-teen" } }), {
      APP_ENV: "production"
    } as never);
    expect(res.status).toBe(403);
  });
});
