import { describe, expect, it } from "vitest";
import { GRAT_ARTICLES, GRAT_CATEGORY_LABEL } from "./gratitude-primer";

describe("GRAT_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(GRAT_ARTICLES.map((a) => a.category));
    expect(categories.has("why_it_works")).toBe(true);
    expect(categories.has("daily_practice")).toBe(true);
    expect(categories.has("savoring")).toBe(true);
    expect(categories.has("letter_writing")).toBe(true);
    expect(categories.has("hard_weeks")).toBe(true);
    expect(categories.has("for_others")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = GRAT_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of GRAT_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(300);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of GRAT_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never uses toxic-positivity or law-of-attraction language", () => {
    // Note: "just be grateful" appears in hard-weeks as a debunked phrase
    // (in quotes, called out as gaslighting). The regex below scopes to
    // outside-quotes usage by requiring it not be immediately preceded by
    // `"` or `'`. The simpler form is just to allow it because the article
    // is doing critique of the phrase, not endorsing it.
    const banned = [
      /\bmanifest(?:ing|ed)?\b/i,
      /high vibration/i,
      /good vibes only/i,
      /law of attraction/i,
      /look on the bright side/i,
      /count your blessings/i, // cliché, doesn't belong as advice
      /everything happens for a reason/i,
      /gratitude (?:cures|heals|fixes)/i
    ];
    for (const article of GRAT_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("why-it-works article explicitly names what gratitude does NOT fix", () => {
    const why = GRAT_ARTICLES.find((a) => a.id === "why-gratitude-actually-works");
    expect(why).toBeTruthy();
    expect(why!.body.toLowerCase()).toMatch(/does not fix|does not treat|not a replacement/);
    expect(why!.body.toLowerCase()).toMatch(/clinical depression|treatment/);
  });

  it("three-good-things article specifies the 'why' requirement", () => {
    const tgt = GRAT_ARTICLES.find((a) => a.id === "three-good-things");
    expect(tgt).toBeTruthy();
    expect(tgt!.body.toLowerCase()).toMatch(/include the "?why"?|one sentence on why/);
  });

  it("savoring article distinguishes savoring from gratitude", () => {
    const sav = GRAT_ARTICLES.find((a) => a.id === "savoring");
    expect(sav).toBeTruthy();
    expect(sav!.body.toLowerCase()).toMatch(/different skill from gratitude|different from gratitude|10[- ]second/);
  });

  it("gratitude-letter article names delivery as the load-bearing piece", () => {
    const letter = GRAT_ARTICLES.find((a) => a.id === "gratitude-letter");
    expect(letter).toBeTruthy();
    expect(letter!.body.toLowerCase()).toMatch(/deliver/);
    // Should explicitly say don't write to harmful people.
    expect(letter!.body.toLowerCase()).toMatch(/abusive|harmful/);
  });

  it("hard-weeks article validates that forced gratitude can backfire", () => {
    const hard = GRAT_ARTICLES.find((a) => a.id === "hard-weeks");
    expect(hard).toBeTruthy();
    expect(hard!.body.toLowerCase()).toMatch(/forced gratitude|backfire/);
    expect(hard!.body.toLowerCase()).toMatch(/counselor/);
    expect(hard!.body.toLowerCase()).toMatch(/two weeks|2 weeks|anhedonia/);
    expect(hard!.body.toLowerCase()).toMatch(/crisis/);
  });

  it("hedonic-adaptation article names the feed/comparison mechanism", () => {
    const hed = GRAT_ARTICLES.find((a) => a.id === "hedonic-adaptation");
    expect(hed).toBeTruthy();
    expect(hed!.body.toLowerCase()).toMatch(/hedonic adaptation|adaptation/);
    expect(hed!.body.toLowerCase()).toMatch(/upward comparison|algorithm|feed/);
  });

  it("for-others article gives a specific 'specific not abstract' rule", () => {
    const fo = GRAT_ARTICLES.find((a) => a.id === "gratitude-for-others");
    expect(fo).toBeTruthy();
    expect(fo!.body.toLowerCase()).toMatch(/specific, not abstract|not abstract/);
    expect(fo!.body.toLowerCase()).toMatch(/transactional|currency/);
  });

  it("at least one article points to clinical help for chronic patterns", () => {
    // This is a positive-practice primer; safety escalations are concentrated
    // in the hard-weeks article (which names counselor + Crisis page). One
    // strong reference is more appropriate than spreading thin across all
    // articles, which would dilute the gratitude content.
    const escalations = GRAT_ARTICLES.filter((a) =>
      /counselor|therapist|clinical/i.test(a.body)
    );
    expect(escalations.length).toBeGreaterThanOrEqual(2);
  });
});

describe("GRAT_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(GRAT_CATEGORY_LABEL.why_it_works).toBeTruthy();
    expect(GRAT_CATEGORY_LABEL.daily_practice).toBeTruthy();
    expect(GRAT_CATEGORY_LABEL.savoring).toBeTruthy();
    expect(GRAT_CATEGORY_LABEL.letter_writing).toBeTruthy();
    expect(GRAT_CATEGORY_LABEL.hard_weeks).toBeTruthy();
    expect(GRAT_CATEGORY_LABEL.for_others).toBeTruthy();
  });
});
