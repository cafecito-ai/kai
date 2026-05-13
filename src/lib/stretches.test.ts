import { describe, expect, it } from "vitest";
import { stretchFlowDurationSeconds, STRETCH_FLOWS, STRETCH_CATEGORY_LABEL } from "./stretches";

describe("STRETCH_FLOWS catalog", () => {
  it("has at least one flow in each category", () => {
    const categories = new Set(STRETCH_FLOWS.map((f) => f.category));
    expect(categories.has("morning")).toBe(true);
    expect(categories.has("desk")).toBe(true);
    expect(categories.has("post_sport")).toBe(true);
    expect(categories.has("wind_down")).toBe(true);
    expect(categories.has("tightness")).toBe(true);
  });

  it("every flow has a unique id", () => {
    const ids = STRETCH_FLOWS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every segment has a positive holdSeconds", () => {
    for (const flow of STRETCH_FLOWS) {
      for (const seg of flow.segments) {
        expect(seg.holdSeconds, `${flow.id} / ${seg.name}`).toBeGreaterThan(0);
      }
    }
  });

  it("totalMinutes is in the ballpark of computed seconds", () => {
    for (const flow of STRETCH_FLOWS) {
      const seconds = stretchFlowDurationSeconds(flow);
      const ratio = seconds / (flow.totalMinutes * 60);
      expect(ratio, `${flow.id} listed ${flow.totalMinutes}m vs ${seconds}s`).toBeGreaterThan(0.6);
      expect(ratio).toBeLessThan(1.6);
    }
  });

  it("never uses force/strain/burn/weight-loss language", () => {
    const banned = [/force the stretch/i, /push through pain/i, /no pain no gain/i, /burn fat/i, /weight loss/i, /calorie/i];
    for (const flow of STRETCH_FLOWS) {
      const blob = JSON.stringify(flow);
      for (const pattern of banned) {
        expect(blob).not.toMatch(pattern);
      }
    }
  });

  it("every flow has a description and a setup hint", () => {
    for (const flow of STRETCH_FLOWS) {
      expect(flow.description.trim().length).toBeGreaterThan(0);
      expect(flow.setup.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("stretchFlowDurationSeconds", () => {
  it("sums hold + rest seconds", () => {
    const morning = STRETCH_FLOWS.find((f) => f.id === "morning-back-unstick-10")!;
    const sum = stretchFlowDurationSeconds(morning);
    // Listed 10 min; should be within reasonable bounds.
    expect(sum).toBeGreaterThan(7 * 60);
    expect(sum).toBeLessThan(13 * 60);
  });
});

describe("STRETCH_CATEGORY_LABEL", () => {
  it("provides a label for every category", () => {
    expect(STRETCH_CATEGORY_LABEL.morning).toBeTruthy();
    expect(STRETCH_CATEGORY_LABEL.desk).toBeTruthy();
    expect(STRETCH_CATEGORY_LABEL.post_sport).toBeTruthy();
    expect(STRETCH_CATEGORY_LABEL.wind_down).toBeTruthy();
    expect(STRETCH_CATEGORY_LABEL.tightness).toBeTruthy();
  });
});
