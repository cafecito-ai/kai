// Phase G — friend-graph pure-helper tests. The route handlers talk to D1 and
// are verified by hand / two-user E2E; this covers the pure invariants.

import { describe, expect, it } from "vitest";
import {
  addDaysKey,
  clampDays,
  clampTarget,
  daysRemaining,
  isChallengeComplete,
  normalizeMetric,
  normalizeUsername,
} from "../src/routes/friends";

describe("normalizeUsername", () => {
  it("lowercases and accepts valid handles", () => {
    expect(normalizeUsername("LevTheBoxer")).toBe("levtheboxer");
    expect(normalizeUsername("  jake_99 ")).toBe("jake_99");
  });
  it("rejects too short, too long, or illegal chars", () => {
    expect(normalizeUsername("ab")).toBeNull();
    expect(normalizeUsername("a".repeat(21))).toBeNull();
    expect(normalizeUsername("has spaces")).toBeNull();
    expect(normalizeUsername("emoji😀")).toBeNull();
    expect(normalizeUsername(null)).toBeNull();
  });
});

describe("clampTarget / clampDays / normalizeMetric", () => {
  it("clamps target to 1..1000", () => {
    expect(clampTarget(0)).toBe(1);
    expect(clampTarget(50)).toBe(50);
    expect(clampTarget(99999)).toBe(1000);
    expect(clampTarget("nope")).toBe(1);
  });
  it("clamps days to 1..365 with a 30 default", () => {
    expect(clampDays(7)).toBe(7);
    expect(clampDays(0)).toBe(1);
    expect(clampDays(99999)).toBe(365);
    expect(clampDays(undefined)).toBe(30);
  });
  it("falls back unknown metrics to custom", () => {
    expect(normalizeMetric("workout")).toBe("workout");
    expect(normalizeMetric("sleep_log")).toBe("sleep_log");
    expect(normalizeMetric("bogus")).toBe("custom");
  });
});

describe("challenge window math", () => {
  const now = new Date("2026-06-19T12:00:00Z");

  it("addDaysKey makes an inclusive window", () => {
    // A 7-day challenge starting the 19th ends the 25th.
    expect(addDaysKey("2026-06-19", 7)).toBe("2026-06-25");
    expect(addDaysKey("2026-06-19", 1)).toBe("2026-06-19");
  });

  it("daysRemaining counts whole days, 0 once closed", () => {
    expect(daysRemaining("2026-06-25", now)).toBeGreaterThan(0);
    expect(daysRemaining("2026-06-10", now)).toBe(0);
  });

  it("isChallengeComplete on target hit OR window close", () => {
    expect(isChallengeComplete(20, 20, "2026-06-25", now)).toBe(true); // hit target
    expect(isChallengeComplete(3, 20, "2026-06-25", now)).toBe(false); // mid-way
    expect(isChallengeComplete(3, 20, "2026-06-10", now)).toBe(true); // window closed
  });
});
