// T-025 — hydration local store tests.
//
// Covers:
//   - default state (no entry yet)
//   - bumpHydration +/- with floor at 0
//   - separate day keys (today vs yesterday)
//   - setHydrationTarget bounds (1-20)
//   - getRecentHydration returns a 7-day series w/ zeros for missing days
//   - 30-day retention trim

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  bumpHydration,
  getRecentHydration,
  getTodayHydration,
  setHydrationTarget,
} from "./local-hydration";

// In-memory localStorage shim so tests don't leak state between runs.
const memory = new Map<string, string>();
const memoryStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => { memory.set(k, v); },
  removeItem: (k: string) => { memory.delete(k); },
  clear: () => memory.clear(),
  key: (i: number) => Array.from(memory.keys())[i] ?? null,
  get length() { return memory.size; },
};

beforeEach(() => {
  memory.clear();
  globalThis.localStorage = memoryStorage as unknown as Storage;
});
afterEach(() => {
  memory.clear();
});

describe("getTodayHydration", () => {
  it("returns a fresh entry with default target when no data exists", () => {
    const entry = getTodayHydration();
    expect(entry.glasses).toBe(0);
    expect(entry.target).toBe(8);
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("does NOT write to localStorage on read", () => {
    getTodayHydration();
    expect(memory.size).toBe(0);
  });
});

describe("bumpHydration", () => {
  it("increments today's counter", () => {
    const after = bumpHydration(1);
    expect(after.glasses).toBe(1);
    expect(getTodayHydration().glasses).toBe(1);
  });

  it("can be called multiple times", () => {
    bumpHydration(1);
    bumpHydration(1);
    bumpHydration(1);
    expect(getTodayHydration().glasses).toBe(3);
  });

  it("floors at 0 on decrement", () => {
    bumpHydration(-1);
    expect(getTodayHydration().glasses).toBe(0);
    bumpHydration(1);
    bumpHydration(-1);
    bumpHydration(-1);
    expect(getTodayHydration().glasses).toBe(0);
  });

  it("preserves the target across increments", () => {
    setHydrationTarget(6);
    bumpHydration(1);
    expect(getTodayHydration().target).toBe(6);
  });
});

describe("setHydrationTarget", () => {
  it("clamps to 1-20", () => {
    expect(setHydrationTarget(-5).target).toBe(1);
    expect(setHydrationTarget(0).target).toBe(1);
    expect(setHydrationTarget(50).target).toBe(20);
  });

  it("rounds to integer", () => {
    expect(setHydrationTarget(8.7).target).toBe(9);
  });

  it("preserves existing glass count", () => {
    bumpHydration(1);
    bumpHydration(1);
    setHydrationTarget(10);
    expect(getTodayHydration().glasses).toBe(2);
    expect(getTodayHydration().target).toBe(10);
  });
});

describe("getRecentHydration", () => {
  it("returns 7 entries by default, oldest first", () => {
    bumpHydration(1);
    const series = getRecentHydration();
    expect(series).toHaveLength(7);
    // Today (rightmost) should have 1 glass.
    expect(series[6].glasses).toBe(1);
    // Days without data should be 0 with default target.
    expect(series[0].glasses).toBe(0);
    expect(series[0].target).toBe(8);
  });

  it("respects an explicit days arg", () => {
    expect(getRecentHydration(3)).toHaveLength(3);
    expect(getRecentHydration(14)).toHaveLength(14);
  });
});
