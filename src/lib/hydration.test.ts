import { describe, expect, it } from "vitest";
import {
  cueFor,
  DAILY_CUP_CEILING,
  DAILY_CUP_FLOOR,
  incrementCups,
  resetIfNewDay,
  todayIso
} from "./hydration";

describe("resetIfNewDay", () => {
  it("returns a fresh state when storage is null", () => {
    // Build the Date with local-time components so the test is timezone-stable.
    const now = new Date(2026, 4, 12, 12, 0, 0);
    const result = resetIfNewDay(null, now);
    expect(result).toEqual({ dateIso: "2026-05-12", cups: 0 });
  });

  it("preserves state when same day (local)", () => {
    const now = new Date(2026, 4, 12, 18, 0, 0);
    const state = { dateIso: "2026-05-12", cups: 4 };
    expect(resetIfNewDay(state, now)).toEqual(state);
  });

  it("resets cups when local day rolls over", () => {
    const now = new Date(2026, 4, 13, 1, 0, 0);
    const state = { dateIso: "2026-05-12", cups: 8 };
    expect(resetIfNewDay(state, now)).toEqual({ dateIso: "2026-05-13", cups: 0 });
  });
});

describe("incrementCups", () => {
  it("adds by default 1", () => {
    expect(incrementCups({ dateIso: "2026-05-12", cups: 3 }).cups).toBe(4);
  });

  it("supports negative deltas (manual decrement)", () => {
    expect(incrementCups({ dateIso: "2026-05-12", cups: 3 }, -1).cups).toBe(2);
  });

  it("never goes below zero", () => {
    expect(incrementCups({ dateIso: "2026-05-12", cups: 0 }, -5).cups).toBe(0);
  });

  it("caps at DAILY_CUP_CEILING", () => {
    const state = { dateIso: "2026-05-12", cups: DAILY_CUP_CEILING - 1 };
    expect(incrementCups(state, 5).cups).toBe(DAILY_CUP_CEILING);
  });

  it("preserves dateIso", () => {
    const state = { dateIso: "2026-05-12", cups: 1 };
    expect(incrementCups(state).dateIso).toBe("2026-05-12");
  });
});

describe("cueFor", () => {
  it("returns below_floor for low counts", () => {
    expect(cueFor(0).level).toBe("below_floor");
    expect(cueFor(2).level).toBe("below_floor");
    expect(cueFor(DAILY_CUP_FLOOR - 1).level).toBe("below_floor");
  });

  it("returns in_range when between floor and ceiling", () => {
    expect(cueFor(DAILY_CUP_FLOOR).level).toBe("in_range");
    expect(cueFor(DAILY_CUP_FLOOR + 3).level).toBe("in_range");
    expect(cueFor(DAILY_CUP_CEILING - 1).level).toBe("in_range");
  });

  it("returns at_cap when at the ceiling", () => {
    expect(cueFor(DAILY_CUP_CEILING).level).toBe("at_cap");
  });

  it("never uses guilt language", () => {
    const banned = [/you failed/i, /you missed/i, /not enough/i, /you need to/i, /must drink/i];
    for (let n = 0; n <= DAILY_CUP_CEILING; n++) {
      const cue = cueFor(n);
      for (const pattern of banned) {
        expect(cue.message, `cue at ${n} cups`).not.toMatch(pattern);
      }
    }
  });

  it("the at_cap message warns gently rather than celebrates", () => {
    const message = cueFor(DAILY_CUP_CEILING).message.toLowerCase();
    expect(message).toMatch(/more isn't always better|over.*hydrat/);
  });
});

describe("todayIso", () => {
  it("returns YYYY-MM-DD", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
