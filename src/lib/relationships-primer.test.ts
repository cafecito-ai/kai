import { describe, expect, it } from "vitest";
import { REL_ARTICLES, REL_CATEGORY_LABEL } from "./relationships-primer";

describe("REL_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(REL_ARTICLES.map((a) => a.category));
    expect(categories.has("friendship")).toBe(true);
    expect(categories.has("conflict")).toBe(true);
    expect(categories.has("romantic")).toBe(true);
    expect(categories.has("loneliness")).toBe(true);
    expect(categories.has("warning_signs")).toBe(true);
    expect(categories.has("boundaries")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = REL_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of REL_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(300);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of REL_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never diagnoses people or uses gender-essentialist tropes", () => {
    const banned = [
      /\bnarcissist\b/i,
      /\bsociopath\b/i,
      /\bpsychopath\b/i,
      /\btoxic person\b/i,
      /\bboys will be boys\b/i,
      /girls are catty/i,
      /men are/i,
      /women are/i,
      /you'll make new friends/i,
      /just talk to them/i,
      /it's all in your head/i
    ];
    for (const article of REL_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("warning_signs article describes patterns, not labels", () => {
    const warning = REL_ARTICLES.find((a) => a.id === "warning-signs");
    expect(warning).toBeTruthy();
    expect(warning!.body.toLowerCase()).toMatch(/pattern/);
    expect(warning!.body.toLowerCase()).toMatch(/trusted adult|counselor/);
    // Should include the dating-violence resource explicitly.
    expect(warning!.body.toLowerCase()).toMatch(/loveisrespect|love is respect|22522|1-866-331-9474/);
  });

  it("loneliness article names crisis-page escalation for severe states", () => {
    const lonely = REL_ARTICLES.find((a) => a.id === "loneliness");
    expect(lonely).toBeTruthy();
    expect(lonely!.body.toLowerCase()).toMatch(/crisis|talk to an adult|thoughts of not being here/);
  });

  it("romantic article centers consent and the mutual no", () => {
    const rom = REL_ARTICLES.find((a) => a.id === "romantic-basics");
    expect(rom).toBeTruthy();
    expect(rom!.body.toLowerCase()).toMatch(/mutual/);
    // Should explicitly state physical pace is mutual.
    expect(rom!.body.toLowerCase()).toMatch(/physical pace is mutual|both people genuinely want/);
  });

  it("conflict article names the three-part apology shape", () => {
    const conflict = REL_ARTICLES.find((a) => a.id === "conflict-and-repair");
    expect(conflict).toBeTruthy();
    expect(conflict!.body.toLowerCase()).toMatch(/i'm sorry i did/);
    expect(conflict!.body.toLowerCase()).toMatch(/different/);
  });

  it("multiple articles direct teens to a trusted adult or counselor", () => {
    const escalations = REL_ARTICLES.filter((a) =>
      /trusted adult|counselor|crisis page|school counselor/i.test(a.body)
    );
    expect(escalations.length).toBeGreaterThanOrEqual(3);
  });
});

describe("REL_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(REL_CATEGORY_LABEL.friendship).toBeTruthy();
    expect(REL_CATEGORY_LABEL.conflict).toBeTruthy();
    expect(REL_CATEGORY_LABEL.romantic).toBeTruthy();
    expect(REL_CATEGORY_LABEL.loneliness).toBeTruthy();
    expect(REL_CATEGORY_LABEL.warning_signs).toBeTruthy();
    expect(REL_CATEGORY_LABEL.boundaries).toBeTruthy();
  });
});
