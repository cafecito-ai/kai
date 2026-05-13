import { describe, expect, it } from "vitest";
import {
  computeAverageCycleLength,
  computePhase,
  PHASE_NOTES,
  todayIso,
  type PeriodEntry
} from "./cycle";

describe("computeAverageCycleLength", () => {
  it("returns null with fewer than 2 entries", () => {
    expect(computeAverageCycleLength([])).toBeNull();
    expect(computeAverageCycleLength([{ startDate: "2026-01-01" }])).toBeNull();
  });

  it("computes a round average from consecutive start dates", () => {
    const entries: PeriodEntry[] = [
      { startDate: "2026-01-01" },
      { startDate: "2026-01-29" }, // 28 days
      { startDate: "2026-02-26" } // 28 days
    ];
    expect(computeAverageCycleLength(entries)).toBe(28);
  });

  it("filters out short-gap mis-entries from the anchor chain", () => {
    const entries: PeriodEntry[] = [
      { startDate: "2026-01-01" },
      { startDate: "2026-01-05" }, // 4 days — drop as mis-entry, NOT used as anchor
      { startDate: "2026-02-02" }, // anchored to 01-01 (32 days), valid
      { startDate: "2026-05-30" } // 117 days from previous anchor — filtered as too long
    ];
    // Per Codex P2 fix: 01-05 is dropped from the anchor chain entirely,
    // so the gap is computed from 01-01 → 02-02 (32 days). The 117-day
    // gap to 05-30 is then out of range and filtered.
    expect(computeAverageCycleLength(entries)).toBe(32);
  });

  it("returns null when all gaps fall outside the valid window", () => {
    const entries: PeriodEntry[] = [
      { startDate: "2026-01-01" },
      { startDate: "2026-01-05" } // 4-day gap — invalid
    ];
    expect(computeAverageCycleLength(entries)).toBeNull();
  });
});

describe("computePhase", () => {
  it("returns unknown for an empty history", () => {
    const result = computePhase([]);
    expect(result.phase).toBe("unknown");
    expect(result.dayOfCycle).toBeNull();
  });

  it("returns menstrual for day 1-5 of the most recent period", () => {
    const today = new Date("2026-05-12T12:00:00Z");
    const result = computePhase([{ startDate: "2026-05-10" }], today);
    expect(result.phase).toBe("menstrual");
    expect(result.dayOfCycle).toBe(3);
  });

  it("returns early phase ~day 7-10 (post-period)", () => {
    const today = new Date("2026-05-12T12:00:00Z");
    const result = computePhase([{ startDate: "2026-05-04" }], today);
    expect(result.phase).toBe("early");
    expect(result.dayOfCycle).toBe(9);
  });

  it("returns mid phase ~day 13-18", () => {
    const today = new Date("2026-05-12T12:00:00Z");
    const result = computePhase([{ startDate: "2026-04-28" }], today);
    expect(result.phase).toBe("mid");
    expect(result.dayOfCycle).toBe(15);
  });

  it("returns late phase ~day 22+", () => {
    const today = new Date("2026-05-12T12:00:00Z");
    const result = computePhase([{ startDate: "2026-04-20" }], today);
    expect(result.phase).toBe("late");
    expect(result.dayOfCycle).toBe(23);
  });

  it("treats data older than 60 days as unknown", () => {
    const today = new Date("2026-05-12T12:00:00Z");
    const result = computePhase([{ startDate: "2026-01-01" }], today);
    expect(result.phase).toBe("unknown");
    expect(result.dayOfCycle).toBeNull();
  });

  it("uses computed average cycle length when 2+ entries are available", () => {
    const today = new Date("2026-05-12T12:00:00Z");
    const result = computePhase(
      [
        { startDate: "2026-03-10" },
        { startDate: "2026-04-07" } // 28 days
      ],
      today
    );
    expect(result.averageCycleLength).toBe(28);
  });
});

describe("PHASE_NOTES", () => {
  it("has a label and energy note for every phase", () => {
    for (const phase of ["menstrual", "early", "mid", "late", "unknown"] as const) {
      expect(PHASE_NOTES[phase].label.trim().length, phase).toBeGreaterThan(0);
      expect(PHASE_NOTES[phase].energyNote.trim().length, phase).toBeGreaterThan(0);
    }
  });

  it("explicitly de-stigmatizes PMS", () => {
    const late = PHASE_NOTES.late;
    const note = late.energyNote.toLowerCase();
    // The actual copy is "PMS is real; PMS is not weakness."
    expect(note).toContain("pms is real");
    expect(note).toContain("not weakness");
    // And it should not contain the *advocacy* framings we ban.
    expect(note).not.toMatch(/excuse|character flaw|just suck it up|tough it out/);
  });

  it("never predicts ovulation, fertility, or contains pregnancy framing", () => {
    const banned = [/ovulat/i, /fertil/i, /\bovum\b/i, /trying to conceive/i, /pregnan(t|cy)/i];
    for (const phase of ["menstrual", "early", "mid", "late", "unknown"] as const) {
      const blob = `${PHASE_NOTES[phase].label} ${PHASE_NOTES[phase].energyNote}`;
      for (const pattern of banned) {
        expect(blob, phase).not.toMatch(pattern);
      }
    }
  });
});

describe("todayIso", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
