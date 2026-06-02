// agent-prompts tests — verify the Mind/Body dispatcher picks the right
// builder and feeds it the expected context.

import { describe, expect, it } from "vitest";
import {
  renderAgentPrompt,
  renderBodyPrompt,
  renderMindPrompt,
} from "../src/lib/agent-prompts";
import type { KaiContext } from "../src/lib/context";

const ctx: KaiContext = {
  userId: "u_test",
  displayName: "Lev",
  age: 16,
  kaiName: "KAI",
  kaiTone: "balanced",
  primaryEngine: "mental",
  intakeSummary: null,
  streakOverall: 0,
  recentPatterns: [],
};

describe("renderMindPrompt", () => {
  it("returns the Mind prompt with user-context fields plugged in", () => {
    const prompt = renderMindPrompt(ctx);
    // Identifies the agent
    expect(prompt).toContain("mental health and emotional growth side");
    // Plugs the user's name
    expect(prompt).toContain("Lev");
    // Plugs KAI's name (custom or default)
    expect(prompt).toContain("KAI");
    // Includes age
    expect(prompt).toContain("Age: 16");
    // Includes the chosen tone instruction (balanced)
    expect(prompt.toLowerCase()).toContain("balance");
    // The prompt explicitly tells the model NOT to name philosophical
    // underpinnings to the user. The names appear in the system prompt
    // (so the model knows what not to say) — we verify the rule is there.
    expect(prompt).toMatch(/never namedrop.*Siegel/i);
    expect(prompt).toMatch(/Frankl/);
  });

  it("falls back to age 16 when context.age is null", () => {
    const prompt = renderMindPrompt({ ...ctx, age: null });
    expect(prompt).toContain("Age: 16");
  });
});

describe("renderBodyPrompt", () => {
  it("returns the Body prompt with user-context fields plugged in", () => {
    const prompt = renderBodyPrompt(ctx);
    expect(prompt).toContain("physical health and performance side");
    expect(prompt).toContain("Lev");
    expect(prompt).toContain("KAI");
    expect(prompt).toContain("Age: 16");
    // The Body forbidden-language list MUST be part of the prompt so the
    // model has the rules visible at generation time.
    expect(prompt).toContain("FORBIDDEN LANGUAGE");
    expect(prompt.toLowerCase()).toContain("shame");
  });
});

describe("renderAgentPrompt (dispatcher)", () => {
  it("returns the Mind prompt when decision is 'mental'", () => {
    const prompt = renderAgentPrompt("mental", ctx);
    expect(prompt).toContain("mental health and emotional growth side");
  });

  it("returns the Body prompt when decision is 'physical'", () => {
    const prompt = renderAgentPrompt("physical", ctx);
    expect(prompt).toContain("physical health and performance side");
  });

  it("tone preference flows through to both agents", () => {
    const warm = renderAgentPrompt("mental", { ...ctx, kaiTone: "warm" });
    const direct = renderAgentPrompt("mental", { ...ctx, kaiTone: "direct" });
    expect(warm).not.toBe(direct);
    expect(warm.toLowerCase()).toContain("warm");
    expect(direct.toLowerCase()).toContain("direct");
  });
});
