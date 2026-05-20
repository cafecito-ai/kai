// T-026 — mobility routine data sanity tests.
//
// Asserts the data file invariants the rest of the app relies on:
//   - 12 routines as the spec calls for
//   - All routines 3-10 minutes
//   - At least one step
//   - durationMin matches the sum of step durations (within 1 min rounding)
//   - Unique ids
//   - Lookup helpers work

import { describe, expect, it } from "vitest";
import {
  getRoutine,
  MOBILITY_ROUTINES,
  routineTotalSeconds,
  routinesByCategory,
} from "./mobility-routines";

describe("MOBILITY_ROUTINES", () => {
  it("has 12 routines (matches T-026 spec)", () => {
    expect(MOBILITY_ROUTINES).toHaveLength(12);
  });

  it("every routine is between 3 and 10 minutes", () => {
    for (const r of MOBILITY_ROUTINES) {
      expect(r.durationMin).toBeGreaterThanOrEqual(3);
      expect(r.durationMin).toBeLessThanOrEqual(10);
    }
  });

  it("every routine has at least one step", () => {
    for (const r of MOBILITY_ROUTINES) {
      expect(r.steps.length).toBeGreaterThan(0);
    }
  });

  it("durationMin matches sum of step durations within 1 minute of rounding", () => {
    for (const r of MOBILITY_ROUTINES) {
      const totalMin = routineTotalSeconds(r) / 60;
      expect(Math.abs(totalMin - r.durationMin)).toBeLessThanOrEqual(1);
    }
  });

  it("has unique ids", () => {
    const ids = MOBILITY_ROUTINES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never has 0-duration steps", () => {
    for (const r of MOBILITY_ROUTINES) {
      for (const s of r.steps) {
        expect(s.durationSec).toBeGreaterThan(0);
      }
    }
  });
});

describe("getRoutine / routinesByCategory", () => {
  it("getRoutine returns null on unknown id", () => {
    expect(getRoutine("does-not-exist")).toBeNull();
  });

  it("getRoutine returns the routine on known id", () => {
    const r = getRoutine("calf-release-3");
    expect(r).not.toBeNull();
    expect(r?.title).toContain("Calf");
  });

  it("routinesByCategory filters", () => {
    const recovery = routinesByCategory("recovery");
    expect(recovery.length).toBeGreaterThan(0);
    for (const r of recovery) {
      expect(r.categories).toContain("recovery");
    }
  });
});
