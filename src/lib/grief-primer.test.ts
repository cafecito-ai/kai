import { describe, expect, it } from "vitest";
import { GRIEF_ARTICLES, GRIEF_CATEGORY_LABEL } from "./grief-primer";

describe("GRIEF_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(GRIEF_ARTICLES.map((a) => a.category));
    expect(categories.has("what_grief_is")).toBe(true);
    expect(categories.has("death_of_loved_one")).toBe(true);
    expect(categories.has("non_death_loss")).toBe(true);
    expect(categories.has("anticipatory_grief")).toBe(true);
    expect(categories.has("complicated_grief")).toBe(true);
    expect(categories.has("what_helps")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = GRIEF_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of GRIEF_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(400);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of GRIEF_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never tells grievers to 'just be strong' / 'move on' / 'get over it'", () => {
    // Articles can reference these phrases as things NOT to say (in critique),
    // but should not prescribe them as advice.
    const banned = [
      /^\s*just be strong\b/im,
      /^\s*you need to move on\b/im,
      /you should be over it by now/i,
      /stop dwelling/i,
      /everyone dies, get over it/i,
      /it's been long enough/i,
      /stop grieving/i
    ];
    for (const article of GRIEF_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("what-grief-is article debunks the 5-stages framing", () => {
    const w = GRIEF_ARTICLES.find((a) => a.id === "what-grief-actually-is");
    expect(w).toBeTruthy();
    expect(w!.body.toLowerCase()).toMatch(/kübler-ross|kubler-ross|five stages|5 stages|stages of grief/);
    // Should explicitly say stages weren't meant for grievers / don't apply linearly.
    expect(w!.body.toLowerCase()).toMatch(/never meant|misapplied|don't move in stages/);
  });

  it("what-grief-is article names closure as a myth", () => {
    const w = GRIEF_ARTICLES.find((a) => a.id === "what-grief-actually-is");
    expect(w).toBeTruthy();
    expect(w!.body.toLowerCase()).toMatch(/closure is a myth|no closure|closure.*invention/);
  });

  it("death-of-loved-one article names common unhelpful phrases AND helpful ones", () => {
    const d = GRIEF_ARTICLES.find((a) => a.id === "death-of-a-loved-one");
    expect(d).toBeTruthy();
    expect(d!.body.toLowerCase()).toMatch(/everything happens for a reason/);
    expect(d!.body.toLowerCase()).toMatch(/say(?:ing)? the name/);
    // Should name the school counselor pathway.
    expect(d!.body.toLowerCase()).toMatch(/school counselor/);
  });

  it("non-death-loss article legitimizes breakups + friend group loss + pets", () => {
    const n = GRIEF_ARTICLES.find((a) => a.id === "non-death-loss");
    expect(n).toBeTruthy();
    expect(n!.body.toLowerCase()).toMatch(/breakup/);
    expect(n!.body.toLowerCase()).toMatch(/pet/);
    expect(n!.body.toLowerCase()).toMatch(/real grief/);
  });

  it("anticipatory-grief article names hospice + Camp Erin grief-camp resource", () => {
    const a = GRIEF_ARTICLES.find((a) => a.id === "anticipatory-grief");
    expect(a).toBeTruthy();
    expect(a!.body.toLowerCase()).toMatch(/anticipatory grief/);
    expect(a!.body.toLowerCase()).toMatch(/hospice/);
    expect(a!.body.toLowerCase()).toMatch(/camp erin|grief camp/);
  });

  it("complicated-grief article names prolonged-grief-disorder clinical pattern", () => {
    const c = GRIEF_ARTICLES.find((a) => a.id === "complicated-grief");
    expect(c).toBeTruthy();
    expect(c!.body.toLowerCase()).toMatch(/prolonged grief|complicated grief/);
    expect(c!.body.toLowerCase()).toMatch(/cgt|pgdt|complicated grief treatment|prolonged grief disorder/);
    // Suicide-loss resource named.
    expect(c!.body.toLowerCase()).toMatch(/afsp|alliance of hope/);
    // Crisis path named.
    expect(c!.body).toMatch(/988/);
  });

  it("what-helps article distinguishes evidence-supported from common-but-unhelpful", () => {
    const h = GRIEF_ARTICLES.find((a) => a.id === "what-helps-and-what-doesnt");
    expect(h).toBeTruthy();
    expect(h!.body.toLowerCase()).toMatch(/continuing bonds/);
    expect(h!.body.toLowerCase()).toMatch(/closure/);
    expect(h!.body.toLowerCase()).toMatch(/stay busy|stay strong/);
    // Should mention writing / journaling.
    expect(h!.body.toLowerCase()).toMatch(/writing|journal/);
  });

  it("supporting-friend article names specific offers vs vague 'let me know'", () => {
    const s = GRIEF_ARTICLES.find((a) => a.id === "supporting-a-grieving-friend");
    expect(s).toBeTruthy();
    expect(s!.body.toLowerCase()).toMatch(/let me know if you need anything/);
    expect(s!.body.toLowerCase()).toMatch(/specific offers/);
    // Should name the say-their-name principle.
    expect(s!.body.toLowerCase()).toMatch(/say their|say the deceased|use the name|say the name/);
    // Should call out the crisis-signal escalation path.
    expect(s!.body).toMatch(/988/);
  });

  it("multiple articles name suicide-loss specifically with resources", () => {
    const refs = GRIEF_ARTICLES.filter((a) =>
      /afsp|suicide loss|alliance of hope/i.test(a.body)
    );
    expect(refs.length).toBeGreaterThanOrEqual(2);
  });

  it("multiple articles direct teens to a counselor or therapist", () => {
    const escalations = GRIEF_ARTICLES.filter((a) =>
      /counselor|therapist|therapy/i.test(a.body)
    );
    expect(escalations.length).toBeGreaterThanOrEqual(4);
  });

  it("multiple articles name 988 (Crisis Lifeline) for grief + dark thoughts", () => {
    const refs = GRIEF_ARTICLES.filter((a) => /988|crisis/i.test(a.body));
    expect(refs.length).toBeGreaterThanOrEqual(4);
  });
});

describe("GRIEF_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(GRIEF_CATEGORY_LABEL.what_grief_is).toBeTruthy();
    expect(GRIEF_CATEGORY_LABEL.death_of_loved_one).toBeTruthy();
    expect(GRIEF_CATEGORY_LABEL.non_death_loss).toBeTruthy();
    expect(GRIEF_CATEGORY_LABEL.anticipatory_grief).toBeTruthy();
    expect(GRIEF_CATEGORY_LABEL.complicated_grief).toBeTruthy();
    expect(GRIEF_CATEGORY_LABEL.what_helps).toBeTruthy();
  });
});
