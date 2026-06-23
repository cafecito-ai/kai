import { afterEach, describe, expect, it } from "vitest";
import { addDays, localDateKey } from "./dates";
import type { ScheduleItem, SystemSection } from "./local-schedule";
import {
  attributeForItem,
  HEALTH_WINDOW_DAYS,
  pointsForItem,
  systemHealth,
} from "./local-system-health";

const SCHEDULE_KEY = "kai_schedule_v1";
const DONE_KEY = "kai_system_done_v1";

const OLD = new Date(0).toISOString(); // created long ago → expected every window day

function item(id: string, section: SystemSection, days: number[] = []): ScheduleItem {
  return { id, section, title: id, detail: "", days, time: null, createdAt: OLD };
}

function seedSchedule(items: ScheduleItem[]) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(items));
}

/** Mark `ids` done on the local day `offset` days before `ref`. */
function seedDoneWindow(ref: Date, dayOffsets: number[], ids: string[]) {
  const map: Record<string, string[]> = {};
  for (const off of dayOffsets) map[localDateKey(addDays(ref, -off))] = [...ids];
  localStorage.setItem(DONE_KEY, JSON.stringify(map));
}

afterEach(() => localStorage.clear());

describe("attribute & points mapping (fixed section map)", () => {
  it("maps each section to its attribute", () => {
    expect(attributeForItem(item("a", "mindset"))).toBe("mental");
    expect(attributeForItem(item("a", "training"))).toBe("body");
    expect(attributeForItem(item("a", "sleep"))).toBe("recovery");
    expect(attributeForItem(item("a", "daily"))).toBe("discipline");
    expect(attributeForItem(item("a", "routine"))).toBe("discipline");
    expect(attributeForItem(item("a", "avoid"))).toBe("discipline");
  });

  it("assigns the client's point values", () => {
    expect(pointsForItem(item("a", "training"))).toBe(8); // +8 Body
    expect(pointsForItem(item("a", "mindset"))).toBe(4); // +4 Mental
    expect(pointsForItem(item("a", "sleep"))).toBe(7); // +7 Recovery
    expect(pointsForItem(item("a", "avoid"))).toBe(6); // +6 Discipline
  });
});

describe("systemHealth — build & gently decay", () => {
  const ref = new Date("2026-06-20T12:00:00");

  it("is 100% for a pillar fully completed across the window, and decays to 0 as it ages out", () => {
    seedSchedule([item("d1", "daily")]); // standing discipline item, expected every day
    const offsets = Array.from({ length: HEALTH_WINDOW_DAYS }, (_, i) => i);
    seedDoneWindow(ref, offsets, ["d1"]);

    // At ref: every expected day was completed → 100%.
    const now = systemHealth(undefined, ref).attributes.find((a) => a.key === "discipline")!;
    expect(now.value).toBe(100);
    expect(now.hasItems).toBe(true);

    // Two weeks later with nothing new: all completed days have aged out → 0%.
    const later = systemHealth(undefined, addDays(ref, HEALTH_WINDOW_DAYS)).attributes.find(
      (a) => a.key === "discipline",
    )!;
    expect(later.value).toBe(0);
  });

  it("rises when an action is completed (0 → positive)", () => {
    seedSchedule([item("d1", "daily")]);
    expect(systemHealth(undefined, ref).attributes.find((a) => a.key === "discipline")!.value).toBe(0);
    seedDoneWindow(ref, [0], ["d1"]); // done today only
    const after = systemHealth(undefined, ref).attributes.find((a) => a.key === "discipline")!.value;
    expect(after).toBeGreaterThan(0);
  });

  it("overall is the mean of pillars that have items; empty pillars don't drag it", () => {
    seedSchedule([item("b1", "training"), item("m1", "mindset")]);
    const offsets = Array.from({ length: HEALTH_WINDOW_DAYS }, (_, i) => i);
    seedDoneWindow(ref, offsets, ["b1", "m1"]);
    const h = systemHealth(undefined, ref);
    expect(h.attributes.find((a) => a.key === "body")!.value).toBe(100);
    expect(h.attributes.find((a) => a.key === "mental")!.value).toBe(100);
    expect(h.attributes.find((a) => a.key === "discipline")!.hasItems).toBe(false);
    expect(h.attributes.find((a) => a.key === "recovery")!.hasItems).toBe(false);
    expect(h.overall).toBe(100); // mean of only body + mental
  });

  it("excludes avoid items from health (not completable check-offs)", () => {
    seedSchedule([item("x", "avoid")]);
    const h = systemHealth(undefined, ref);
    expect(h.attributes.find((a) => a.key === "discipline")!.hasItems).toBe(false);
    expect(h.overall).toBe(0);
  });

  it("credits a completion logged on an off day", () => {
    const now = new Date("2026-06-23T12:00:00");
    const otherWeekday = (now.getDay() + 1) % 7; // not today
    seedSchedule([item("b1", "training", [otherWeekday])]);
    // Nothing done → 0.
    expect(systemHealth(undefined, now).attributes.find((a) => a.key === "body")!.value).toBe(0);
    // Complete it TODAY, which is an off day for this Monday-ish item.
    localStorage.setItem(DONE_KEY, JSON.stringify({ [localDateKey(now)]: ["b1"] }));
    expect(systemHealth(undefined, now).attributes.find((a) => a.key === "body")!.value).toBeGreaterThan(0);
  });

  it("marks a pillar active when its only item is scheduled for a future day", () => {
    const now = new Date("2026-06-23T12:00:00");
    const futureWeekday = (now.getDay() + 2) % 7;
    // Created today, scheduled only on a not-yet-arrived weekday.
    seedSchedule([
      { id: "b1", section: "training", title: "Lift", detail: "", days: [futureWeekday], time: null, createdAt: now.toISOString() },
    ]);
    const body = systemHealth(undefined, now).attributes.find((a) => a.key === "body")!;
    expect(body.hasItems).toBe(true); // present, even though nothing is due yet
    expect(body.value).toBe(0);
  });

  it("counts legacy items with no stored createdAt across the full window", () => {
    const now = new Date("2026-06-23T12:00:00");
    // A legacy stored item with NO createdAt → migration fills a stable epoch,
    // so past completions still count (health doesn't reset to today).
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify([{ id: "d1", section: "daily", title: "Move", days: [] }]));
    const map: Record<string, string[]> = {};
    for (const off of [1, 2, 3]) map[localDateKey(addDays(now, -off))] = ["d1"];
    localStorage.setItem(DONE_KEY, JSON.stringify(map));
    expect(systemHealth(undefined, now).attributes.find((a) => a.key === "discipline")!.value).toBeGreaterThan(0);
  });
});
