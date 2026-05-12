import { describe, expect, it } from "vitest";
import {
  FEELINGS_ORDERED,
  FEELING_LABEL,
  recommendBreath,
  type Feeling
} from "./breath-recommender";

describe("recommendBreath", () => {
  it("maps anxious to 4-7-8 (long exhale)", () => {
    const rec = recommendBreath("anxious");
    expect(rec.pattern.id).toBe("4-7-8");
  });

  it("maps wired_tired to calming (long exhale, no hold)", () => {
    const rec = recommendBreath("wired_tired");
    expect(rec.pattern.id).toBe("calming");
  });

  it("maps tired to energizing (short exhale)", () => {
    const rec = recommendBreath("tired");
    expect(rec.pattern.id).toBe("energizing");
  });

  it("maps before_big to box (steady)", () => {
    const rec = recommendBreath("before_big");
    expect(rec.pattern.id).toBe("box");
  });

  it("maps after_hard to 4-7-8 (real downshift)", () => {
    const rec = recommendBreath("after_hard");
    expect(rec.pattern.id).toBe("4-7-8");
  });

  it("maps maintaining to box (default)", () => {
    const rec = recommendBreath("maintaining");
    expect(rec.pattern.id).toBe("box");
  });

  it("always returns a non-empty rationale", () => {
    for (const feeling of FEELINGS_ORDERED) {
      const rec = recommendBreath(feeling);
      expect(rec.rationale.trim().length, feeling).toBeGreaterThan(0);
    }
  });

  it("never recommends energizing for an anxious teen", () => {
    // Sanity: amping up an anxious system is the opposite of what helps.
    const anxiousLike: Feeling[] = ["anxious", "wired_tired", "after_hard"];
    for (const feeling of anxiousLike) {
      const rec = recommendBreath(feeling);
      expect(rec.pattern.id, feeling).not.toBe("energizing");
    }
  });
});

describe("FEELING_LABEL", () => {
  it("provides a label for every feeling", () => {
    for (const feeling of FEELINGS_ORDERED) {
      expect(FEELING_LABEL[feeling].trim().length, feeling).toBeGreaterThan(0);
    }
  });

  it("labels are teen-current (no clinical jargon)", () => {
    const banned = [/parasympathetic/i, /sympathetic/i, /vagal/i, /panic disorder/i];
    for (const feeling of FEELINGS_ORDERED) {
      const label = FEELING_LABEL[feeling];
      for (const pattern of banned) {
        expect(label, feeling).not.toMatch(pattern);
      }
    }
  });
});
