import { describe, expect, it } from "vitest";
import { IDENTITY_ARTICLES, IDENTITY_CATEGORY_LABEL } from "./identity-primer";

describe("IDENTITY_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(IDENTITY_ARTICLES.map((a) => a.category));
    expect(categories.has("values")).toBe(true);
    expect(categories.has("comparison")).toBe(true);
    expect(categories.has("authenticity")).toBe(true);
    expect(categories.has("change")).toBe(true);
    expect(categories.has("self_talk")).toBe(true);
    expect(categories.has("self_knowledge")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = IDENTITY_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of IDENTITY_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(300);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of IDENTITY_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never uses self-help cliches or platitudes", () => {
    const banned = [
      /find your true self/i,
      /\bmanifest\b/i,
      /live your truth/i,
      /authentic self/i,
      /\byou are enough\b/i,
      /you do you (?!exactly|specifically)/i,  // allow if quoted in specific context, not generic
      /just believe in yourself/i,
      /it's all in your head/i,
      /high vibration/i,
      /good vibes/i
    ];
    for (const article of IDENTITY_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("self-talk article points to therapy as treatable, not as last-resort", () => {
    const selfTalk = IDENTITY_ARTICLES.find((a) => a.id === "self-talk");
    expect(selfTalk).toBeTruthy();
    expect(selfTalk!.body.toLowerCase()).toMatch(/counselor|therapy/);
    expect(selfTalk!.body.toLowerCase()).toMatch(/treatable|evidence-based|cbt|act/);
    // Names crisis-page for severe cases.
    expect(selfTalk!.body.toLowerCase()).toMatch(/crisis|not being here/);
  });

  it("change article doesn't prescribe identity / orientation / religion", () => {
    const change = IDENTITY_ARTICLES.find((a) => a.id === "right-to-change");
    expect(change).toBeTruthy();
    // Should explicitly affirm self-pacing on these.
    expect(change!.body.toLowerCase()).toMatch(/your timeline is yours|own timeline/);
    // Should mention sexuality/gender/religion as private + paced.
    expect(change!.body.toLowerCase()).toMatch(/sexuality|gender|religion/);
  });

  it("comparison article frames it as wiring, not flaw", () => {
    const comp = IDENTITY_ARTICLES.find((a) => a.id === "comparison-trap");
    expect(comp).toBeTruthy();
    expect(comp!.body.toLowerCase()).toMatch(/wiring|evolved|not a personal flaw|not a flaw/);
    expect(comp!.body.toLowerCase()).toMatch(/highlight reel/);
  });

  it("values article surfaces values through noticing, not from a list", () => {
    const v = IDENTITY_ARTICLES.find((a) => a.id === "values-clarification");
    expect(v).toBeTruthy();
    // Explicitly states the noticing approach.
    expect(v!.body.toLowerCase()).toMatch(/notice them|don't pick values/);
  });

  it("borrowed-vs-yours article names examination without prescribing answers", () => {
    const b = IDENTITY_ARTICLES.find((a) => a.id === "borrowed-vs-yours");
    expect(b).toBeTruthy();
    expect(b!.body.toLowerCase()).toMatch(/examined|examine/);
    expect(b!.body.toLowerCase()).toMatch(/your timeline|own timeline/);
  });

  it("multiple articles direct teens to a counselor or trusted adult for hard patterns", () => {
    const escalations = IDENTITY_ARTICLES.filter((a) =>
      /counselor|trusted adult|therapy/i.test(a.body)
    );
    expect(escalations.length).toBeGreaterThanOrEqual(3);
  });
});

describe("IDENTITY_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(IDENTITY_CATEGORY_LABEL.values).toBeTruthy();
    expect(IDENTITY_CATEGORY_LABEL.comparison).toBeTruthy();
    expect(IDENTITY_CATEGORY_LABEL.authenticity).toBeTruthy();
    expect(IDENTITY_CATEGORY_LABEL.change).toBeTruthy();
    expect(IDENTITY_CATEGORY_LABEL.self_talk).toBeTruthy();
    expect(IDENTITY_CATEGORY_LABEL.self_knowledge).toBeTruthy();
  });
});
