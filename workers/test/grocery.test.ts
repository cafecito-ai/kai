// Bucket 5 — Smart Grocery Planner (in-chat only).

import { describe, expect, it } from "vitest";
import { buildGroceryPrompt, looksLikeGroceryRequest } from "../src/lib/grocery";
import type { KaiContext } from "../src/lib/context";

function ctx(): KaiContext {
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
  };
}

describe("looksLikeGroceryRequest", () => {
  it("fires on a real grocery run with budget + store", () => {
    expect(
      looksLikeGroceryRequest(
        "I have $120 for groceries this week, I'm bulking, I shop at Publix, and I need easy meals for school.",
      ),
    ).toBe(true);
  });

  it("fires on a plain grocery list ask", () => {
    expect(looksLikeGroceryRequest("can you make me a grocery list?")).toBe(true);
    expect(looksLikeGroceryRequest("what's my shopping list look like")).toBe(true);
  });

  it("does NOT fire on ordinary food chat", () => {
    expect(looksLikeGroceryRequest("what should I eat after my workout?")).toBe(false);
    expect(looksLikeGroceryRequest("I'm hungry, any ideas for lunch?")).toBe(false);
  });
});

describe("buildGroceryPrompt", () => {
  it("requires the categorized list + nutrition + cost summaries", () => {
    const p = buildGroceryPrompt(ctx());
    expect(p).toMatch(/Protein/);
    expect(p).toMatch(/Carbs/);
    expect(p).toMatch(/Fruits & Vegetables/);
    expect(p).toMatch(/Nutrition Summary/i);
    expect(p).toMatch(/Cost Summary/i);
  });

  it("instructs budget / goal / store awareness and honoring allergies", () => {
    const p = buildGroceryPrompt(ctx());
    expect(p).toMatch(/budget/i);
    expect(p).toMatch(/goal/i);
    expect(p).toMatch(/store/i);
    expect(p).toMatch(/allerg/i);
  });

  it("keeps the safety rails: no supplements, no appearance/size words", () => {
    const p = buildGroceryPrompt(ctx());
    expect(p).toMatch(/never recommend supplements/i);
    expect(p).toMatch(/never use appearance or size words/i);
  });
});
