// T-021 — mental patterns detector tests.
//
// We test the pure detector and the aggregator separately. The store
// helpers (patterns-store.ts) talk to D1, so they're verified by hand
// against a local DB rather than unit-tested here.
//
// Critical invariants:
//   - No specific journal content ever appears in output
//   - At most 5 patterns returned
//   - Edge cases (empty input, single day, all-null) never throw or
//     return NaN/undefined strings
//   - 3+ day mood trends fire as expected
//   - 5-day mood swings fire on +/- 1.5 points
//   - Sleep streak of 3+ nights <6h fires
//   - Journaling habit detection (positive + drop-off)

import { describe, expect, it } from "vitest";
import {
  aggregateDaySignals,
  detectPatterns,
  type DaySignal,
  type RawInput,
} from "../src/lib/mental-patterns";

// ─────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────

/** Build a DaySignal for a date offset (days before `today`). */
function dayBefore(
  offsetDays: number,
  fields: Partial<Omit<DaySignal, "date">> = {},
  today = new Date("2026-05-20"),
): DaySignal {
  const d = new Date(today);
  d.setDate(d.getDate() - offsetDays);
  return {
    date: d.toISOString().slice(0, 10),
    mood: null,
    sleepHours: null,
    journalSentiment: null,
    journalCount: 0,
    finalScore: null,
    ...fields,
  };
}

const TODAY = new Date("2026-05-20");

// ─────────────────────────────────────────────────────────────────────
// detectPatterns — empty / edge cases
// ─────────────────────────────────────────────────────────────────────

describe("detectPatterns — empty input", () => {
  it("returns [] for no days", () => {
    expect(detectPatterns([], TODAY)).toEqual([]);
  });

  it("returns [] for a single day", () => {
    const days = [dayBefore(0, { mood: 3 }, TODAY)];
    expect(detectPatterns(days, TODAY)).toEqual([]);
  });

  it("returns [] for two days (need 3+ for any trend)", () => {
    const days = [
      dayBefore(1, { mood: 2 }, TODAY),
      dayBefore(0, { mood: 4 }, TODAY),
    ];
    expect(detectPatterns(days, TODAY)).toEqual([]);
  });

  it("returns [] for all-null mood/sleep/journal days", () => {
    const days = [
      dayBefore(2, {}, TODAY),
      dayBefore(1, {}, TODAY),
      dayBefore(0, {}, TODAY),
    ];
    expect(detectPatterns(days, TODAY)).toEqual([]);
  });

  it("caps output at 5 patterns max", () => {
    // Pile on every detector at once.
    const days = [
      dayBefore(13, { mood: 1, sleepHours: 4, journalCount: 1, finalScore: 30 }, TODAY),
      dayBefore(12, { mood: 1, sleepHours: 4, journalCount: 1, finalScore: 32 }, TODAY),
      dayBefore(11, { mood: 1, sleepHours: 4, journalCount: 1, finalScore: 31 }, TODAY),
      dayBefore(10, { mood: 1, sleepHours: 4, journalCount: 1, finalScore: 30 }, TODAY),
      dayBefore(9, { mood: 1, sleepHours: 4, journalCount: 1, finalScore: 31 }, TODAY),
      dayBefore(8, { mood: 1, sleepHours: 4, journalCount: 1, finalScore: 30 }, TODAY),
      dayBefore(7, { mood: 1, sleepHours: 4, journalCount: 1, finalScore: 32 }, TODAY),
      dayBefore(6, { mood: 2, sleepHours: 5, journalCount: 1, finalScore: 50 }, TODAY),
      dayBefore(5, { mood: 3, sleepHours: 6, journalCount: 1, finalScore: 60 }, TODAY),
      dayBefore(4, { mood: 4, sleepHours: 7, journalCount: 1, finalScore: 70 }, TODAY),
      dayBefore(3, { mood: 5, sleepHours: 8, journalCount: 1, finalScore: 80 }, TODAY),
      dayBefore(2, { mood: 5, sleepHours: 9, journalCount: 1, finalScore: 85 }, TODAY),
      dayBefore(1, { mood: 5, sleepHours: 9, journalCount: 1, finalScore: 88 }, TODAY),
      dayBefore(0, { mood: 5, sleepHours: 9, journalCount: 1, finalScore: 90 }, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    expect(patterns.length).toBeLessThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Mood trend
// ─────────────────────────────────────────────────────────────────────

describe("detectPatterns — mood trend", () => {
  it("flags 3-day upward mood trend", () => {
    const days = [
      dayBefore(2, { mood: 2 }, TODAY),
      dayBefore(1, { mood: 3 }, TODAY),
      dayBefore(0, { mood: 4 }, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    expect(patterns.some((p) => /trending up/.test(p))).toBe(true);
  });

  it("flags 4-day downward mood trend", () => {
    const days = [
      dayBefore(3, { mood: 5 }, TODAY),
      dayBefore(2, { mood: 4 }, TODAY),
      dayBefore(1, { mood: 3 }, TODAY),
      dayBefore(0, { mood: 2 }, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    expect(patterns.some((p) => /trending down for 4 days/.test(p))).toBe(true);
  });

  it("does not flag a wobble (up, down, up)", () => {
    const days = [
      dayBefore(2, { mood: 3 }, TODAY),
      dayBefore(1, { mood: 4 }, TODAY),
      dayBefore(0, { mood: 3 }, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    expect(patterns.some((p) => /trending/.test(p))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Mood swing (5-day)
// ─────────────────────────────────────────────────────────────────────

describe("detectPatterns — mood swing", () => {
  it("flags a 5-day positive swing of 2 points", () => {
    const days = [
      dayBefore(4, { mood: 2 }, TODAY),
      dayBefore(3, { mood: 2 }, TODAY),
      dayBefore(2, { mood: 3 }, TODAY),
      dayBefore(1, { mood: 4 }, TODAY),
      dayBefore(0, { mood: 4 }, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    expect(patterns.some((p) => /lifted noticeably/.test(p))).toBe(true);
  });

  it("flags a 5-day negative swing of 2 points", () => {
    const days = [
      dayBefore(4, { mood: 5 }, TODAY),
      dayBefore(3, { mood: 5 }, TODAY),
      dayBefore(2, { mood: 4 }, TODAY),
      dayBefore(1, { mood: 3 }, TODAY),
      dayBefore(0, { mood: 2 }, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    expect(patterns.some((p) => /dipped noticeably/.test(p))).toBe(true);
  });

  it("does NOT flag a small (<1.5pt) swing", () => {
    const days = [
      dayBefore(4, { mood: 3 }, TODAY),
      dayBefore(3, { mood: 3 }, TODAY),
      dayBefore(2, { mood: 3 }, TODAY),
      dayBefore(1, { mood: 4 }, TODAY),
      dayBefore(0, { mood: 4 }, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    expect(patterns.some((p) => /noticeably/.test(p))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Sleep
// ─────────────────────────────────────────────────────────────────────

describe("detectPatterns — sleep", () => {
  it("flags 3 nights in a row under 6h", () => {
    const days = [
      dayBefore(2, { sleepHours: 5 }, TODAY),
      dayBefore(1, { sleepHours: 4.5 }, TODAY),
      dayBefore(0, { sleepHours: 5.5 }, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    expect(patterns.some((p) => /under 6 hours.*3 nights/.test(p))).toBe(true);
  });

  it("does NOT flag a single bad night", () => {
    const days = [
      dayBefore(2, { sleepHours: 8 }, TODAY),
      dayBefore(1, { sleepHours: 4 }, TODAY),
      dayBefore(0, { sleepHours: 8 }, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    expect(patterns.some((p) => /under 6 hours/.test(p))).toBe(false);
  });

  it("flags wildly inconsistent sleep (high variance)", () => {
    const days = [
      dayBefore(6, { sleepHours: 3 }, TODAY),
      dayBefore(5, { sleepHours: 11 }, TODAY),
      dayBefore(4, { sleepHours: 4 }, TODAY),
      dayBefore(3, { sleepHours: 12 }, TODAY),
      dayBefore(2, { sleepHours: 3 }, TODAY),
      dayBefore(1, { sleepHours: 11 }, TODAY),
      dayBefore(0, { sleepHours: 4 }, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    expect(patterns.some((p) => /all over the place/.test(p))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Journaling
// ─────────────────────────────────────────────────────────────────────

describe("detectPatterns — journaling", () => {
  it("flags journaling nearly every day", () => {
    const days = [
      dayBefore(6, { journalCount: 1 }, TODAY),
      dayBefore(5, { journalCount: 1 }, TODAY),
      dayBefore(4, { journalCount: 1 }, TODAY),
      dayBefore(3, { journalCount: 1 }, TODAY),
      dayBefore(2, { journalCount: 1 }, TODAY),
      dayBefore(1, { journalCount: 1 }, TODAY),
      dayBefore(0, { journalCount: 1 }, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    expect(patterns.some((p) => /journaling nearly every day/.test(p))).toBe(true);
  });

  it("flags a drop-off from prior habit", () => {
    const days = [
      // Week 1: journaled 5 days
      dayBefore(13, { journalCount: 1 }, TODAY),
      dayBefore(12, { journalCount: 1 }, TODAY),
      dayBefore(11, { journalCount: 1 }, TODAY),
      dayBefore(10, { journalCount: 1 }, TODAY),
      dayBefore(9, { journalCount: 1 }, TODAY),
      dayBefore(8, {}, TODAY),
      dayBefore(7, {}, TODAY),
      // Week 2: silent
      dayBefore(6, {}, TODAY),
      dayBefore(5, {}, TODAY),
      dayBefore(4, {}, TODAY),
      dayBefore(3, {}, TODAY),
      dayBefore(2, {}, TODAY),
      dayBefore(1, {}, TODAY),
      dayBefore(0, {}, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    expect(patterns.some((p) => /dropped off/.test(p))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Score lift / dip
// ─────────────────────────────────────────────────────────────────────

describe("detectPatterns — overall score shift", () => {
  it("flags week-over-week score lift of 15+ points", () => {
    const days = [
      dayBefore(13, { finalScore: 50 }, TODAY),
      dayBefore(12, { finalScore: 52 }, TODAY),
      dayBefore(11, { finalScore: 48 }, TODAY),
      dayBefore(10, { finalScore: 50 }, TODAY),
      dayBefore(9, { finalScore: 51 }, TODAY),
      dayBefore(8, { finalScore: 49 }, TODAY),
      dayBefore(7, { finalScore: 50 }, TODAY),
      dayBefore(6, { finalScore: 70 }, TODAY),
      dayBefore(5, { finalScore: 72 }, TODAY),
      dayBefore(4, { finalScore: 68 }, TODAY),
      dayBefore(3, { finalScore: 70 }, TODAY),
      dayBefore(2, { finalScore: 71 }, TODAY),
      dayBefore(1, { finalScore: 69 }, TODAY),
      dayBefore(0, { finalScore: 70 }, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    expect(patterns.some((p) => /score has lifted/.test(p))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Guardrail — no journal text ever leaks into observations
// ─────────────────────────────────────────────────────────────────────

describe("guardrail — abstracted-only", () => {
  it("never includes journal note text in any observation", () => {
    // Even if a caller passed journal *content* through the value field,
    // detectPatterns operates on DaySignal which has no content slot.
    // This test asserts the shape of output: strings ≤ 100 chars, no
    // long verbatim text, no obvious quote markers.
    const days = [
      dayBefore(6, { mood: 1, sleepHours: 4, journalCount: 1 }, TODAY),
      dayBefore(5, { mood: 1, sleepHours: 4, journalCount: 1 }, TODAY),
      dayBefore(4, { mood: 1, sleepHours: 4, journalCount: 1 }, TODAY),
      dayBefore(3, { mood: 2, sleepHours: 5, journalCount: 1 }, TODAY),
      dayBefore(2, { mood: 3, sleepHours: 6, journalCount: 1 }, TODAY),
      dayBefore(1, { mood: 4, sleepHours: 7, journalCount: 1 }, TODAY),
      dayBefore(0, { mood: 5, sleepHours: 8, journalCount: 1 }, TODAY),
    ];
    const patterns = detectPatterns(days, TODAY);
    for (const p of patterns) {
      expect(p.length).toBeLessThan(100);
      expect(p).not.toMatch(/["'""'']/); // no quotes
      expect(p).not.toMatch(/\bwrote\b|\bnote\b|\bsaid\b/i);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// aggregateDaySignals
// ─────────────────────────────────────────────────────────────────────

describe("aggregateDaySignals", () => {
  it("turns score_inputs rows into one DaySignal per date", () => {
    const inputs: RawInput[] = [
      { date: "2026-05-18", source: "check_in", value: { mood: 4 } },
      { date: "2026-05-18", source: "sleep_log", value: { hours: 7 } },
      { date: "2026-05-19", source: "check_in", value: { mood: 3 } },
      { date: "2026-05-19", source: "journal", value: { sentiment: 0.2 } },
    ];
    const days = aggregateDaySignals(inputs);
    expect(days).toHaveLength(2);
    expect(days[0].date).toBe("2026-05-18");
    expect(days[0].mood).toBe(4);
    expect(days[0].sleepHours).toBe(7);
    expect(days[1].mood).toBe(3);
    expect(days[1].journalCount).toBe(1);
    expect(days[1].journalSentiment).toBeCloseTo(0.2);
  });

  it("averages multiple check-ins on the same day", () => {
    const inputs: RawInput[] = [
      { date: "2026-05-18", source: "check_in", value: { mood: 2 } },
      { date: "2026-05-18", source: "check_in", value: { mood: 4 } },
    ];
    const days = aggregateDaySignals(inputs);
    expect(days[0].mood).toBe(3); // average of 2 and 4
  });

  it("ignores any text/note fields — only reads known numeric keys", () => {
    const inputs: RawInput[] = [
      {
        date: "2026-05-18",
        source: "check_in",
        // Deliberately includes a "note" / "mind" field — should be ignored.
        value: { mood: 4, mind: "I felt nervous about Sarah's party", better: "more sleep" },
      },
    ];
    const days = aggregateDaySignals(inputs);
    // The DaySignal type has no slot for the text — so it can't leak.
    expect(days[0].mood).toBe(4);
    expect(Object.keys(days[0])).not.toContain("mind");
    expect(Object.keys(days[0])).not.toContain("better");
  });

  it("merges in daily_scores rows when provided", () => {
    const inputs: RawInput[] = [
      { date: "2026-05-18", source: "check_in", value: { mood: 4 } },
    ];
    const days = aggregateDaySignals(inputs, [
      { date: "2026-05-18", final: 72 },
    ]);
    expect(days[0].finalScore).toBe(72);
  });
});
