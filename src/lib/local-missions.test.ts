// Rawz/2 — daily missions tests.
//
// Critical invariants:
//   - Exactly 3 missions returned, every time
//   - Priority: check-in > sleep > energy > workout/food/journal > stretch/hydrate
//   - Logging a check-in (via appendLocalInput) auto-completes the
//     check-in mission without the user manually ticking it
//   - Different days regenerate the set
//   - Explicit completeMission still works for stretch / hydrate

import { beforeEach, describe, expect, it } from "vitest";
import {
  completeMission,
  getTodayMissions,
  missionProgress,
  resetTodayMissions,
} from "./local-missions";
import { appendLocalInput } from "./local-score";

const memory = new Map<string, string>();
beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => { memory.set(k, v); },
    removeItem: (k: string) => { memory.delete(k); },
    clear: () => memory.clear(),
    key: (i: number) => Array.from(memory.keys())[i] ?? null,
    get length() { return memory.size; },
  } as unknown as Storage;
});

describe("getTodayMissions", () => {
  it("always returns exactly 3 missions", () => {
    expect(getTodayMissions()).toHaveLength(3);
  });

  it("prioritizes check_in when no check-in has been logged today", () => {
    const missions = getTodayMissions();
    expect(missions.some((m) => m.id === "check_in")).toBe(true);
  });

  it("prioritizes sleep when no sleep log today", () => {
    const missions = getTodayMissions();
    expect(missions.some((m) => m.id === "log_sleep")).toBe(true);
  });

  it("none start as completed", () => {
    const missions = getTodayMissions();
    for (const m of missions) {
      expect(m.completed).toBe(false);
    }
  });

  it("regenerates on a new day", () => {
    getTodayMissions();
    // Simulate yesterday's storage
    const raw = localStorage.getItem("kai_missions_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.date = "1999-01-01";
      localStorage.setItem("kai_missions_v1", JSON.stringify(parsed));
    }
    const second = getTodayMissions();
    // Both are length 3; second has today's date stored
    expect(second).toHaveLength(3);
    const stored = JSON.parse(localStorage.getItem("kai_missions_v1")!);
    expect(stored.date).toBe(new Date().toISOString().slice(0, 10));
  });

  it("personalizes goals from emotional onboarding instead of random defaults", () => {
    const missions = getTodayMissions({
      firstName: "Lev",
      focusAreas: ["mood", "confidence"],
      hardestLately: "I am sad and overthinking",
      followUps: {},
      updatedAt: new Date().toISOString(),
    });
    expect(missions.map((m) => m.id)).toEqual(["check_in", "journal", "stretch"]);
    expect(missions[0].title).toBe("Name the feeling");
    expect(missions[1].title).toBe("Write the real sentence");
  });

  it("personalizes goals from focus/distraction onboarding", () => {
    const missions = getTodayMissions({
      focusAreas: ["focus", "motivation"],
      hardestLately: "I keep procrastinating and my phone distracts me",
      followUps: {},
      updatedAt: new Date().toISOString(),
    });
    expect(missions.map((m) => m.id)).toEqual(["journal", "energy_check", "stretch"]);
    expect(missions[0].title).toBe("Pick the first tiny rep");
  });
});

describe("auto-completion from score inputs", () => {
  it("logging a check-in via appendLocalInput auto-completes the check_in mission", () => {
    const before = getTodayMissions();
    const checkInMission = before.find((m) => m.id === "check_in");
    expect(checkInMission?.completed).toBe(false);

    appendLocalInput({
      date: new Date().toISOString().slice(0, 10),
      source: "check_in",
      value: { mood: 4 },
    });

    const after = getTodayMissions();
    const checkInAfter = after.find((m) => m.id === "check_in");
    expect(checkInAfter?.completed).toBe(true);
  });

  it("logging sleep AFTER missions are generated auto-completes log_sleep", () => {
    // Generate the day's set first (locks in the list with sleep included
    // since nothing's logged yet)
    const before = getTodayMissions();
    expect(before.some((m) => m.id === "log_sleep")).toBe(true);

    appendLocalInput({
      date: new Date().toISOString().slice(0, 10),
      source: "sleep_log",
      value: { hours: 7.5 },
    });

    const after = getTodayMissions();
    const sleep = after.find((m) => m.id === "log_sleep");
    expect(sleep?.completed).toBe(true);
  });

  it("logging happens AFTER mission generation; pre-logged items don't appear in the set", () => {
    // If sleep was logged before missions ever generated, it shouldn't be
    // picked (because it's already done — picking it would be silly).
    appendLocalInput({
      date: new Date().toISOString().slice(0, 10),
      source: "sleep_log",
      value: { hours: 7 },
    });
    const missions = getTodayMissions();
    // log_sleep should NOT be in the list since it was already done
    expect(missions.some((m) => m.id === "log_sleep")).toBe(false);
  });
});

describe("completeMission (explicit tick)", () => {
  it("marks a mission as completed without a score input", () => {
    // Generate today's set
    const initial = getTodayMissions();
    const target = initial[0];
    const updated = completeMission(target.id);
    const targetUpdated = updated.find((m) => m.id === target.id);
    expect(targetUpdated?.completed).toBe(true);
  });

  it("is idempotent — completing twice doesn't double-add", () => {
    const initial = getTodayMissions();
    const target = initial[0];
    completeMission(target.id);
    completeMission(target.id);
    const stored = JSON.parse(localStorage.getItem("kai_missions_v1")!);
    expect(stored.completed.filter((id: string) => id === target.id)).toHaveLength(1);
  });
});

describe("missionProgress", () => {
  it("returns {done: 0, total: 3} on fresh day", () => {
    getTodayMissions(); // initialize
    expect(missionProgress()).toEqual({ done: 0, total: 3 });
  });

  it("increments done as missions are explicitly ticked", () => {
    const initial = getTodayMissions();
    completeMission(initial[0].id);
    expect(missionProgress().done).toBe(1);
  });
});

describe("resetTodayMissions", () => {
  it("clears storage and regenerates", () => {
    const initial = getTodayMissions();
    completeMission(initial[0].id);
    expect(missionProgress().done).toBe(1);
    resetTodayMissions();
    expect(missionProgress().done).toBe(0);
  });
});
