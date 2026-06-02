// Rawz/5 — onboarding follow-up picker tests.
//
// Critical invariants:
//   - Picks no more than 3 questions even if many focus areas are selected
//   - Stable ordering (same input → same questions in same order)
//   - Empty focus selection → empty questions list
//   - Every question has at least one option (no empty chip lists)
//   - No question prompt uses shame / comparative language

import { describe, expect, it } from "vitest";
import {
  FOLLOW_UPS,
  formatFollowUpsForIntake,
  pickFollowUps,
} from "./onboarding-followups";

describe("FOLLOW_UPS catalog", () => {
  it("covers every focus area that has questions defined", () => {
    expect(FOLLOW_UPS.length).toBeGreaterThanOrEqual(15);
  });

  it("every question has at least one chip option", () => {
    for (const q of FOLLOW_UPS) {
      expect(q.options.length).toBeGreaterThan(0);
    }
  });

  it("no two questions share an id", () => {
    const ids = FOLLOW_UPS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("no question uses shame / comparative language", () => {
    const FORBIDDEN = ["lazy", "behind", "compared to", "everyone else", "you should"];
    for (const q of FOLLOW_UPS) {
      const blob = `${q.prompt} ${q.options.join(" ")}`.toLowerCase();
      for (const w of FORBIDDEN) {
        expect(blob.includes(w), `question "${q.id}" uses forbidden "${w}"`).toBe(false);
      }
    }
  });
});

describe("pickFollowUps", () => {
  it("returns empty list when no focus areas selected", () => {
    expect(pickFollowUps([])).toEqual([]);
  });

  it("returns 1 question when 1 focus area selected", () => {
    const qs = pickFollowUps(["better_sleep"]);
    expect(qs).toHaveLength(1);
    expect(qs[0].focusArea).toBe("better_sleep");
  });

  it("returns at most 3 questions even with 5 focus areas selected", () => {
    const qs = pickFollowUps([
      "better_sleep",
      "energy",
      "managing_stress",
      "anxiety",
      "confidence",
    ]);
    expect(qs).toHaveLength(3);
  });

  it("is stable — same input twice gives same output", () => {
    const inputs = ["managing_stress", "better_sleep", "social_life"] as const;
    const a = pickFollowUps([...inputs]);
    const b = pickFollowUps([...inputs]);
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
  });

  it("prioritizes higher-priority questions when more than 3 areas selected", () => {
    // better_sleep has priority 95 (highest among these picks)
    const qs = pickFollowUps([
      "family_stuff",      // priority 55
      "friendships",       // 60
      "better_sleep",      // 95 — should be first
      "body_image",        // 65
    ]);
    expect(qs[0].id).toBe("sleep_hours");
  });
});

describe("formatFollowUpsForIntake", () => {
  it("returns empty object when no responses", () => {
    const qs = pickFollowUps(["better_sleep"]);
    expect(formatFollowUpsForIntake(qs, {})).toEqual({});
  });

  it("prefixes each key with 'followup_'", () => {
    const qs = pickFollowUps(["better_sleep"]);
    const out = formatFollowUpsForIntake(qs, { sleep_hours: "7–8" });
    expect(out).toEqual({ followup_sleep_hours: "7–8" });
  });

  it("ignores responses for questions not in the picked list", () => {
    const qs = pickFollowUps(["better_sleep"]); // only sleep_hours
    const out = formatFollowUpsForIntake(qs, {
      sleep_hours: "7–8",
      stress_source: "School", // not in picked list
    });
    expect(out).toEqual({ followup_sleep_hours: "7–8" });
  });

  it("trims whitespace and drops empty answers", () => {
    const qs = pickFollowUps(["better_sleep", "energy"]);
    const out = formatFollowUpsForIntake(qs, {
      sleep_hours: "  ",
      energy_low: "Mornings  ",
    });
    expect(out).toEqual({ followup_energy_low: "Mornings" });
  });
});
