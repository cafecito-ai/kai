import { describe, expect, it } from "vitest";
import {
  IC3_URL,
  NCMEC_CYBERTIPLINE,
  ONLINE_SAFETY_ARTICLES,
  ONLINE_SAFETY_CATEGORY_LABEL,
  STOPNCII_URL,
  TAKE_IT_DOWN_URL
} from "./online-safety-primer";

describe("ONLINE_SAFETY_ARTICLES", () => {
  it("has at least one article per category", () => {
    const categories = new Set(ONLINE_SAFETY_ARTICLES.map((a) => a.category));
    expect(categories.has("passwords_and_accounts")).toBe(true);
    expect(categories.has("phishing_and_scams")).toBe(true);
    expect(categories.has("sextortion")).toBe(true);
    expect(categories.has("public_vs_private")).toBe(true);
    expect(categories.has("ai_and_deepfakes")).toBe(true);
    expect(categories.has("consent_and_messaging")).toBe(true);
  });

  it("every article has a unique id", () => {
    const ids = ONLINE_SAFETY_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every article has title + summary + body + takeaways", () => {
    for (const article of ONLINE_SAFETY_ARTICLES) {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.summary.trim().length, article.id).toBeGreaterThan(0);
      expect(article.body.trim().length, article.id).toBeGreaterThan(400);
      expect(article.takeaways.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("read time is 1-10 minutes", () => {
    for (const article of ONLINE_SAFETY_ARTICLES) {
      expect(article.readMinutes, article.id).toBeGreaterThanOrEqual(1);
      expect(article.readMinutes, article.id).toBeLessThanOrEqual(10);
    }
  });

  it("never blames victims of sextortion or NCII", () => {
    const banned = [
      /shouldn't have sent/i,
      /you brought this on yourself/i,
      /your fault for sending/i,
      /serves you right/i,
      /asking for it/i,
      /should have known better than to/i
    ];
    for (const article of ONLINE_SAFETY_ARTICLES) {
      const blob = `${article.title} ${article.summary} ${article.body} ${article.takeaways.join(" ")}`;
      for (const pattern of banned) {
        expect(blob, article.id).not.toMatch(pattern);
      }
    }
  });

  it("never uses fear-only abstinence framing as the primary message", () => {
    // Harm reduction stance: the primer doesn't lead with 'just don't' as
    // the only advice. Some articles can mention abstinence as one option,
    // but the consent_and_messaging article must explicitly engage with
    // the reality that intimate messaging happens.
    const cm = ONLINE_SAFETY_ARTICLES.find((a) => a.id === "consent-and-messaging");
    expect(cm).toBeTruthy();
    expect(cm!.body.toLowerCase()).toMatch(/harm[- ]reduction/);
    expect(cm!.body.toLowerCase()).toMatch(/fear[- ]based|absent/);
  });

  it("sextortion article explicitly states it's not the victim's fault", () => {
    const s = ONLINE_SAFETY_ARTICLES.find((a) => a.id === "sextortion-reality");
    expect(s).toBeTruthy();
    expect(s!.body.toLowerCase()).toMatch(/not your fault/);
    expect(s!.body.toLowerCase()).toMatch(/cybertipline|ncmec/);
    expect(s!.body.toLowerCase()).toMatch(/take it down/);
    expect(s!.body.toLowerCase()).toMatch(/not prosecuted|are victims/);
    // Must name the suicide-risk escalation path.
    expect(s!.body.toLowerCase()).toMatch(/988|911/);
  });

  it("ai-deepfakes article names AI-generated CSAM coverage and victim resources", () => {
    const ai = ONLINE_SAFETY_ARTICLES.find((a) => a.id === "ai-deepfakes-and-nudify");
    expect(ai).toBeTruthy();
    expect(ai!.body.toLowerCase()).toMatch(/nudify|deepfake/);
    expect(ai!.body.toLowerCase()).toMatch(/take it down/);
    expect(ai!.body.toLowerCase()).toMatch(/take it down act|federal|illegal/);
    // Should explicitly name the bystander rule: don't share even 'as a joke'.
    expect(ai!.body.toLowerCase()).toMatch(/even .as a joke.|even 'as a joke'/);
  });

  it("passwords article names password managers, MFA priority, and recovery setup", () => {
    const p = ONLINE_SAFETY_ARTICLES.find((a) => a.id === "passwords-and-account-basics");
    expect(p).toBeTruthy();
    expect(p!.body.toLowerCase()).toMatch(/password manager/);
    expect(p!.body.toLowerCase()).toMatch(/bitwarden/);
    expect(p!.body.toLowerCase()).toMatch(/authenticator app/);
    expect(p!.body.toLowerCase()).toMatch(/multi-?factor|mfa|2fa|two-step/);
    expect(p!.body.toLowerCase()).toMatch(/recovery (?:email|phone|codes)/);
  });

  it("phishing article names IC3 reporting and the 'urgency = scam' rule", () => {
    const ph = ONLINE_SAFETY_ARTICLES.find((a) => a.id === "phishing-and-scams");
    expect(ph).toBeTruthy();
    expect(ph!.body.toLowerCase()).toMatch(/ic3/);
    expect(ph!.body.toLowerCase()).toMatch(/urgency.*scam|scam.*urgency/);
    // Should specifically name free-robux / nitro / vbucks generators.
    expect(ph!.body.toLowerCase()).toMatch(/robux|v-?bucks|nitro/);
  });

  it("public-vs-private article warns that disappearing/encrypted ≠ unrecoverable", () => {
    const pp = ONLINE_SAFETY_ARTICLES.find((a) => a.id === "public-vs-private-archive");
    expect(pp).toBeTruthy();
    expect(pp!.body.toLowerCase()).toMatch(/screenshot/);
    expect(pp!.body.toLowerCase()).toMatch(/wayback machine|archive/);
    // Should name pseudonymous accounts as a reasonable but-not-anonymous option.
    expect(pp!.body.toLowerCase()).toMatch(/pseudonymous|pseudonym/);
  });

  it("consent-and-messaging names the federal CSAM law and victim non-prosecution reality", () => {
    const c = ONLINE_SAFETY_ARTICLES.find((a) => a.id === "consent-and-messaging");
    expect(c).toBeTruthy();
    expect(c!.body.toLowerCase()).toMatch(/csam|child sexual abuse material/);
    expect(c!.body.toLowerCase()).toMatch(/victims[\s\S]{0,80}not[\s\S]{0,20}prosecuted/);
    // Should name a bystander rule for circulated images at school.
    expect(c!.body.toLowerCase()).toMatch(/don't open|don't share|don't screenshot/);
  });

  it("data-footprint article names privacy-respecting alternatives", () => {
    const d = ONLINE_SAFETY_ARTICLES.find((a) => a.id === "data-and-digital-footprint");
    expect(d).toBeTruthy();
    expect(d!.body.toLowerCase()).toMatch(/duckduckgo|brave|firefox/);
    expect(d!.body.toLowerCase()).toMatch(/permission/);
    expect(d!.body.toLowerCase()).toMatch(/ad tracking|tracking/);
  });

  it("multiple articles direct teens to a trusted adult or counselor", () => {
    const escalations = ONLINE_SAFETY_ARTICLES.filter((a) =>
      /trusted adult|school counselor|parent|counselor|adult/i.test(a.body)
    );
    expect(escalations.length).toBeGreaterThanOrEqual(4);
  });

  it("NCMEC CyberTipline referenced in at least three articles", () => {
    const refs = ONLINE_SAFETY_ARTICLES.filter((a) =>
      /cybertipline|ncmec|1-?800-?843-?5678/i.test(a.body)
    );
    expect(refs.length).toBeGreaterThanOrEqual(3);
  });

  it("Take It Down referenced in at least three articles", () => {
    const refs = ONLINE_SAFETY_ARTICLES.filter((a) =>
      /take it down|takeitdown\.ncmec/i.test(a.body)
    );
    expect(refs.length).toBeGreaterThanOrEqual(3);
  });
});

describe("resource constants", () => {
  it("NCMEC CyberTipline number matches expected format", () => {
    expect(NCMEC_CYBERTIPLINE).toMatch(/1-800-843-5678/);
  });
  it("Take It Down URL is the official NCMEC subdomain", () => {
    expect(TAKE_IT_DOWN_URL).toMatch(/takeitdown\.ncmec\.org/);
  });
  it("StopNCII URL constant is present (adult-age equivalent)", () => {
    expect(STOPNCII_URL).toMatch(/stopncii\.org/);
  });
  it("IC3 URL constant is present (FBI cybercrime reporting)", () => {
    expect(IC3_URL).toMatch(/ic3\.gov/);
  });
});

describe("ONLINE_SAFETY_CATEGORY_LABEL", () => {
  it("has a label for every category", () => {
    expect(ONLINE_SAFETY_CATEGORY_LABEL.passwords_and_accounts).toBeTruthy();
    expect(ONLINE_SAFETY_CATEGORY_LABEL.phishing_and_scams).toBeTruthy();
    expect(ONLINE_SAFETY_CATEGORY_LABEL.sextortion).toBeTruthy();
    expect(ONLINE_SAFETY_CATEGORY_LABEL.public_vs_private).toBeTruthy();
    expect(ONLINE_SAFETY_CATEGORY_LABEL.ai_and_deepfakes).toBeTruthy();
    expect(ONLINE_SAFETY_CATEGORY_LABEL.consent_and_messaging).toBeTruthy();
  });
});
