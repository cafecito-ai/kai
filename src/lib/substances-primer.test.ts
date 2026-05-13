import { describe, expect, it } from "vitest";
import {
  SAMHSA_HELPLINE,
  SUBSTANCES_ARTICLES,
  SUBSTANCES_CATEGORY_LABEL
} from "./substances-primer";

describe("SUBSTANCES_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(SUBSTANCES_ARTICLES.map((a) => a.category));
    expect(categories.has("vaping_nicotine")).toBe(true);
    expect(categories.has("alcohol")).toBe(true);
    expect(categories.has("cannabis")).toBe(true);
    expect(categories.has("pills_and_counterfeits")).toBe(true);
    expect(categories.has("friends_and_emergency")).toBe(true);
    expect(categories.has("when_use_is_a_problem")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = SUBSTANCES_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of SUBSTANCES_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(300);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of SUBSTANCES_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never moralizes or shames", () => {
    const banned = [
      /\bjust say no\b/i,
      /drugs are bad/i,
      /you're a junkie/i,
      /you should be ashamed/i,
      /one and done/i, // shame trope
      /\bweak\b(?!.*not)/i,
      /willpower (?:failure|problem)/i,
      /pothead/i,
      /stoner/i,
      /druggie/i
    ];
    for (const article of SUBSTANCES_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("never provides how-to instructions for using substances", () => {
    // The article should not provide preparation / dosing / route instructions.
    // This is a content guard: harm reduction should describe risks, not how to use.
    const banned = [
      /to get high,? mix/i,
      /to dose,? you should/i,
      /the best way to consume/i,
      /to smoke,? first/i,
      /to inject/i,
      /best ratio of/i,
      /maximize the effect/i
    ];
    for (const article of SUBSTANCES_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("SAMHSA helpline is present and referenced", () => {
    expect(SAMHSA_HELPLINE).toMatch(/1-800-662/);
    const referencesCount = SUBSTANCES_ARTICLES.filter((a) =>
      /1-800-662|samhsa/i.test(a.body)
    ).length;
    expect(referencesCount).toBeGreaterThanOrEqual(4);
  });

  it("vaping article names EVALI and Truth Initiative quitting program", () => {
    const v = SUBSTANCES_ARTICLES.find((a) => a.id === "vaping-nicotine-reality");
    expect(v).toBeTruthy();
    expect(v!.body.toLowerCase()).toMatch(/evali|acute vape-related lung/);
    expect(v!.body.toLowerCase()).toMatch(/ditchvape|truth initiative|this is quitting/);
  });

  it("alcohol article names the specific medical red flags for alcohol poisoning", () => {
    const a = SUBSTANCES_ARTICLES.find((a) => a.id === "alcohol-reality");
    expect(a).toBeTruthy();
    expect(a!.body.toLowerCase()).toMatch(/unresponsive|won't wake/);
    expect(a!.body.toLowerCase()).toMatch(/8 breaths|slow breathing|irregular breathing/);
    expect(a!.body.toLowerCase()).toMatch(/blue|cyanosis|pale/);
    expect(a!.body.toLowerCase()).toMatch(/recovery position/);
    expect(a!.body.toLowerCase()).toMatch(/\b911\b/);
  });

  it("cannabis article names dose-dependent risk and adolescent-specific research", () => {
    const c = SUBSTANCES_ARTICLES.find((a) => a.id === "cannabis-reality");
    expect(c).toBeTruthy();
    expect(c!.body.toLowerCase()).toMatch(/dose-dependent|frequency-dependent|concentration/);
    expect(c!.body.toLowerCase()).toMatch(/adolescent|teen brain|developing brain|under .25/);
    expect(c!.body.toLowerCase()).toMatch(/cannabis use disorder/);
  });

  it("pills-and-counterfeits article names fentanyl + Narcan + Good Samaritan", () => {
    const p = SUBSTANCES_ARTICLES.find((a) => a.id === "pills-and-counterfeits");
    expect(p).toBeTruthy();
    expect(p!.body.toLowerCase()).toMatch(/fentanyl/);
    expect(p!.body.toLowerCase()).toMatch(/naloxone|narcan/);
    expect(p!.body.toLowerCase()).toMatch(/good samaritan/);
    expect(p!.body.toLowerCase()).toMatch(/fentanyl test strips/);
    // Must explicitly say a pill outside a pharmacy bottle has unknown contents.
    expect(p!.body.toLowerCase()).toMatch(/unknown contents|cannot tell|can't tell/);
  });

  it("friends-and-emergency article names the amnesty mindset + recovery position + rescue breathing", () => {
    const f = SUBSTANCES_ARTICLES.find((a) => a.id === "friends-and-emergencies");
    expect(f).toBeTruthy();
    expect(f!.body.toLowerCase()).toMatch(/recovery position/);
    expect(f!.body.toLowerCase()).toMatch(/rescue breathing/);
    expect(f!.body.toLowerCase()).toMatch(/good samaritan/);
    expect(f!.body.toLowerCase()).toMatch(/\b911\b/);
    // Explicitly says don't drive them.
    expect(f!.body.toLowerCase()).toMatch(/don't drive|do not drive/);
  });

  it("when-use-is-a-problem article names DSM-style criteria without diagnosing", () => {
    const w = SUBSTANCES_ARTICLES.find((a) => a.id === "when-use-is-a-problem");
    expect(w).toBeTruthy();
    expect(w!.body.toLowerCase()).toMatch(/tolerance/);
    expect(w!.body.toLowerCase()).toMatch(/withdrawal/);
    expect(w!.body.toLowerCase()).toMatch(/loss of control/);
    expect(w!.body.toLowerCase()).toMatch(/use disorder/);
    // Should NOT make a self-diagnostic claim.
    expect(w!.body.toLowerCase()).not.toMatch(/you have an addiction/);
  });

  it("why-this-section-exists article names harm reduction as the third stance", () => {
    const why = SUBSTANCES_ARTICLES.find((a) => a.id === "why-this-section-exists");
    expect(why).toBeTruthy();
    expect(why!.body.toLowerCase()).toMatch(/harm reduction/);
    expect(why!.body.toLowerCase()).toMatch(/fear[- ]based|scare tactic/);
    expect(why!.body.toLowerCase()).toMatch(/dismissive|underplays/);
  });

  it("multiple articles direct teens to a confidential adult resource", () => {
    const escalations = SUBSTANCES_ARTICLES.filter((a) =>
      /school counselor|pediatrician|trusted adult|samhsa|1-800-662/i.test(a.body)
    );
    expect(escalations.length).toBeGreaterThanOrEqual(5);
  });
});

describe("SUBSTANCES_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(SUBSTANCES_CATEGORY_LABEL.vaping_nicotine).toBeTruthy();
    expect(SUBSTANCES_CATEGORY_LABEL.alcohol).toBeTruthy();
    expect(SUBSTANCES_CATEGORY_LABEL.cannabis).toBeTruthy();
    expect(SUBSTANCES_CATEGORY_LABEL.pills_and_counterfeits).toBeTruthy();
    expect(SUBSTANCES_CATEGORY_LABEL.friends_and_emergency).toBeTruthy();
    expect(SUBSTANCES_CATEGORY_LABEL.when_use_is_a_problem).toBeTruthy();
  });
});
