import { describe, expect, it } from "vitest";
import {
  ANAD_HELPLINE,
  BODY_IMAGE_ARTICLES,
  BODY_IMAGE_CATEGORY_LABEL,
  CRISIS_TEXT,
  NEDA_HELPLINE
} from "./body-image-primer";

describe("BODY_IMAGE_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(BODY_IMAGE_ARTICLES.map((a) => a.category));
    expect(categories.has("comparison_and_feeds")).toBe(true);
    expect(categories.has("body_acceptance")).toBe(true);
    expect(categories.has("diet_culture")).toBe(true);
    expect(categories.has("changing_body")).toBe(true);
    expect(categories.has("body_checking_patterns")).toBe(true);
    expect(categories.has("when_its_an_ed")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = BODY_IMAGE_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of BODY_IMAGE_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(300);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of BODY_IMAGE_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never provides specific calorie / macro / weight-loss targets or strategies", () => {
    // Hardest-baked guard for this primer. Per CLAUDE.md §1: no calorie
    // obsession, no weight-loss aids, no daily calorie limits ever.
    const banned = [
      /\d{3,4}\s*calories per day/i,
      /eat (?:less than|under)\s*\d/i,
      /lose\s*\d+\s*pounds/i,
      /cut\s*\d+\s*calories/i,
      /\d+ ?% body fat target/i,
      /\bbmi target\b/i,
      /macros? target/i,
      /the optimal weight is/i,
      /\bideal body weight\b/i
    ];
    for (const article of BODY_IMAGE_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("never shames bodies (fat, thin, or otherwise)", () => {
    const banned = [
      /fat-?shaming(?! is)/i, // article can name the concept ("fat-shaming is real") but not enact it
      /you're too fat/i,
      /too thin to be/i,
      /\bfatso\b/i,
      /chunky/i,
      /pleasingly plump/i,
      /\bskinny shaming\b(?! is)/i,
      /a real woman has/i,
      /a real man has/i
    ];
    for (const article of BODY_IMAGE_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("never uses required-positivity / toxic-positivity language", () => {
    const banned = [
      /\blove your body\b/i,
      /every body is beautiful/i,
      /\bgood vibes only\b/i,
      /\bmanifest a better body\b/i
    ];
    for (const article of BODY_IMAGE_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("comparison-and-feeds article cites intervention research with concrete numbers", () => {
    const c = BODY_IMAGE_ARTICLES.find((a) => a.id === "comparison-feeds-and-bodies");
    expect(c).toBeTruthy();
    expect(c!.body.toLowerCase()).toMatch(/algorithm/);
    expect(c!.body.toLowerCase()).toMatch(/50%|cutting/);
    expect(c!.body.toLowerCase()).toMatch(/edit your feed|unfollow/);
    expect(c!.body.toLowerCase()).toMatch(/phone out of the bedroom|bedroom/);
  });

  it("body-neutrality article distinguishes neutrality from required positivity", () => {
    const n = BODY_IMAGE_ARTICLES.find((a) => a.id === "body-neutrality");
    expect(n).toBeTruthy();
    expect(n!.body.toLowerCase()).toMatch(/body neutrality/);
    expect(n!.body.toLowerCase()).toMatch(/required positivity|exhausting|don't have to love/);
    expect(n!.body.toLowerCase()).toMatch(/functional/);
  });

  it("diet-culture article cites the adolescent-dieting ED-risk research", () => {
    const d = BODY_IMAGE_ARTICLES.find((a) => a.id === "diet-culture-named");
    expect(d).toBeTruthy();
    expect(d!.body.toLowerCase()).toMatch(/diet culture/);
    expect(d!.body.toLowerCase()).toMatch(/adolescent dieting|teen.*dieting/);
    expect(d!.body.toLowerCase()).toMatch(/intuitive eating/);
    expect(d!.body.toLowerCase()).toMatch(/predict|risk/);
  });

  it("changing-body article frames puberty changes as required, not failures", () => {
    const c = BODY_IMAGE_ARTICLES.find((a) => a.id === "puberty-and-changing-body");
    expect(c).toBeTruthy();
    expect(c!.body.toLowerCase()).toMatch(/puberty/);
    expect(c!.body.toLowerCase()).toMatch(/required|biologically|adult body/);
    // Should call out gender-related body distress with real resources.
    expect(c!.body.toLowerCase()).toMatch(/trevor project|trans lifeline|gender/);
  });

  it("body-checking article names the self-feeding-loop research finding", () => {
    const b = BODY_IMAGE_ARTICLES.find((a) => a.id === "body-checking-patterns");
    expect(b).toBeTruthy();
    expect(b!.body.toLowerCase()).toMatch(/body checking/);
    expect(b!.body.toLowerCase()).toMatch(/self[- ]feeding|loop|worse body image/);
    expect(b!.body.toLowerCase()).toMatch(/cbt|therapy/);
  });

  it("when-its-an-eating-disorder article enumerates clinical signs + helplines", () => {
    const w = BODY_IMAGE_ARTICLES.find((a) => a.id === "when-its-an-eating-disorder");
    expect(w).toBeTruthy();
    expect(w!.body.toLowerCase()).toMatch(/anorexia/);
    expect(w!.body.toLowerCase()).toMatch(/bulimia/);
    expect(w!.body.toLowerCase()).toMatch(/binge eating/);
    expect(w!.body.toLowerCase()).toMatch(/arfid/);
    // Must explicitly name the "ED at any body size" myth-buster.
    expect(w!.body.toLowerCase()).toMatch(/any body size|atypical anorexia/);
    expect(w!.body).toMatch(/1-?888-?375-?7767/);
  });

  it("compliments-and-comments article gives non-body alternatives", () => {
    const c = BODY_IMAGE_ARTICLES.find((a) => a.id === "compliments-and-comments");
    expect(c).toBeTruthy();
    expect(c!.body.toLowerCase()).toMatch(/energy|vibe|outfit/);
    expect(c!.body.toLowerCase()).toMatch(/topic[- ]shift|prefer not to/);
  });

  it("at least three articles reference NEDA or ANAD or Crisis Text Line", () => {
    const refCount = BODY_IMAGE_ARTICLES.filter((a) =>
      /1-?888-?375-?7767|anad|neda|741741|1-?800-?931-?2237/i.test(a.body)
    ).length;
    expect(refCount).toBeGreaterThanOrEqual(3);
  });

  it("multiple articles direct teens to a counselor / trusted adult", () => {
    const escalations = BODY_IMAGE_ARTICLES.filter((a) =>
      /counselor|trusted adult|therapist|pediatrician/i.test(a.body)
    );
    expect(escalations.length).toBeGreaterThanOrEqual(4);
  });
});

describe("helpline constants", () => {
  it("ANAD helpline matches expected format", () => {
    expect(ANAD_HELPLINE).toMatch(/1-888-375-7767/);
  });
  it("NEDA helpline matches expected format", () => {
    expect(NEDA_HELPLINE).toMatch(/1-800-931-2237/);
  });
  it("Crisis Text Line constant is present", () => {
    expect(CRISIS_TEXT.toLowerCase()).toMatch(/home|741741/);
  });
});

describe("BODY_IMAGE_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(BODY_IMAGE_CATEGORY_LABEL.comparison_and_feeds).toBeTruthy();
    expect(BODY_IMAGE_CATEGORY_LABEL.body_acceptance).toBeTruthy();
    expect(BODY_IMAGE_CATEGORY_LABEL.diet_culture).toBeTruthy();
    expect(BODY_IMAGE_CATEGORY_LABEL.changing_body).toBeTruthy();
    expect(BODY_IMAGE_CATEGORY_LABEL.body_checking_patterns).toBeTruthy();
    expect(BODY_IMAGE_CATEGORY_LABEL.when_its_an_ed).toBeTruthy();
  });
});
