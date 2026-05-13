import { describe, expect, it } from "vitest";
import {
  SLEEP_CATEGORY_LABEL,
  SLEEP_TIPS,
  TEEN_SLEEP_HOURS,
  WIND_DOWN_ROUTINES,
  windDownRoutineDurationSeconds
} from "./sleep";

describe("WIND_DOWN_ROUTINES catalog", () => {
  it("has at least one routine in each category", () => {
    const categories = new Set(WIND_DOWN_ROUTINES.map((r) => r.category));
    expect(categories.has("last_resort")).toBe(true);
    expect(categories.has("quick")).toBe(true);
    expect(categories.has("standard")).toBe(true);
    expect(categories.has("extended")).toBe(true);
  });

  it("every routine has a unique id", () => {
    const ids = WIND_DOWN_ROUTINES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("timed steps have a positive durationSeconds; do steps don't", () => {
    for (const routine of WIND_DOWN_ROUTINES) {
      for (const step of routine.steps) {
        if (step.kind === "timed") {
          expect(step.durationSeconds, `${routine.id} / ${step.name}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("totalMinutes is in the ballpark of computed seconds", () => {
    for (const routine of WIND_DOWN_ROUTINES) {
      const seconds = windDownRoutineDurationSeconds(routine);
      const ratio = seconds / (routine.totalMinutes * 60);
      expect(ratio, `${routine.id} listed ${routine.totalMinutes}m vs ${seconds}s`).toBeGreaterThan(0.4);
      expect(ratio).toBeLessThan(1.8);
    }
  });

  it("never includes supplement / biohacking / shame language", () => {
    const banned = [/melatonin/i, /biohack/i, /should sleep/i, /lazy/i, /productive sleep/i, /weight loss/i];
    for (const routine of WIND_DOWN_ROUTINES) {
      const blob = JSON.stringify(routine);
      for (const pattern of banned) {
        expect(blob, `${routine.id}`).not.toMatch(pattern);
      }
    }
  });

  it("every routine has a description and a setup hint", () => {
    for (const routine of WIND_DOWN_ROUTINES) {
      expect(routine.description.trim().length).toBeGreaterThan(0);
      expect(routine.setup.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("SLEEP_TIPS", () => {
  it("has at least 6 tips", () => {
    expect(SLEEP_TIPS.length).toBeGreaterThanOrEqual(6);
  });

  it("every tip has unique id, title, and body", () => {
    const ids = SLEEP_TIPS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const tip of SLEEP_TIPS) {
      expect(tip.title.trim().length).toBeGreaterThan(0);
      expect(tip.body.trim().length).toBeGreaterThan(0);
    }
  });

  it("never recommends medication, supplements, or self-diagnosis", () => {
    const banned = [/melatonin/i, /benadryl/i, /should take/i, /you have insomnia/i, /diagnosis/i];
    for (const tip of SLEEP_TIPS) {
      const blob = `${tip.title} ${tip.body}`;
      for (const pattern of banned) {
        expect(blob, `${tip.id}`).not.toMatch(pattern);
      }
    }
  });
});

describe("TEEN_SLEEP_HOURS", () => {
  it("matches the spec (8-10 hours)", () => {
    expect(TEEN_SLEEP_HOURS.min).toBe(8);
    expect(TEEN_SLEEP_HOURS.max).toBe(10);
  });
});

describe("SLEEP_CATEGORY_LABEL", () => {
  it("provides a label for every category", () => {
    expect(SLEEP_CATEGORY_LABEL.last_resort).toBeTruthy();
    expect(SLEEP_CATEGORY_LABEL.quick).toBeTruthy();
    expect(SLEEP_CATEGORY_LABEL.standard).toBeTruthy();
    expect(SLEEP_CATEGORY_LABEL.extended).toBeTruthy();
  });
});
