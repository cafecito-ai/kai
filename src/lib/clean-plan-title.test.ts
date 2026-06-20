import { describe, expect, it } from "vitest";
import { cleanPlanTitle } from "./local-northstar";

describe("cleanPlanTitle (Bucket 3 — smart plan names)", () => {
  it("shortens a rambling goal into a clean title instead of using the whole sentence", () => {
    const messy =
      "I want to lock in, get disciplined, stop wasting time, get bigger, and improve my life.";
    const title = cleanPlanTitle(messy);
    expect(title).toBe("Discipline Reset");
    expect(title.length).toBeLessThan(messy.length);
  });

  it("maps a strength/bulk goal to a clean title", () => {
    expect(cleanPlanTitle("trying to get jacked and put on a ton of size this whole year")).toBe(
      "Strength Build",
    );
  });

  it("keeps an already-tight title the user typed (just title-cased)", () => {
    expect(cleanPlanTitle("summer bulk")).toBe("Summer Bulk");
    expect(cleanPlanTitle("Boxing Focus")).toBe("Boxing Focus");
  });

  it("falls back to a sane default for empty input", () => {
    expect(cleanPlanTitle("")).toBe("My Plan");
  });
});
