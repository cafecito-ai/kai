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
});
