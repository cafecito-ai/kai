import { describe, expect, it } from "vitest";
import { EMOTION_ARTICLES, EMOTION_CATEGORY_LABEL } from "./emotion-vocabulary";

describe("EMOTION_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(EMOTION_ARTICLES.map((a) => a.category));
    expect(categories.has("anger_family")).toBe(true);
    expect(categories.has("sadness_family")).toBe(true);
    expect(categories.has("fear_family")).toBe(true);
    expect(categories.has("joy_family")).toBe(true);
    expect(categories.has("shame_family")).toBe(true);
    expect(categories.has("body_cues")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = EMOTION_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of EMOTION_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(300);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of EMOTION_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never frames emotions as moral categories or uses toxic-positivity speak", () => {
    const banned = [
      /negative emotions/i,
      /positive emotions/i,
      /good vibes only/i,
      /high vibration/i,
      /positive thinking/i,
      /shouldn't feel/i,
      /you shouldn't be/i,
      /be strong, don't cry/i  // generic version, not the in-quotes critique
    ];
    for (const article of EMOTION_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("naming-it article names affect labeling research grounding", () => {
    const naming = EMOTION_ARTICLES.find((a) => a.id === "naming-it");
    expect(naming).toBeTruthy();
    expect(naming!.body.toLowerCase()).toMatch(/affect labeling/);
    expect(naming!.body.toLowerCase()).toMatch(/amygdala|prefrontal/);
  });

  it("shame-vs-guilt article names the behavior-vs-identity distinction", () => {
    const shame = EMOTION_ARTICLES.find((a) => a.id === "shame-and-guilt");
    expect(shame).toBeTruthy();
    expect(shame!.body.toLowerCase()).toMatch(/i did/);
    expect(shame!.body.toLowerCase()).toMatch(/i am/);
    expect(shame!.body.toLowerCase()).toMatch(/crisis|not being here/);
  });

  it("body-cues article grounds in interoception, not woo-speak", () => {
    const body = EMOTION_ARTICLES.find((a) => a.id === "body-cues");
    expect(body).toBeTruthy();
    expect(body!.body.toLowerCase()).toMatch(/interoception/);
    // Should explicitly name hunger/tiredness/dehydration as confounds.
    expect(body!.body.toLowerCase()).toMatch(/hungry|hunger/);
    expect(body!.body.toLowerCase()).toMatch(/tired|dehydrat/);
  });

  it("sadness article names escalation for >2-week patterns", () => {
    const sad = EMOTION_ARTICLES.find((a) => a.id === "sadness-family");
    expect(sad).toBeTruthy();
    expect(sad!.body.toLowerCase()).toMatch(/two weeks|2 weeks/);
    expect(sad!.body.toLowerCase()).toMatch(/counselor/);
  });

  it("fear article distinguishes anxiety from a clinical diagnosis", () => {
    const fear = EMOTION_ARTICLES.find((a) => a.id === "fear-family");
    expect(fear).toBeTruthy();
    // The article should explicitly say having these fears doesn't mean having a "disorder".
    expect(fear!.body.toLowerCase()).toMatch(/not have an anxiety .* disorder|not pathology/);
  });

  it("anger article doesn't gender or moralize anger", () => {
    const anger = EMOTION_ARTICLES.find((a) => a.id === "anger-family");
    expect(anger).toBeTruthy();
    // Should explicitly mention cultural rules differ + name a gendered pattern carefully (not endorse it).
    expect(anger!.body.toLowerCase()).toMatch(/cultur/);
    // Should NOT endorse anger as bad or as a "negative" emotion.
    expect(anger!.body.toLowerCase()).not.toMatch(/anger is bad/);
    expect(anger!.body.toLowerCase()).not.toMatch(/bad emotion/);
  });

  it("joy article names quiet/loud-joy distinction and gratitude/awe research", () => {
    const joy = EMOTION_ARTICLES.find((a) => a.id === "joy-family");
    expect(joy).toBeTruthy();
    expect(joy!.body.toLowerCase()).toMatch(/quiet/);
    expect(joy!.body.toLowerCase()).toMatch(/gratitude|awe/);
  });

  it("multiple articles direct teens to a counselor for chronic patterns", () => {
    const escalations = EMOTION_ARTICLES.filter((a) =>
      /counselor|therapist|trusted adult/i.test(a.body)
    );
    expect(escalations.length).toBeGreaterThanOrEqual(4);
  });
});

describe("EMOTION_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(EMOTION_CATEGORY_LABEL.anger_family).toBeTruthy();
    expect(EMOTION_CATEGORY_LABEL.sadness_family).toBeTruthy();
    expect(EMOTION_CATEGORY_LABEL.fear_family).toBeTruthy();
    expect(EMOTION_CATEGORY_LABEL.joy_family).toBeTruthy();
    expect(EMOTION_CATEGORY_LABEL.shame_family).toBeTruthy();
    expect(EMOTION_CATEGORY_LABEL.body_cues).toBeTruthy();
  });
});
