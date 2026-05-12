import { describe, expect, it } from "vitest";
import { rateLimit, rateLimitKey, shouldAllow } from "../src/lib/rate-limit";
import type { Env } from "../src/types";

describe("rateLimitKey", () => {
  it("buckets all requests inside one window to the same key", () => {
    const period = 60;
    const t0 = new Date("2026-05-12T12:00:00Z").getTime();
    const t30 = new Date("2026-05-12T12:00:30Z").getTime();
    expect(rateLimitKey("chat", "user-a", t0, period)).toBe(rateLimitKey("chat", "user-a", t30, period));
  });

  it("crosses to a new key at the window boundary", () => {
    const period = 60;
    const inWindow = new Date("2026-05-12T12:00:59Z").getTime();
    const nextWindow = new Date("2026-05-12T12:01:00Z").getTime();
    expect(rateLimitKey("chat", "user-a", inWindow, period)).not.toBe(rateLimitKey("chat", "user-a", nextWindow, period));
  });

  it("keys are scoped per user and per route", () => {
    const period = 60;
    const t = new Date("2026-05-12T12:00:00Z").getTime();
    expect(rateLimitKey("chat", "user-a", t, period)).not.toBe(rateLimitKey("chat", "user-b", t, period));
    expect(rateLimitKey("chat", "user-a", t, period)).not.toBe(rateLimitKey("consent_request", "user-a", t, period));
  });
});

describe("shouldAllow", () => {
  it("permits requests under the limit", () => {
    expect(shouldAllow(0, 30)).toBe(true);
    expect(shouldAllow(29, 30)).toBe(true);
  });

  it("blocks at and over the limit", () => {
    expect(shouldAllow(30, 30)).toBe(false);
    expect(shouldAllow(99, 30)).toBe(false);
  });
});

// Tiny in-memory KV stub so the integration shape is covered without miniflare.
function makeKvStub(): KVNamespace {
  const store = new Map<string, string>();
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
    async delete(key: string) {
      store.delete(key);
    },
    async list() {
      return { keys: [...store.keys()].map((name) => ({ name })), list_complete: true, cursor: "" };
    },
    async getWithMetadata() {
      return { value: null, metadata: null };
    }
  } as unknown as KVNamespace;
}

describe("rateLimit", () => {
  const config = { route: "chat", limit: 3, periodSeconds: 60 } as const;

  it("permits the first N requests and blocks the (N+1)th in the same window", async () => {
    const env = { SESSIONS_KV: makeKvStub() } as Env;
    const r1 = await rateLimit(env, "user-a", config);
    const r2 = await rateLimit(env, "user-a", config);
    const r3 = await rateLimit(env, "user-a", config);
    const r4 = await rateLimit(env, "user-a", config);
    expect([r1.allowed, r2.allowed, r3.allowed, r4.allowed]).toEqual([true, true, true, false]);
    expect(r1.remaining).toBe(2);
    expect(r3.remaining).toBe(0);
  });

  it("isolates counters between users", async () => {
    const env = { SESSIONS_KV: makeKvStub() } as Env;
    await rateLimit(env, "user-a", config);
    await rateLimit(env, "user-a", config);
    await rateLimit(env, "user-a", config); // user-a now at limit
    const userB = await rateLimit(env, "user-b", config);
    expect(userB.allowed).toBe(true);
  });

  it("fails open when SESSIONS_KV is not bound", async () => {
    const env = {} as Env;
    const result = await rateLimit(env, "user-a", config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(config.limit);
  });
});
