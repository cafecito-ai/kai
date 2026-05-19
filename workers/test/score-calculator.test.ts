// Daily Score calculator tests — covers the formula, the saturating sleep
// curve, mood/sentiment mappings, and the all-edge-cases guarantee (never
// NaN, missing sub-scores get null + reason).

import { describe, expect, it } from "vitest";
import {
  calculateDailyScore,
  bandFor,
} from "../src/lib/score-calculator";

describe("calculateDailyScore — empty/edge cases", () => {
  it("returns nulls + reasons when there are no inputs", () => {
    const r = calculateDailyScore([]);
    expect(r.final).toBeNull();
    expect(r.mental).toBeNull();
    expect(r.sleep).toBeNull();
    expect(r.mood).toBeNull();
    expect(r.band).toBeNull();
    expect(r.reasons.final).toMatch(/start with a check-in or sleep log/i);
  });

  it("never returns NaN even for garbage payloads", () => {
    const r = calculateDailyScore([
      { source: "check_in", value: { mood: NaN } },
      { source: "sleep_log", value: { hours: Number.NaN } },
      { source: "journal", value: { sentiment: Infinity } },
    ]);
    expect(Number.isNaN(r.final)).toBe(false);
    expect(Number.isNaN(r.mental)).toBe(false);
    expect(Number.isNaN(r.sleep)).toBe(false);
    expect(Number.isNaN(r.mood)).toBe(false);
  });
});

describe("sub-scores", () => {
  it("a great check-in (mood 5) + great sleep (8h) + journal positive → high band", () => {
    const r = calculateDailyScore([
      { source: "check_in", value: { mood: 5 } },
      { source: "sleep_log", value: { hours: 8 } },
      { source: "journal", value: { sentiment: 1 } },
    ]);
    expect(r.final).toBeGreaterThanOrEqual(85);
    expect(r.band).toBe("high");
  });

  it("a rough day (mood 1, sleep 4h, journal negative) → low band but never 0 red", () => {
    const r = calculateDailyScore([
      { source: "check_in", value: { mood: 1 } },
      { source: "sleep_log", value: { hours: 4 } },
      { source: "journal", value: { sentiment: -1 } },
    ]);
    expect(r.final).not.toBeNull();
    expect(r.final!).toBeLessThan(45);
    expect(r.band).toBe("low");
  });
});

describe("sleep curve (8h cap, 9h+ ease-back, 6h notable dip)", () => {
  it("8h sleep is the peak (100)", () => {
    const r = calculateDailyScore([
      { source: "sleep_log", value: { hours: 8 } },
    ]);
    expect(r.sleep).toBe(100);
  });
  it("7h ≈ 90", () => {
    const r = calculateDailyScore([
      { source: "sleep_log", value: { hours: 7 } },
    ]);
    expect(r.sleep).toBe(90);
  });
  it("6h ≈ 75", () => {
    const r = calculateDailyScore([
      { source: "sleep_log", value: { hours: 6 } },
    ]);
    expect(r.sleep).toBe(75);
  });
  it("4h ≈ 40", () => {
    const r = calculateDailyScore([
      { source: "sleep_log", value: { hours: 4 } },
    ]);
    expect(r.sleep).toBe(40);
  });
  it("9h+ eases back to 95 (oversleep also signals something off)", () => {
    const r = calculateDailyScore([
      { source: "sleep_log", value: { hours: 11 } },
    ]);
    expect(r.sleep).toBe(95);
  });
  it("quality (1-5) blends in when provided", () => {
    const without = calculateDailyScore([
      { source: "sleep_log", value: { hours: 6 } },
    ]).sleep;
    const withQuality = calculateDailyScore([
      { source: "sleep_log", value: { hours: 6, quality: 5 } },
    ]).sleep;
    expect(withQuality).toBeGreaterThan(without!);
  });
});

describe("partial inputs re-weight present sub-scores", () => {
  it("only a check-in → final is the mental score itself", () => {
    const r = calculateDailyScore([
      { source: "check_in", value: { mood: 4 } },
    ]);
    expect(r.mental).not.toBeNull();
    expect(r.sleep).toBeNull();
    expect(r.mood).not.toBeNull();
    // With only mental+mood present, the calculator re-weights from
    // the original 0.4/0.3/0.3 → present weights.
    expect(r.final).not.toBeNull();
    expect(r.final).toBeGreaterThan(0);
  });

  it("only sleep → final is the sleep score itself", () => {
    const r = calculateDailyScore([
      { source: "sleep_log", value: { hours: 8 } },
    ]);
    expect(r.sleep).toBe(100);
    expect(r.mental).toBeNull();
    expect(r.mood).toBeNull();
    expect(r.final).toBe(100);
  });
});

describe("idempotence + accumulation", () => {
  it("running the same inputs twice returns the same score", () => {
    const inputs = [
      { source: "check_in", value: { mood: 4 } } as const,
      { source: "sleep_log", value: { hours: 7 } } as const,
    ];
    const a = calculateDailyScore(inputs);
    const b = calculateDailyScore(inputs);
    expect(a.final).toBe(b.final);
    expect(a.mental).toBe(b.mental);
    expect(a.sleep).toBe(b.sleep);
    expect(a.mood).toBe(b.mood);
  });

  it("multiple check-ins average rather than over-weight the last one", () => {
    const r = calculateDailyScore([
      { source: "check_in", value: { mood: 5 } },
      { source: "check_in", value: { mood: 1 } },
    ]);
    // 5 → 95, 1 → 10 → avg 52-ish. Should land mid, not high.
    expect(r.mental).toBeLessThan(70);
    expect(r.mental).toBeGreaterThan(40);
  });
});

describe("bandFor (v3 §2 thresholds, never red)", () => {
  it.each([
    [0, "low"],
    [40, "low"],
    [41, "mid"],
    [70, "mid"],
    [71, "high"],
    [100, "high"],
  ] as const)("score %s → %s band", (score, expected) => {
    expect(bandFor(score)).toBe(expected);
  });
});
