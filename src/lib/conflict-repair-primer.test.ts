import { describe, expect, it } from "vitest";
import { CONFLICT_ARTICLES, CONFLICT_CATEGORY_LABEL } from "./conflict-repair-primer";

describe("CONFLICT_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(CONFLICT_ARTICLES.map((a) => a.category));
    expect(categories.has("hard_conversations")).toBe(true);
    expect(categories.has("the_apology_shape")).toBe(true);
    expect(categories.has("repair_after_harm")).toBe(true);
    expect(categories.has("de_escalation")).toBe(true);
    expect(categories.has("when_to_walk_away")).toBe(true);
    expect(categories.has("online_conflict")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = CONFLICT_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of CONFLICT_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(400);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of CONFLICT_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never moralizes who's 'right' in conflicts", () => {
    const banned = [
      /^.*the right side\b/im,
      /any good person knows/i,
      /no decent person would/i,
      /there's always a winner/i,
      /they were wrong, you were right/i
    ];
    for (const article of CONFLICT_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("never uses 'avoid conflict' or 'stand up for yourself' as universal prescriptions", () => {
    const banned = [
      /^.*avoid conflict at all costs\b/im,
      /^.*never engage in conflict\b/im,
      /^.*always stand up for yourself\b/im,
      /^.*never back down\b/im
    ];
    for (const article of CONFLICT_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("hard-conversations article names pre-work + opening + listening + closing structure", () => {
    const h = CONFLICT_ARTICLES.find((a) => a.id === "having-a-hard-conversation");
    expect(h).toBeTruthy();
    expect(h!.body.toLowerCase()).toMatch(/clear on what you actually want|what you want from this conversation/);
    expect(h!.body.toLowerCase()).toMatch(/we need to talk/);
    expect(h!.body.toLowerCase()).toMatch(/listen|listening/);
    // Should distinguish from abuse situations.
    expect(h!.body.toLowerCase()).toMatch(/abuse|coercion|power imbalance/);
  });

  it("apology-shape article names the 5 components + non-apologies", () => {
    const a = CONFLICT_ARTICLES.find((a) => a.id === "the-apology-shape");
    expect(a).toBeTruthy();
    expect(a!.body.toLowerCase()).toMatch(/specific/);
    expect(a!.body.toLowerCase()).toMatch(/impact/);
    expect(a!.body.toLowerCase()).toMatch(/responsibility/);
    expect(a!.body.toLowerCase()).toMatch(/sorry if|sorry you|sorry but/);
    // Should explicitly name that forgiveness is the receiver's choice, not extracted.
    expect(a!.body.toLowerCase()).toMatch(/can't extract|isn't transactional|not transactional|their choice|forgiveness is for you/);
  });

  it("repair-after-harm article names the 6 components + accepting consequences", () => {
    const r = CONFLICT_ARTICLES.find((a) => a.id === "repair-after-harm");
    expect(r).toBeTruthy();
    expect(r!.body.toLowerCase()).toMatch(/full acknowledgment|full acknowledgement/);
    expect(r!.body.toLowerCase()).toMatch(/changed behavior/);
    expect(r!.body.toLowerCase()).toMatch(/accept(?:ing)? (?:the )?consequences/);
    // Should explicitly warn against self-flagellation as repair.
    expect(r!.body.toLowerCase()).toMatch(/self-flagellation|self flagellation|punish.*yourself/);
    // Should mention that some relationships don't survive.
    expect(r!.body.toLowerCase()).toMatch(/relationship.*doesn't survive|relationship.*ends|may not survive/);
  });

  it("de-escalation article names body-first + repair attempts + physical-violence stop rule", () => {
    const d = CONFLICT_ARTICLES.find((a) => a.id === "de-escalation");
    expect(d).toBeTruthy();
    expect(d!.body.toLowerCase()).toMatch(/slow your body|body controls/);
    expect(d!.body.toLowerCase()).toMatch(/repair attempt/);
    expect(d!.body.toLowerCase()).toMatch(/physical violence/);
    expect(d!.body).toMatch(/1-800-656-4673|RAINN|22522/);
  });

  it("when-to-walk-away article gives specific patterns + how-to-walk-away-well", () => {
    const w = CONFLICT_ARTICLES.find((a) => a.id === "when-to-walk-away");
    expect(w).toBeTruthy();
    expect(w!.body.toLowerCase()).toMatch(/abuse|coercion/);
    expect(w!.body.toLowerCase()).toMatch(/one-sided|always.*initiating|chronically/);
    expect(w!.body.toLowerCase()).toMatch(/don't badmouth|don't.*dramatize/);
    // Should distinguish breakups + provide guidance.
    expect(w!.body.toLowerCase()).toMatch(/breakup/);
  });

  it("online-conflict article names text-vs-in-person + screenshots + voice memos + don't fight in group chats", () => {
    const o = CONFLICT_ARTICLES.find((a) => a.id === "online-conflict");
    expect(o).toBeTruthy();
    expect(o!.body.toLowerCase()).toMatch(/screenshot/);
    expect(o!.body.toLowerCase()).toMatch(/voice memo/);
    expect(o!.body.toLowerCase()).toMatch(/group chat/);
    expect(o!.body.toLowerCase()).toMatch(/move.*off text|in person|on the phone/);
    // Should explicitly mention harassment escalation path.
    expect(o!.body.toLowerCase()).toMatch(/harassment/);
  });

  it("mediation article names school counselor + Psychology Today + Open Path Collective", () => {
    const m = CONFLICT_ARTICLES.find((a) => a.id === "mediation-and-help");
    expect(m).toBeTruthy();
    expect(m!.body.toLowerCase()).toMatch(/school counselor/);
    expect(m!.body.toLowerCase()).toMatch(/psychology today|openpath|open path/);
    expect(m!.body.toLowerCase()).toMatch(/family therapist|family therapy/);
    // Should mention mediation doesn't fix abuse/coercion.
    expect(m!.body.toLowerCase()).toMatch(/mediation.*can't|abuse.*coercion|abuse \/ coercion/);
  });

  it("multiple articles distinguish abuse/coercion situations from repair situations", () => {
    const refs = CONFLICT_ARTICLES.filter((a) =>
      /abuse|coercion|warning[- ]signs|relationships primer/i.test(a.body)
    );
    expect(refs.length).toBeGreaterThanOrEqual(3);
  });

  it("multiple articles direct chronic / stuck conflict patterns to professional help", () => {
    const escalations = CONFLICT_ARTICLES.filter((a) =>
      /counselor|therapist|mediator|professional help|trusted adult/i.test(a.body)
    );
    expect(escalations.length).toBeGreaterThanOrEqual(4);
  });
});

describe("CONFLICT_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(CONFLICT_CATEGORY_LABEL.hard_conversations).toBeTruthy();
    expect(CONFLICT_CATEGORY_LABEL.the_apology_shape).toBeTruthy();
    expect(CONFLICT_CATEGORY_LABEL.repair_after_harm).toBeTruthy();
    expect(CONFLICT_CATEGORY_LABEL.de_escalation).toBeTruthy();
    expect(CONFLICT_CATEGORY_LABEL.when_to_walk_away).toBeTruthy();
    expect(CONFLICT_CATEGORY_LABEL.online_conflict).toBeTruthy();
  });
});
