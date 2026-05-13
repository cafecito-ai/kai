import { describe, expect, it } from "vitest";
import { DECISION_ARTICLES, DECISION_CATEGORY_LABEL } from "./decision-primer";

describe("DECISION_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(DECISION_ARTICLES.map((a) => a.category));
    expect(categories.has("decision_frames")).toBe(true);
    expect(categories.has("biases_to_know")).toBe(true);
    expect(categories.has("reversibility")).toBe(true);
    expect(categories.has("when_to_defer")).toBe(true);
    expect(categories.has("regret_and_recovery")).toBe(true);
    expect(categories.has("decision_with_others")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = DECISION_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of DECISION_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(400);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of DECISION_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never prescribes 'trust your gut' / 'follow your heart' as universal advice", () => {
    // Articles can engage with these phrases (the kinds-of-decisions piece
    // explicitly addresses 'trust your gut' as a caveat). Banned set is
    // endorsed prescriptions.
    const banned = [
      /^\s*always trust your gut\b/im,
      /^\s*just follow your heart\b/im,
      /your gut is always right/i,
      /your heart knows the answer/i,
      /the universe will guide you/i,
      /everything happens for a reason/i
    ];
    for (const article of DECISION_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("never moralizes specific choices", () => {
    const banned = [
      /you should always (?:choose|pick|go with)/i,
      /the right answer is always/i,
      /any decent person would/i,
      /no good person would/i
    ];
    for (const article of DECISION_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("kinds-of-decisions article names the three frames + critiques 'trust your gut' nuance", () => {
    const k = DECISION_ARTICLES.find((a) => a.id === "kinds-of-decisions");
    expect(k).toBeTruthy();
    expect(k!.body.toLowerCase()).toMatch(/reversible/);
    expect(k!.body.toLowerCase()).toMatch(/value-driven|fact-driven/);
    expect(k!.body.toLowerCase()).toMatch(/urgent|patient/);
    // Should engage with the gut question honestly.
    expect(k!.body.toLowerCase()).toMatch(/gut/);
  });

  it("biases article names present bias / social proof / sunk cost / confirmation bias", () => {
    const b = DECISION_ARTICLES.find((a) => a.id === "biases-teens-should-know");
    expect(b).toBeTruthy();
    expect(b!.body.toLowerCase()).toMatch(/present bias|hyperbolic discounting/);
    expect(b!.body.toLowerCase()).toMatch(/social proof|conformity/);
    expect(b!.body.toLowerCase()).toMatch(/sunk cost/);
    expect(b!.body.toLowerCase()).toMatch(/confirmation bias/);
    expect(b!.body.toLowerCase()).toMatch(/loss aversion/);
    expect(b!.body.toLowerCase()).toMatch(/affect heuristic|availability/);
  });

  it("reversibility article names the irreversible-share-image example explicitly", () => {
    const r = DECISION_ARTICLES.find((a) => a.id === "reversibility-as-key-frame");
    expect(r).toBeTruthy();
    expect(r!.body.toLowerCase()).toMatch(/reversible/);
    expect(r!.body.toLowerCase()).toMatch(/digital permanence|sharing an explicit image|nude/);
    // Should note teen brain under-weights long-term consequences.
    expect(r!.body.toLowerCase()).toMatch(/long-term consequences|present bias/);
  });

  it("when-to-defer article gives reasons to defer AND reasons not to", () => {
    const d = DECISION_ARTICLES.find((a) => a.id === "when-to-defer");
    expect(d).toBeTruthy();
    expect(d!.body.toLowerCase()).toMatch(/reasons to defer/);
    expect(d!.body.toLowerCase()).toMatch(/reasons not to defer|reasons not to/);
    // Should name avoidance as a fake defer.
    expect(d!.body.toLowerCase()).toMatch(/avoiding|avoidance/);
    // Should reference the 10/10/10 framing.
    expect(d!.body.toLowerCase()).toMatch(/10\/10\/10/);
  });

  it("regret-and-recovery article separates decision quality from outcome", () => {
    const r = DECISION_ARTICLES.find((a) => a.id === "regret-and-recovery");
    expect(r).toBeTruthy();
    expect(r!.body.toLowerCase()).toMatch(/separate the decision from the outcome|good decision.*bad outcome|bad decision.*good outcome/);
    expect(r!.body.toLowerCase()).toMatch(/specific lesson/);
    // Should direct chronic rumination to a counselor.
    expect(r!.body.toLowerCase()).toMatch(/counselor|therapist/);
    expect(r!.body.toLowerCase()).toMatch(/rumination|ocd/);
  });

  it("deciding-with-others article gives WHO-to-ask guidance + warns against social-media polls", () => {
    const d = DECISION_ARTICLES.find((a) => a.id === "deciding-with-others");
    expect(d).toBeTruthy();
    expect(d!.body.toLowerCase()).toMatch(/who to consult|whom to ask/);
    expect(d!.body.toLowerCase()).toMatch(/skin in the game|stakes in the outcome/);
    expect(d!.body.toLowerCase()).toMatch(/social media polls/);
  });

  it("decision-paralysis article distinguishes paralysis from anxiety + chronic patterns", () => {
    const p = DECISION_ARTICLES.find((a) => a.id === "decision-paralysis");
    expect(p).toBeTruthy();
    expect(p!.body.toLowerCase()).toMatch(/paralysis/);
    expect(p!.body.toLowerCase()).toMatch(/anxiety/);
    // Should direct chronic paralysis to a counselor.
    expect(p!.body.toLowerCase()).toMatch(/counselor|therapist/);
    // Should reference ADHD / OCD / depression as possible underlying patterns.
    expect(p!.body.toLowerCase()).toMatch(/adhd|ocd|depression/);
  });

  it("multiple articles direct chronic patterns to a counselor / therapist", () => {
    const refs = DECISION_ARTICLES.filter((a) =>
      /counselor|therapist|professional/i.test(a.body)
    );
    expect(refs.length).toBeGreaterThanOrEqual(3);
  });
});

describe("DECISION_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(DECISION_CATEGORY_LABEL.decision_frames).toBeTruthy();
    expect(DECISION_CATEGORY_LABEL.biases_to_know).toBeTruthy();
    expect(DECISION_CATEGORY_LABEL.reversibility).toBeTruthy();
    expect(DECISION_CATEGORY_LABEL.when_to_defer).toBeTruthy();
    expect(DECISION_CATEGORY_LABEL.regret_and_recovery).toBeTruthy();
    expect(DECISION_CATEGORY_LABEL.decision_with_others).toBeTruthy();
  });
});
