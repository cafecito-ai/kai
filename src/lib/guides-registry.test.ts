import { describe, expect, it } from "vitest";
import { findGuide, GUIDES, guidesForEngine } from "./guides-registry";

describe("guides-registry", () => {
  it("exposes GUIDES as an array", () => {
    // Sanity check: this is the per-PR registration point.
    expect(Array.isArray(GUIDES)).toBe(true);
  });

  it("every registered guide has the required fields", () => {
    for (const guide of GUIDES) {
      expect(["physical", "potential", "mental"]).toContain(guide.engine);
      expect(typeof guide.slug).toBe("string");
      expect(guide.slug.length).toBeGreaterThan(0);
      expect(typeof guide.title).toBe("string");
      expect(typeof guide.summary).toBe("string");
      expect(guide.component).toBeDefined();
    }
  });

  it("slugs are unique within each engine", () => {
    const byEngine = new Map<string, Set<string>>();
    for (const guide of GUIDES) {
      const set = byEngine.get(guide.engine) ?? new Set<string>();
      expect(set.has(guide.slug), `duplicate slug ${guide.slug} in ${guide.engine}`).toBe(false);
      set.add(guide.slug);
      byEngine.set(guide.engine, set);
    }
  });

  it("findGuide returns undefined when slug doesn't exist", () => {
    expect(findGuide("physical", "nonexistent-slug-xyz")).toBeUndefined();
  });

  it("findGuide returns undefined for unknown engines", () => {
    expect(findGuide("ghost-engine", "anything")).toBeUndefined();
  });

  it("guidesForEngine returns only entries matching the requested engine", () => {
    for (const engine of ["physical", "potential", "mental"] as const) {
      const guides = guidesForEngine(engine);
      for (const g of guides) {
        expect(g.engine).toBe(engine);
      }
    }
  });

  it("findGuide / guidesForEngine round-trip a registered entry", () => {
    if (GUIDES.length === 0) return; // no guides registered yet, smoke test only
    const sample = GUIDES[0];
    expect(findGuide(sample.engine, sample.slug)).toBe(sample);
    expect(guidesForEngine(sample.engine)).toContain(sample);
  });

  it("registry mutation (push/pop) works for ad-hoc test additions", () => {
    const fake = {
      engine: "physical" as const,
      slug: "test-slug-xyz",
      title: "Test guide",
      summary: "Test",
      component: {} as never
    };
    GUIDES.push(fake);
    try {
      expect(findGuide("physical", "test-slug-xyz")).toBe(fake);
      expect(findGuide("mental", "test-slug-xyz")).toBeUndefined();
    } finally {
      const idx = GUIDES.indexOf(fake);
      if (idx >= 0) GUIDES.splice(idx, 1);
    }
  });
});
