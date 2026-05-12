import { describe, expect, it } from "vitest";
import { MOTIVATION_ARTICLES, MOTIVATION_CATEGORY_LABEL } from "./motivation-primer";

describe("MOTIVATION_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(MOTIVATION_ARTICLES.map((a) => a.category));
    expect(categories.has("starting")).toBe(true);
    expect(categories.has("drive")).toBe(true);
    expect(categories.has("freeze")).toBe(true);
    expect(categories.has("energy")).toBe(true);
    expect(categories.has("consistency")).toBe(true);
    expect(categories.has("when_stuck")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = MOTIVATION_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of MOTIVATION_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(300);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of MOTIVATION_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never uses hustle-culture or shaming language", () => {
    const banned = [
      /\bgrindset\b/i,
      /no excuses/i,
      /\b10x\b/i,
      /stop being lazy/i,
      /you're just lazy/i,
      /man up/i,
      /rise and grind/i,
      /hustle culture(?! )/i,
      /sleep when you're dead/i,
      /you have the same hours as/i,
      /you have the same 24 hours/i
    ];
    for (const article of MOTIVATION_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("procrastination article frames it as fear, not laziness", () => {
    const proc = MOTIVATION_ARTICLES.find((a) => a.id === "procrastination-is-anxiety");
    expect(proc).toBeTruthy();
    expect(proc!.body.toLowerCase()).toMatch(/not a discipline problem|not.*laziness|fear/);
    // Should direct chronic cases to a counselor without diagnosing.
    expect(proc!.body.toLowerCase()).toMatch(/counselor|professional/);
    // Should NOT make a diagnostic claim.
    expect(proc!.body.toLowerCase()).not.toMatch(/you have adhd/);
    expect(proc!.body.toLowerCase()).not.toMatch(/you have executive dysfunction/);
  });

  it("intrinsic-vs-extrinsic article doesn't shame extrinsic motivation", () => {
    const drive = MOTIVATION_ARTICLES.find((a) => a.id === "intrinsic-vs-extrinsic");
    expect(drive).toBeTruthy();
    expect(drive!.body.toLowerCase()).toMatch(/most of school is structurally extrinsic|not a moral failing/);
  });

  it("when-stuck article names crisis-page escalation", () => {
    const stuck = MOTIVATION_ARTICLES.find((a) => a.id === "when-stuck-completely");
    expect(stuck).toBeTruthy();
    expect(stuck!.body.toLowerCase()).toMatch(/crisis|not being here|stop-everything/);
    expect(stuck!.body.toLowerCase()).toMatch(/counselor|trusted adult/);
  });

  it("5-minute start article frames action-before-motivation", () => {
    const start = MOTIVATION_ARTICLES.find((a) => a.id === "the-5-minute-start");
    expect(start).toBeTruthy();
    // Should explicitly name action → motivation direction.
    expect(start!.body.toLowerCase()).toMatch(/action.*motivation|motivation.*comes.*after|starting.*first/);
  });

  it("perfectionism-freeze article distinguishes starting bar from finishing bar", () => {
    const perf = MOTIVATION_ARTICLES.find((a) => a.id === "perfectionism-freeze");
    expect(perf).toBeTruthy();
    expect(perf!.body.toLowerCase()).toMatch(/starting bar|finishing bar|lower the bar/);
    expect(perf!.body.toLowerCase()).toMatch(/can't edit a blank page/);
  });

  it("multiple articles direct teens to a counselor for chronic patterns", () => {
    const escalations = MOTIVATION_ARTICLES.filter((a) =>
      /counselor|trusted adult|professional|psychiatrist/i.test(a.body)
    );
    expect(escalations.length).toBeGreaterThanOrEqual(3);
  });
});

describe("MOTIVATION_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(MOTIVATION_CATEGORY_LABEL.starting).toBeTruthy();
    expect(MOTIVATION_CATEGORY_LABEL.drive).toBeTruthy();
    expect(MOTIVATION_CATEGORY_LABEL.freeze).toBeTruthy();
    expect(MOTIVATION_CATEGORY_LABEL.energy).toBeTruthy();
    expect(MOTIVATION_CATEGORY_LABEL.consistency).toBeTruthy();
    expect(MOTIVATION_CATEGORY_LABEL.when_stuck).toBeTruthy();
  });
});
