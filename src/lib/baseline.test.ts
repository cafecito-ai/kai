import { afterEach, describe, expect, it } from "vitest";

import { progressDeltas } from "./baseline";
import { appendLocalInput, clearLocalInputs } from "./local-score";

const NOW = new Date("2026-06-30T12:00:00");

describe("progressDeltas", () => {
  afterEach(() => clearLocalInputs());

  it("returns nulls/zeros when there's no history", () => {
    const d = progressDeltas(NOW);
    expect(d.workoutsLifetime).toBe(0);
    expect(d.sleepHoursDelta).toBeNull();
  });

  it("counts lifetime workouts across all time", () => {
    appendLocalInput({ source: "workout", date: "2026-06-01", value: {} });
    appendLocalInput({ source: "workout", date: "2026-06-20", value: {} });
    appendLocalInput({ source: "workout", date: "2026-06-29", value: {} });
    expect(progressDeltas(NOW).workoutsLifetime).toBe(3);
  });

  it("compares recent sleep to the first week of sleep", () => {
    // First week of activity (early June): ~5h.
    appendLocalInput({ source: "sleep_log", date: "2026-06-01", value: { hours: 5 } });
    appendLocalInput({ source: "sleep_log", date: "2026-06-02", value: { hours: 5 } });
    // Recent week (late June): ~7.5h.
    appendLocalInput({ source: "sleep_log", date: "2026-06-28", value: { hours: 7 } });
    appendLocalInput({ source: "sleep_log", date: "2026-06-29", value: { hours: 8 } });

    const d = progressDeltas(NOW);
    expect(d.sleepHoursDelta).toBeCloseTo(2.5, 5);
  });
});
