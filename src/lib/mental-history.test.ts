import { describe, expect, it } from "vitest";
import { getMentalPatternItems, mentalNextNudge, summarizeMentalEntry } from "./mental-history";
import type { EngineEntry } from "./types";

describe("mental history", () => {
  it("summarizes feelings check-ins as patterns without diagnosis", () => {
    const item = summarizeMentalEntry({
      id: "feel-1",
      engine: "mental",
      entryType: "feelings_check_in",
      title: "Feelings check-in",
      payload: {
        emotions: { anxious: 8, sad: 3, energized: 1 },
        bodyArea: "chest"
      }
    });

    expect(item).toMatchObject({
      kind: "checkin",
      body: "anxious was loudest, mostly in chest."
    });
    expect(item.body).not.toMatch(/diagnos/i);
  });

  it("summarizes reframes through the teen's own honest sentence", () => {
    expect(
      summarizeMentalEntry({
        id: "reframe-1",
        engine: "mental",
        entryType: "thought_reframe",
        payload: { reframe: "This is hard, but I can make the next move smaller." }
      }).body
    ).toBe("This is hard, but I can make the next move smaller.");
  });

  it("filters by mental pattern kind", () => {
    const entries: EngineEntry[] = [
      { id: "social-1", engine: "mental", entryType: "social_reset", payload: { boundary: "Mute the group chat", replacement: "Walk" } },
      { id: "breath-1", engine: "mental", entryType: "mental_breathing", payload: { patternId: "box", seconds: 120 } },
      { id: "social-2", engine: "mental", entryType: "social_reset", payload: { boundary: "Close the app" } }
    ];

    expect(getMentalPatternItems(entries, "social")).toHaveLength(2);
    expect(getMentalPatternItems(entries, "reset")[0]?.body).toBe("box for 2 min.");
  });

  it("keeps nudges action-oriented and non-shaming", () => {
    expect(mentalNextNudge("social")).toContain("one hour");
    expect(mentalNextNudge("reframe", { id: "x", kind: "reframe", title: "Reframe", body: "x", meta: "today" })).toContain("Next:");
    expect(mentalNextNudge("checkin")).not.toMatch(/fix yourself|try harder/i);
  });
});
