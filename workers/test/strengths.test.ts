import { describe, expect, it } from "vitest";
import { countAnswered, deterministicStrengthsSummary, summarizeStrengths } from "../src/lib/strengths";
import type { Env } from "../src/types";

describe("countAnswered", () => {
  it("counts only non-empty trimmed responses", () => {
    expect(countAnswered({ q01: "yes", q02: "", q03: "   ", q05: "another" })).toBe(2);
  });

  it("ignores unknown ids", () => {
    expect(countAnswered({ q01: "yes", q99: "ignored", "not-a-real-id": "ignored" })).toBe(1);
  });

  it("returns 0 for empty input", () => {
    expect(countAnswered({})).toBe(0);
  });
});

describe("deterministicStrengthsSummary", () => {
  it("stitches the first three non-empty answers", () => {
    const result = deterministicStrengthsSummary({ q01: "music", q02: "", q03: "writing", q04: "", q05: "fixing things" });
    expect(result).toContain("music");
    expect(result).toContain("writing");
    expect(result).toContain("fixing things");
    expect(result).toContain("Working draft");
  });

  it("returns empty string when nothing was answered", () => {
    expect(deterministicStrengthsSummary({})).toBe("");
  });
});

function makeFakeEnv(opts: { response?: string; fail?: boolean; noAI?: boolean }): Env {
  if (opts.noAI) return {} as Env;
  return {
    AI: {
      async run() {
        if (opts.fail) throw new Error("model down");
        return { response: opts.response ?? "Three sentences from Kai. About the teen. Useful summary." };
      }
    }
  } as unknown as Env;
}

describe("summarizeStrengths", () => {
  it("returns the LLM summary on success", async () => {
    const env = makeFakeEnv({ response: "You light up when you're fixing things. Your energy follows curiosity. Try a small repair project this week. Draft only." });
    const result = await summarizeStrengths(env, { q01: "fixing", q02: "tinkering" });
    expect(result).toContain("fixing");
  });

  it("returns null on LLM failure", async () => {
    const env = makeFakeEnv({ fail: true });
    const result = await summarizeStrengths(env, { q01: "x" });
    expect(result).toBeNull();
  });

  it("returns null when no AI binding is present", async () => {
    const env = makeFakeEnv({ noAI: true });
    const result = await summarizeStrengths(env, { q01: "x" });
    expect(result).toBeNull();
  });

  it("returns null when no answers were provided", async () => {
    const env = makeFakeEnv({});
    const result = await summarizeStrengths(env, {});
    expect(result).toBeNull();
  });

  it("caps overly long output at 1200 chars", async () => {
    const env = makeFakeEnv({ response: "x".repeat(3000) });
    const result = await summarizeStrengths(env, { q01: "x" });
    expect(result?.length).toBe(1200);
  });
});
