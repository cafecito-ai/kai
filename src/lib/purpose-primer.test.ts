import { describe, expect, it } from "vitest";
import { PURPOSE_ARTICLES, PURPOSE_CATEGORY_LABEL } from "./purpose-primer";

describe("PURPOSE_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(PURPOSE_ARTICLES.map((a) => a.category));
    expect(categories.has("what_purpose_is")).toBe(true);
    expect(categories.has("passion_vs_practice")).toBe(true);
    expect(categories.has("existential_questions")).toBe(true);
    expect(categories.has("contribution_and_service")).toBe(true);
    expect(categories.has("career_and_meaning")).toBe(true);
    expect(categories.has("when_meaning_falters")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = PURPOSE_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of PURPOSE_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(400);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of PURPOSE_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never uses prescriptive 'find your why' / 'follow your dreams' as advice", () => {
    // The passion-vs-practice article critiques 'follow your passion' (allowed
    // in critique context). The banned set is the directives endorsed as
    // advice.
    const banned = [
      /^\s*find your why\s*\.?$/im,
      /^\s*just follow your dreams\b/im,
      /you can be anything you want to be/i,
      /the universe (?:will|wants to) provide/i,
      /everything happens for a reason/i,
      /trust the universe/i,
      /align with your higher self/i,
      /\bdream big\b/i
    ];
    for (const article of PURPOSE_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("never prescribes a specific meaning of life or moralizes about teens' choices", () => {
    const banned = [
      /the meaning of life is/i,
      /you must (?:believe|have faith)/i,
      /the right path for everyone/i,
      /god has a plan for you/i,
      /the only true meaning/i
    ];
    for (const article of PURPOSE_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("what-purpose-actually-is article cites Damon's framework and adolescent stats", () => {
    const w = PURPOSE_ARTICLES.find((a) => a.id === "what-purpose-actually-is");
    expect(w).toBeTruthy();
    expect(w!.body.toLowerCase()).toMatch(/damon|stable.*meaningful.*consequential/);
    expect(w!.body.toLowerCase()).toMatch(/1 in 4|25%|developmental/);
    expect(w!.body.toLowerCase()).toMatch(/developmental milestone|not a teen requirement|not a teenage/);
  });

  it("passion-vs-practice article cites Newport / Duckworth and debunks 'follow your passion'", () => {
    const p = PURPOSE_ARTICLES.find((a) => a.id === "passion-is-built-not-found");
    expect(p).toBeTruthy();
    expect(p!.body.toLowerCase()).toMatch(/newport|duckworth|grit/);
    expect(p!.body.toLowerCase()).toMatch(/follow your passion/);
    expect(p!.body.toLowerCase()).toMatch(/curiosity/);
  });

  it("existential-questions article normalizes the questions + names depression escalation", () => {
    const e = PURPOSE_ARTICLES.find((a) => a.id === "existential-questions");
    expect(e).toBeTruthy();
    expect(e!.body.toLowerCase()).toMatch(/not symptoms|normal/);
    expect(e!.body.toLowerCase()).toMatch(/anhedonia|depression|counselor/);
    // Should name 988 for crisis.
    expect(e!.body).toMatch(/988/);
    // Should explicitly say meaning is made, not found.
    expect(e!.body.toLowerCase()).toMatch(/meaning is made|made, not found/);
  });

  it("contribution-and-service article doesn't moralize volunteerism", () => {
    const c = PURPOSE_ARTICLES.find((a) => a.id === "contribution-and-service");
    expect(c).toBeTruthy();
    expect(c!.body.toLowerCase()).toMatch(/research/);
    // Should explicitly NOT be a virtue/moralism pitch.
    expect(c!.body.toLowerCase()).toMatch(/not moralizing|not.*moral virtue|pattern in the data/);
    // Should mention self-care + contribution as complementary.
    expect(c!.body.toLowerCase()).toMatch(/self-care/);
  });

  it("career-and-meaning article frames career as iterative + non-linear", () => {
    const c = PURPOSE_ARTICLES.find((a) => a.id === "career-and-meaning");
    expect(c).toBeTruthy();
    expect(c!.body.toLowerCase()).toMatch(/change.*major|major.*change|iterative|non-linear/);
    expect(c!.body.toLowerCase()).toMatch(/trades|vocational|non-prestigious|plumbers|electricians/);
    // Should explicitly say major doesn't determine career.
    expect(c!.body.toLowerCase()).toMatch(/major.*doesn't.*determine|major.*doesn't.*career|unrelated to their.*major/);
  });

  it("when-meaning-falters article differentiates existential / depression / burnout / circumstantial", () => {
    const w = PURPOSE_ARTICLES.find((a) => a.id === "when-meaning-falters");
    expect(w).toBeTruthy();
    expect(w!.body.toLowerCase()).toMatch(/existential transition|existential/);
    expect(w!.body.toLowerCase()).toMatch(/depression/);
    expect(w!.body.toLowerCase()).toMatch(/burnout/);
    expect(w!.body.toLowerCase()).toMatch(/circumstantial/);
    expect(w!.body).toMatch(/988/);
  });

  it("honest-version article frames meaning as quiet, not dramatic", () => {
    const h = PURPOSE_ARTICLES.find((a) => a.id === "the-honest-version-of-meaning");
    expect(h).toBeTruthy();
    expect(h!.body.toLowerCase()).toMatch(/quiet|not dramatic/);
    // Should explicitly disentangle meaning from happiness.
    // Article should explicitly mention meaning and happiness as related-but-different.
    expect(h!.body.toLowerCase()).toMatch(/meaning[\s\S]{0,160}happiness/);
    expect(h!.body.toLowerCase()).toMatch(/different|not the same|but they're different/);
  });

  it("multiple articles name 988 or counselor for meaning-paired-with-dark-thoughts", () => {
    const refs = PURPOSE_ARTICLES.filter((a) =>
      /988|counselor|crisis/i.test(a.body)
    );
    expect(refs.length).toBeGreaterThanOrEqual(3);
  });
});

describe("PURPOSE_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(PURPOSE_CATEGORY_LABEL.what_purpose_is).toBeTruthy();
    expect(PURPOSE_CATEGORY_LABEL.passion_vs_practice).toBeTruthy();
    expect(PURPOSE_CATEGORY_LABEL.existential_questions).toBeTruthy();
    expect(PURPOSE_CATEGORY_LABEL.contribution_and_service).toBeTruthy();
    expect(PURPOSE_CATEGORY_LABEL.career_and_meaning).toBeTruthy();
    expect(PURPOSE_CATEGORY_LABEL.when_meaning_falters).toBeTruthy();
  });
});
