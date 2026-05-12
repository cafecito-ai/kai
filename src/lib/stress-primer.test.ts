import { describe, expect, it } from "vitest";
import { STRESS_ARTICLES, STRESS_CATEGORY_LABEL } from "./stress-primer";

describe("STRESS_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(STRESS_ARTICLES.map((a) => a.category));
    expect(categories.has("academic")).toBe(true);
    expect(categories.has("perfectionism")).toBe(true);
    expect(categories.has("performance")).toBe(true);
    expect(categories.has("social")).toBe(true);
    expect(categories.has("family")).toBe(true);
    expect(categories.has("body_signals")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = STRESS_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of STRESS_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(200);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of STRESS_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never uses 'just relax' / 'man up' / diagnostic claims", () => {
    const banned = [
      /just relax/i,
      /\bcalm down\b/i,
      /man up/i,
      /tough it out/i,
      /toughen up/i,
      /you have anxiety/i,
      /you have an anxiety disorder/i,
      /you have depression/i,
      /clinical (anxiety|depression|burnout)/i,
      /it's all in your head/i
    ];
    for (const article of STRESS_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("body-signals article names the suicidal-ideation escalation path", () => {
    const body = STRESS_ARTICLES.find((a) => a.id === "body-signals");
    expect(body).toBeTruthy();
    // The article should call out the escalation explicitly.
    expect(body!.body.toLowerCase()).toMatch(/thoughts about not being here|talk to an adult|crisis/);
  });

  it("perfectionism article distinguishes adaptive from maladaptive", () => {
    const perf = STRESS_ARTICLES.find((a) => a.id === "perfectionism-cost");
    expect(perf).toBeTruthy();
    expect(perf!.body.toLowerCase()).toMatch(/adaptive/);
    expect(perf!.body.toLowerCase()).toMatch(/maladaptive/);
  });

  it("performance article reframes nerves rather than telling teens to calm down", () => {
    const perf = STRESS_ARTICLES.find((a) => a.id === "performance-anxiety");
    expect(perf).toBeTruthy();
    expect(perf!.body.toLowerCase()).toMatch(/i am excited|excited/);
    expect(perf!.body.toLowerCase()).not.toMatch(/calm down/);
  });

  it("multiple articles direct teens to a clinician or trusted adult for persistent patterns", () => {
    const clinicianMentions = STRESS_ARTICLES.filter((a) =>
      /clinician|counselor|trusted adult|real help/i.test(a.body)
    );
    expect(clinicianMentions.length).toBeGreaterThanOrEqual(3);
  });
});

describe("STRESS_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(STRESS_CATEGORY_LABEL.academic).toBeTruthy();
    expect(STRESS_CATEGORY_LABEL.perfectionism).toBeTruthy();
    expect(STRESS_CATEGORY_LABEL.performance).toBeTruthy();
    expect(STRESS_CATEGORY_LABEL.social).toBeTruthy();
    expect(STRESS_CATEGORY_LABEL.family).toBeTruthy();
    expect(STRESS_CATEGORY_LABEL.body_signals).toBeTruthy();
  });
});
