import { beforeEach, describe, expect, it, vi } from "vitest";

import { setSchedule } from "./local-schedule";
import {
  clearSystemGoal,
  getSystemGoal,
  isDoneToday,
  listSystems,
  saveCurrentAsSystem,
  setSystemGoal,
  toggleDoneToday,
} from "./local-systems";

describe("local systems storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("namespaces system goal, saved systems, and check-offs by signed-in user", () => {
    setSystemGoal("Alice goal", "alice");
    setSystemGoal("Bob goal", "bob");

    expect(getSystemGoal("alice")).toBe("Alice goal");
    expect(getSystemGoal("bob")).toBe("Bob goal");

    vi.spyOn(crypto, "randomUUID").mockReturnValue("00000000-0000-4000-8000-000000000000");
    setSchedule([
      { section: "daily", title: "Read", detail: "", days: [], time: null },
    ]);

    saveCurrentAsSystem("alice");
    expect(listSystems("alice")).toHaveLength(1);
    expect(listSystems("bob")).toHaveLength(0);

    const itemId = listSystems("alice")[0].items[0].id;
    toggleDoneToday(itemId, "alice");
    expect(isDoneToday(itemId, "alice")).toBe(true);
    expect(isDoneToday(itemId, "bob")).toBe(false);
  });

  it("clears the system goal for the right user only", () => {
    setSystemGoal("Alice goal", "alice");
    setSystemGoal("Bob goal", "bob");

    clearSystemGoal("alice");

    // Alice's goal is gone (no North Star fallback set, so null); Bob's stays.
    expect(getSystemGoal("alice")).toBeNull();
    expect(getSystemGoal("bob")).toBe("Bob goal");
  });
});
