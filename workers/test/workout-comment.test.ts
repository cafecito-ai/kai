// T-023 — Body agent workout comment tests.
//
// Same shape as food-comment tests: stubbed env.AI, sequenced responses.
// Critical extra coverage: age-gating for under-16 users — the prompt must
// include the bodyweight/no-barbell rule.

import { describe, expect, it, vi } from "vitest";
import {
  WORKOUT_COMMENT_FALLBACK,
  generateWorkoutComment,
  type WorkoutPayload,
} from "../src/lib/workout-comment";
import type { KaiContext } from "../src/lib/context";
import type { Env } from "../src/types";

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

function payload(overrides: Partial<WorkoutPayload> = {}): WorkoutPayload {
  return {
    type: "run",
    durationMin: 30,
    intensity: 3,
    notes: undefined,
    ...overrides,
  };
}

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

describe("generateWorkoutComment — happy path", () => {
  it("returns a clean 2-3 sentence comment on first try", async () => {
    const { env, runMock } = mockEnv([
      "Solid 30-minute run at moderate effort — good steady-state day. Hydrate now and aim for protein in the next hour to support recovery. Easy day tomorrow if your legs feel heavy.",
    ]);
    const result = await generateWorkoutComment(env, ctx(), payload());
    expect(result.usedFallback).toBe(false);
    expect(result.attempts).toBe(1);
    expect(result.comment).toMatch(/30-minute|run|recovery/i);
    expect(runMock).toHaveBeenCalledTimes(1);
  });

  it("trims a 5-sentence response down to 3 sentences", async () => {
    const { env } = mockEnv([
      "One. Two. Three. Four. Five.",
    ]);
    const result = await generateWorkoutComment(env, ctx(), payload());
    expect(result.comment).toBe("One. Two. Three.");
  });
});

describe("generateWorkoutComment — body-language filter", () => {
  it("regenerates on forbidden language and accepts a clean retry", async () => {
    const { env, runMock } = mockEnv([
      "Time to get ripped, no excuse to skip this.",
      "Strong run. Refuel with carbs and protein, then sleep well — that's where the gains live.",
    ]);
    const result = await generateWorkoutComment(env, ctx(), payload());
    expect(result.usedFallback).toBe(false);
    expect(result.attempts).toBe(2);
    expect(runMock).toHaveBeenCalledTimes(2);
  });

  it("falls back after 3 forbidden regens", async () => {
    const { env } = mockEnv([
      "You're getting ripped.",
      "Stay shredded.",
      "Cutting phase is on.",
    ]);
    const result = await generateWorkoutComment(env, ctx(), payload());
    expect(result.usedFallback).toBe(true);
    expect(result.comment).toBe(WORKOUT_COMMENT_FALLBACK);
    expect(result.attempts).toBe(3);
  });
});

describe("generateWorkoutComment — no AI binding", () => {
  it("returns the fallback immediately", async () => {
    const env = {} as unknown as Env;
    const result = await generateWorkoutComment(env, ctx(), payload());
    expect(result.usedFallback).toBe(true);
    expect(result.attempts).toBe(0);
  });
});

describe("generateWorkoutComment — age guardrails", () => {
  it("injects the no-barbell rule for users under 16", async () => {
    const { env, runMock } = mockEnv(["Nice work — keep showing up."]);
    await generateWorkoutComment(
      env,
      ctx({ age: 14, displayName: "Sam" }),
      payload({ type: "strength", intensity: 4 }),
    );
    const prompt = (runMock.mock.calls[0]![1] as { prompt: string }).prompt;
    expect(prompt).toMatch(/under 16/i);
    expect(prompt).toMatch(/DO NOT recommend specific weights/i);
    expect(prompt).toMatch(/bodyweight/i);
  });

  it("does NOT inject the under-16 rule for users 16+", async () => {
    const { env, runMock } = mockEnv(["Strong session."]);
    await generateWorkoutComment(env, ctx({ age: 17 }), payload({ type: "strength" }));
    const prompt = (runMock.mock.calls[0]![1] as { prompt: string }).prompt;
    expect(prompt).not.toMatch(/under 16/i);
  });

  it("does NOT inject the under-16 rule when age is unknown (defaults to 16)", async () => {
    const { env, runMock } = mockEnv(["Strong session."]);
    await generateWorkoutComment(env, ctx({ age: null }), payload());
    const prompt = (runMock.mock.calls[0]![1] as { prompt: string }).prompt;
    expect(prompt).not.toMatch(/under 16/i);
  });
});

describe("generateWorkoutComment — prompt safety", () => {
  it("includes the no-supplements rule", async () => {
    const { env, runMock } = mockEnv(["OK."]);
    await generateWorkoutComment(env, ctx(), payload());
    const prompt = (runMock.mock.calls[0]![1] as { prompt: string }).prompt;
    expect(prompt).toMatch(/never recommend supplements/i);
  });

  it("includes the no-training-through-pain rule", async () => {
    const { env, runMock } = mockEnv(["OK."]);
    await generateWorkoutComment(env, ctx(), payload());
    const prompt = (runMock.mock.calls[0]![1] as { prompt: string }).prompt;
    expect(prompt).toMatch(/never push training through pain/i);
  });

  it("references the actual workout type/duration/intensity in the prompt", async () => {
    const { env, runMock } = mockEnv(["OK."]);
    await generateWorkoutComment(
      env,
      ctx(),
      payload({ type: "yoga", durationMin: 45, intensity: 2 }),
    );
    const prompt = (runMock.mock.calls[0]![1] as { prompt: string }).prompt;
    expect(prompt).toContain("yoga");
    expect(prompt).toContain("45 minutes");
    expect(prompt).toContain("2/5");
  });
});
