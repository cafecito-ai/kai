import { describe, expect, it } from "vitest";
import { NUTRITION_ARTICLES, NUTRITION_CATEGORY_LABEL } from "./nutrition-primer";

describe("NUTRITION_ARTICLES catalog", () => {
  it("has at least one article per category", () => {
    const categories = new Set(NUTRITION_ARTICLES.map((a) => a.category));
    expect(categories.has("fuel")).toBe(true);
    expect(categories.has("meals")).toBe(true);
    expect(categories.has("sport_fueling")).toBe(true);
    expect(categories.has("intuitive")).toBe(true);
    expect(categories.has("myths")).toBe(true);
    expect(categories.has("emotional")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = NUTRITION_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of NUTRITION_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(200);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of NUTRITION_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never quotes calorie targets or weight-loss framing", () => {
    // The "diet myths" article LISTS the myth ("Carbs make you gain weight") in order
    // to debunk it. Test against the *advocacy* framing, not any mention.
    const banned = [
      /eat\s+\d+\s+calories/i,
      /\b\d+\s+calorie\s+(diet|plan|target|goal)/i,
      /lose\s+\d+\s+pounds/i,
      /burn fat fast/i,
      /(should|must|need to)\s+lose weight/i,
      /\bskinny\s+(is|equals)\s+healthy/i,
      /miracle/i
      // Note: phrases like "detox tea", "forbidden food", "juice cleanse"
      // legitimately appear in the diet-myths and intuitive-eating articles
      // *to be debunked*. We don't ban them outright — the test catches
      // advocacy framing (e.g. "you should lose weight", "X-calorie plan",
      // "skinny is healthy"), not educational mention.
    ];
    for (const article of NUTRITION_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("emotional-eating article directs to a clinician for loss-of-control patterns", () => {
    const emotional = NUTRITION_ARTICLES.find((a) => a.id === "eating-around-feelings");
    expect(emotional).toBeTruthy();
    expect(emotional!.body.toLowerCase()).toMatch(/clinician|trusted adult|doctor/);
  });

  it("breakfast article reframes the 'most important meal' framing", () => {
    const breakfast = NUTRITION_ARTICLES.find((a) => a.id === "breakfast-actually-matters");
    expect(breakfast).toBeTruthy();
    // Either body or summary should reframe the "most important meal" hype.
    const blob = `${breakfast!.summary} ${breakfast!.body}`.toLowerCase();
    expect(blob).toMatch(/hype|myth|magical|not the way ads claim/);
  });

  it("supplement / detox content explicitly debunks", () => {
    const myths = NUTRITION_ARTICLES.find((a) => a.id === "diet-myths");
    expect(myths).toBeTruthy();
    expect(myths!.body.toLowerCase()).toContain("detox");
    // Body should contain a debunk verb near the detox claim.
    expect(myths!.body.toLowerCase()).toMatch(/false|marketing|not medicine|kidneys|liver/);
  });
});

describe("NUTRITION_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(NUTRITION_CATEGORY_LABEL.fuel).toBeTruthy();
    expect(NUTRITION_CATEGORY_LABEL.meals).toBeTruthy();
    expect(NUTRITION_CATEGORY_LABEL.sport_fueling).toBeTruthy();
    expect(NUTRITION_CATEGORY_LABEL.intuitive).toBeTruthy();
    expect(NUTRITION_CATEGORY_LABEL.myths).toBeTruthy();
    expect(NUTRITION_CATEGORY_LABEL.emotional).toBeTruthy();
  });
});
