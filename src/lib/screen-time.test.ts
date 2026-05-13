import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearScreenTimeData,
  getEntryForDate,
  getNudge,
  getRollingAverage,
  loadScreenTimeData,
  saveScreenTimeData,
  STORAGE_KEY,
  TEEN_SCREEN_REFERENCE,
  todayKey,
  upsertEntry,
  type ScreenTimeData,
  type ScreenTimeEntry
} from "./screen-time";

// Minimal in-memory localStorage shim for the test environment.
const memory = new Map<string, string>();
const memoryStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => {
    memory.set(k, v);
  },
  removeItem: (k: string) => {
    memory.delete(k);
  },
  clear: () => memory.clear(),
  key: (i: number) => Array.from(memory.keys())[i] ?? null,
  get length() {
    return memory.size;
  }
};

beforeEach(() => {
  memory.clear();
  globalThis.localStorage = memoryStorage as unknown as Storage;
});

afterEach(() => {
  memory.clear();
});

function makeEntry(date: string, hours: number, note?: string): ScreenTimeEntry {
  return { date, hours, note };
}

function shiftDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

describe("todayKey", () => {
  it("returns ISO date YYYY-MM-DD", () => {
    const key = todayKey(new Date("2026-04-15T18:30:00"));
    expect(key).toBe("2026-04-15");
  });
});

describe("loadScreenTimeData / saveScreenTimeData", () => {
  it("returns empty when nothing stored", () => {
    const data = loadScreenTimeData();
    expect(data.entries).toEqual([]);
  });

  it("round-trips a real value", () => {
    const data: ScreenTimeData = { entries: [makeEntry("2026-04-10", 3)] };
    saveScreenTimeData(data);
    const loaded = loadScreenTimeData();
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].date).toBe("2026-04-10");
    expect(loaded.entries[0].hours).toBe(3);
  });

  it("drops invalid entries on load", () => {
    memoryStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        entries: [
          makeEntry("2026-04-10", 3),
          { date: "not-a-date", hours: 2 },
          { date: "2026-04-11", hours: 99 },
          { date: "2026-04-12", hours: -1 },
          makeEntry("2026-04-13", 0)
        ]
      })
    );
    const loaded = loadScreenTimeData();
    expect(loaded.entries.map((e) => e.date)).toEqual(["2026-04-10", "2026-04-13"]);
  });

  it("returns empty on parse error", () => {
    memoryStorage.setItem(STORAGE_KEY, "{not valid json");
    expect(loadScreenTimeData().entries).toEqual([]);
  });
});

describe("upsertEntry", () => {
  it("adds a new entry", () => {
    const data = upsertEntry({ entries: [] }, makeEntry("2026-04-10", 3));
    expect(data.entries).toHaveLength(1);
  });

  it("replaces an entry with the same date", () => {
    const initial = { entries: [makeEntry("2026-04-10", 3, "first")] };
    const next = upsertEntry(initial, makeEntry("2026-04-10", 4, "second"));
    expect(next.entries).toHaveLength(1);
    expect(next.entries[0].hours).toBe(4);
    expect(next.entries[0].note).toBe("second");
  });

  it("keeps entries sorted by date ascending", () => {
    let data: ScreenTimeData = { entries: [] };
    data = upsertEntry(data, makeEntry("2026-04-12", 2));
    data = upsertEntry(data, makeEntry("2026-04-10", 4));
    data = upsertEntry(data, makeEntry("2026-04-11", 3));
    expect(data.entries.map((e) => e.date)).toEqual([
      "2026-04-10",
      "2026-04-11",
      "2026-04-12"
    ]);
  });

  it("rejects invalid entries silently", () => {
    const initial = { entries: [makeEntry("2026-04-10", 3)] };
    const next = upsertEntry(initial, { date: "x", hours: 1 } as ScreenTimeEntry);
    expect(next.entries).toHaveLength(1);
    expect(next.entries[0].date).toBe("2026-04-10");
  });
});

describe("getEntryForDate", () => {
  it("finds the right entry or returns undefined", () => {
    const data = { entries: [makeEntry("2026-04-10", 3), makeEntry("2026-04-11", 4)] };
    expect(getEntryForDate(data, "2026-04-10")?.hours).toBe(3);
    expect(getEntryForDate(data, "2026-04-15")).toBeUndefined();
  });
});

describe("getRollingAverage", () => {
  it("returns null when no entries in window", () => {
    expect(getRollingAverage({ entries: [] }, new Date("2026-04-15"), 7)).toBeNull();
  });

  it("averages entries within the window only", () => {
    const data = {
      entries: [
        makeEntry("2026-04-01", 10),
        makeEntry("2026-04-10", 2),
        makeEntry("2026-04-11", 4),
        makeEntry("2026-04-12", 6)
      ]
    };
    const avg = getRollingAverage(data, new Date("2026-04-15"), 7);
    // Window is 2026-04-09 .. 2026-04-15: includes 2, 4, 6 only.
    expect(avg).toBe(4);
  });

  it("does not extrapolate from missing days", () => {
    // Use local-noon to avoid the UTC-vs-local boundary issue between
    // ISO-only date strings and Date constructor parsing.
    const asOf = new Date("2026-04-15T12:00:00");
    const data = { entries: [makeEntry(todayKey(asOf), 6)] };
    const avg = getRollingAverage(data, asOf, 7);
    expect(avg).toBe(6); // one entry of 6, not 6/7
  });
});

describe("getNudge", () => {
  it("encourages logging when there's no data, names on-device privacy", () => {
    const nudge = getNudge({ entries: [] }, new Date("2026-04-15"));
    expect(nudge?.key).toBe("no_data_yet");
    expect(nudge?.body.toLowerCase()).toMatch(/stays on this device|on this device/);
  });

  it("returns first-week-observation when 1-6 entries", () => {
    const entries: ScreenTimeEntry[] = [];
    const start = new Date("2026-04-10");
    for (let i = 0; i < 5; i++) {
      entries.push(makeEntry(todayKey(shiftDays(start, i)), 2));
    }
    const nudge = getNudge({ entries }, new Date("2026-04-15"));
    expect(nudge?.key).toBe("first_week_observation");
  });

  it("returns average_steady when last-7 ~= prev-7", () => {
    const entries: ScreenTimeEntry[] = [];
    const start = new Date("2026-04-01");
    for (let i = 0; i < 14; i++) {
      entries.push(makeEntry(todayKey(shiftDays(start, i)), 3));
    }
    const nudge = getNudge({ entries }, new Date("2026-04-14"));
    expect(nudge?.key).toBe("average_steady");
  });

  it("returns average_up_significant when last-7 is materially higher", () => {
    const entries: ScreenTimeEntry[] = [];
    const start = new Date("2026-04-01");
    for (let i = 0; i < 7; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), 2));
    for (let i = 7; i < 14; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), 4));
    const nudge = getNudge({ entries }, new Date("2026-04-14"));
    expect(nudge?.key).toBe("average_up_significant");
  });

  it("returns average_down_significant when last-7 is materially lower", () => {
    const entries: ScreenTimeEntry[] = [];
    const start = new Date("2026-04-01");
    for (let i = 0; i < 7; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), 5));
    for (let i = 7; i < 14; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), 2.5));
    const nudge = getNudge({ entries }, new Date("2026-04-14"));
    expect(nudge?.key).toBe("average_down_significant");
  });

  it("surfaces sleep-window pattern when last 3 days are all ≥ high-association hours", () => {
    const entries: ScreenTimeEntry[] = [];
    const start = new Date("2026-04-01");
    // 14 days of data (so we're past first-week threshold), final 3 are heavy.
    for (let i = 0; i < 11; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), 3));
    for (let i = 11; i < 14; i++)
      entries.push(makeEntry(todayKey(shiftDays(start, i)), TEEN_SCREEN_REFERENCE.highAssociationDailyHours + 1));
    const nudge = getNudge({ entries }, new Date("2026-04-14"));
    expect(nudge?.key).toBe("sleep_window_pattern");
    // Should name sleep, not mood (only sleep link is well-supported).
    expect(nudge!.body.toLowerCase()).toMatch(/sleep/);
  });

  it("never includes shame language or a daily target", () => {
    const banned = [
      /should use less/i,
      /you're using too much/i,
      /should be under/i,
      /addict/i,
      /screen addict/i,
      /lazy/i,
      /\bbad\b/i // "bad pattern" / "bad number" — none of these belong
    ];
    const longSeries: ScreenTimeEntry[] = [];
    const start = new Date("2026-04-01");
    for (let i = 0; i < 14; i++) longSeries.push(makeEntry(todayKey(shiftDays(start, i)), 6));
    const cases = [
      getNudge({ entries: [] }, new Date("2026-04-14")),
      getNudge({ entries: [makeEntry("2026-04-14", 3)] }, new Date("2026-04-14")),
      getNudge({ entries: longSeries }, new Date("2026-04-14"))
    ];
    for (const nudge of cases) {
      if (!nudge) continue;
      for (const pattern of banned) {
        expect(nudge.body, nudge.key).not.toMatch(pattern);
      }
    }
  });
});

describe("clearScreenTimeData", () => {
  it("removes all stored data", () => {
    saveScreenTimeData({ entries: [makeEntry("2026-04-10", 3)] });
    expect(loadScreenTimeData().entries).toHaveLength(1);
    clearScreenTimeData();
    expect(loadScreenTimeData().entries).toEqual([]);
  });
});
