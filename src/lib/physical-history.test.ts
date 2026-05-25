import { describe, expect, it } from "vitest";
import { getPhysicalHistoryItems, physicalNextNudge, summarizePhysicalEntry } from "./physical-history";
import type { EngineEntry } from "./types";

describe("physical history", () => {
  it("summarizes saved meals without scoring food", () => {
    const entry = summarizePhysicalEntry({
      id: "meal-1",
      engine: "physical",
      entryType: "meal_log",
      title: "Fuel note",
      payload: {
        mealContext: "after_practice",
        items: [{ name: "Turkey sandwich" }, { name: "apple" }]
      },
      completedAt: "2026-05-25T10:00:00Z"
    });

    expect(entry).toMatchObject({
      kind: "food",
      title: "Fuel note",
      body: "Saved fuel: Turkey sandwich, apple."
    });
    expect(entry.body).not.toMatch(/score|target/i);
  });

  it("uses private scan analysis as body scan history", () => {
    expect(
      summarizePhysicalEntry({
        id: "scan-1",
        engine: "physical",
        entryType: "body_scan",
        payload: {
          analysis: {
            summary: "Private scan saved. Kai will use this as posture context."
          }
        }
      }).body
    ).toBe("Private scan saved. Kai will use this as posture context.");
  });

  it("filters recent items by physical kind", () => {
    const entries: EngineEntry[] = [
      { id: "sleep-1", engine: "physical", entryType: "sleep_log", payload: { hours: 8, quality: "solid" } },
      { id: "move-1", engine: "physical", entryType: "movement_log", payload: { minutes: 10, focus: "hips" } },
      { id: "sleep-2", engine: "physical", entryType: "sleep_log", payload: { hours: 6, quality: "rough" } }
    ];

    expect(getPhysicalHistoryItems(entries, "sleep")).toHaveLength(2);
    expect(getPhysicalHistoryItems(entries, "movement")[0]?.body).toBe("10 minutes for hips.");
  });

  it("returns next nudges that keep the loop action-oriented", () => {
    expect(physicalNextNudge("sleep")).toContain("Log last night once");
    expect(physicalNextNudge("food", { id: "x", kind: "food", title: "Fuel note", body: "Saved fuel.", meta: "today" })).toContain("Next:");
  });
});
