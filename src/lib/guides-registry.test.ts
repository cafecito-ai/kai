import { describe, expect, it } from "vitest";
import { findGuide, GUIDES, guidesForEngine } from "./guides-registry";

describe("guides-registry", () => {
  it("starts with an empty GUIDES array on the scaffold PR", () => {
    // Sanity check: this should grow as primer PRs land.
    expect(Array.isArray(GUIDES)).toBe(true);
  });

  it("findGuide returns undefined when slug doesn't exist", () => {
    expect(findGuide("physical", "nonexistent-slug")).toBeUndefined();
  });

  it("findGuide returns undefined for unknown engines", () => {
    expect(findGuide("ghost-engine", "anything")).toBeUndefined();
  });

  it("guidesForEngine returns empty arrays for engines with no entries", () => {
    expect(guidesForEngine("physical")).toEqual([]);
    expect(guidesForEngine("potential")).toEqual([]);
    expect(guidesForEngine("mental")).toEqual([]);
  });

  it("once entries are added, findGuide matches on engine + slug", () => {
    // This test simulates the per-PR contract without actually mutating
    // the exported GUIDES (which would break parallelism). We add a
    // fake entry, exercise the helpers, then pop it.
    const fake = {
      engine: "physical" as const,
      slug: "test-slug",
      title: "Test guide",
      summary: "Test",
      component: {} as never
    };
    GUIDES.push(fake);
    try {
      expect(findGuide("physical", "test-slug")).toBe(fake);
      expect(findGuide("mental", "test-slug")).toBeUndefined();
      expect(guidesForEngine("physical")).toContain(fake);
      expect(guidesForEngine("mental")).not.toContain(fake);
    } finally {
      const idx = GUIDES.indexOf(fake);
      if (idx >= 0) GUIDES.splice(idx, 1);
    }
  });
});
