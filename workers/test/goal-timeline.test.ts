// PR 3 — goal timeline estimate parser.

import { describe, expect, it } from "vitest";
import { parseTimeline } from "../src/routes/goal-timeline";

describe("parseTimeline", () => {
  it("parses a well-formed estimate", () => {
    const r = parseTimeline('{"weeks": 12, "rationale": "Steady reps get you there.", "factors": ["consistency over intensity", "sleep drives recovery"]}');
    expect(r).toEqual({
      weeks: 12,
      rationale: "Steady reps get you there.",
      factors: ["consistency over intensity", "sleep drives recovery"],
    });
  });

  it("pulls the object out of surrounding prose", () => {
    const r = parseTimeline('Sure! Here you go:\n{"weeks": 8, "rationale": "x", "factors": []}\nHope that helps');
    expect(r?.weeks).toBe(8);
  });

  it("clamps absurd values and caps factors at 3", () => {
    const r = parseTimeline('{"weeks": 500, "rationale": "", "factors": ["a","b","c","d","e"]}');
    expect(r?.weeks).toBe(104);
    expect(r?.factors).toHaveLength(3);
  });

  it("returns null on malformed / missing output", () => {
    expect(parseTimeline("no json here")).toBeNull();
    expect(parseTimeline('{"weeks": "soon"}')).toBeNull();
    expect(parseTimeline('{"weeks": 0}')).toBeNull();
    expect(parseTimeline("")).toBeNull();
  });
});
