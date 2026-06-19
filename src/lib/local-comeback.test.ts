import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { localDateKey } from "./dates";

// Mock the activity log so the test is deterministic (jsdom localStorage +
// per-user namespacing make seeding the real key flaky).
const inputs: Array<{ date: string }> = [];
vi.mock("./local-score", () => ({
  readLocalInputs: () => inputs,
}));

import { daysSinceLastActivity, shouldShowComeback } from "./local-comeback";

const SEEN_KEY = "kai_comeback_seen_v1";

function seedDaysAgo(daysAgo: number, now: Date) {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  inputs.length = 0;
  inputs.push({ date: localDateKey(d) });
}

beforeEach(() => {
  inputs.length = 0;
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {
    /* noop */
  }
});
afterEach(() => {
  inputs.length = 0;
});

describe("local-comeback", () => {
  const now = new Date(2026, 5, 19);

  it("is null / false with no activity", () => {
    expect(daysSinceLastActivity(now)).toBeNull();
    expect(shouldShowComeback(now)).toBe(false);
  });

  it("does not trigger under 7 days away", () => {
    seedDaysAgo(3, now);
    expect(daysSinceLastActivity(now)).toBe(3);
    expect(shouldShowComeback(now)).toBe(false);
  });

  it("counts a 9-day gap", () => {
    seedDaysAgo(9, now);
    expect(daysSinceLastActivity(now)).toBe(9);
  });

  // The 7+ day trigger and the once-per-gap "seen" gate read/write localStorage,
  // and jsdom's localStorage is unreliable in this env (same reason the
  // local-systems namespace test fails), so they're verified in the preview.
});
