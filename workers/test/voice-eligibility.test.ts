// T-035 — voice eligibility tests.
//
// Critical CLAUDE.md §5 invariant: under-16 users must not get voice
// access between 11 PM and 6 AM local time.

import { describe, expect, it } from "vitest";
import {
  checkVoiceEligibility,
  isNightHour,
} from "../src/lib/voice-eligibility";

describe("isNightHour", () => {
  it("11 PM is night", () => {
    expect(isNightHour(23)).toBe(true);
  });
  it("midnight through 5 AM is night", () => {
    for (const h of [0, 1, 2, 3, 4, 5]) {
      expect(isNightHour(h)).toBe(true);
    }
  });
  it("6 AM is allowed (exclusive end)", () => {
    expect(isNightHour(6)).toBe(false);
  });
  it("daytime hours are allowed", () => {
    for (const h of [7, 9, 12, 15, 18, 22]) {
      expect(isNightHour(h)).toBe(false);
    }
  });
  it("10 PM is allowed (inclusive start is 11 PM)", () => {
    expect(isNightHour(22)).toBe(false);
  });
  it("invalid input is treated as not-night (defensive)", () => {
    expect(isNightHour(NaN)).toBe(false);
  });
});

describe("checkVoiceEligibility — 16+", () => {
  it("16+ allowed at any hour", () => {
    for (const h of [0, 6, 12, 23]) {
      expect(checkVoiceEligibility({ age: 16, localHour: h }).allowed).toBe(true);
      expect(checkVoiceEligibility({ age: 18, localHour: h }).allowed).toBe(true);
      expect(checkVoiceEligibility({ age: 45, localHour: h }).allowed).toBe(true);
    }
  });
  it("null age is treated as 16+ (fail-open) at any hour", () => {
    for (const h of [0, 6, 12, 23]) {
      expect(
        checkVoiceEligibility({ age: null, localHour: h }).allowed,
      ).toBe(true);
    }
  });
});

describe("checkVoiceEligibility — under 16", () => {
  it("blocked at 11 PM through 5:59 AM", () => {
    for (const h of [23, 0, 1, 2, 3, 4, 5]) {
      const r = checkVoiceEligibility({ age: 14, localHour: h });
      expect(r.allowed).toBe(false);
      if (!r.allowed) {
        expect(r.reason).toBe("night_under_16");
        expect(r.message).toMatch(/11 PM and 6 AM/i);
        expect(r.message).toMatch(/under 16/i);
      }
    }
  });
  it("allowed during daytime (6 AM through 10:59 PM)", () => {
    for (const h of [6, 7, 12, 15, 18, 22]) {
      expect(
        checkVoiceEligibility({ age: 14, localHour: h }).allowed,
      ).toBe(true);
    }
  });
  it("13-year-old blocked same as 15-year-old", () => {
    for (const age of [13, 14, 15]) {
      expect(
        checkVoiceEligibility({ age, localHour: 23 }).allowed,
      ).toBe(false);
    }
  });
  it("message never uses shame language", () => {
    const r = checkVoiceEligibility({ age: 14, localHour: 2 });
    expect(r.allowed).toBe(false);
    if (!r.allowed) {
      expect(r.message).not.toMatch(/lazy|excuse|kid|child/i);
    }
  });
});

describe("checkVoiceEligibility — edge cases", () => {
  it("16th birthday — turning 16 unblocks", () => {
    expect(
      checkVoiceEligibility({ age: 15, localHour: 23 }).allowed,
    ).toBe(false);
    expect(
      checkVoiceEligibility({ age: 16, localHour: 23 }).allowed,
    ).toBe(true);
  });
  it("hour 6.5 (just past 6 AM, fractional) is allowed", () => {
    expect(
      checkVoiceEligibility({ age: 14, localHour: 6.5 }).allowed,
    ).toBe(true);
  });
  it("hour 22.99 (just before 11 PM) is allowed", () => {
    expect(
      checkVoiceEligibility({ age: 14, localHour: 22.99 }).allowed,
    ).toBe(true);
  });
});
