import { describe, expect, it } from "vitest";
import {
  HELPLINE_211,
  MONEY_ARTICLES,
  MONEY_CATEGORY_LABEL
} from "./money-primer";

describe("MONEY_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(MONEY_ARTICLES.map((a) => a.category));
    expect(categories.has("first_money_skills")).toBe(true);
    expect(categories.has("job_and_earning")).toBe(true);
    expect(categories.has("spending_and_saving")).toBe(true);
    expect(categories.has("family_stress")).toBe(true);
    expect(categories.has("college_costs")).toBe(true);
    expect(categories.has("predatory_patterns")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = MONEY_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of MONEY_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(400);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of MONEY_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never gives specific stock / crypto / get-rich pitches", () => {
    // The primer educates about predatory patterns; it does not pitch them.
    const banned = [
      /\bbuy\s+(?:bitcoin|ethereum|btc|eth|sol|doge)\b/i,
      /\bguaranteed return\b/i,
      /\bget rich\b/i,
      /\bmillionaire mindset\b/i,
      /\bfinancial freedom by .25\b/i,
      /\bpassive income guaranteed\b/i,
      /\binvest in this/i
    ];
    for (const article of MONEY_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("never moralizes how money should be spent", () => {
    const banned = [
      /\bshouldn't spend money on\b/i,
      /\bwasting your money\b/i,
      /\bfrivolous purchase\b/i,
      /\bsmart people don't\b/i,
      /\brich people don't\b/i,
      /\byou should be saving every/i
    ];
    for (const article of MONEY_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("never uses hustle / manifest / FIRE-bro language", () => {
    const banned = [
      /\bmanifest money\b/i,
      /\bwealth mindset\b/i,
      /\bsleep is for the broke\b/i,
      /\bgrind for wealth\b/i,
      /\b10x your income\b/i,
      /\bcrypto bro\b(?! ie)/i
    ];
    for (const article of MONEY_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("basics article names credit scores, compound interest, and FAFSA-relevant infra", () => {
    const b = MONEY_ARTICLES.find((a) => a.id === "money-basics-that-school-skips");
    expect(b).toBeTruthy();
    expect(b!.body.toLowerCase()).toMatch(/compound interest/);
    expect(b!.body.toLowerCase()).toMatch(/credit score/);
    expect(b!.body.toLowerCase()).toMatch(/payment history|utilization/);
    expect(b!.body.toLowerCase()).toMatch(/credit union/);
  });

  it("first-job article names labor-law protections and MLM red flags", () => {
    const j = MONEY_ARTICLES.find((a) => a.id === "first-job-realities");
    expect(j).toBeTruthy();
    expect(j!.body.toLowerCase()).toMatch(/minimum wage|department of labor|dol/);
    expect(j!.body.toLowerCase()).toMatch(/pyramid scheme|mlm|training fee/);
  });

  it("spending-vs-saving article names 50/30/20 + 24-hour test + experiences>things", () => {
    const s = MONEY_ARTICLES.find((a) => a.id === "spending-vs-saving");
    expect(s).toBeTruthy();
    expect(s!.body.toLowerCase()).toMatch(/50\/30\/20/);
    expect(s!.body.toLowerCase()).toMatch(/24[- ]hour/);
    expect(s!.body.toLowerCase()).toMatch(/experience/);
  });

  it("family-stress article names 211 helpline and school counselor", () => {
    const f = MONEY_ARTICLES.find((a) => a.id === "family-money-stress");
    expect(f).toBeTruthy();
    expect(f!.body).toMatch(/2-?1-?1/);
    expect(f!.body.toLowerCase()).toMatch(/school counselor/);
    // Should explicitly name what's NOT yours to carry.
    expect(f!.body.toLowerCase()).toMatch(/not yours|isn't yours|not your fault/);
  });

  it("college-cost article calls out FAFSA, federal-loan cap, and private-loan warning", () => {
    const c = MONEY_ARTICLES.find((a) => a.id === "college-cost-honesty");
    expect(c).toBeTruthy();
    expect(c!.body.toLowerCase()).toMatch(/fafsa/);
    expect(c!.body.toLowerCase()).toMatch(/private (?:student )?loan/);
    expect(c!.body.toLowerCase()).toMatch(/community college/);
    // Should name the sticker-price-vs-actual reality.
    expect(c!.body.toLowerCase()).toMatch(/sticker price|net price/);
  });

  it("predatory-patterns article names BNPL, sports betting, MLMs, payday-advance apps", () => {
    const p = MONEY_ARTICLES.find((a) => a.id === "predatory-patterns");
    expect(p).toBeTruthy();
    expect(p!.body.toLowerCase()).toMatch(/buy[- ]now[- ]pay[- ]later|bnpl|klarna|afterpay|affirm/);
    expect(p!.body.toLowerCase()).toMatch(/sports betting|draftkings|fanduel/);
    expect(p!.body.toLowerCase()).toMatch(/mlm|multi-?level marketing/);
    expect(p!.body.toLowerCase()).toMatch(/payday|earnin|dave|brigit/);
    // Should name 1-800-GAMBLER explicitly.
    expect(p!.body.toLowerCase()).toMatch(/1-800-gambler|1-800-426-2537/);
  });

  it("money-and-friendships article names split-by-what-you-ordered + lending-as-gift", () => {
    const f = MONEY_ARTICLES.find((a) => a.id === "money-and-friendships");
    expect(f).toBeTruthy();
    expect(f!.body.toLowerCase()).toMatch(/split.*ordered|by what each person ordered/);
    expect(f!.body.toLowerCase()).toMatch(/lend|borrow|gift/);
  });

  it("multiple articles name 211 or school counselor or DOL as a real resource", () => {
    const refs = MONEY_ARTICLES.filter((a) =>
      /2-?1-?1|school counselor|department of labor|consumerfinance|cfpb|ftc/i.test(a.body)
    );
    expect(refs.length).toBeGreaterThanOrEqual(3);
  });
});

describe("HELPLINE_211 constant", () => {
  it("references 211 helpline by name", () => {
    expect(HELPLINE_211).toMatch(/2-1-1/);
  });
});

describe("MONEY_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(MONEY_CATEGORY_LABEL.first_money_skills).toBeTruthy();
    expect(MONEY_CATEGORY_LABEL.job_and_earning).toBeTruthy();
    expect(MONEY_CATEGORY_LABEL.spending_and_saving).toBeTruthy();
    expect(MONEY_CATEGORY_LABEL.family_stress).toBeTruthy();
    expect(MONEY_CATEGORY_LABEL.college_costs).toBeTruthy();
    expect(MONEY_CATEGORY_LABEL.predatory_patterns).toBeTruthy();
  });
});
