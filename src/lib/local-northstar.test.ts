import { describe, it, expect } from "vitest";

import { shortLabelFor } from "./local-northstar";

describe("shortLabelFor — glanceable goal card label", () => {
  it("keeps an already-short theme word as-is", () => {
    expect(shortLabelFor("Bulk")).toBe("Bulk");
    expect(shortLabelFor("confidence")).toBe("Confidence");
    expect(shortLabelFor("Faith")).toBe("Faith");
  });

  it("condenses a full sentence into a one-word identity/theme", () => {
    expect(shortLabelFor("I want to get bigger and put on serious muscle this year")).toBe("Bulk");
    expect(shortLabelFor("grow closer to God and strengthen my faith")).toBe("Faith");
    expect(shortLabelFor("I really want a girlfriend and to be better with people")).toBe("Relationships");
    expect(shortLabelFor("become way more disciplined and stop wasting time on my phone")).toBe("Discipline");
    expect(shortLabelFor("get my grades up so I can get into a good college")).toBe("Grades");
    expect(shortLabelFor("I want to feel less anxious all the time")).toBe("Calm");
  });

  it("falls back to a clean first meaningful word, never a stopword", () => {
    const label = shortLabelFor("i want to travel the whole world someday");
    expect(label).toBe("Travel");
  });

  it("returns empty for empty input", () => {
    expect(shortLabelFor("")).toBe("");
    expect(shortLabelFor("   ")).toBe("");
  });
});
