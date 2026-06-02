// T-027 — energy check-in tests.
//
// Covers the AGENT_PLAN trigger: two consecutive days of energy ≤ 2
// fires the recovery note. Edge cases:
//   - Only one day low → no fire
//   - Today low, yesterday high → no fire
//   - Today low, yesterday low → fire
//   - Today low, yesterday "missed" → no fire
//   - Both days have multiple check-ins, at least one is low each day → fire

import { beforeEach, describe, expect, it } from "vitest";
import {
  detectLowEnergyStreak,
  energyLabel,
  lowEnergyRecoveryNote,
  submitLocalEnergy,
  type EnergyValue,
} from "./local-energy";
import type { LocalInput } from "./local-score";

// In-memory localStorage shim.
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

function dateOffsetDays(days: number, now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function inputFor(date: string, energy: EnergyValue): LocalInput {
  return {
    id: `li_${Math.random()}`,
    date,
    source: "energy_check_in",
    value: { energy },
    createdAt: new Date(date).toISOString(),
  };
}

describe("energyLabel", () => {
  it("returns a label for every value", () => {
    expect(energyLabel(1)).toBe("Wiped");
    expect(energyLabel(3)).toBe("Okay");
    expect(energyLabel(5)).toBe("Sharp");
  });
});

describe("submitLocalEnergy", () => {
  it("appends an energy_check_in input to localStorage", () => {
    const row = submitLocalEnergy(2, "tired");
    expect(row.source).toBe("energy_check_in");
    expect((row.value as { energy: number }).energy).toBe(2);
    expect((row.value as { note?: string }).note).toBe("tired");
  });

  it("omits note when empty", () => {
    const row = submitLocalEnergy(4);
    expect((row.value as { note?: string }).note).toBeUndefined();
  });
});

describe("detectLowEnergyStreak", () => {
  it("returns false on empty inputs", () => {
    expect(detectLowEnergyStreak([])).toBe(false);
  });

  it("returns false when only today is low", () => {
    const today = dateOffsetDays(0);
    expect(detectLowEnergyStreak([inputFor(today, 2)])).toBe(false);
  });

  it("returns false when only yesterday is low", () => {
    const y = dateOffsetDays(1);
    expect(detectLowEnergyStreak([inputFor(y, 1)])).toBe(false);
  });

  it("returns true when today AND yesterday are both ≤ 2", () => {
    const t = dateOffsetDays(0);
    const y = dateOffsetDays(1);
    expect(
      detectLowEnergyStreak([inputFor(y, 2), inputFor(t, 1)]),
    ).toBe(true);
  });

  it("returns false when today low but yesterday is 3+", () => {
    const t = dateOffsetDays(0);
    const y = dateOffsetDays(1);
    expect(
      detectLowEnergyStreak([inputFor(y, 4), inputFor(t, 2)]),
    ).toBe(false);
  });

  it("returns true if either day has multiple check-ins and at least one is low", () => {
    const t = dateOffsetDays(0);
    const y = dateOffsetDays(1);
    expect(
      detectLowEnergyStreak([
        inputFor(y, 4), // yesterday high
        inputFor(y, 2), // yesterday low (later)
        inputFor(t, 1), // today low
      ]),
    ).toBe(true);
  });

  it("ignores non-energy sources", () => {
    const t = dateOffsetDays(0);
    const y = dateOffsetDays(1);
    const moodLow: LocalInput = {
      id: "x",
      date: t,
      source: "check_in",
      value: { mood: 1 },
      createdAt: new Date().toISOString(),
    };
    expect(detectLowEnergyStreak([inputFor(y, 1), moodLow])).toBe(false);
  });
});

describe("lowEnergyRecoveryNote", () => {
  it("uses the 'your body is asking' frame, never 'lazy'", () => {
    const note = lowEnergyRecoveryNote();
    expect(note).toMatch(/your body/i);
    expect(note).not.toMatch(/lazy/i);
    expect(note).not.toMatch(/no excuse/i);
  });
});
