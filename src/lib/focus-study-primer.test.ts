import { describe, expect, it } from "vitest";
import { FOCUS_ARTICLES, FOCUS_CATEGORY_LABEL } from "./focus-study-primer";

describe("FOCUS_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(FOCUS_ARTICLES.map((a) => a.category));
    expect(categories.has("myth_of_multitasking")).toBe(true);
    expect(categories.has("time_blocks")).toBe(true);
    expect(categories.has("environment")).toBe(true);
    expect(categories.has("retrieval_practice")).toBe(true);
    expect(categories.has("spaced_repetition")).toBe(true);
    expect(categories.has("when_stuck")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = FOCUS_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of FOCUS_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(300);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of FOCUS_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never uses hustle / grindset / shame language", () => {
    const banned = [
      /\bgrindset\b/i,
      /no excuses/i,
      /rise and grind/i,
      /sleep when you're dead/i,
      /you're just lazy/i,
      /just get it done/i,
      /you have the same 24 hours/i,
      /\b10x\b/i
    ];
    for (const article of FOCUS_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("never makes diagnostic claims about ADHD / executive dysfunction", () => {
    for (const article of FOCUS_ARTICLES) {
      const body = article.body.toLowerCase();
      expect(body, article.id).not.toMatch(/you have adhd/);
      expect(body, article.id).not.toMatch(/you have executive dysfunction/);
      expect(body, article.id).not.toMatch(/you have a learning disability/);
    }
  });

  it("multitasking article names task-switching cost with research grounding", () => {
    const m = FOCUS_ARTICLES.find((a) => a.id === "multitasking-myth");
    expect(m).toBeTruthy();
    expect(m!.body.toLowerCase()).toMatch(/task[- ]switch/);
    expect(m!.body.toLowerCase()).toMatch(/20-40%|20[- ]?to[- ]?40/);
    expect(m!.body.toLowerCase()).toMatch(/another room|out of the room/);
  });

  it("time-blocks article presents pomodoro as a starting point with variants", () => {
    const tb = FOCUS_ARTICLES.find((a) => a.id === "time-blocks");
    expect(tb).toBeTruthy();
    expect(tb!.body.toLowerCase()).toMatch(/pomodoro/);
    expect(tb!.body.toLowerCase()).toMatch(/starting point|not a mandate/);
    expect(tb!.body.toLowerCase()).toMatch(/different brains|neurodivergent/);
  });

  it("retrieval-practice article calls out re-reading as the trap", () => {
    const r = FOCUS_ARTICLES.find((a) => a.id === "retrieval-practice");
    expect(r).toBeTruthy();
    expect(r!.body.toLowerCase()).toMatch(/re-?reading/);
    expect(r!.body.toLowerCase()).toMatch(/familiarity|familiar/);
    expect(r!.body.toLowerCase()).toMatch(/highlight/);
  });

  it("spaced-repetition article quantifies the spacing effect", () => {
    const s = FOCUS_ARTICLES.find((a) => a.id === "spaced-repetition");
    expect(s).toBeTruthy();
    expect(s!.body.toLowerCase()).toMatch(/spacing effect|spaced/);
    expect(s!.body.toLowerCase()).toMatch(/anki|spaced[- ]repetition/);
    // Should name the deep-first-session caveat — not just a magic bullet.
    expect(s!.body.toLowerCase()).toMatch(/caveat|less well|understanding/);
  });

  it("environment article acknowledges teens may not have ideal conditions", () => {
    const e = FOCUS_ARTICLES.find((a) => a.id === "study-environment");
    expect(e).toBeTruthy();
    expect(e!.body.toLowerCase()).toMatch(/library|coffee shop|common space/);
    expect(e!.body.toLowerCase()).toMatch(/parent|counselor|trusted adult/);
  });

  it("when-stuck article names sleep / food / hydration before attributing to character", () => {
    const w = FOCUS_ARTICLES.find((a) => a.id === "when-focus-is-broken");
    expect(w).toBeTruthy();
    expect(w!.body.toLowerCase()).toMatch(/sleep/);
    expect(w!.body.toLowerCase()).toMatch(/hungry|fuel|food/);
    expect(w!.body.toLowerCase()).toMatch(/hydrat/);
    // Should point to learning evaluation as a real option, not a verdict.
    expect(w!.body.toLowerCase()).toMatch(/learning evaluation|counselor/);
    // Should explicitly warn against self-medicating.
    expect(w!.body.toLowerCase()).toMatch(/study drug|stimulant|self-medicat/);
  });

  it("deep-vs-shallow article gives concrete teen examples on both sides", () => {
    const d = FOCUS_ARTICLES.find((a) => a.id === "deep-vs-shallow-work");
    expect(d).toBeTruthy();
    expect(d!.body.toLowerCase()).toMatch(/essay/);
    expect(d!.body.toLowerCase()).toMatch(/shallow/);
    expect(d!.body.toLowerCase()).toMatch(/peak hours|peak/);
  });

  it("multiple articles direct to counselor / trusted adult / learning evaluation for chronic patterns", () => {
    const escalations = FOCUS_ARTICLES.filter((a) =>
      /counselor|trusted adult|learning evaluation|pediatrician/i.test(a.body)
    );
    expect(escalations.length).toBeGreaterThanOrEqual(2);
  });
});

describe("FOCUS_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(FOCUS_CATEGORY_LABEL.myth_of_multitasking).toBeTruthy();
    expect(FOCUS_CATEGORY_LABEL.time_blocks).toBeTruthy();
    expect(FOCUS_CATEGORY_LABEL.environment).toBeTruthy();
    expect(FOCUS_CATEGORY_LABEL.retrieval_practice).toBeTruthy();
    expect(FOCUS_CATEGORY_LABEL.spaced_repetition).toBeTruthy();
    expect(FOCUS_CATEGORY_LABEL.when_stuck).toBeTruthy();
  });
});
