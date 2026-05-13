import { describe, expect, it } from "vitest";
import { BODY_LITERACY_ARTICLES, BODY_LITERACY_CATEGORY_LABEL } from "./body-literacy";

describe("BODY_LITERACY_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(BODY_LITERACY_ARTICLES.map((a) => a.category));
    expect(categories.has("growth")).toBe(true);
    expect(categories.has("energy")).toBe(true);
    expect(categories.has("hydration")).toBe(true);
    expect(categories.has("hormones")).toBe(true);
    expect(categories.has("body_changes")).toBe(true);
    expect(categories.has("recovery")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = BODY_LITERACY_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of BODY_LITERACY_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(100);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is plausible (1-10 minutes)", () => {
    for (const article of BODY_LITERACY_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never uses diagnostic / medication / shame / weight-loss language", () => {
    // Note: 'melatonin' appears in the hormones article as an educational
    // reference to the *body's natural hormone* in the daily rhythm. That's
    // legitimate body-literacy content. The banned pattern looks specifically
    // for the *supplement* framing.
    const banned = [
      /you have (depression|adhd|anxiety|an eating disorder|insomnia)/i,
      /you should take/i,
      /take (melatonin|benadryl|nyquil)/i,
      /melatonin (supplement|gummies|pills)/i,
      /miracle/i,
      /detox(?!ify)/i, // catches "detox" but allow "detoxify" if it ever came up clinically
      /(juice|diet|body)\s+cleanse/i,
      /weight loss/i,
      /burn fat/i,
      /\blazy\b/i,
      /just push through/i,
      /man up/i,
      /toughen up/i
    ];
    for (const article of BODY_LITERACY_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("hormones article explicitly applies to all teens regardless of sex/gender", () => {
    const hormones = BODY_LITERACY_ARTICLES.find((a) => a.id === "hormones-and-mood");
    expect(hormones).toBeTruthy();
    expect(hormones!.body).toMatch(/regardless of your sex|every teen body|everyone has/i);
  });

  it("fueling article names the cost of restriction during growth", () => {
    const fueling = BODY_LITERACY_ARTICLES.find((a) => a.id === "fueling-for-growth");
    expect(fueling).toBeTruthy();
    expect(fueling!.body.toLowerCase()).toContain("restriction");
    // It should also direct teens to a clinician for persistent food-thought issues.
    expect(fueling!.body.toLowerCase()).toMatch(/clinician|trusted adult|doctor/);
  });
});

describe("BODY_LITERACY_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(BODY_LITERACY_CATEGORY_LABEL.growth).toBeTruthy();
    expect(BODY_LITERACY_CATEGORY_LABEL.energy).toBeTruthy();
    expect(BODY_LITERACY_CATEGORY_LABEL.hydration).toBeTruthy();
    expect(BODY_LITERACY_CATEGORY_LABEL.hormones).toBeTruthy();
    expect(BODY_LITERACY_CATEGORY_LABEL.body_changes).toBeTruthy();
    expect(BODY_LITERACY_CATEGORY_LABEL.recovery).toBeTruthy();
  });
});
