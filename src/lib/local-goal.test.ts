import { afterEach, describe, expect, it } from "vitest";
import { localDateKey, addDays } from "./dates";
import {
  goalProgress,
  goalSignature,
  loadCachedTimeline,
  saveCachedTimeline,
} from "./local-goal";

const SCHEDULE_KEY = "kai_schedule_v1";
const DONE_KEY = "kai_system_done_v1";
const GOAL_STARTED_KEY = "kai_goal_started_v1";

const OLD = new Date(0).toISOString();

function seedSystem() {
  localStorage.setItem(
    SCHEDULE_KEY,
    JSON.stringify([
      { id: "d1", section: "daily", title: "Move", detail: "", days: [], time: null, createdAt: OLD },
    ]),
  );
}

afterEach(() => localStorage.clear());

describe("timeline cache (only re-calls when goal/system changes)", () => {
  it("returns the cached estimate for the same goal + system, null otherwise", () => {
    seedSystem();
    saveCachedTimeline("Get stronger", { weeks: 12, rationale: "r", factors: [] });
    expect(loadCachedTimeline("Get stronger")?.weeks).toBe(12);
    // Different goal → cache miss.
    expect(loadCachedTimeline("Learn guitar")).toBeNull();
  });

  it("invalidates when the system changes", () => {
    seedSystem();
    saveCachedTimeline("Get stronger", { weeks: 12, rationale: "r", factors: [] });
    const sigBefore = goalSignature("Get stronger");
    // Add an item → signature changes → cache miss.
    localStorage.setItem(
      SCHEDULE_KEY,
      JSON.stringify([
        { id: "d1", section: "daily", title: "Move", detail: "", days: [], time: null, createdAt: OLD },
        { id: "t1", section: "training", title: "Lift", detail: "", days: [], time: null, createdAt: OLD },
      ]),
    );
    expect(goalSignature("Get stronger")).not.toBe(sigBefore);
    expect(loadCachedTimeline("Get stronger")).toBeNull();
  });

  it("invalidates when an item's cadence changes, not just its title", () => {
    localStorage.setItem(
      SCHEDULE_KEY,
      JSON.stringify([{ id: "t1", section: "training", title: "Lift", detail: "", days: [1], time: null, createdAt: OLD }]),
    );
    saveCachedTimeline("Get stronger", { weeks: 8, rationale: "", factors: [] });
    expect(loadCachedTimeline("Get stronger")?.weeks).toBe(8);
    // Same title, but now five days a week → a real system change → cache miss.
    localStorage.setItem(
      SCHEDULE_KEY,
      JSON.stringify([{ id: "t1", section: "training", title: "Lift", detail: "", days: [1, 2, 3, 4, 5], time: null, createdAt: OLD }]),
    );
    expect(loadCachedTimeline("Get stronger")).toBeNull();
  });
});

describe("goalProgress — consistency-driven", () => {
  const ref = new Date("2026-06-20T12:00:00");

  function startedDaysAgo(days: number) {
    // The goal's clock is scoped per-goal (keyed by normalized goal text).
    localStorage.setItem(
      GOAL_STARTED_KEY,
      JSON.stringify({ "get stronger": localDateKey(addDays(ref, -days)) }),
    );
  }

  it("returns null without a cached estimate", () => {
    seedSystem();
    expect(goalProgress("Get stronger", ref)).toBeNull();
  });

  it("higher consistency = more progress and a sooner finish", () => {
    seedSystem();
    saveCachedTimeline("Get stronger", { weeks: 10, rationale: "steady", factors: ["consistency"] });
    startedDaysAgo(35); // 5 weeks in

    // Low consistency: nothing done → System Health 0 → floored at 0.4.
    const low = goalProgress("Get stronger", ref)!;

    // High consistency: complete the daily item across the whole window.
    const map: Record<string, string[]> = {};
    for (let d = 0; d < 14; d += 1) map[localDateKey(addDays(ref, -d))] = ["d1"];
    localStorage.setItem(DONE_KEY, JSON.stringify(map));
    const high = goalProgress("Get stronger", ref)!;

    expect(high.pct).toBeGreaterThan(low.pct);
    expect(high.projectedFinishISO < low.projectedFinishISO).toBe(true); // sooner
    expect(high.estimatedWeeks).toBe(10);
    expect(high.pct).toBeGreaterThanOrEqual(0);
    expect(high.pct).toBeLessThanOrEqual(100);
  });
});
