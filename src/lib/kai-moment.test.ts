import { afterEach, describe, expect, it } from "vitest";

import { classifyMoment } from "./kai-moment";
import { appendLocalInput, clearLocalInputs } from "./local-score";

const NOW = new Date("2026-06-19T12:00:00");

/** Seed `count` consecutive check-in days ending on `endDate`. */
function seedStreak(count: number, endDate: string, mood = 4) {
  const d = new Date(endDate);
  for (let i = 0; i < count; i += 1) {
    appendLocalInput({
      source: "check_in",
      date: d.toISOString().slice(0, 10),
      value: { mood },
    });
    d.setDate(d.getDate() - 1);
  }
}

describe("classifyMoment", () => {
  afterEach(() => clearLocalInputs());

  it("is 'milestone' when the streak just crossed a milestone day", () => {
    seedStreak(7, "2026-06-19");
    expect(classifyMoment(NOW)).toBe("milestone");
  });

  it("is 'struggle' when recent check-in mood is low", () => {
    // 4 days of mood ≤ 2 trips the low_mood signal.
    seedStreak(4, "2026-06-19", 1);
    expect(classifyMoment(NOW)).toBe("struggle");
  });

  it("is 'routine' on an ordinary day", () => {
    seedStreak(3, "2026-06-19");
    expect(classifyMoment(NOW)).toBe("routine");
  });
});
