import { describe, expect, it } from "vitest";
import { BOREDOM_REST_ARTICLES, BOREDOM_REST_CATEGORY_LABEL } from "./boredom-rest-primer";

describe("BOREDOM_REST_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(BOREDOM_REST_ARTICLES.map((a) => a.category));
    expect(categories.has("what_boredom_is")).toBe(true);
    expect(categories.has("kinds_of_rest")).toBe(true);
    expect(categories.has("scroll_vs_rest")).toBe(true);
    expect(categories.has("unstructured_time")).toBe(true);
    expect(categories.has("sleep_specifically")).toBe(true);
    expect(categories.has("when_rest_doesnt_work")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = BOREDOM_REST_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of BOREDOM_REST_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(400);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of BOREDOM_REST_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never uses hustle / shame framing about rest", () => {
    const banned = [
      /the grind never sleeps/i,
      /if you're bored, you're boring/i,
      /rest is for the weak/i,
      /sleep when you're dead/i,
      /you're being lazy/i,
      /^.*real winners don't rest\b/im,
      /no excuses/i
    ];
    for (const article of BOREDOM_REST_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("boredom article cites default mode network and creative benefits", () => {
    const b = BOREDOM_REST_ARTICLES.find((a) => a.id === "boredom-is-useful");
    expect(b).toBeTruthy();
    expect(b!.body.toLowerCase()).toMatch(/default mode network|default mode/);
    expect(b!.body.toLowerCase()).toMatch(/mind-wandering|creativity|creative/);
    // Should distinguish from anhedonia depression.
    expect(b!.body.toLowerCase()).toMatch(/anhedonia/);
  });

  it("seven-kinds-of-rest article names Dalton-Smith's 7 distinct kinds", () => {
    const r = BOREDOM_REST_ARTICLES.find((a) => a.id === "seven-kinds-of-rest");
    expect(r).toBeTruthy();
    expect(r!.body.toLowerCase()).toMatch(/dalton-smith/);
    expect(r!.body.toLowerCase()).toMatch(/physical rest/);
    expect(r!.body.toLowerCase()).toMatch(/mental rest/);
    expect(r!.body.toLowerCase()).toMatch(/sensory rest/);
    expect(r!.body.toLowerCase()).toMatch(/emotional rest/);
    expect(r!.body.toLowerCase()).toMatch(/social rest/);
    expect(r!.body.toLowerCase()).toMatch(/creative rest/);
    expect(r!.body.toLowerCase()).toMatch(/spiritual rest/);
  });

  it("scroll-vs-rest article cites specific brain mechanisms + post-state check", () => {
    const s = BOREDOM_REST_ARTICLES.find((a) => a.id === "scrolling-is-not-rest");
    expect(s).toBeTruthy();
    expect(s!.body.toLowerCase()).toMatch(/reward circuit|variable-reward|task-switch/);
    expect(s!.body.toLowerCase()).toMatch(/default mode/);
    // Should give specific real-rest alternatives.
    expect(s!.body.toLowerCase()).toMatch(/walking|lying down|nature/);
  });

  it("unstructured-time article names self-knowledge + creativity + identity formation as outputs", () => {
    const u = BOREDOM_REST_ARTICLES.find((a) => a.id === "value-of-unstructured-time");
    expect(u).toBeTruthy();
    expect(u!.body.toLowerCase()).toMatch(/self-knowledge|creativity|identity formation/);
    // Should give a concrete practice prescription.
    expect(u!.body.toLowerCase()).toMatch(/one hour per week|1 hour|phone in another room/);
  });

  it("sleep article cites teen 8-10 hour requirement + phone-out-of-bedroom intervention", () => {
    const s = BOREDOM_REST_ARTICLES.find((a) => a.id === "sleep-is-load-bearing");
    expect(s).toBeTruthy();
    expect(s!.body.toLowerCase()).toMatch(/8-10 hours|8 to 10 hours/);
    expect(s!.body.toLowerCase()).toMatch(/phone out of the bedroom|phone out|alarm clock/);
    // Should name CBT-I as the evidence-based insomnia treatment.
    expect(s!.body.toLowerCase()).toMatch(/cbt-i|cognitive behavioral therapy for insomnia/);
    // Should mention sleep apnea / pediatrician screen.
    expect(s!.body.toLowerCase()).toMatch(/sleep apnea/);
  });

  it("when-rest-doesnt-work article enumerates specific identifiable causes", () => {
    const w = BOREDOM_REST_ARTICLES.find((a) => a.id === "when-rest-doesnt-work");
    expect(w).toBeTruthy();
    expect(w!.body.toLowerCase()).toMatch(/depression/);
    expect(w!.body.toLowerCase()).toMatch(/anxiety/);
    expect(w!.body.toLowerCase()).toMatch(/iron deficiency|anemia/);
    expect(w!.body.toLowerCase()).toMatch(/thyroid/);
    expect(w!.body.toLowerCase()).toMatch(/sleep apnea/);
    expect(w!.body.toLowerCase()).toMatch(/long covid|post-viral/);
    expect(w!.body.toLowerCase()).toMatch(/pediatrician/);
    // Should explicitly warn against pushing through.
    expect(w!.body.toLowerCase()).toMatch(/pushing through|powering through|push through/);
  });

  it("rest-as-skill article enumerates specific learnable skills", () => {
    const r = BOREDOM_REST_ARTICLES.find((a) => a.id === "rest-as-a-skill");
    expect(r).toBeTruthy();
    expect(r!.body.toLowerCase()).toMatch(/skill/);
    expect(r!.body.toLowerCase()).toMatch(/single-tasking|saying no|stopping/);
    // Should reframe rest as infrastructure not selfishness.
    expect(r!.body.toLowerCase()).toMatch(/not selfish|infrastructure/);
  });

  it("multiple articles direct chronic exhaustion to a pediatrician or counselor", () => {
    const escalations = BOREDOM_REST_ARTICLES.filter((a) =>
      /pediatrician|counselor|therapist/i.test(a.body)
    );
    expect(escalations.length).toBeGreaterThanOrEqual(3);
  });
});

describe("BOREDOM_REST_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(BOREDOM_REST_CATEGORY_LABEL.what_boredom_is).toBeTruthy();
    expect(BOREDOM_REST_CATEGORY_LABEL.kinds_of_rest).toBeTruthy();
    expect(BOREDOM_REST_CATEGORY_LABEL.scroll_vs_rest).toBeTruthy();
    expect(BOREDOM_REST_CATEGORY_LABEL.unstructured_time).toBeTruthy();
    expect(BOREDOM_REST_CATEGORY_LABEL.sleep_specifically).toBeTruthy();
    expect(BOREDOM_REST_CATEGORY_LABEL.when_rest_doesnt_work).toBeTruthy();
  });
});
