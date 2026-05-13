import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearMoodLogData,
  countLowDays,
  EXTENDED_LOW_THRESHOLD_DAYS,
  getEntryForDate,
  getNudge,
  getRollingMood,
  loadMoodLogData,
  MOOD_VALUES,
  STORAGE_KEY,
  saveMoodLogData,
  todayKey,
  upsertEntry,
  type MoodEntry,
  type MoodLogData
} from "./mood-log";

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
  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage,
    configurable: true
  });
});

afterEach(() => {
  memory.clear();
});

function makeEntry(date: string, mood: MoodEntry["mood"], energy?: MoodEntry["energy"], note?: string): MoodEntry {
  return { date, mood, energy, note };
}

function shiftDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

describe("MOOD_VALUES", () => {
  it("maps to a 1-5 scale in order", () => {
    expect(MOOD_VALUES.very_low).toBe(1);
    expect(MOOD_VALUES.low).toBe(2);
    expect(MOOD_VALUES.neutral).toBe(3);
    expect(MOOD_VALUES.good).toBe(4);
    expect(MOOD_VALUES.great).toBe(5);
  });
});

describe("load / save", () => {
  it("returns empty when nothing stored", () => {
    expect(loadMoodLogData().entries).toEqual([]);
  });

  it("round-trips a value", () => {
    saveMoodLogData({ entries: [makeEntry("2026-04-10", "good", "high", "fine")] });
    const loaded = loadMoodLogData();
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].mood).toBe("good");
    expect(loaded.entries[0].energy).toBe("high");
    expect(loaded.entries[0].note).toBe("fine");
  });

  it("drops invalid entries on load", () => {
    memoryStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        entries: [
          makeEntry("2026-04-10", "good"),
          { date: "not-a-date", mood: "good" },
          { date: "2026-04-11", mood: "nonsense" },
          { date: "2026-04-12", mood: "good", energy: "fake" },
          makeEntry("2026-04-13", "neutral")
        ]
      })
    );
    const loaded = loadMoodLogData();
    expect(loaded.entries.map((e) => e.date)).toEqual(["2026-04-10", "2026-04-13"]);
  });

  it("returns empty on parse error", () => {
    memoryStorage.setItem(STORAGE_KEY, "{not valid");
    expect(loadMoodLogData().entries).toEqual([]);
  });
});

describe("upsertEntry", () => {
  it("adds a new entry", () => {
    const data = upsertEntry({ entries: [] }, makeEntry("2026-04-10", "good"));
    expect(data.entries).toHaveLength(1);
  });

  it("replaces an entry for the same day", () => {
    const initial = { entries: [makeEntry("2026-04-10", "good", "high")] };
    const next = upsertEntry(initial, makeEntry("2026-04-10", "low", "low"));
    expect(next.entries).toHaveLength(1);
    expect(next.entries[0].mood).toBe("low");
    expect(next.entries[0].energy).toBe("low");
  });

  it("keeps entries sorted", () => {
    let d: MoodLogData = { entries: [] };
    d = upsertEntry(d, makeEntry("2026-04-12", "good"));
    d = upsertEntry(d, makeEntry("2026-04-10", "low"));
    d = upsertEntry(d, makeEntry("2026-04-11", "neutral"));
    expect(d.entries.map((e) => e.date)).toEqual([
      "2026-04-10",
      "2026-04-11",
      "2026-04-12"
    ]);
  });

  it("rejects invalid entries silently", () => {
    const initial = { entries: [makeEntry("2026-04-10", "good")] };
    const next = upsertEntry(initial, { date: "x", mood: "good" } as MoodEntry);
    expect(next.entries).toHaveLength(1);
  });
});

describe("getEntryForDate", () => {
  it("finds or returns undefined", () => {
    const data = { entries: [makeEntry("2026-04-10", "good")] };
    expect(getEntryForDate(data, "2026-04-10")?.mood).toBe("good");
    expect(getEntryForDate(data, "2026-04-11")).toBeUndefined();
  });
});

describe("getRollingMood", () => {
  it("returns null when no entries in window", () => {
    expect(getRollingMood({ entries: [] }, new Date("2026-04-15"), 7)).toBeNull();
  });

  it("averages mood values within the window", () => {
    const data = {
      entries: [
        makeEntry("2026-04-10", "good"),    // 4
        makeEntry("2026-04-11", "neutral"), // 3
        makeEntry("2026-04-12", "great")    // 5
      ]
    };
    const avg = getRollingMood(data, new Date("2026-04-15"), 7);
    expect(avg).toBe(4);
  });
});

describe("countLowDays", () => {
  it("counts low + very_low within the window", () => {
    const data = {
      entries: [
        makeEntry("2026-04-10", "very_low"),
        makeEntry("2026-04-11", "low"),
        makeEntry("2026-04-12", "neutral"),
        makeEntry("2026-04-13", "low"),
        makeEntry("2026-04-14", "good")
      ]
    };
    expect(countLowDays(data, new Date("2026-04-15"), 7)).toBe(3);
  });
});

describe("getNudge", () => {
  it("no-data nudge mentions on-device privacy", () => {
    const n = getNudge({ entries: [] }, new Date("2026-04-15T12:00:00"));
    expect(n?.key).toBe("no_data_yet");
    expect(n?.body.toLowerCase()).toMatch(/on this device|stays on this device/);
    expect(n?.escalate).toBe(false);
  });

  it("first-week nudge for 1-6 entries", () => {
    const entries: MoodEntry[] = [];
    const start = new Date("2026-04-10T12:00:00");
    for (let i = 0; i < 5; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), "neutral"));
    const n = getNudge({ entries }, new Date("2026-04-15T12:00:00"));
    expect(n?.key).toBe("first_week");
  });

  it("extended-low pattern surfaces counselor escalation", () => {
    const entries: MoodEntry[] = [];
    const start = new Date("2026-04-01T12:00:00");
    // 14 days: 7 days at "low", 7 days at "neutral"
    for (let i = 0; i < 7; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), "low"));
    for (let i = 7; i < 14; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), "neutral"));
    const n = getNudge({ entries }, new Date("2026-04-14T12:00:00"));
    expect(n?.key).toBe("extended_low_pattern");
    expect(n?.escalate).toBe(true);
    // Should name counselor explicitly and frame as treatable.
    expect(n!.body.toLowerCase()).toMatch(/counselor|therapist/);
    expect(n!.body.toLowerCase()).toMatch(/treatable/);
  });

  it("low-mood high-energy combo pattern surfaces softly", () => {
    const entries: MoodEntry[] = [];
    const start = new Date("2026-04-08T12:00:00");
    // 7 days, 3 of which are low+high
    for (let i = 0; i < 3; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), "low", "high"));
    for (let i = 3; i < 7; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), "neutral", "medium"));
    const n = getNudge({ entries }, new Date("2026-04-14T12:00:00"));
    expect(n?.key).toBe("low_mood_high_energy_pattern");
    expect(n?.escalate).toBe(false);
  });

  it("trend_lifting when last-7 avg up ≥0.5", () => {
    const entries: MoodEntry[] = [];
    const start = new Date("2026-04-01T12:00:00");
    // Avoid hitting the extended_low priority — use neutral → great, no low days.
    for (let i = 0; i < 7; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), "neutral"));
    for (let i = 7; i < 14; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), "great"));
    const n = getNudge({ entries }, new Date("2026-04-14T12:00:00"));
    expect(n?.key).toBe("trend_lifting");
  });

  it("trend_dipping when last-7 avg down ≥0.5", () => {
    const entries: MoodEntry[] = [];
    const start = new Date("2026-04-01T12:00:00");
    // Great → neutral keeps low-day count at 0, so trend wins.
    for (let i = 0; i < 7; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), "great"));
    for (let i = 7; i < 14; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), "neutral"));
    const n = getNudge({ entries }, new Date("2026-04-14T12:00:00"));
    expect(n?.key).toBe("trend_dipping");
  });

  it("trend_steady when last-7 avg similar to prev-7", () => {
    const entries: MoodEntry[] = [];
    const start = new Date("2026-04-01T12:00:00");
    for (let i = 0; i < 14; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), "neutral"));
    const n = getNudge({ entries }, new Date("2026-04-14T12:00:00"));
    expect(n?.key).toBe("trend_steady");
  });

  it("extended-low wins priority over trend nudges", () => {
    const entries: MoodEntry[] = [];
    const start = new Date("2026-04-01T12:00:00");
    // 7 good days then 7 low days — this would be trend_dipping AND extended_low.
    for (let i = 0; i < 7; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), "good"));
    for (let i = 7; i < 14; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), "low"));
    const n = getNudge({ entries }, new Date("2026-04-14T12:00:00"));
    expect(n?.key).toBe("extended_low_pattern");
  });

  it("never uses shame language or quick-fix phrasing", () => {
    const banned = [
      /just cheer up/i,
      /think positive/i,
      /look on the bright side/i,
      /smile more/i,
      /toughen up/i,
      /you're being dramatic/i,
      /it's all in your head/i,
      /addict/i,
      /\bweakness\b/i
    ];
    // Synthesize the extended-low pattern to exercise the most consequential nudge.
    const entries: MoodEntry[] = [];
    const start = new Date("2026-04-01T12:00:00");
    for (let i = 0; i < 14; i++) entries.push(makeEntry(todayKey(shiftDays(start, i)), "very_low"));
    const cases = [
      getNudge({ entries: [] }, new Date("2026-04-14T12:00:00")),
      getNudge({ entries: [makeEntry("2026-04-14", "neutral")] }, new Date("2026-04-14T12:00:00")),
      getNudge({ entries }, new Date("2026-04-14T12:00:00"))
    ];
    for (const n of cases) {
      if (!n) continue;
      for (const pattern of banned) {
        expect(n.body, n.key).not.toMatch(pattern);
      }
    }
  });
});

describe("EXTENDED_LOW_THRESHOLD_DAYS", () => {
  it("is set to 7 (PHQ-9 / clinical-style threshold)", () => {
    expect(EXTENDED_LOW_THRESHOLD_DAYS).toBe(7);
  });
});

describe("clearMoodLogData", () => {
  it("removes all stored data", () => {
    saveMoodLogData({ entries: [makeEntry("2026-04-10", "good")] });
    expect(loadMoodLogData().entries).toHaveLength(1);
    clearMoodLogData();
    expect(loadMoodLogData().entries).toEqual([]);
  });
});
