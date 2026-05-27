// T-022 — Body agent food comment tests.
//
// We don't have a real env.AI in the test environment, so we mock it
// with a stub that returns whatever we want. This lets us assert:
//   - Clean response passes through unchanged (cap to 2 sentences)
//   - Forbidden word triggers regen (and eventually fallback)
//   - No AI binding → falls back without trying
//   - Long output gets trimmed to 2 sentences

import { describe, expect, it, vi } from "vitest";
import { FOOD_COMMENT_FALLBACK, generateFoodComment } from "../src/lib/food-comment";
import type { KaiContext } from "../src/lib/context";
import type { MealAnalysis } from "../src/lib/food-analysis";
import type { Nutrition } from "../src/lib/usda";
import type { Env } from "../src/types";

// ─────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────

function ctx(overrides: Partial<KaiContext> = {}): KaiContext {
  return {
    userId: "u1",
    displayName: "Lev",
    age: 16,
    kaiName: "KAI",
    kaiTone: "balanced",
    primaryEngine: "physical",
    intakeSummary: null,
    streakOverall: 0,
    recentPatterns: [],
    ...overrides,
  };
}

function analysis(overrides: Partial<MealAnalysis> = {}): MealAnalysis {
  return {
    items: [
      { name: "grilled chicken breast", source: "vision", estimatedGrams: 150 },
      { name: "white rice", source: "vision", estimatedGrams: 200 },
    ],
    totals: { calories: 580, protein: 38, carbs: 70, fat: 8 } as Nutrition,
    confidence: "medium",
    notes: "",
    ...overrides,
  };
}

/** Build a mock Env with a stubbed AI.run that returns a sequence of strings.
 *  Mirrors the real Workers AI signature: run(modelName, { prompt, ... }). */
function mockEnv(responses: string[]): { env: Env; runMock: ReturnType<typeof vi.fn> } {
  const queue = [...responses];
  const runMock = vi.fn(async () => ({
    response: queue.shift() ?? "",
  }));
  const env = {
    AI: { run: runMock },
    AI_TEXT_MODEL: "@cf/test/model",
  } as unknown as Env;
  return { env, runMock };
}

// ─────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────

describe("generateFoodComment — happy path", () => {
  it("returns a clean comment after one call", async () => {
    // Avoiding words like "something" / "afternoon" / "after" that can
    // false-positive against the filter's naive substring match.
    const { env, runMock } = mockEnv([
      "Solid hit of protein — that meal will help recovery if you trained. Color on the plate is a nice add for tomorrow.",
    ]);
    const result = await generateFoodComment(env, ctx(), analysis());
    expect(result.usedFallback).toBe(false);
    expect(result.attempts).toBe(1);
    expect(result.comment).toMatch(/protein/i);
    expect(runMock).toHaveBeenCalledTimes(1);
  });

  it("trims a 3-sentence response down to 2 sentences", async () => {
    const { env } = mockEnv([
      "Sentence one. Sentence two. Sentence three.",
    ]);
    const result = await generateFoodComment(env, ctx(), analysis());
    expect(result.comment).toBe("Sentence one. Sentence two.");
  });
});

describe("generateFoodComment — body-language filter regen", () => {
  it("regenerates when first response contains forbidden language", async () => {
    const { env, runMock } = mockEnv([
      // "ripped" + "cutting" are both in the forbidden list as plain words
      "Looking ripped today — perfect cutting macros.",
      // Clean replacement — no forbidden substrings, even false-positive ones
      "Good fuel: that protein will hold your energy. Color on the plate is a nice add.",
    ]);
    const result = await generateFoodComment(env, ctx(), analysis());
    expect(result.usedFallback).toBe(false);
    expect(result.attempts).toBe(2);
    expect(result.comment).not.toMatch(/ripped|cutting/i);
    expect(runMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to safe canned string after 3 forbidden regens", async () => {
    const { env, runMock } = mockEnv([
      "You look ripped.",
      "Stay shredded.",
      "Cutting hard, no excuse to skip protein.",
    ]);
    const result = await generateFoodComment(env, ctx(), analysis());
    expect(result.usedFallback).toBe(true);
    expect(result.comment).toBe(FOOD_COMMENT_FALLBACK);
    expect(result.attempts).toBe(3);
    expect(runMock).toHaveBeenCalledTimes(3);
  });
});

describe("generateFoodComment — env without AI", () => {
  it("returns fallback immediately when env.AI is missing", async () => {
    const env = {} as unknown as Env;
    const result = await generateFoodComment(env, ctx(), analysis());
    expect(result.usedFallback).toBe(true);
    expect(result.comment).toBe(FOOD_COMMENT_FALLBACK);
    expect(result.attempts).toBe(0);
  });
});

describe("generateFoodComment — prompt safety", () => {
  it("does NOT inject a 'calorie target' or 'deficit' instruction in any prompt", async () => {
    const { env, runMock } = mockEnv([
      "Plenty of fuel here — enjoy it.",
    ]);
    await generateFoodComment(env, ctx(), analysis());
    const prompt = (runMock.mock.calls[0]![1] as { prompt: string }).prompt;
    // We tell the model NOT to do these things; assert the instructions
    // are present in the system prompt.
    expect(prompt).toMatch(/never give a calorie target/i);
    expect(prompt).toMatch(/never shame/i);
    expect(prompt).toMatch(/never use words like fat, skinny/i);
  });

  it("references the actual food items in the prompt context", async () => {
    const { env, runMock } = mockEnv(["Solid meal."]);
    await generateFoodComment(
      env,
      ctx(),
      analysis({
        items: [
          { name: "salmon", source: "vision", estimatedGrams: 120 },
          { name: "broccoli", source: "vision", estimatedGrams: 80 },
        ],
      }),
    );
    const prompt = (runMock.mock.calls[0]![1] as { prompt: string }).prompt;
    expect(prompt).toContain("salmon");
    expect(prompt).toContain("broccoli");
  });
});
