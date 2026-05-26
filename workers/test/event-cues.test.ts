import { describe, expect, it, vi } from "vitest";
import { generateEventCue, getFallbackCue, isSafeCue } from "../src/lib/event-cues";

describe("getFallbackCue", () => {
  it("returns a cue per known event type", () => {
    expect(getFallbackCue("sleep_log")).toMatch(/sleep/i);
    expect(getFallbackCue("meal_logged")).toMatch(/no scoring/i);
    expect(getFallbackCue("body_scan")).toMatch(/posture/i);
    expect(getFallbackCue("tracker_session")).toMatch(/rep/i);
  });

  it("falls back to a default for unknown event types", () => {
    expect(getFallbackCue("totally_made_up_event")).toBe("Logged.");
  });
});

describe("isSafeCue", () => {
  it("accepts a clean one-sentence cue", () => {
    expect(isSafeCue("Nice. The next rep can be even smaller.")).toBe(true);
    expect(isSafeCue("Logged. Sleep is the quiet rep.")).toBe(true);
  });

  it("rejects cues with 'should'", () => {
    expect(isSafeCue("You should drink more water.")).toBe(false);
    expect(isSafeCue("Probably you should rest more.")).toBe(false);
  });

  it("rejects corporate-wellness vocabulary", () => {
    expect(isSafeCue("Time to level up your wellness journey.")).toBe(false);
    expect(isSafeCue("Transform your sleep starting tonight.")).toBe(false);
    expect(isSafeCue("Unlock your potential with daily reps.")).toBe(false);
  });

  it("rejects exclamation points", () => {
    expect(isSafeCue("Nice job!")).toBe(false);
    expect(isSafeCue("Great rep!")).toBe(false);
  });

  it("rejects anything over 220 characters", () => {
    const longCue = "Nice rep. ".repeat(40);
    expect(isSafeCue(longCue)).toBe(false);
  });

  it("rejects unsafe phrases even if the rest reads warm", () => {
    expect(isSafeCue("That was a good night. Just don't harm yourself if it slips.")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isSafeCue("YOU SHOULD eat more")).toBe(false);
  });
});

describe("generateEventCue", () => {
  function fakeEnv(overrides: Record<string, unknown> = {}) {
    return { AI: undefined, AI_TEXT_MODEL: undefined, ...overrides } as unknown as Parameters<typeof generateEventCue>[0];
  }

  it("returns the fallback cue when AI binding is missing", async () => {
    const result = await generateEventCue(fakeEnv(), { eventType: "sleep_log" });
    expect(result.source).toBe("fallback");
    expect(result.cue).toBe(getFallbackCue("sleep_log"));
  });

  it("returns the fallback when the model output is unsafe", async () => {
    const env = fakeEnv({
      AI: {
        run: vi.fn().mockResolvedValue({ response: "You should level up immediately!" })
      }
    });
    const result = await generateEventCue(env, { eventType: "sleep_log" });
    expect(result.source).toBe("fallback");
  });

  it("returns the model output when it passes the safety filter", async () => {
    const env = fakeEnv({
      AI: {
        run: vi.fn().mockResolvedValue({ response: "Nice. Sleep is the quiet rep." })
      }
    });
    const result = await generateEventCue(env, { eventType: "sleep_log" });
    expect(result.source).toBe("model");
    expect(result.cue).toBe("Nice. Sleep is the quiet rep.");
  });

  it("strips surrounding quotes the model sometimes emits", async () => {
    const env = fakeEnv({
      AI: {
        run: vi.fn().mockResolvedValue({ response: '"Logged. That counts."' })
      }
    });
    const result = await generateEventCue(env, { eventType: "meal_logged" });
    expect(result.cue).toBe("Logged. That counts.");
  });

  it("falls back when the model throws", async () => {
    const env = fakeEnv({
      AI: {
        run: vi.fn().mockRejectedValue(new Error("model down"))
      }
    });
    const result = await generateEventCue(env, { eventType: "body_scan" });
    expect(result.source).toBe("fallback");
  });
});
