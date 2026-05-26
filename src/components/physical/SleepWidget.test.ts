import { describe, expect, it } from "vitest";
import { formatDuration, sleepEventValue } from "./SleepWidget";

describe("formatDuration", () => {
  it("returns '0m' for 0 minutes — used as the initial 'asleep for' value", () => {
    expect(formatDuration(0)).toBe("0m");
  });

  it("uses bare minutes under 60", () => {
    expect(formatDuration(34)).toBe("34m");
  });

  it("uses Xh for exact-hour durations", () => {
    expect(formatDuration(180)).toBe("3h");
  });

  it("uses Xh Ym for mixed durations", () => {
    expect(formatDuration(7 * 60 + 24)).toBe("7h 24m");
  });
});

describe("sleepEventValue", () => {
  it("gives a small signal for very short sessions (nap / mismatched tap)", () => {
    expect(sleepEventValue(60)).toBe(4);
  });

  it("gives partial credit for short nights", () => {
    expect(sleepEventValue(5 * 60)).toBe(12);
  });

  it("gives almost-full credit for 6-7h nights", () => {
    expect(sleepEventValue(6 * 60 + 30)).toBe(20);
  });

  it("gives full credit for the 7-9h sweet spot", () => {
    expect(sleepEventValue(7 * 60 + 30)).toBe(26);
    expect(sleepEventValue(8 * 60 + 30)).toBe(26);
  });

  it("tapers for 9h+ nights (still positive, not a punishment)", () => {
    expect(sleepEventValue(10 * 60)).toBe(18);
  });
});
