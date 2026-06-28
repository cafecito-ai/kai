// PR 1 (voice-first onboarding) — /api/onboarding/converse.
//
// Covers the structured-extraction parser (mirrors goal-timeline / northstar
// parser tests) and the safety short-circuit: a crisis message must hand off to
// 988 via the regex fast path WITHOUT calling the conversational model.

import { describe, expect, it } from "vitest";
import app from "../src/index";
import { parseConverseResult } from "../src/routes/onboarding";

describe("parseConverseResult", () => {
  it("parses a well-formed turn (line + extraction delta)", () => {
    const r = parseConverseResult(
      '{"kaiLine":"Football, nice — that gives us a real target.","done":false,"delta":{"firstName":"Leo","primaryGoal":"get stronger for football","focusAreas":["getting_stronger"],"motivation":"football","emotionalMotivation":"confidence","timeframe":"before the season","tone":"direct","blocker":null,"identityStatement":null,"originStory":null}}',
    );
    expect(r?.kaiLine).toContain("Football");
    expect(r?.done).toBe(false);
    expect(r?.delta.firstName).toBe("Leo");
    expect(r?.delta.motivation).toBe("football");
    expect(r?.delta.tone).toBe("direct");
    expect(r?.delta.focusAreas).toEqual(["getting_stronger"]);
  });

  it("pulls the object out of surrounding prose / markdown fences", () => {
    const r = parseConverseResult(
      'Sure:\n```json\n{"kaiLine":"Got it.","done":true,"delta":{"firstName":"Mia"}}\n```\nhope that helps',
    );
    expect(r?.kaiLine).toBe("Got it.");
    expect(r?.done).toBe(true);
    expect(r?.delta.firstName).toBe("Mia");
  });

  it("drops invalid fields instead of propagating junk", () => {
    const r = parseConverseResult(
      '{"kaiLine":"ok","done":false,"delta":{"tone":"aggressive","focusAreas":"sleep","firstName":123}}',
    );
    expect(r).not.toBeNull();
    expect(r?.delta.tone).toBeNull(); // not a valid enum value
    expect(r?.delta.focusAreas).toEqual([]); // not an array
    expect(r?.delta.firstName).toBeNull(); // not a string
  });

  it("accepts a line with no extraction", () => {
    const r = parseConverseResult('{"kaiLine":"Tell me more about that.","done":false,"delta":{}}');
    expect(r?.kaiLine).toContain("Tell me more");
  });

  it("returns null on malformed / empty output", () => {
    expect(parseConverseResult("no json here")).toBeNull();
    expect(parseConverseResult("")).toBeNull();
    // A turn with neither a line nor any extraction is useless → null.
    expect(parseConverseResult('{"kaiLine":"","done":false,"delta":{}}')).toBeNull();
  });
});

describe("POST /api/onboarding/converse — safety short-circuit", () => {
  // Minimal env: x-dev-user auth (staging) needs a DB for ensureUserForWrite.
  const stmt = {
    bind: () => stmt,
    run: async () => ({}),
    first: async () => null,
    all: async () => ({ results: [] }),
  };
  const env = { APP_ENV: "staging", DB: { prepare: () => stmt } } as never;

  it("hands off to 988 on a crisis message without calling the model", async () => {
    const res = await app.fetch(
      new Request("https://worker.test/api/onboarding/converse", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dev-user": "tester-1" },
        body: JSON.stringify({ transcript: [], latestUserMessage: "I want to kill myself" }),
      }),
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { safety: { safe: boolean }; kaiLine: string; done: boolean };
    expect(body.safety.safe).toBe(false);
    expect(body.kaiLine).toContain("988");
    expect(body.done).toBe(true);
  });

  it("400s an empty message", async () => {
    const res = await app.fetch(
      new Request("https://worker.test/api/onboarding/converse", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dev-user": "tester-1" },
        body: JSON.stringify({ transcript: [], latestUserMessage: "   " }),
      }),
      env,
    );
    expect(res.status).toBe(400);
  });
});
