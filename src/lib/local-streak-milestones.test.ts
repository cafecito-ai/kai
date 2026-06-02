// Rawz/7 — streak milestone detection tests.
//
// Invariants:
//   - Each milestone fires exactly once per streak run
//   - Reset to 0 clears the announced set (fresh start)
//   - Catch-up: starting fresh at streak=35 should fire [7, 30] once

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appendLocalInput, clearLocalInputs } from "./local-score";
import {
  STREAK_MILESTONES,
  checkAndConsumeStreakMilestones,
  currentLocalStreak,
} from "./local-streak-milestones";

const memory = new Map<string, string>();
beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memory.set(k, v);
    },
    removeItem: (k: string) => {
      memory.delete(k);
    },
    clear: () => memory.clear(),
    key: (i: number) => Array.from(memory.keys())[i] ?? null,
    get length() {
      return memory.size;
    },
  } as unknown as Storage;
});
afterEach(() => {
  clearLocalInputs();
});

/** Seed N consecutive days ending at `endDate`, one input per day. */
function seedConsecutive(endDate: Date, days: number) {
  for (let i = 0; i < days; i += 1) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    appendLocalInput({
      date: d.toISOString().slice(0, 10),
      source: "check_in",
      value: {},
    });
  }
}

describe("currentLocalStreak", () => {
  it("returns 0 with no inputs", () => {
    expect(currentLocalStreak()).toBe(0);
  });
  it("counts consecutive days ending today", () => {
    const now = new Date("2026-05-27T12:00:00Z");
    seedConsecutive(now, 5);
    expect(currentLocalStreak(now)).toBe(5);
  });
});

describe("checkAndConsumeStreakMilestones", () => {
  it("returns [] before any milestone", () => {
    const now = new Date("2026-05-27T12:00:00Z");
    seedConsecutive(now, 5);
    expect(checkAndConsumeStreakMilestones(now)).toEqual([]);
  });

  it("fires [7] exactly once when user crosses 7", () => {
    const now = new Date("2026-05-27T12:00:00Z");
    seedConsecutive(now, 7);
    expect(checkAndConsumeStreakMilestones(now)).toEqual([7]);
    // Second call same day — already announced.
    expect(checkAndConsumeStreakMilestones(now)).toEqual([]);
  });

  it("fires [30] after [7] without re-firing 7", () => {
    const first = new Date("2026-05-07T12:00:00Z");
    seedConsecutive(first, 7);
    expect(checkAndConsumeStreakMilestones(first)).toEqual([7]);

    // Now 23 more days pass with daily check-ins → streak = 30.
    const later = new Date("2026-05-30T12:00:00Z");
    seedConsecutive(later, 30);
    expect(checkAndConsumeStreakMilestones(later)).toEqual([30]);
  });

  it("catches up multiple milestones on a cold start", () => {
    // User imports / has 35 days of inputs from before app install.
    const now = new Date("2026-05-27T12:00:00Z");
    seedConsecutive(now, 35);
    // First check — fire both 7 and 30 (but not 100 yet).
    expect(checkAndConsumeStreakMilestones(now)).toEqual([7, 30]);
    // Subsequent calls — nothing new.
    expect(checkAndConsumeStreakMilestones(now)).toEqual([]);
  });

  it("resets the announced set when streak drops to 0", () => {
    // Cross 7.
    const day7 = new Date("2026-05-07T12:00:00Z");
    seedConsecutive(day7, 7);
    expect(checkAndConsumeStreakMilestones(day7)).toEqual([7]);

    // Streak dies — clear inputs, advance day. currentStreak now 0.
    clearLocalInputs();
    const dayAfterGap = new Date("2026-05-15T12:00:00Z");
    expect(checkAndConsumeStreakMilestones(dayAfterGap)).toEqual([]);

    // Build back up to 7 — fresh-start framing means we DO fire 7 again.
    seedConsecutive(dayAfterGap, 7);
    expect(checkAndConsumeStreakMilestones(dayAfterGap)).toEqual([7]);
  });

  it("treats an implicit decrease as a reset (missed day mid-run)", () => {
    // Cross 7.
    const day7 = new Date("2026-05-07T12:00:00Z");
    seedConsecutive(day7, 7);
    expect(checkAndConsumeStreakMilestones(day7)).toEqual([7]);

    // Two days later, only inputs from the last day exist (they missed
    // 5/8) — current streak from 5/9 is just 1.
    clearLocalInputs();
    const recovery = new Date("2026-05-09T12:00:00Z");
    appendLocalInput({
      date: "2026-05-09",
      source: "check_in",
      value: {},
    });
    expect(checkAndConsumeStreakMilestones(recovery)).toEqual([]);

    // Streak rebuilds to 7 — should fire again because the announced
    // set got cleared on the implicit reset.
    seedConsecutive(recovery, 7);
    expect(checkAndConsumeStreakMilestones(recovery)).toEqual([7]);
  });

  it("never advertises a milestone twice in the same run", () => {
    const now = new Date("2026-05-27T12:00:00Z");
    seedConsecutive(now, 7);
    checkAndConsumeStreakMilestones(now);
    // Repeated calls over many same-run days, never re-fire.
    for (let i = 0; i < 5; i += 1) {
      expect(checkAndConsumeStreakMilestones(now)).toEqual([]);
    }
  });
});

describe("STREAK_MILESTONES catalogue", () => {
  it("is the 7 / 30 / 100 set we promised the user", () => {
    expect(STREAK_MILESTONES).toEqual([7, 30, 100]);
  });
  it("is in ascending order (catch-up logic depends on it)", () => {
    const sorted = [...STREAK_MILESTONES].sort((a, b) => a - b);
    expect(STREAK_MILESTONES).toEqual(sorted);
  });
});
