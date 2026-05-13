import { describe, expect, it } from "vitest";
import {
  CHILDHELP_HOTLINE,
  CRISIS_TEXT_LINE,
  RAINN_HOTLINE,
  TRAUMA_ARTICLES,
  TRAUMA_CATEGORY_LABEL
} from "./trauma-primer";

describe("TRAUMA_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(TRAUMA_ARTICLES.map((a) => a.category));
    expect(categories.has("what_trauma_is")).toBe(true);
    expect(categories.has("stress_response")).toBe(true);
    expect(categories.has("aces_and_childhood")).toBe(true);
    expect(categories.has("after_a_hard_event")).toBe(true);
    expect(categories.has("complex_trauma")).toBe(true);
    expect(categories.has("healing_and_growth")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = TRAUMA_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of TRAUMA_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(400);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of TRAUMA_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never uses toxic-positivity or moralizing framing of trauma", () => {
    // Note: 'what doesn't kill you makes you stronger' is debunked by name in
    // healing-and-growth (quoted in critique context). Filtering the banned
    // matchers to "endorsed" usage avoids false positives on critique.
    const banned = [
      /trauma is your superpower/i,
      /everything happens for a reason/i,
      /\byou'?re lucky.*compared to/i,
      /others have it worse(?! doesn't apply)/i,
      /you (?:just )?need to get over it/i,
      /just (?:think|stay) positive/i,
      /it builds character/i
    ];
    for (const article of TRAUMA_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("never makes positive diagnostic claims about the reader", () => {
    // Articles can legitimately say "they don't mean you have PTSD" (negation /
    // critique). The banned pattern is a positive diagnostic claim about the
    // reader. Detect via a preceding word that signals certainty.
    for (const article of TRAUMA_ARTICLES) {
      const body = article.body.toLowerCase();
      // Affirmative diagnostic claims:
      expect(body, article.id).not.toMatch(/you definitely have ptsd/);
      expect(body, article.id).not.toMatch(/you (?:probably|likely) have ptsd/);
      expect(body, article.id).not.toMatch(/you are traumatized/);
      expect(body, article.id).not.toMatch(/you have c-ptsd/);
      expect(body, article.id).not.toMatch(/you definitely have complex ptsd/);
    }
  });

  it("what-trauma-is article distinguishes event from response and names ACEs framework", () => {
    const w = TRAUMA_ARTICLES.find((a) => a.id === "what-trauma-actually-is");
    expect(w).toBeTruthy();
    expect(w!.body.toLowerCase()).toMatch(/response|not the event itself/);
    expect(w!.body.toLowerCase()).toMatch(/acute|chronic|complex/);
    expect(w!.body.toLowerCase()).toMatch(/aces|adverse childhood/);
    // Should clarify ACEs = correlation, not destiny.
    expect(w!.body.toLowerCase()).toMatch(/not (?:a )?destiny|correlation|elevated risk/);
  });

  it("stress-response article names fight/flight/freeze/fawn plus tonic immobility / dissociation", () => {
    const s = TRAUMA_ARTICLES.find((a) => a.id === "stress-response-physiology");
    expect(s).toBeTruthy();
    expect(s!.body.toLowerCase()).toMatch(/fight/);
    expect(s!.body.toLowerCase()).toMatch(/flight/);
    expect(s!.body.toLowerCase()).toMatch(/freeze/);
    expect(s!.body.toLowerCase()).toMatch(/fawn/);
    expect(s!.body.toLowerCase()).toMatch(/tonic immobility|collapse/);
    expect(s!.body.toLowerCase()).toMatch(/dissociation/);
    // Critical assertion: freezing is not consent.
    expect(s!.body.toLowerCase()).toMatch(/not consent|doesn't mean.*consent|froze.*not/);
  });

  it("ACEs article names protective factors AND the limits of the framework", () => {
    const a = TRAUMA_ARTICLES.find((a) => a.id === "aces-and-childhood-adversity");
    expect(a).toBeTruthy();
    expect(a!.body.toLowerCase()).toMatch(/protective factor/);
    // Accepts "one stable adult", "one caring adult", or both adjectives.
    expect(a!.body.toLowerCase()).toMatch(/one (?:stable|caring)[ ,]+(?:caring )?adult/);
    // Should name the framework's limits.
    expect(a!.body.toLowerCase()).toMatch(/community violence|racism|poverty/);
  });

  it("after-hard-event article distinguishes normal acute response from PTSD warning signs", () => {
    const e = TRAUMA_ARTICLES.find((a) => a.id === "after-a-hard-event");
    expect(e).toBeTruthy();
    expect(e!.body.toLowerCase()).toMatch(/normal|acute stress/);
    expect(e!.body.toLowerCase()).toMatch(/one month|more than a month/);
    expect(e!.body.toLowerCase()).toMatch(/rainn/);
    // Should name early-intervention preventing PTSD.
    expect(e!.body.toLowerCase()).toMatch(/early intervention|prevent.*ptsd|first weeks/);
  });

  it("complex-trauma article enumerates treatment modalities by name", () => {
    const c = TRAUMA_ARTICLES.find((a) => a.id === "complex-trauma-patterns");
    expect(c).toBeTruthy();
    expect(c!.body.toLowerCase()).toMatch(/tf-cbt|trauma-focused/);
    expect(c!.body.toLowerCase()).toMatch(/emdr/);
    expect(c!.body.toLowerCase()).toMatch(/dbt|dialectical/);
    expect(c!.body.toLowerCase()).toMatch(/ifs|internal family systems/);
    expect(c!.body.toLowerCase()).toMatch(/somatic/);
    expect(c!.body.toLowerCase()).toMatch(/childhelp|1-?800-?422-?4453/);
  });

  it("healing-and-growth article frames post-traumatic growth honestly", () => {
    const h = TRAUMA_ARTICLES.find((a) => a.id === "healing-and-growth");
    expect(h).toBeTruthy();
    expect(h!.body.toLowerCase()).toMatch(/post-traumatic growth|ptg/);
    // Should explicitly NOT require gratitude for the trauma.
    expect(h!.body.toLowerCase()).toMatch(/not required|not automatic|not a superpower|don't have to/);
    // Should call out the toxic positivity framing.
    expect(h!.body.toLowerCase()).toMatch(/what doesn't kill you/);
  });

  it("what-trauma-is-not article gives precise alternative vocabulary", () => {
    const w = TRAUMA_ARTICLES.find((a) => a.id === "what-trauma-is-not");
    expect(w).toBeTruthy();
    // Should give better words for hard things that aren't trauma.
    expect(w!.body.toLowerCase()).toMatch(/that hurt|i was upset|i'm struggling/);
    expect(w!.body.toLowerCase()).toMatch(/grief|stress|overwhelmed/);
    // Should explicitly name precision as the value, not gatekeeping.
    expect(w!.body.toLowerCase()).toMatch(/precise|precision|right word/);
  });

  it("multiple articles name childhelp / RAINN / 988 / crisis text line", () => {
    const refs = TRAUMA_ARTICLES.filter((a) =>
      /childhelp|1-?800-?422-?4453|rainn|1-?800-?656-?4673|741741|\b988\b/i.test(a.body)
    );
    expect(refs.length).toBeGreaterThanOrEqual(3);
  });

  it("multiple articles direct to trauma-trained therapist specifically", () => {
    const refs = TRAUMA_ARTICLES.filter((a) =>
      /trauma-(?:trained|focused|informed)|trauma therapist|trauma specialist/i.test(a.body)
    );
    expect(refs.length).toBeGreaterThanOrEqual(3);
  });
});

describe("resource constants", () => {
  it("CHILDHELP_HOTLINE matches expected format", () => {
    expect(CHILDHELP_HOTLINE).toMatch(/1-800-422-4453/);
  });
  it("RAINN_HOTLINE matches expected format", () => {
    expect(RAINN_HOTLINE).toMatch(/1-800-656-4673/);
  });
  it("CRISIS_TEXT_LINE constant is present", () => {
    expect(CRISIS_TEXT_LINE.toLowerCase()).toMatch(/home|741741/);
  });
});

describe("TRAUMA_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(TRAUMA_CATEGORY_LABEL.what_trauma_is).toBeTruthy();
    expect(TRAUMA_CATEGORY_LABEL.stress_response).toBeTruthy();
    expect(TRAUMA_CATEGORY_LABEL.aces_and_childhood).toBeTruthy();
    expect(TRAUMA_CATEGORY_LABEL.after_a_hard_event).toBeTruthy();
    expect(TRAUMA_CATEGORY_LABEL.complex_trauma).toBeTruthy();
    expect(TRAUMA_CATEGORY_LABEL.healing_and_growth).toBeTruthy();
  });
});
