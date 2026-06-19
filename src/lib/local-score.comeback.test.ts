import { afterEach, describe, expect, it } from "vitest";

import {
  appendLocalInput,
  clearLocalInputs,
  daysSinceAnyActivity,
} from "./local-score";

const NOW = new Date("2026-06-19T12:00:00");

describe("daysSinceAnyActivity", () => {
  afterEach(() => clearLocalInputs());

  it("returns null when there's never been any activity", () => {
    expect(daysSinceAnyActivity(NOW)).toBeNull();
  });

  it("returns 0 when the most recent input is today", () => {
    appendLocalInput({ source: "check_in", date: "2026-06-19", value: {} });
    expect(daysSinceAnyActivity(NOW)).toBe(0);
  });

  it("returns days since the most recent input across all sources", () => {
    appendLocalInput({ source: "sleep_log", date: "2026-06-01", value: {} });
    appendLocalInput({ source: "check_in", date: "2026-06-11", value: {} });
    // Most recent is 06-11 → 8 days before 06-19.
    expect(daysSinceAnyActivity(NOW)).toBe(8);
  });
});
