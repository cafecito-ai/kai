/**
 * Sex education + bodies primer. Age-appropriate, factual, harm-reduction,
 * inclusive across orientation and gender identity. Covers anatomy + puberty
 * normal-variation, consent foundations, contraception basics, STI awareness,
 * pleasure + communication, and where to get reliable answers.
 *
 * Voice rules (strict):
 *   - Inclusive: all bodies, all genders, all orientations. No assumption of
 *     who teens are or with whom.
 *   - No moralizing. The product doesn't have an opinion on whether or when
 *     teens should have sex.
 *   - Clinically accurate. STI / contraception facts grounded in published
 *     public-health sources (CDC, ACOG, WHO).
 *   - No "abstinence-only" framing AND no "everyone is doing it" framing.
 *     Both fail teens.
 *   - Consent is centered throughout, with specific clarifications (intoxicated
 *     consent, age-of-consent, ongoing consent).
 *   - For situations involving abuse / assault: RAINN, school counselor,
 *     trusted adult.
 *   - Sex-positive without being prescriptive. Pleasure is named as
 *     legitimate; teens get to decide if/when/how to engage.
 *   - Where to get answers: Planned Parenthood, Scarleteen, Bedsider, school
 *     nurse, pediatrician. Real resources, not random forums.
 */

export type SexEdCategory =
  | "bodies_and_puberty"
  | "consent_foundations"
  | "contraception_basics"
  | "sti_awareness"
  | "pleasure_and_communication"
  | "resources_and_help";

export type SexEdArticle = {
  id: string;
  category: SexEdCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

/** Planned Parenthood national hotline + chat. */
export const PLANNED_PARENTHOOD_HOTLINE = "1-800-230-PLAN (7526)";

/** Scarleteen — comprehensive teen sex ed, well-regarded across two decades. */
export const SCARLETEEN_URL = "scarleteen.com";

/** Power to Decide's contraception-info site. */
export const BEDSIDER_URL = "bedsider.org";

/** RAINN sexual assault hotline (used by other primers too). */
export const RAINN_HOTLINE_SEX_ED = "1-800-656-4673 (RAINN)";

export const SEX_ED_ARTICLES: ReadonlyArray<SexEdArticle> = [
  {
    id: "bodies-vary-normally",
    category: "bodies_and_puberty",
    title: "Anatomy normally varies (a lot)",
    summary: "Most teens worry their body is abnormal. Almost always it isn't. Here's the range of normal.",
    readMinutes: 4,
    body: `One of the most common silent worries in adolescence is "is my body normal?" — about literally every part. Genitals, breasts, hair, skin, voice, body shape, hormonal changes. Almost universally, the answer is: yes, you're normal. Bodies vary enormously.

This article gives a plain reference for what "normal" actually looks like, because most teens compare against media (which shows a tiny slice of bodies, often edited) and conclude they're outliers when they aren't.

**Genitalia (anatomy from puberty onward):**

For people with a penis:
- **Size at full erection** ranges roughly 4-7 inches in the general population, with smaller and larger outside that range. Pornography typically features the upper end of the distribution, which distorts perception.
- **Curvature** is common and usually not a problem; significant curvature (Peyronie's) is rare and treatable.
- **Foreskin** intact or removed, depending on whether circumcised; both are normal.
- **Testicles** are typically asymmetrical (one hangs lower); this is normal.

For people with a vulva / vagina:
- **Labia** vary significantly in size, shape, and color. Inner labia often extend beyond outer labia, which is completely normal despite stylized images suggesting otherwise.
- **Clitoris** size varies; mostly internal (the external "glans" is the visible tip).
- **Vagina** is a flexible muscular tube; the "tightness" framing is mostly mythology and the hymen is not what most teens have been taught it is (it's a flexible tissue, not a "seal").
- **Discharge** is normal and changes across the menstrual cycle.
- **Asymmetry** between left and right is normal.

For intersex teens:
- Bodies that don't fit typical sex-development patterns are part of human variation. Intersex traits affect roughly 1.7% of people. If you have questions, an endocrinologist or pediatrician with intersex experience can help. interACT (interactadvocates.org) is a teen-friendly resource.

**Pubertal timing varies hugely.**

Puberty starts anywhere from about age 8 to 14 for people assigned female at birth, and about age 9 to 15 for people assigned male at birth. Being "early" or "late" is mostly genetic. Within this range, your timing isn't a problem.

Major changes (in rough order):
- Growth spurt
- Body hair development
- Body shape changes (broader shoulders, hips, etc.)
- Breasts develop (for some teens; varies)
- Genital development and maturation
- For some bodies: menstrual cycles begin
- For some bodies: voice changes
- Acne, skin oiliness
- Stronger body odor, sweat changes
- Hormonal mood changes

The full set of changes typically takes 2-5 years to complete. Individual timing of each piece varies widely.

**Things teens worry about that are usually fine:**

- One body part developing before another (asymmetric breast growth, etc.)
- Stretch marks (common, fade over time)
- Acne in unusual places (back, chest, butt — common during puberty)
- Body hair patterns that seem "too much" or "too little"
- Smells that didn't used to happen
- Body proportions that seem off (these usually resolve as growth continues)
- Voice cracking or changing erratically
- Erections at "random" times (autonomic, completely normal)
- Wet dreams (normal, not under conscious control)
- Difficulty sleeping during growth spurts
- Hormonal mood shifts

**When to see a doctor about a body-related concern:**

- **Severe persistent pain** anywhere.
- **No pubertal changes by age 14-15** (this is when delayed puberty might warrant medical evaluation, not earlier).
- **Periods that are extremely heavy, extremely painful, or stop entirely after starting.**
- **Lumps, masses, or unusual changes** in breasts or testicles. (Testicular self-exams are worth learning; testicular cancer is uncommon but is one of the more common cancers in young men, highly treatable when caught early.)
- **Significant gender distress** (more on this below).
- **STI symptoms** (next article).
- **Anything that just feels wrong** to you about your body.

Pediatricians are trained to handle adolescent body concerns. They've seen everything. The "you have to know what to ask for" intimidation is wrong — you can say "I'm worried about a thing with my body" and a good pediatrician will work with you. Some clinical settings allow teens to see doctors confidentially without parents present for sexual and reproductive health questions; ask if that's available.

**Gender and bodies:**

For teens whose bodies don't align with their gender (transgender, non-binary, gender-questioning):

This experience is real and there are people who get it. Gender dysphoria (significant distress about misalignment between assigned-at-birth and gender) is recognized clinically. There are clinicians who specialize in this.

What's NOT helpful: friends or online sources telling you you definitely are or aren't trans, pressure to "decide" quickly, fast online medical providers offering hormones without proper evaluation.

What's helpful:
- A gender-informed therapist to talk through your experience.
- An adolescent endocrinologist if you're exploring medical transition options.
- Trevor Project (1-866-488-7386) for crisis support.
- Trans Lifeline (1-877-565-8860), peer support.
- WPATH-trained clinicians (search "WPATH" + your area).

Decisions about your body are yours; rushing them or being rushed isn't the goal. Time, careful exploration, and proper clinical care matter.

**The takeaway:**

Almost every body-related worry teens have falls within normal human variation. When you're genuinely unsure, a doctor — not a forum, not a friend, not TikTok — is who can give you real information.`,
    takeaways: [
      "Body parts vary enormously. Media (especially porn) shows a narrow slice and distorts perception of normal.",
      "Pubertal timing varies by years and is mostly genetic. Being early or late is not a problem.",
      "Pediatricians handle adolescent body questions routinely. You don't need to know special words to ask.",
      "Gender-related body distress is real. Gender-informed therapist + WPATH-trained clinician + Trevor Project / Trans Lifeline for crisis."
    ]
  },
  {
    id: "consent-essentials",
    category: "consent_foundations",
    title: "Consent: the actual definition",
    summary: "Consent has been simplified into slogans that miss most of what teens need to know. The full picture is more useful.",
    readMinutes: 4,
    body: `Consent is the practice of voluntary, informed, ongoing agreement to sexual activity, given by people with the capacity to consent. Most consent education for teens stops at "no means no" or "yes means yes" — useful slogans, but they miss most of the practical complexity.

**The components, plainly:**

**1. Voluntary.**
Consent is given freely. Not under pressure ("if you loved me, you would"), not from fear of consequences ("they'll get mad if I say no"), not because saying yes was the easier path. Pressure of any kind invalidates consent.

**2. Informed.**
The person knows what they're consenting to. Sneaking past an agreed limit (e.g., removing a condom mid-activity without telling the partner — called "stealthing," illegal in many places) violates this. Lying about STI status, identity, age, or relationship status violates this.

**3. Ongoing.**
Consent isn't one-time. Yes to one activity isn't yes to another. Yes earlier doesn't mean yes now. You can withdraw consent at any point, and the activity stops at that point. Period.

**4. Capacity.**
The person is in a state where they can meaningfully give consent. This means:
- **Not significantly intoxicated.** Drunk, high, on substances, blacked out — can't legally or ethically consent. The intoxicated person doesn't have full capacity.
- **Not asleep / unconscious.** Obvious but worth saying.
- **Old enough** to legally consent (varies by jurisdiction; most US states set ages of consent between 16 and 18).
- **Not coerced** by power dynamics (a teacher, a coach, a much older person — these inherently create power dynamics that compromise consent).

**5. Affirmative.**
"Not saying no" is not consent. Silence is not consent. A reluctant "okay" isn't enthusiastic consent. Active "yes I want to" is what counts.

**The most common ways consent gets violated:**

- **Pressure.** "Just this once." "I drove all this way." "We've already started." "Just the tip." All pressure.
- **Intoxication.** Either party significantly drunk / high = compromised consent.
- **Stealthing.** Removing barrier methods (condoms) without partner's knowledge.
- **Going beyond what was agreed.** Yes to kissing isn't yes to more.
- **Threats or guilt.** "I'll break up with you." "You'll embarrass yourself if you stop now."
- **Continuing after a pause / hesitation.** Hesitation = stop, ask, check in.

**Power dynamics that compromise consent:**

- **Significant age gaps.** Especially when one party is a minor. Most jurisdictions have specific laws about this; the criminal definition matches a real ethical concern.
- **Authority figures.** Teachers, coaches, employers, religious leaders, family members. These power imbalances mean consent isn't fully voluntary.
- **Substance situations.** Even if both parties chose to drink, the consent that follows is compromised.

**Practical consent practice:**

The healthiest sexual interactions tend to involve explicit, ongoing communication. This sounds awkward in theory; in practice it's just talking.

- "Is this okay?"
- "Do you want to keep going?"
- "How does this feel?"
- "I want to try X. What do you think?"
- "I'm not into that right now."
- "Can we slow down?"
- "Stop." (Always honored, immediately.)

People who can talk during sex tend to have better sex. The "spoiling the mood" framing of communication is a myth; the actual mood-spoiler is being unsure whether your partner is okay.

**A note on intoxicated consent specifically:**

A common pattern in teen sexual encounters is both parties drinking and one or both regretting it the next day. This is one of the most fraught areas of consent.

What's true:
- Significantly intoxicated people can't fully consent. If you're not sure whether your partner is okay, don't proceed.
- The legal standard for "incapacitated" varies but generally means severely impaired (slurred speech, can't walk straight, blacking out, unconscious, severely confused).
- Both people being drunk doesn't make it okay. Consent is still compromised.
- The next-morning "regret" is sometimes about realizing the consent wasn't really there in the moment.

The honest harm-reduction advice: be more careful, not less, when alcohol is involved. If you're not sure, don't.

**If consent was violated against you (or by you):**

If something happened to you that violated your consent:
- It wasn't your fault. Saying yes to one thing isn't yes to another. Being intoxicated didn't mean you wanted it. Not fighting back isn't consent.
- **RAINN: ${RAINN_HOTLINE_SEX_ED}** can help you think through what you want to do. They don't pressure you to report or to take specific action. Anonymous and free.
- You can choose to report or not. Both are valid.
- Medical care is worth considering (STI testing, evidence collection if you choose). Doesn't require police involvement.
- A trauma-informed counselor is one of the best long-term resources.

If you realize you may have violated someone's consent:
- This is genuinely hard to face. Facing it matters.
- Don't try to "explain" to the other person — this often re-traumatizes them.
- A trauma-informed therapist can help you work through what happened, what you're responsible for, and what comes next.
- Sexual harm exists on a spectrum. Some situations are crimes; some are ethical failures that aren't criminal. Either way, growth requires honest reckoning, not denial.

**The takeaway:**

Consent is more than "no means no." It's voluntary + informed + ongoing + capacity + affirmative. People who practice this consistently have better sexual experiences and avoid causing harm. People who don't are often surprised by the harm they create.`,
    takeaways: [
      "Consent = voluntary + informed + ongoing + capacity + affirmative. Silence and reluctant 'okay' aren't consent.",
      "Pressure invalidates consent. So does significant intoxication, age gaps, power dynamics, and coercive threats.",
      "Talking during sex isn't a mood-killer; uncertainty about your partner's experience is.",
      "Consent violation in either direction → trauma-informed help. RAINN 1-800-656-4673 for survivors."
    ]
  },
  {
    id: "contraception-overview",
    category: "contraception_basics",
    title: "Contraception: what works, plainly",
    summary: "Most teens get bad or incomplete contraception information. Here's a non-prescriptive overview of what actually works.",
    readMinutes: 5,
    body: `If you're considering or having sex that could lead to pregnancy, contraception is genuinely useful information. This article is non-prescriptive — it doesn't tell you to use any particular method. It tells you how the methods compare so you can make an informed decision.

**The two big things to know:**

1. **Effectiveness rates depend on "perfect use" vs "typical use."** Perfect use = following instructions exactly. Typical use = the way real humans actually use it (forgetting pills, putting condoms on wrong, etc.). Typical-use effectiveness is what matters in real life.

2. **No method except abstinence is 100% effective.** Abstinence has a perfect-use effectiveness of 100% and a typical-use effectiveness that's whatever your actual practice is.

**Most effective methods (less than 1% failure per year in typical use):**

- **Hormonal IUDs** (Mirena, Liletta, Kyleena, Skyla). Plastic device with hormones, placed in uterus, lasts 3-8 years. ~99.8% effective.
- **Copper IUD** (ParaGard). Hormone-free, lasts up to 12 years. ~99.2% effective.
- **Implant** (Nexplanon). Matchstick-sized rod placed under arm skin, lasts 3-5 years. ~99.9% effective.
- **Tubal ligation / vasectomy.** Surgical, usually permanent. Not usually a teen option but worth knowing about.

These are called LARC (Long-Acting Reversible Contraception) and they're the gold standard for effectiveness. Pediatricians' professional societies (AAP, ACOG) explicitly recommend LARC as first-line options for teens who want contraception. They don't require remembering anything daily.

**Highly effective with daily attention (5-9% failure with typical use):**

- **Birth control pills.** Daily pill, hormonal. Combined estrogen-progestin or progestin-only.
- **The patch.** Skin patch changed weekly.
- **The ring** (NuvaRing, etc.). Vaginal ring changed monthly.
- **The shot** (Depo-Provera). Injection every 3 months.

Less effective in real life than LARC because they require ongoing user action. If you're good at routine, they work. If you forget regularly, effectiveness drops.

**Moderately effective (12-15% failure with typical use):**

- **Condoms.** Latex or non-latex. The only common method that also prevents STIs. Should be used WITH another method for maximum effectiveness.
- **Internal condoms** (formerly called "female condoms"). Less common, also STI-preventive.
- **Diaphragm / cervical cap.** Less common, needs prescription, used with spermicide.

**Less effective methods (18-28% failure with typical use):**

- **Spermicide alone.** Pretty unreliable as a single method.
- **Withdrawal ("pulling out").** Often dismissed as ineffective; perfect use is around 4% failure, but typical use is much higher. Better than nothing but not a primary method.
- **Fertility awareness methods** (rhythm method, etc.). Require careful daily tracking. Effective for some people who track carefully; not reliable for most teens.

**Emergency contraception:**

If contraception fails, was forgotten, or wasn't used:
- **Plan B / levonorgestrel pills** (Plan B One-Step, etc.). Available over the counter without prescription. Works best within 72 hours, can work up to 5 days. Less effective for higher body weight. ~$30-50.
- **Ella (ulipristal acetate).** Prescription required (or pharmacy in some states). Works up to 5 days. More effective than Plan B at higher body weight.
- **Copper IUD as emergency contraception.** The most effective form of emergency contraception (99%+). Inserted within 5 days. Becomes ongoing contraception.

Emergency contraception is NOT the same as the "abortion pill." Plan B and Ella prevent or delay ovulation; they don't end pregnancy.

**What about pulling out + Plan B?**

Common harm-reduction strategy. Better than nothing. Significantly less effective than LARC + condoms. Not recommended as a primary plan.

**STI prevention vs pregnancy prevention:**

These are separate goals with separate solutions.
- **For pregnancy:** LARC, pills, patch, ring, shot, all very effective. Condoms add additional STI protection.
- **For STIs:** Condoms (external or internal). PrEP for HIV prevention if applicable. Regular testing.

The "I'm on the pill, so we don't need condoms" framing leaves you exposed to STIs. Pregnancy and STI prevention are different problems.

**Getting contraception as a teen:**

- **Planned Parenthood.** Sliding scale, often free for teens. Provides all methods. **${PLANNED_PARENTHOOD_HOTLINE}**.
- **Title X clinics.** Federally-funded family planning clinics, usually free or sliding scale for teens. Search "Title X" + your area.
- **School-based health clinics** (where available). Some offer contraception.
- **Pediatricians.** Most can prescribe pills, patch, ring. Some can refer for LARC.
- **Bedsider.org** has tools to find clinics and compare methods.

**Confidentiality:**

In most US states, minors can access contraception confidentially without parental notification, especially through Title X clinics and Planned Parenthood. Specifics vary; ask "is this confidential?" up front.

**Cost:**

- Many forms are free or low-cost through Planned Parenthood, Title X, school clinics, and Medicaid (if eligible).
- Insurance typically covers contraception under the Affordable Care Act (zero copay for most methods at in-network providers).
- Plan B is over-the-counter, $30-50. Generic versions are cheaper.

**What this article isn't saying:**

It's not saying you should be having sex. It's not saying you shouldn't. It's saying: if you are, here's what's true about how contraception works. Decisions about whether and when to have sex are yours; they don't have to be made today.

**Where to learn more:**

- **${SCARLETEEN_URL}** — comprehensive, teen-specific, well-regarded for 20+ years.
- **${BEDSIDER_URL}** — contraception-specific, lots of comparison tools.
- **Planned Parenthood website + chat tool ("Roo")** — chat with an expert about specific questions.
- **CDC Sexual Health pages** — clinical info.
- **Your pediatrician or a sexual health clinician.**`,
    takeaways: [
      "Effectiveness varies hugely by method AND by 'typical use' vs 'perfect use'. LARC (IUDs / implant) is most effective.",
      "Condoms are the only method that also prevents STIs. Combine with pregnancy prevention for max coverage.",
      "Emergency contraception is OTC (Plan B), works best within 72 hours. Copper IUD is most effective EC.",
      "Planned Parenthood / Title X / school clinics / pediatricians provide contraception. Often free, often confidential."
    ]
  },
  {
    id: "sti-awareness-basics",
    category: "sti_awareness",
    title: "STIs: testing, prevention, treatment",
    summary: "STIs are common, mostly treatable, and not shameful. Most teens never get clear info on them; here it is.",
    readMinutes: 4,
    body: `Sexually transmitted infections (STIs) — used to be called STDs — are extremely common. Teens and young adults (ages 15-24) account for about half of all new STI cases in the US, even though they're a much smaller fraction of the population. This isn't because teens are uniquely irresponsible; it's because teen sexual encounters are often less protected and STI testing is less routine in this age group.

The good news: most STIs are treatable, all are manageable, and prevention + testing + treatment together work very well.

**The major STIs you should know about:**

**Bacterial (curable with antibiotics):**

- **Chlamydia.** Most common STI in the US. Often no symptoms. Can cause long-term reproductive issues if untreated. Test = urine sample. Treatment = single-dose antibiotic.
- **Gonorrhea.** Often no symptoms. Causing increasing antibiotic resistance, important to test and treat. Similar testing and treatment to chlamydia.
- **Syphilis.** Rising in incidence recently. Multiple stages; usually treatable with penicillin. Test = blood test.

**Viral (manageable, not curable, varies by virus):**

- **HPV (human papillomavirus).** Extremely common — most sexually active people get it at some point. Most strains are harmless and the body clears them. Some strains cause genital warts; some cause certain cancers (cervical, throat, anal). HPV vaccine prevents most high-risk strains; recommended at age 11-12 ideally, can be given up through age 26.
- **Herpes (HSV-1, HSV-2).** Very common. Can cause sores around mouth (HSV-1, often non-sexual transmission as a child) or genitals (often HSV-2). Treated with antivirals that suppress outbreaks. Stigma is much worse than the medical reality for most people.
- **HIV.** Less common than the others but more serious. Modern treatment (antiretroviral therapy / ART) makes HIV manageable and undetectable = untransmittable (U=U). PrEP (pre-exposure prophylaxis, daily pill or 2-month injection) prevents HIV in people at risk.
- **Hepatitis B/C.** Less common from sex than other routes for hep C; hep B vaccine is part of childhood vaccination.

**Parasitic / other (curable):**

- **Trichomoniasis ("trich").** Common, treatable with antibiotics.
- **Pubic lice ("crabs").** Treatable.
- **Scabies.** Treatable.

**Symptoms — but most STIs are often asymptomatic:**

When symptoms do show up, they can include:
- Unusual discharge
- Burning during urination
- Sores, blisters, or warts
- Unexplained pelvic pain
- Itching
- Rashes

But the most important thing to know: many STIs have no symptoms. Routine testing is how you find them, not waiting for symptoms.

**Testing — when, where, what to ask for:**

**When to test:**
- After unprotected sex with a new partner.
- After a condom break.
- If a partner discloses an STI.
- If you're sexually active and haven't been tested in a year.
- If you're starting a new sexual relationship.
- Annually if sexually active (recommended baseline).

**Where to test:**
- **Planned Parenthood** (${PLANNED_PARENTHOOD_HOTLINE}). Often free or sliding scale.
- **Title X clinics.** Free or low-cost.
- **School-based health clinics** (where available).
- **Your pediatrician.** Often can order tests; ask about confidentiality.
- **County / city public health departments.** Often free STI testing.
- **Urgent care / ER** (more expensive but possible).

**What to ask for:**
Standard "STI panel" usually covers:
- Chlamydia + gonorrhea (urine or swab)
- HIV (blood)
- Syphilis (blood)

Less commonly included by default:
- Herpes (blood test or swab of an active sore; routine testing not always recommended because of high false-positive rates)
- HPV (cervical sites screened via Pap test in adults; no routine test for other sites)
- Hepatitis (blood test if indicated)

If you've had specific exposures (oral, anal), ask for site-specific testing — throat swab, rectal swab. Many providers don't ask, so you might need to bring it up. This isn't awkward; it's clinical.

**Prevention:**

- **Condoms.** Reduce risk of most STIs significantly. Not 100% (herpes and HPV can spread from areas condoms don't cover).
- **Dental dams** for oral sex (yes, oral sex can transmit STIs).
- **HPV vaccine.** Strongly recommended. Prevents most high-risk strains. If you didn't get it as a kid, it's still useful through age 26.
- **PrEP.** For people at higher risk of HIV (men who have sex with men, partners of HIV-positive people, others). Pill daily or injection every 2 months. Highly effective.
- **Vaccination for hep B** (already in childhood vaccines for most teens).
- **Regular testing.** Knowing your status (and partners knowing theirs) is itself a prevention strategy.
- **Communication with partners.** Asking about testing history and current status before sexual contact. Awkward and worth it.

**If you test positive:**

- **It's not the end.** Most STIs are very treatable. Even the ones that aren't curable (herpes, HIV, HPV) are manageable.
- **Tell partners.** This is hard but important. Many clinics offer partner notification services that contact partners anonymously on your behalf.
- **Take the full course of treatment.** Especially for bacterial STIs — finishing the antibiotic matters.
- **Re-test as recommended.** Some STIs need follow-up testing after treatment.
- **Don't catastrophize.** Most teens who get STIs go on to have healthy sexual lives. The diagnosis is one moment, not your future.

**The stigma is much worse than the medical reality.**

The shame around STIs causes real harm — keeps people from testing, from disclosing, from getting treatment. Most people who've had common STIs (which is most sexually active people) lead totally normal sexual and romantic lives.

The cultural framing of STIs as "punishment" for sexual behavior is wrong. Bacteria and viruses don't moralize. Getting one means you had skin-to-skin contact with another human, that's it. The right response is treatment + prevention, not shame.

**Crisis specifics:**

- **If you've been sexually assaulted** and there's STI / pregnancy risk: emergency contraception within 5 days, HIV PEP (post-exposure prophylaxis) within 72 hours dramatically reduces HIV risk. Go to an ER or a clinic that handles sexual assault response. RAINN: ${RAINN_HOTLINE_SEX_ED}.
- **For HIV-specific resources:** Greater Than HIV (greaterthan.org), Test At Home options.
- **For free HIV testing:** gettested.cdc.gov to find local options.`,
    takeaways: [
      "STIs are common — half of new US cases are 15-24 year-olds. Most are treatable, all are manageable.",
      "Most STIs are often asymptomatic. Routine annual testing is how you find them, not waiting for symptoms.",
      "Condoms reduce STI risk significantly (not 100%). HPV vaccine + PrEP (for HIV) + regular testing add layers.",
      "Stigma is worse than medical reality. Test positive ≠ broken. Treatment + prevention works; shame doesn't."
    ]
  },
  {
    id: "pleasure-and-communication",
    category: "pleasure_and_communication",
    title: "Talking about sex with a partner",
    summary: "Most teens learn about sex from media and porn — both of which model communication terribly. Real talking matters more than technique.",
    readMinutes: 4,
    body: `One of the biggest gaps in teen sex education is communication. Pornography and most movies show sex happening without conversation — people somehow know what to do, do it, finish, done. Real sex involves real talking, and the people who do it best tend to communicate constantly.

This article is about the talking part, not technique.

**Why this matters:**

- Sex without communication is largely guessing. Guessing isn't a path to good experiences for either person.
- The myth of "if they love you, they'll know what you like" causes more frustration than almost any other sexual misconception.
- Communication makes consent ongoing (see consent article).
- Communication is also pleasure: knowing what works for your partner, knowing what works for you, asking, adjusting.

**Talking before:**

The kinds of conversations to have before getting physical with someone new:

- **Sexual history / STI status.** "When were you last tested?" Awkward, important.
- **Contraception** if pregnancy is a possibility. Don't assume; talk about it.
- **What you both want from this interaction.** Casual? Relationship? Different goals = different conversations.
- **Limits and preferences.** Things you definitely want to do or definitely don't want to do.
- **Safe words / signals** for non-traditional dynamics.

These conversations get easier with practice. The first time feels like a lot; the tenth time is routine.

**Talking during:**

The conversational practices that make sex actually work:

- **"Is this okay?"** — basic, frequent, always appropriate.
- **"How does that feel?"** — invites feedback.
- **"Can we slow down / speed up / try something different?"** — adjusts in real time.
- **"I want to try X" / "Can we do X?"** — names what you want.
- **"I'm not into that" / "Not tonight" / "Can we not?"** — declines without explaining.
- **"That's good" / "That's working" / "That's perfect"** — positive feedback.
- **Sounds, not just words.** Breath, sighs, moans, body movements. These communicate too.

The myth of "spoiling the mood" by talking is exactly that — a myth. The actual mood-spoiler is being unsure whether your partner is okay or not getting what works for you.

**Talking after:**

Often skipped, often valuable:

- **"What did you like?"** — learning what worked.
- **"What didn't work?"** — adjusting for next time, if there's a next time.
- **"Are you okay?"** — emotional check-in.
- **"Anything you want to try differently?"** — invites collaboration.

**What about pleasure?**

This is the part most teens get the worst information about. The honest version:

- **Pleasure is real and legitimate.** Sexual pleasure isn't dirty or shameful. It's a normal part of human experience.
- **Pleasure isn't guaranteed.** Especially early sexual experiences (especially for people with vulvas, partly because of the orgasm gap — most studies show heterosexual women orgasm far less often than their male partners, mostly because of communication gaps, not biology).
- **Knowing your own body is a prerequisite for partner sex working.** Solo exploration (masturbation) helps you know what you like, so you can communicate that to a partner. This isn't dirty; it's prep.
- **The clitoris is the primary site of pleasure for most people with vulvas.** This is biology, not preference. Sexual practices that ignore the clitoris will often leave one party unsatisfied. (Most TV/movie sex doesn't reflect this accurately.)
- **First-time anxiety is universal.** People expect it to be amazing or magical. It's usually awkward, sometimes fumbling, sometimes funny, often not as physically pleasurable as later sex. This is normal. It tends to improve.

**The pleasure gap:**

Research is consistent on this: in heterosexual encounters, men report orgasm in 90%+ of sexual encounters; women report 50-65% (varies by study). In committed relationships with established communication, this gap closes substantially. The cause is communication, not biology.

This matters because:
- People with vulvas can have orgasms, including from partnered sex, when their pleasure is centered and communicated about.
- The cultural framing of male orgasm as the "completion" of sex is bad for everyone.
- Sex that ends when one party finishes isn't equitable sex.

**Talking about sex outside of sex:**

The conversations don't have to happen mid-act. Often easier to have them in calm moments:

- "Hey, I've been thinking about what we did last time. I really liked X."
- "There's something I've been curious about. Want to talk about it?"
- "I want to make sure you're enjoying things too. Is there anything I should do differently?"
- "I'm not into Y. Can we just not?"

People who can have these conversations with partners tend to have better sex lives over decades. The skill is learnable.

**A note on porn:**

Most teens encounter porn before they have sex. Worth knowing:

- Porn is performance, not documentary. Bodies, positions, durations, sounds — most of it isn't representative.
- Porn often models terrible communication (none, or only certain kinds).
- Some genres model dynamics that aren't healthy in real relationships.
- Porn-trained expectations about how partners should look or act are often unrealistic and cause real-life dissatisfaction.

Using porn for arousal is one thing. Using porn as your only sex education is another. The articles in this section, Scarleteen, Planned Parenthood, and conversations with real people are much better sources.

**What if I don't want to have sex yet?**

That's a legitimate, healthy choice. Most people who wait don't regret waiting. The pressure to have sex by a specific age or before a specific event is mostly cultural noise.

You don't need a reason. "I'm not ready" is enough. "I don't feel like it" is enough. "I'd rather not yet" is enough.

People who pressure you about your sexual pace are showing you something about them. Take the information.

**What if I'm asexual or don't experience sexual attraction?**

Asexuality is a real orientation. Not wanting sex isn't broken; it's a way of being human. AVEN (Asexual Visibility & Education Network, asexuality.org) has community and resources.`,
    takeaways: [
      "Communication matters more than technique. People who can talk about sex tend to have better sex.",
      "Pleasure is real, legitimate, and unevenly distributed in heterosexual encounters — mostly due to communication gaps, not biology.",
      "Porn is performance, not documentary. Bad sex education when used as the only source.",
      "'I'm not ready' is a complete sentence. 'I don't experience sexual attraction' is a real and valid orientation (AVEN)."
    ]
  },
  {
    id: "where-to-get-real-answers",
    category: "resources_and_help",
    title: "Where to get answers without shame",
    summary: "Most teens get sex information from terrible sources. Here are the actually reliable ones.",
    readMinutes: 3,
    body: `Most teens piece together sex information from porn, peers, social media, and whatever bits of school sex ed they got. The result is often a mix of myths, half-truths, and gaps. Reliable, comprehensive teen sex ed sources exist, and they're worth knowing about.

**For comprehensive sex ed (everything):**

**${SCARLETEEN_URL}** — Comprehensive, teen-specific, queer-inclusive, harm-reduction, regularly updated since 1998. Articles on anatomy, relationships, consent, identity, sexuality, contraception, STIs, pleasure, communication. Also has a moderated message board and a SMS/chat line. Probably the single best free teen sex ed resource available.

**Planned Parenthood** — Articles, videos, a chat tool called "Roo" that answers questions in real time. **${PLANNED_PARENTHOOD_HOTLINE}** for clinical referrals. plannedparenthood.org/learn covers most topics.

**For contraception specifically:**

**${BEDSIDER_URL}** (Power to Decide) — Compare methods, find local clinics, set reminders. Visual, comparison-focused.

**reproductiveaccess.org** — Practical clinical info on contraception.

**For STIs:**

**CDC Sexual Health pages** (cdc.gov/std) — clinical, dry, accurate. Includes a clinic locator (gettested.cdc.gov).

**HIVinfo.NIH.gov** — for HIV-specific information.

**Greater Than HIV** (greaterthan.org) — newer, more teen-friendly HIV resources.

**For LGBTQ+ specific:**

**Trevor Project** — for crisis support (1-866-488-7386), but also has resource libraries.

**Q Chat Space** (qchatspace.org) — moderated chats for LGBTQ+ teens.

**It Gets Better Project** — videos and resources.

**Trans Lifeline** (1-877-565-8860) — peer support for trans people.

**WPATH** — clinical standards for transgender health care; useful for finding informed clinicians.

**For asexual / aromantic:**

**AVEN** (asexuality.org) — Asexual Visibility & Education Network.

**For sexual assault / abuse survivors:**

**RAINN** (${RAINN_HOTLINE_SEX_ED}) — confidential, 24/7. Has chat option at rainn.org.

**For specific medical questions:**

- Your pediatrician (most can handle most questions, even ones that feel embarrassing).
- Adolescent medicine specialists (if your pediatrician isn't the right fit).
- Sexual and reproductive health clinics.
- School nurses (more knowledgeable than most teens realize; often able to refer).

**For abortion access (if relevant in your situation):**

- **AbortionFinder.org** — finds nearby providers, accurate post-Dobbs.
- **National Abortion Federation Hotline** (1-800-772-9100) — financial help, info, support.
- **Plan C** (plancpills.org) — info on abortion pills.

**Generally NOT reliable sources:**

- **Pornography.** Performance, not documentary.
- **TikTok / Instagram sex ed accounts.** Some are good, many spread misinformation. Hard to vet.
- **Reddit (most sex-related subreddits).** Mix of real info and bad info. Hard to filter.
- **YouTube videos by non-experts.**
- **Most blogs.** Variable quality.
- **Friend group consensus.** Sometimes accurate, sometimes a game of telephone.
- **Religious or "abstinence-only" sources** that withhold medical information. (Information being framed as "to prevent sin" rather than "to inform" is a clue.)

**Some questions only humans can answer:**

For some things you actually want to talk to a person:
- Specifics about your body that aren't quite "normal" but might be normal — pediatrician.
- "Should I have sex with this person?" — friend, counselor, your own inner conversation. Not the internet.
- Identity questions — counselor or trusted adult, plus identity-specific resources.
- "Is this relationship okay?" — counselor.
- Reactions to past sexual experiences — trauma-informed counselor.

**A note on cost and confidentiality:**

- Most teen-specific resources are free.
- Planned Parenthood, Title X clinics, and many school-based health clinics offer free or sliding-scale services.
- Confidentiality for teens accessing sexual health care varies by state. In most US states, minors can access contraception, STI testing, and pregnancy care without parental notification — but this varies. Ask "is this confidential" upfront.
- For LGBTQ+ teens, accessing care in non-supportive home environments can be hard; school nurses and counselors are usually the best confidential entry point.

**The big picture:**

Most adults you'd want to ask weren't taught this material well either. The teens who do well navigating their sexual development tend to be the ones who actively learn from good sources (the ones above), develop communication skills, and build the habit of asking real clinicians for things that need clinical answers.

You don't have to figure this out alone, and you don't have to figure it out fast.`,
    takeaways: [
      "Scarleteen.com, Planned Parenthood, Bedsider, CDC Sexual Health — the genuinely reliable teen sex ed resources.",
      "Porn, social media, friend group consensus, abstinence-only sources are usually unreliable. Be discerning.",
      "Most teen sexual health care is confidential in most states. Planned Parenthood / Title X clinics / school nurses are entry points.",
      "Identity-specific resources exist: Trevor Project, Trans Lifeline, AVEN, Q Chat Space, AbortionFinder.org."
    ]
  }
];

export const SEX_ED_CATEGORY_LABEL: Record<SexEdCategory, string> = {
  bodies_and_puberty: "Bodies + puberty",
  consent_foundations: "Consent foundations",
  contraception_basics: "Contraception",
  sti_awareness: "STIs",
  pleasure_and_communication: "Pleasure + communication",
  resources_and_help: "Reliable resources"
};
