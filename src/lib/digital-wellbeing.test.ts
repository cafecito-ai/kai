import { describe, expect, it } from "vitest";
import { DIGITAL_ARTICLES, DIGITAL_CATEGORY_LABEL } from "./digital-wellbeing";

describe("DIGITAL_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(DIGITAL_ARTICLES.map((a) => a.category));
    expect(categories.has("research")).toBe(true);
    expect(categories.has("mechanics")).toBe(true);
    expect(categories.has("social_comparison")).toBe(true);
    expect(categories.has("sleep")).toBe(true);
    expect(categories.has("focus")).toBe(true);
    expect(categories.has("agency")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = DIGITAL_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of DIGITAL_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(200);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of DIGITAL_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never uses shame / 'kids these days' / blanket-bad framing", () => {
    const banned = [
      /kids these days/i,
      /this generation is/i,
      /\bjust put down\b/i,
      /you're addicted/i, // diagnostic claim
      /\bphone addict/i,
      /(rotting|melting) your brain/i,
      /(should|need to)\s+quit (social media|tiktok|instagram)/i
    ];
    for (const article of DIGITAL_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("research article explicitly says correlation != causation", () => {
    const research = DIGITAL_ARTICLES.find((a) => a.id === "phones-and-mood");
    expect(research).toBeTruthy();
    expect(research!.body.toLowerCase()).toMatch(/correlation.*caus/);
  });

  it("doomscroll article names the slot-machine / variable-reward mechanic", () => {
    const doomscroll = DIGITAL_ARTICLES.find((a) => a.id === "doomscroll-mechanics");
    expect(doomscroll).toBeTruthy();
    expect(doomscroll!.body.toLowerCase()).toMatch(/variable reward|slot machine/);
  });

  it("phones-and-sleep article does not overclaim blue light", () => {
    const sleep = DIGITAL_ARTICLES.find((a) => a.id === "phones-and-sleep");
    expect(sleep).toBeTruthy();
    // The article should mention blue light only to *de-emphasize* it (overblown).
    expect(sleep!.body.toLowerCase()).toMatch(/overblown|less about/);
  });
});

describe("DIGITAL_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(DIGITAL_CATEGORY_LABEL.research).toBeTruthy();
    expect(DIGITAL_CATEGORY_LABEL.mechanics).toBeTruthy();
    expect(DIGITAL_CATEGORY_LABEL.social_comparison).toBeTruthy();
    expect(DIGITAL_CATEGORY_LABEL.sleep).toBeTruthy();
    expect(DIGITAL_CATEGORY_LABEL.focus).toBeTruthy();
    expect(DIGITAL_CATEGORY_LABEL.agency).toBeTruthy();
  });
});
