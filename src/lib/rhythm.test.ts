import { describe, expect, it } from "vitest";
import {
  buildSchedule,
  DEFAULT_SCHOOL_DAY,
  DEFAULT_WEEKEND,
  hhmmFromMinutes,
  minutesFromHHMM,
  sleepHoursFromWake,
  totalScheduledMinutes
} from "./rhythm";

describe("minutesFromHHMM / hhmmFromMinutes", () => {
  it("round-trips a 24h time", () => {
    expect(minutesFromHHMM("07:30")).toBe(450);
    expect(hhmmFromMinutes(450)).toBe("07:30");
    expect(hhmmFromMinutes(0)).toBe("00:00");
    expect(hhmmFromMinutes(23 * 60 + 59)).toBe("23:59");
  });

  it("hhmmFromMinutes wraps past 24h", () => {
    expect(hhmmFromMinutes(25 * 60)).toBe("01:00");
    expect(hhmmFromMinutes(-30)).toBe("23:30");
  });
});

describe("buildSchedule", () => {
  it("places blocks consecutively from wakeMinutes", () => {
    const blocks = [
      { id: "a", label: "A", durationMinutes: 30 },
      { id: "b", label: "B", durationMinutes: 60 }
    ];
    const result = buildSchedule(blocks, 420); // 07:00
    expect(result).toHaveLength(2);
    expect(result[0].startMinutes).toBe(420);
    expect(result[0].endMinutes).toBe(450);
    expect(result[1].startMinutes).toBe(450);
    expect(result[1].endMinutes).toBe(510);
  });

  it("returns empty for empty input", () => {
    expect(buildSchedule([], 420)).toEqual([]);
  });
});

describe("totalScheduledMinutes", () => {
  it("sums block durations", () => {
    const blocks = [
      { id: "a", label: "A", durationMinutes: 30 },
      { id: "b", label: "B", durationMinutes: 60 }
    ];
    expect(totalScheduledMinutes(blocks)).toBe(90);
  });

  it("treats negative durations as 0", () => {
    expect(totalScheduledMinutes([{ id: "x", label: "X", durationMinutes: -20 }])).toBe(0);
  });
});

describe("sleepHoursFromWake", () => {
  it("returns 24h - awake hours, rounded to 1 decimal", () => {
    expect(sleepHoursFromWake(420, 15 * 60)).toBe(9); // awake 15h → sleep 9h
    expect(sleepHoursFromWake(420, 15 * 60 + 30)).toBe(8.5);
  });

  it("clamps to non-negative", () => {
    expect(sleepHoursFromWake(420, 30 * 60)).toBe(0);
  });
});

describe("DEFAULT_SCHOOL_DAY", () => {
  it("has all the major teen-day phases", () => {
    const ids = DEFAULT_SCHOOL_DAY.map((b) => b.id);
    expect(ids).toContain("morning");
    expect(ids).toContain("school");
    expect(ids).toContain("after_school");
    expect(ids).toContain("movement");
    expect(ids).toContain("homework");
    expect(ids).toContain("dinner");
    expect(ids).toContain("downtime");
    expect(ids).toContain("wind_down");
  });

  it("total awake time leaves a teen-reasonable sleep window", () => {
    const total = totalScheduledMinutes(DEFAULT_SCHOOL_DAY);
    const sleep = sleepHoursFromWake(420, total); // wake 07:00
    expect(sleep, "school day default should leave ~8 hours sleep").toBeGreaterThan(7);
    expect(sleep).toBeLessThan(10);
  });
});

describe("DEFAULT_WEEKEND", () => {
  it("is lighter than the school template", () => {
    const ids = DEFAULT_WEEKEND.map((b) => b.id);
    expect(ids).not.toContain("school");
    expect(ids).not.toContain("homework");
  });

  it("still has movement and dinner blocks", () => {
    const ids = DEFAULT_WEEKEND.map((b) => b.id);
    expect(ids).toContain("movement");
    expect(ids).toContain("dinner");
  });
});
