import { afterEach, describe, expect, it } from "vitest";
import { localDateKey, addDays } from "./dates";
import {
  goalProgress,
  goalSignature,
  loadCachedTimeline,
  saveCachedTimeline,
  systemSummary,
} from "./local-goal";

const SCHEDULE_KEY = "kai_schedule_v1";
const DONE_KEY = "kai_system_done_v1";
const GOAL_STARTED_KEY = "kai_goal_started_v1";
const NORTHSTAR_KEY = "kai_northstar_v1";

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

describe("goal start anchor (Codex round-2)", () => {
  function setNorthStarRaw(goal: string, createdAtISO: string) {
    localStorage.setItem(
      NORTHSTAR_KEY,
      JSON.stringify({ goal, theme: "strength", source: "custom", createdAt: createdAtISO }),
    );
  }

  it("stamps the goal start from a matching North Star createdAt (credits prior time)", () => {
    seedSystem();
    setNorthStarRaw("Get stronger", "2026-05-01T12:00:00.000Z");
    saveCachedTimeline("Get stronger", { weeks: 10, rationale: "", factors: [] });
    const map = JSON.parse(localStorage.getItem(GOAL_STARTED_KEY)!);
    expect(map["get stronger"]).toBe(localDateKey(new Date("2026-05-01T12:00:00.000Z")));
  });

  it("falls back to today when the North Star goal doesn't match", () => {
    seedSystem();
    setNorthStarRaw("Learn guitar", "2026-05-01T12:00:00.000Z");
    saveCachedTimeline("Get stronger", { weeks: 10, rationale: "", factors: [] });
    const map = JSON.parse(localStorage.getItem(GOAL_STARTED_KEY)!);
    expect(map["get stronger"]).toBe(localDateKey(new Date()));
  });
});

describe("systemSummary (Codex round-2 — cadence in the estimate input)", () => {
  it("includes cadence and detail so a workload change reaches the model", () => {
    localStorage.setItem(
      SCHEDULE_KEY,
      JSON.stringify([
        { id: "t1", section: "training", title: "Lift", detail: "progressive overload", days: [1, 2, 3, 4, 5], time: "17:00", createdAt: OLD },
      ]),
    );
    const s = systemSummary();
    expect(s).toContain("Lift (");          // cadence is now attached
    expect(s).toContain("progressive overload");
    expect(s).not.toContain("(daily)");      // a 5-day item isn't "daily"
  });
});

describe("goal start anchor — signed-in users keep their set date (Codex round-3)", () => {
  function setNorthStarRaw(goal: string, createdAtISO: string) {
    localStorage.setItem(
      NORTHSTAR_KEY,
      JSON.stringify({ goal, theme: "strength", source: "custom", createdAt: createdAtISO }),
    );
  }

  it("credits a signed-in user's own matching North Star createdAt", () => {
    seedSystem();
    // A signed-in user set this goal weeks ago; their first estimate lands now.
    setNorthStarRaw("Get stronger", "2026-05-01T12:00:00.000Z");
    saveCachedTimeline("Get stronger", { weeks: 10, rationale: "", factors: [] }, "user_b");
    // The clock must reflect when they SET the goal, not lose those weeks.
    const map = JSON.parse(localStorage.getItem("u_user_b__kai_goal_started_v1")!);
    expect(map["get stronger"]).toBe(localDateKey(new Date("2026-05-01T12:00:00.000Z")));
  });
});

describe("timeline cache (only re-calls when goal/system changes)", () => {
  it("invalidates when an item's detail changes past 40 chars (Codex round-3)", () => {
    const longA = "x".repeat(40) + " original tail";
    const longB = "x".repeat(40) + " changed tail";
    localStorage.setItem(
      SCHEDULE_KEY,
      JSON.stringify([{ id: "t1", section: "training", title: "Lift", detail: longA, days: [1], time: null, createdAt: OLD }]),
    );
    saveCachedTimeline("Get stronger", { weeks: 8, rationale: "", factors: [] });
    expect(loadCachedTimeline("Get stronger")?.weeks).toBe(8);
    // Only the detail past char 40 changed — the AI input differs, so the cache
    // must miss and re-estimate (the old 40-char prefix would have collided).
    localStorage.setItem(
      SCHEDULE_KEY,
      JSON.stringify([{ id: "t1", section: "training", title: "Lift", detail: longB, days: [1], time: null, createdAt: OLD }]),
    );
    expect(loadCachedTimeline("Get stronger")).toBeNull();
  });
});

describe("timeline cache (goal/system signature)", () => {
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

  it("stamps a start date for a pre-cached estimate that has none (Codex round-3)", () => {
    seedSystem();
    // Simulate a timeline cached before the start-map existed: write the cache
    // entry directly so saveCachedTimeline (and its ensureGoalStart) never ran.
    localStorage.setItem(
      "kai_goal_timeline_v1",
      JSON.stringify({ sig: goalSignature("Get stronger"), estimate: { weeks: 10, rationale: "", factors: [] } }),
    );
    expect(localStorage.getItem(GOAL_STARTED_KEY)).toBeNull();

    const p = goalProgress("Get stronger", ref)!;
    expect(p).not.toBeNull();
    // goalProgress must have stamped the start (today = ref) so it isn't stuck at 0%.
    const map = JSON.parse(localStorage.getItem(GOAL_STARTED_KEY)!);
    expect(map["get stronger"]).toBe(localDateKey(ref));
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
