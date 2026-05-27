// T-024 — sleep + Body recovery comment tests.
//
// Covers:
//   - notesSuggestPhysical: keyword heuristic for the notes field
//   - generateSleepBodyComment: happy path, regen, fallback, no-AI
//   - prompt safety (no melatonin recommendation, no training-through-fatigue)

import { describe, expect, it, vi } from "vitest";
import {
  SLEEP_BODY_FALLBACK,
  generateSleepBodyComment,
  notesSuggestPhysical,
} from "../src/lib/sleep-body-comment";
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

describe("notesSuggestPhysical", () => {
  it("returns false for empty / undefined notes", () => {
    expect(notesSuggestPhysical(undefined)).toBe(false);
    expect(notesSuggestPhysical("")).toBe(false);
  });

  it("fires on training keywords", () => {
    expect(notesSuggestPhysical("Pretty sore after training")).toBe(true);
    expect(notesSuggestPhysical("ran 5 miles before bed")).toBe(true);
    expect(notesSuggestPhysical("lifted heavy yesterday")).toBe(true);
    expect(notesSuggestPhysical("game tomorrow")).toBe(true);
    expect(notesSuggestPhysical("Practice was brutal")).toBe(true);
    expect(notesSuggestPhysical("heavy legs from yesterday")).toBe(true);
  });

  it("does NOT fire on unrelated notes", () => {
    expect(notesSuggestPhysical("Stressed about school")).toBe(false);
    expect(notesSuggestPhysical("Fine night, no notes")).toBe(false);
    expect(notesSuggestPhysical("Mom and I argued")).toBe(false);
  });

  it("is case insensitive", () => {
    expect(notesSuggestPhysical("TRAINED hard today")).toBe(true);
    expect(notesSuggestPhysical("SoRe everywhere")).toBe(true);
  });
});

describe("generateSleepBodyComment — happy path", () => {
  it("returns a clean comment on first try", async () => {
    const { env, runMock } = mockEnv([
      "5 hours after a hard session is light — drink water now, and an easy day tomorrow will let your nervous system catch up. Aim for an extra 30-45 minutes tonight.",
    ]);
    const result = await generateSleepBodyComment(
      env,
      ctx(),
      5,
      undefined,
      "recent_workout",
    );
    expect(result.usedFallback).toBe(false);
    expect(result.attempts).toBe(1);
    expect(runMock).toHaveBeenCalledTimes(1);
  });

  it("trims a long response to 2 sentences", async () => {
    const { env } = mockEnv(["One. Two. Three. Four."]);
    const result = await generateSleepBodyComment(env, ctx(), 7, undefined, "notes");
    expect(result.comment).toBe("One. Two.");
  });
});

describe("generateSleepBodyComment — filter regen", () => {
  it("regenerates on forbidden language", async () => {
    const { env, runMock } = mockEnv([
      "You'll be shredded if you keep cutting calories on light days.",
      "Recovery matters more than mileage right now — give your legs a real rest day tomorrow.",
    ]);
    const result = await generateSleepBodyComment(
      env,
      ctx(),
      6,
      undefined,
      "recent_workout",
    );
    expect(result.usedFallback).toBe(false);
    expect(result.attempts).toBe(2);
    expect(runMock).toHaveBeenCalledTimes(2);
  });

  it("falls back after 3 forbidden regens", async () => {
    const { env } = mockEnv([
      "Cutting hard.",
      "Stay shredded.",
      "You look ripped after sleep like that.",
    ]);
    const result = await generateSleepBodyComment(
      env,
      ctx(),
      7,
      undefined,
      "recent_workout",
    );
    expect(result.usedFallback).toBe(true);
    expect(result.comment).toBe(SLEEP_BODY_FALLBACK);
    expect(result.attempts).toBe(3);
  });
});

describe("generateSleepBodyComment — no AI binding", () => {
  it("returns the fallback immediately", async () => {
    const env = {} as unknown as Env;
    const result = await generateSleepBodyComment(env, ctx(), 7, undefined, null);
    expect(result.usedFallback).toBe(true);
    expect(result.attempts).toBe(0);
  });
});

describe("generateSleepBodyComment — prompt safety", () => {
  it("includes the no-melatonin / no-medication rule", async () => {
    const { env, runMock } = mockEnv(["OK."]);
    await generateSleepBodyComment(env, ctx(), 7, 4, "recent_workout");
    const prompt = (runMock.mock.calls[0]![1] as { prompt: string }).prompt;
    expect(prompt).toMatch(/never recommend supplements, melatonin/i);
  });

  it("includes the no-training-through-fatigue rule", async () => {
    const { env, runMock } = mockEnv(["OK."]);
    await generateSleepBodyComment(env, ctx(), 7, 4, "recent_workout");
    const prompt = (runMock.mock.calls[0]![1] as { prompt: string }).prompt;
    expect(prompt).toMatch(/never push training through fatigue/i);
  });

  it("includes the actual sleep hours in the prompt", async () => {
    const { env, runMock } = mockEnv(["OK."]);
    await generateSleepBodyComment(env, ctx(), 5.5, undefined, "notes");
    const prompt = (runMock.mock.calls[0]![1] as { prompt: string }).prompt;
    expect(prompt).toContain("5.5");
  });

  it("includes quality when present, omits when undefined", async () => {
    const { env, runMock } = mockEnv(["OK.", "OK."]);
    await generateSleepBodyComment(env, ctx(), 7, 4, "notes");
    const withQ = (runMock.mock.calls[0]![1] as { prompt: string }).prompt;
    expect(withQ).toContain("4/5");

    await generateSleepBodyComment(env, ctx(), 7, undefined, "notes");
    const withoutQ = (runMock.mock.calls[1]![1] as { prompt: string }).prompt;
    expect(withoutQ).not.toContain("/5");
  });
});
