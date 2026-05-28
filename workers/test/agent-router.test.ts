// Agent router tests — verifies the routing classifier returns mental /
// physical / unclear correctly, collapses unclear → mental, and stays
// graceful when the model errors or is absent.
//
// The real LLM is mocked: each test sets up a fake env.AI.run that returns
// a canned response. The 30-message accuracy claim in AGENT_PLAN T-006
// Done_when is a statistical/deployment-time check; this suite covers the
// router contract and is paired with a separate deployed-staging sweep
// (logged in DECISIONS.md alongside this task).

import { describe, expect, it, vi } from "vitest";
import { classifyRoute, pickAgent } from "../src/lib/agent-router";
import type { Env } from "../src/types";

function mockEnv(response: string): Env {
  return {
    AI: {
      run: vi.fn().mockResolvedValue({ response }),
    },
    AI_TEXT_MODEL: "@cf/meta/llama-3.1-8b-instruct",
  } as unknown as Env;
}

function mockEnvThatThrows(): Env {
  return {
    AI: {
      run: vi.fn().mockRejectedValue(new Error("model down")),
    },
  } as unknown as Env;
}

describe("classifyRoute (raw three-value classifier)", () => {
  it("parses 'mental' from the model", async () => {
    const env = mockEnv("mental");
    expect(await classifyRoute(env, "I've been feeling lonely")).toBe(
      "mental",
    );
  });

  it("parses 'physical' from the model", async () => {
    const env = mockEnv("physical");
    expect(await classifyRoute(env, "give me a chest workout")).toBe(
      "physical",
    );
  });

  it("parses 'unclear' from the model", async () => {
    const env = mockEnv("unclear");
    expect(await classifyRoute(env, "hey")).toBe("unclear");
  });

  it("handles surrounding whitespace and capitalization", async () => {
    expect(await classifyRoute(mockEnv("  Physical \n"), "x")).toBe(
      "physical",
    );
    expect(await classifyRoute(mockEnv("MENTAL"), "x")).toBe("mental");
  });

  it("falls back to 'unclear' when the model returns garbage", async () => {
    const env = mockEnv("I think this is about feelings.");
    expect(await classifyRoute(env, "x")).toBe("unclear");
  });

  it("falls back to 'unclear' when the model throws", async () => {
    expect(await classifyRoute(mockEnvThatThrows(), "x")).toBe("unclear");
  });

  it("returns 'unclear' when no AI binding is present (local dev)", async () => {
    const env = { AI: undefined } as unknown as Env;
    expect(await classifyRoute(env, "x")).toBe("unclear");
  });

  it("sends a deterministic low-token request to the model", async () => {
    const env = mockEnv("mental");
    await classifyRoute(env, "test");
    const runMock = env.AI!.run as ReturnType<typeof vi.fn>;
    const call = runMock.mock.calls[0][1] as {
      max_tokens: number;
      temperature: number;
      prompt: string;
    };
    expect(call.max_tokens).toBe(8);
    expect(call.temperature).toBe(0);
    expect(call.prompt).toContain("mental, physical, or unclear");
    expect(call.prompt).toContain('"test"');
  });
});

describe("pickAgent (production entrypoint)", () => {
  it("uses deterministic physical routing for obvious nutrition and muscle-gain requests", async () => {
    const env = mockEnv("mental");
    expect(await pickAgent(env, "create a diet for bulking by this summer")).toBe("physical");
    expect(await pickAgent(env, "give me a protein meal plan for basketball")).toBe("physical");
  });

  it("returns 'mental' when classifier says mental", async () => {
    expect(await pickAgent(mockEnv("mental"), "x")).toBe("mental");
  });

  it("returns 'physical' when classifier says physical", async () => {
    expect(await pickAgent(mockEnv("physical"), "x")).toBe("physical");
  });

  it("collapses 'unclear' → 'mental' (AGENT_PLAN T-006 default)", async () => {
    expect(await pickAgent(mockEnv("unclear"), "x")).toBe("mental");
  });

  it("collapses errors and missing bindings to 'mental'", async () => {
    expect(await pickAgent(mockEnvThatThrows(), "x")).toBe("mental");
    expect(await pickAgent({ AI: undefined } as unknown as Env, "x")).toBe(
      "mental",
    );
  });
});

// AGENT_PLAN T-006 Done_when: "the routing classifier never reads the user's
// safety classifier output, so a malicious message can't manipulate routing
// to escape safety." This is enforced by the architecture — `classifyRoute`
// only takes (env, userMessage). It has no parameter through which safety
// state could enter, and the prompt is built from a constant + the raw user
// message via `buildRoutingRequest`. These tests pin that contract.
describe("safety isolation", () => {
  it("only receives the literal user message as variable input", async () => {
    const env = mockEnv("mental");
    const userMessage = "I want to hurt myself";
    await classifyRoute(env, userMessage);
    const runMock = env.AI!.run as ReturnType<typeof vi.fn>;
    const call = runMock.mock.calls[0][1] as { prompt: string };
    // The exact user message appears in the prompt, quoted, exactly once.
    // No "the user's safety classifier said X" payload, no flags, no
    // synthesized metadata.
    const matches = call.prompt.split(`"${userMessage}"`).length - 1;
    expect(matches).toBe(1);
  });
});
