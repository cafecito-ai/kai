import { describe, expect, it } from "vitest";
import {
  deterministicSummary,
  keywordRouteEngine,
  parseEngineRouting,
  routeEngineFromSummary,
  summarizeIntake
} from "../src/lib/intake";
import type { Env } from "../src/types";

describe("parseEngineRouting", () => {
  it("accepts a clean response", () => {
    const result = parseEngineRouting('{"engine":"mental","reasoning":"You mentioned a lot of social pressure."}');
    expect(result).toEqual({ engine: "mental", reasoning: "You mentioned a lot of social pressure." });
  });

  it("strips chatty preamble and markdown fences", () => {
    const raw = 'Here is my pick:\n```json\n{"engine":"physical","reasoning":"sleep is off"}\n```';
    expect(parseEngineRouting(raw)).toEqual({ engine: "physical", reasoning: "sleep is off" });
  });

  it("returns null for an unknown engine", () => {
    expect(parseEngineRouting('{"engine":"made_up","reasoning":"x"}')).toBeNull();
  });

  it("returns null when reasoning is missing or empty", () => {
    expect(parseEngineRouting('{"engine":"mental"}')).toBeNull();
    expect(parseEngineRouting('{"engine":"mental","reasoning":""}')).toBeNull();
    expect(parseEngineRouting('{"engine":"mental","reasoning":"   "}')).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseEngineRouting("not json")).toBeNull();
    expect(parseEngineRouting('{"engine":"mental",')).toBeNull();
  });
});

describe("keywordRouteEngine", () => {
  it("routes goal-language to potential", () => {
    const result = keywordRouteEngine({ q1: "I want to make varsity soccer", q2: "", q3: "", q4: "", q5: "practice more", q6: "7" });
    expect(result.engine).toBe("potential");
    expect(result.reasoning).toMatch(/goal|skill/i);
  });

  it("routes to mental when emotional-pressure language is present", () => {
    const result = keywordRouteEngine({ q1: "everything feels overwhelming", q2: "social media", q3: "", q4: "stress", q5: "", q6: "3" });
    expect(result.engine).toBe("mental");
    expect(result.reasoning).toMatch(/feeling|emotionally/i);
  });

  it("falls through to physical when nothing else matches", () => {
    const result = keywordRouteEngine({ q1: "I sleep ok", q2: "", q3: "", q4: "", q5: "", q6: "5" });
    expect(result.engine).toBe("physical");
    expect(result.reasoning).toMatch(/body|sleep|food|movement/i);
  });
});

describe("deterministicSummary", () => {
  it("concatenates the first three non-empty answers", () => {
    const result = deterministicSummary({ q1: "wake up at 7", q2: "school", q3: "", q4: "soccer", q5: "tired", q6: "6" });
    expect(result).toBe("wake up at 7 school soccer");
  });

  it("returns empty string when all answers are empty", () => {
    expect(deterministicSummary({ q1: "", q2: "", q3: "" })).toBe("");
  });
});

function makeFakeEnv(opts: {
  summaryResponse?: string;
  routingResponse?: string;
  failSummary?: boolean;
  failRouting?: boolean;
  noAI?: boolean;
}): Env {
  if (opts.noAI) return {} as Env;
  return {
    AI: {
      async run(_model: string, input: Record<string, unknown>) {
        const prompt = String(input.prompt ?? "");
        const isRouting = prompt.includes("Agents:");
        if (isRouting) {
          if (opts.failRouting) throw new Error("routing model down");
          return { response: opts.routingResponse ?? '{"engine":"physical","reasoning":"default"}' };
        }
        if (opts.failSummary) throw new Error("summary model down");
        return { response: opts.summaryResponse ?? "A teen who is tired and a little stressed. Wants more time for music. Could use a steady check-in." };
      }
    }
  } as unknown as Env;
}

describe("summarizeIntake", () => {
  it("returns the LLM summary on success", async () => {
    const env = makeFakeEnv({ summaryResponse: "Three sentences here. About the teen. Useful summary." });
    const result = await summarizeIntake(env, { q1: "a", q2: "b" });
    expect(result).toBe("Three sentences here. About the teen. Useful summary.");
  });

  it("returns null on LLM error", async () => {
    const env = makeFakeEnv({ failSummary: true });
    const result = await summarizeIntake(env, { q1: "a" });
    expect(result).toBeNull();
  });

  it("returns null when no AI binding is present", async () => {
    const env = makeFakeEnv({ noAI: true });
    const result = await summarizeIntake(env, { q1: "a" });
    expect(result).toBeNull();
  });

  it("caps overly long output at 800 chars", async () => {
    const long = "x".repeat(2000);
    const env = makeFakeEnv({ summaryResponse: long });
    const result = await summarizeIntake(env, { q1: "a" });
    expect(result?.length).toBe(800);
  });
});

describe("routeEngineFromSummary", () => {
  it("parses a valid LLM response", async () => {
    const env = makeFakeEnv({ routingResponse: '{"engine":"mental","reasoning":"There is a lot of social pressure."}' });
    const result = await routeEngineFromSummary(env, "summary");
    expect(result).toEqual({ engine: "mental", reasoning: "There is a lot of social pressure." });
  });

  it("returns null on LLM error", async () => {
    const env = makeFakeEnv({ failRouting: true });
    const result = await routeEngineFromSummary(env, "summary");
    expect(result).toBeNull();
  });

  it("returns null when the LLM returns malformed JSON", async () => {
    const env = makeFakeEnv({ routingResponse: "no JSON here" });
    const result = await routeEngineFromSummary(env, "summary");
    expect(result).toBeNull();
  });

  it("returns null when no AI binding is present", async () => {
    const env = makeFakeEnv({ noAI: true });
    const result = await routeEngineFromSummary(env, "summary");
    expect(result).toBeNull();
  });
});
