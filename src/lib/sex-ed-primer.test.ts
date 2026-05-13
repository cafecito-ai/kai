import { describe, expect, it } from "vitest";
import {
  BEDSIDER_URL,
  PLANNED_PARENTHOOD_HOTLINE,
  RAINN_HOTLINE_SEX_ED,
  SCARLETEEN_URL,
  SEX_ED_ARTICLES,
  SEX_ED_CATEGORY_LABEL
} from "./sex-ed-primer";

describe("SEX_ED_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(SEX_ED_ARTICLES.map((a) => a.category));
    expect(categories.has("bodies_and_puberty")).toBe(true);
    expect(categories.has("consent_foundations")).toBe(true);
    expect(categories.has("contraception_basics")).toBe(true);
    expect(categories.has("sti_awareness")).toBe(true);
    expect(categories.has("pleasure_and_communication")).toBe(true);
    expect(categories.has("resources_and_help")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = SEX_ED_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of SEX_ED_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(400);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of SEX_ED_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never moralizes about teen sexual choices", () => {
    const banned = [
      /you shouldn't have sex/i,
      /sex is dirty/i,
      /save yourself for marriage/i,
      /real men/i,
      /good girls don't/i,
      /losing your purity/i,
      /lose your virginity/i, // outdated framing; "first time" is the more accurate framing
      /\bvirginity is\b/i,
      /sex outside marriage is wrong/i
    ];
    for (const article of SEX_ED_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("never uses heteronormative or cisnormative framing as default", () => {
    // Articles can describe statistical patterns (e.g., heterosexual orgasm gap) but
    // should not assume the reader is hetero or cis. Articles should explicitly
    // include LGBTQ+ teens or use inclusive anatomical language.
    const banned = [
      /everyone is straight/i,
      /\bnormal people\b/i,
      /^.*biological sex is binary\b/im,
      /^.*there are only two genders\b/im
    ];
    for (const article of SEX_ED_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("bodies-vary article names normal anatomical variation + intersex + gender-diverse resources", () => {
    const b = SEX_ED_ARTICLES.find((a) => a.id === "bodies-vary-normally");
    expect(b).toBeTruthy();
    expect(b!.body.toLowerCase()).toMatch(/vary|variation/);
    // Should name intersex + interACT.
    expect(b!.body.toLowerCase()).toMatch(/intersex/);
    expect(b!.body.toLowerCase()).toMatch(/interact/);
    // Should name gender-distressed teens with appropriate resources.
    expect(b!.body.toLowerCase()).toMatch(/transgender|gender|wpath/);
    expect(b!.body.toLowerCase()).toMatch(/trevor project|trans lifeline/);
  });

  it("consent article enumerates the 5 components (voluntary / informed / ongoing / capacity / affirmative)", () => {
    const c = SEX_ED_ARTICLES.find((a) => a.id === "consent-essentials");
    expect(c).toBeTruthy();
    expect(c!.body.toLowerCase()).toMatch(/voluntary/);
    expect(c!.body.toLowerCase()).toMatch(/informed/);
    expect(c!.body.toLowerCase()).toMatch(/ongoing/);
    expect(c!.body.toLowerCase()).toMatch(/capacity/);
    expect(c!.body.toLowerCase()).toMatch(/affirmative/);
    // Intoxicated consent specifically addressed.
    expect(c!.body.toLowerCase()).toMatch(/intoxicat|drunk|high/);
    // RAINN referenced for survivors.
    expect(c!.body.toLowerCase()).toMatch(/rainn/);
    // 'Stealthing' named.
    expect(c!.body.toLowerCase()).toMatch(/stealthing/);
  });

  it("contraception article names LARC + effectiveness + Planned Parenthood + Bedsider", () => {
    const co = SEX_ED_ARTICLES.find((a) => a.id === "contraception-overview");
    expect(co).toBeTruthy();
    expect(co!.body.toLowerCase()).toMatch(/larc|iud|implant/);
    expect(co!.body.toLowerCase()).toMatch(/typical use|perfect use/);
    expect(co!.body.toLowerCase()).toMatch(/planned parenthood/);
    expect(co!.body.toLowerCase()).toMatch(/bedsider/);
    // Emergency contraception named.
    expect(co!.body.toLowerCase()).toMatch(/plan b|emergency contraception|ella/);
    // Distinguishes pregnancy prevention from STI prevention.
    expect(co!.body.toLowerCase()).toMatch(/condoms.*sti|sti.*condom/);
  });

  it("STI article names major STIs + testing locations + non-shame framing", () => {
    const s = SEX_ED_ARTICLES.find((a) => a.id === "sti-awareness-basics");
    expect(s).toBeTruthy();
    expect(s!.body.toLowerCase()).toMatch(/chlamydia/);
    expect(s!.body.toLowerCase()).toMatch(/gonorrhea/);
    expect(s!.body.toLowerCase()).toMatch(/hpv/);
    expect(s!.body.toLowerCase()).toMatch(/herpes/);
    expect(s!.body.toLowerCase()).toMatch(/hiv/);
    expect(s!.body.toLowerCase()).toMatch(/prep/);
    expect(s!.body.toLowerCase()).toMatch(/asymptomatic/);
    expect(s!.body.toLowerCase()).toMatch(/title x|planned parenthood/);
    // Should explicitly destigmatize.
    expect(s!.body.toLowerCase()).toMatch(/stigma.*worse|not (?:a )?punishment|not your fault/);
  });

  it("pleasure-and-communication article centers communication + names orgasm gap honestly", () => {
    const p = SEX_ED_ARTICLES.find((a) => a.id === "pleasure-and-communication");
    expect(p).toBeTruthy();
    expect(p!.body.toLowerCase()).toMatch(/communication|talking/);
    expect(p!.body.toLowerCase()).toMatch(/clitoris/);
    expect(p!.body.toLowerCase()).toMatch(/orgasm gap/);
    // Should call out porn as bad sex ed.
    expect(p!.body.toLowerCase()).toMatch(/porn/);
    // Should affirm 'I'm not ready' as a valid choice.
    expect(p!.body.toLowerCase()).toMatch(/i'm not ready|not yet|don't want/);
    // Should name asexuality.
    expect(p!.body.toLowerCase()).toMatch(/asexual|aven/);
  });

  it("resources article names Scarleteen + Planned Parenthood + Bedsider + identity-specific orgs", () => {
    const r = SEX_ED_ARTICLES.find((a) => a.id === "where-to-get-real-answers");
    expect(r).toBeTruthy();
    expect(r!.body.toLowerCase()).toMatch(/scarleteen/);
    expect(r!.body.toLowerCase()).toMatch(/planned parenthood/);
    expect(r!.body.toLowerCase()).toMatch(/bedsider/);
    // LGBTQ+ + asexual resources.
    expect(r!.body.toLowerCase()).toMatch(/trevor project|trans lifeline|q chat/);
    expect(r!.body.toLowerCase()).toMatch(/aven|asexual/);
    // Abortion access (post-Dobbs important).
    expect(r!.body.toLowerCase()).toMatch(/abortionfinder|abortion/);
    // Should warn against unreliable sources.
    expect(r!.body.toLowerCase()).toMatch(/abstinence-only|porn|tiktok/);
  });

  it("multiple articles reference Scarleteen / Planned Parenthood / Bedsider", () => {
    const refs = SEX_ED_ARTICLES.filter((a) =>
      /scarleteen|planned parenthood|bedsider/i.test(a.body)
    );
    expect(refs.length).toBeGreaterThanOrEqual(4);
  });

  it("multiple articles direct teens to a clinician / pediatrician / school nurse", () => {
    const escalations = SEX_ED_ARTICLES.filter((a) =>
      /pediatrician|clinician|school nurse|doctor|adolescent medicine/i.test(a.body)
    );
    expect(escalations.length).toBeGreaterThanOrEqual(4);
  });
});

describe("resource constants", () => {
  it("PLANNED_PARENTHOOD_HOTLINE matches expected format", () => {
    expect(PLANNED_PARENTHOOD_HOTLINE).toMatch(/1-800-230-PLAN/);
  });
  it("SCARLETEEN_URL is the official domain", () => {
    expect(SCARLETEEN_URL).toMatch(/scarleteen\.com/);
  });
  it("BEDSIDER_URL is the official domain", () => {
    expect(BEDSIDER_URL).toMatch(/bedsider\.org/);
  });
  it("RAINN_HOTLINE_SEX_ED matches expected format", () => {
    expect(RAINN_HOTLINE_SEX_ED).toMatch(/1-800-656-4673/);
  });
});

describe("SEX_ED_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(SEX_ED_CATEGORY_LABEL.bodies_and_puberty).toBeTruthy();
    expect(SEX_ED_CATEGORY_LABEL.consent_foundations).toBeTruthy();
    expect(SEX_ED_CATEGORY_LABEL.contraception_basics).toBeTruthy();
    expect(SEX_ED_CATEGORY_LABEL.sti_awareness).toBeTruthy();
    expect(SEX_ED_CATEGORY_LABEL.pleasure_and_communication).toBeTruthy();
    expect(SEX_ED_CATEGORY_LABEL.resources_and_help).toBeTruthy();
  });
});
