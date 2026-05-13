/**
 * Substances + risk primer. Harm-reduction approach: honest about real risks,
 * doesn't moralize, doesn't pretend teens never encounter substances. Names
 * specific medical red flags and the SAMHSA helpline.
 *
 * Voice rules (strict):
 *   - No moralizing (sloganeering, scare tactics) AND no dismissal
 *     ("a little is fine"). Both fail teens.
 *   - Honest about adolescent brain development context (research is real).
 *   - Specific medical red flags named (alcohol poisoning, fentanyl,
 *     overdose, mixing substances). Not as scare tactics — as information.
 *   - Strong escalation paths in every category: trusted adult, school
 *     counselor, SAMHSA 988/1-800-662-HELP, Crisis page.
 *   - No instruction on how to USE substances. Harm-reduction names the
 *     risks; doesn't provide a how-to.
 *   - "Amnesty" framing for friends-and-pressure: in a medical emergency,
 *     calling for help is the right move regardless of who's in trouble for
 *     what. Most states have Good Samaritan laws; that's worth knowing.
 *   - If a teen tells Kai they're using → Kai's job is acknowledgment +
 *     pointing to a real adult / clinician, NOT lecturing.
 *   - This content is sensitive enough that the cover copy on the
 *     component flags that the engine is not a substitute for talking to
 *     a real person.
 */

export type SubstancesCategory =
  | "vaping_nicotine"
  | "alcohol"
  | "cannabis"
  | "pills_and_counterfeits"
  | "friends_and_emergency"
  | "when_use_is_a_problem";

export type SubstancesArticle = {
  id: string;
  category: SubstancesCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

/** US-specific national helpline; not specific to substances alone. */
export const SAMHSA_HELPLINE = "1-800-662-HELP (4357)";

export const SUBSTANCES_ARTICLES: ReadonlyArray<SubstancesArticle> = [
  {
    id: "vaping-nicotine-reality",
    category: "vaping_nicotine",
    title: "Vaping and nicotine: what's actually happening in the body",
    summary: "Vapes are not 'just water vapor.' Nicotine in modern devices is concentrated, addictive, and especially hard on a teen brain.",
    readMinutes: 4,
    body: `Vaping rates among teens dropped from the 2019 peak but are still much higher than cigarette use ever was at this age. Most teens who vape don't think of themselves as nicotine users — the marketing has been deliberate about that. The pharmacology is the same regardless of branding.

What's actually in there:

**High-concentration nicotine.** A modern disposable vape (Elf Bar, Geek Bar, etc.) typically contains the nicotine of a pack or two of cigarettes — sometimes more. Nicotine salts in these devices are designed to deliver nicotine faster and more smoothly than older systems, which makes them more reinforcing.

**Other ingredients.** Propylene glycol, vegetable glycerin, flavoring chemicals. Some flavorings cause specific lung damage when heated and inhaled (diacetyl, etc.). Long-term inhalation data on these is still being collected — the products outran the research.

**What it does to the teen brain specifically.** Nicotine alters the development of the prefrontal cortex and the reward system, both of which are actively forming through about age 25. Studies consistently link teen nicotine use to:
- Stronger and faster addiction than adult-onset.
- Higher lifetime risk of mood disorders.
- Some evidence of attention and learning effects.

This is not moral — it's mechanical. The same dose that an adult brain absorbs as "buzz then done" trains a teen brain into a longer pattern.

**The addiction profile that's underemphasized:** modern devices produce nicotine dependence faster than cigarettes ever did. Most teen vapers who try to stop are surprised at how hard it is. This is by design.

What "moderate" vaping does:

There isn't a safe lane. The body doesn't have a threshold below which nicotine is fine for an adolescent. Less is less harmful than more — that's true — but the framing of "I only vape a little" obscures how reinforcing even moderate use is at this age.

Signs the vape isn't just casual anymore:

- You think about it during class / first thing on waking / before bed.
- You feel anxious or off when you can't access it for a few hours.
- You hide it from people who'd be worried.
- You've tried to stop and couldn't.
- It's affecting your sleep, your runs, your singing, your wallet.

What helps if you want to stop:

- **It's harder than most teens expect.** Plan for hard, not for easy. Most successful quits take multiple attempts.
- **Nicotine replacement (patches, gum) is legitimate help**, including for teens — talk to a doctor or school nurse. Cold turkey is often unnecessarily brutal.
- **Programs that work:** Truth Initiative's "This Is Quitting" text-based program (text DITCHVAPE to 88709) is free, anonymous, and research-supported.
- **Doctor or counselor.** Real, normal help for a real, normal problem. There's no shame attached for asking.

Risk-of-vape-related illness:

- Sudden trouble breathing, chest pain, severe coughing after vaping → emergency room. There are documented cases of acute vape-related lung injury (EVALI) that are medical emergencies.
- Counterfeit / black-market THC vapes are higher-risk for this. If you don't know exactly what's in it, that's its own information.

Resources: SAMHSA helpline ${SAMHSA_HELPLINE}. School nurse / counselor. Pediatrician. None of these will get you in trouble for asking.`,
    takeaways: [
      "Modern vapes deliver concentrated nicotine — faster, smoother, and more addictive than cigarettes ever were.",
      "Teen brains develop nicotine dependence faster than adult brains. This is mechanical, not moral.",
      "Programs that work: Truth Initiative's 'This Is Quitting' (text DITCHVAPE to 88709), school nurse, doctor.",
      "Sudden breathing/chest issues after vaping → ER. EVALI is a real medical emergency."
    ]
  },
  {
    id: "alcohol-reality",
    category: "alcohol",
    title: "Alcohol: what it actually does and the red flags worth knowing",
    summary: "Most teen drinking is not catastrophic. Specific patterns are dangerous — alcohol poisoning kills teens every year, often from preventable mistakes.",
    readMinutes: 4,
    body: `This article isn't telling you whether or when to drink. It's giving you information about what alcohol actually does in your body so that if you encounter it — your own choice, someone else's choice in your friend group, a moment that gets out of hand — you have better information than the room.

What alcohol does in the body:

- **It's a depressant.** Slows the central nervous system. Lower doses produce disinhibition and warmth. Higher doses produce drowsiness, impaired motor control, slowed breathing.
- **The body processes it slowly.** About one standard drink per hour. There's no way to "speed up" this — coffee doesn't help, cold showers don't help. Time is the only fix.
- **Body weight + biological sex + tolerance + food in the stomach all change effect.** A 110-lb person drinks the same amount as a 200-lb person and the effect is dramatically different. People assume their tolerance is the same as the loudest person at the party. It isn't.
- **It interacts with everything else.** Mixed with cannabis: stronger and harder to track. Mixed with sleep meds or anxiety meds: respiratory depression risk. Mixed with stimulants (caffeine, study drugs): you feel less drunk than you are, which leads to drinking more, which leads to dangerous levels.

What "alcohol poisoning" actually looks like (memorize these — they save lives):

- **Unresponsive or only partially responsive.** Can't be woken by shouting, can be woken with hard shake but goes right back out, doesn't track when spoken to.
- **Slow or irregular breathing.** Fewer than 8 breaths per minute, or gaps of 10+ seconds between breaths.
- **Pale, blue-ish, or clammy skin.** Especially around lips and fingernails.
- **Vomiting while unresponsive.** Risk of choking on vomit while unconscious is a leading killer in alcohol poisoning.
- **Cold body temperature.**
- **Seizures.**

Any one of these = call 911. Don't wait. Don't "let them sleep it off." Don't make the call about whether anyone gets in trouble — make it about whether they make it.

The recovery position:

If someone is very drunk but breathing okay, put them on their side (left side preferred) with their top knee bent. This prevents choking on vomit. Stay with them. Don't leave to "let them rest alone."

Mixing alcohol with other things — the highest-risk combos:

- **Alcohol + benzodiazepines (Xanax, Klonopin, Ativan):** can stop breathing. Has killed many.
- **Alcohol + opioids (Vicodin, Percocet, OxyContin, fentanyl):** can stop breathing.
- **Alcohol + sleep medications:** same.
- **Alcohol + cocaine:** produces cocaethylene, much harder on the heart than either alone.
- **Alcohol + stimulants:** dangerously masks how drunk you are.

What to do if you're worried about your own drinking:

- **Notice patterns.** Drinking alone. Drinking to handle feelings. Blackouts. Drinking earlier than planned. Hiding it. Friends commenting on it. All of these are information.
- **Talk to someone.** A trusted adult, a school counselor, a doctor. SAMHSA helpline: ${SAMHSA_HELPLINE}.
- **It's normal to have a complicated relationship with alcohol as a teen.** Especially in families where alcohol is heavy. Genetic predisposition is real. Getting honest feedback from a counselor — not parents, if that's hard — is reasonable and confidential.

What this article doesn't say:

It doesn't say drinking is fine. It also doesn't say it's catastrophic. Alcohol carries specific risks for teens (developing brains, smaller bodies, less experience) and the most dangerous outcomes are usually from specific mistakes that information can prevent. The point is to have the information.`,
    takeaways: [
      "Alcohol poisoning red flags: unresponsive, slow breathing (<8/min), blue/pale lips, vomiting while out, seizures, cold body. ANY one = call 911.",
      "Recovery position: on their side, left preferred, top knee bent. Stay with them.",
      "Highest-risk mixes: benzos, opioids, sleep meds, stimulants. Mixing has killed many teens.",
      "Patterns to notice in yourself: drinking alone, blackouts, hiding it, drinking earlier than planned. Counselor / SAMHSA / doctor is the move."
    ]
  },
  {
    id: "cannabis-reality",
    category: "cannabis",
    title: "Cannabis: high-potency THC and the developing brain",
    summary: "The cannabis your parents had isn't the cannabis available now. Modern concentrates are dramatically more potent — and the teen brain is the most vulnerable to long-term effects.",
    readMinutes: 4,
    body: `Two things have changed about cannabis in the last 15 years that most teens don't know:

1. **The product is much stronger.** Average THC content in flower went from ~4% in the 1990s to 15-25%+ today. Concentrates / dabs / wax / shatter run 60-90% THC. Edibles can deliver 100mg+ in a single piece. The "it's just weed" framing was from a different product.

2. **Research on adolescent cannabis has matured.** The story is more specific than 1990s panic and more concerning than recent legalization narratives.

What the research consistently shows about teen cannabis use (under ~25):

- **Increased risk of cannabis use disorder.** ~1 in 6 teens who use cannabis develop persistent use problems, compared to ~1 in 11 adults.
- **Cognitive effects that persist.** Heavy adolescent use is associated with measurable IQ drops that don't fully recover, attention issues, and learning problems — even years after stopping.
- **Increased risk of psychotic disorders.** Especially with high-potency products. The risk is higher in people with family history of psychosis, but it's not limited to them.
- **Mood effects.** Daily cannabis use is associated with higher rates of depression and anxiety in adolescents, not lower.

This is research, not moralizing. The effects are dose-dependent, frequency-dependent, and concentration-dependent. Occasional low-dose use carries lower risk than daily high-dose dabbing. But the lowest-risk option is no use until the brain finishes developing.

What concentrates / edibles do that flower doesn't:

- **Concentrates (dabs, wax, shatter, vape carts):** 60-90% THC. Effects are stronger, faster, and harder to dose. Acute psychotic episodes (paranoia, panic, dissociation) are far more common than with flower.
- **Edibles:** delayed onset (60-90 min) means people often re-dose before the first hit lands, then end up at very high effective doses. ER visits for cannabis among teens are mostly edibles.

Acute red flags (when to call for help):

- **Severe panic, paranoia, dissociation that doesn't pass in a few hours.** Sometimes a single high-dose dose triggers an episode that needs medical attention.
- **Cannabinoid hyperemesis syndrome:** intense, repeated vomiting in people with chronic heavy use that won't stop. ER.
- **Inability to be soothed or oriented** — emergency room.

For most acute "bad highs":

- Get to a quiet, safe place.
- Hydrate.
- Sleep if you can.
- Black pepper (sounds weird, has some research support) and CBD can reduce acute THC overstimulation in some cases.
- Time. Most acute episodes resolve in hours.
- Don't drive. Don't operate anything dangerous.

What chronic use can look like in a teen:

- Daily or near-daily use.
- Use immediately on waking.
- Use to "handle" emotions, sleep, focus, social anxiety.
- Friend group is mostly defined by who uses.
- Loss of interest in things you used to enjoy when not high.
- School slipping in ways you don't fully explain to yourself.

If any of these patterns is true and you've thought about stopping but couldn't: that's not weakness, that's cannabis use disorder, which is real and treatable.

What helps:

- **SAMHSA helpline:** ${SAMHSA_HELPLINE}. Anonymous, free, 24/7. Will not get you in trouble.
- **School counselor.** Most are bound by confidentiality except for life-threat situations.
- **Pediatrician or therapist.** Cannabis-specific therapies (motivational enhancement, CBT for cannabis) work.
- **For severe cases:** there are youth-specific outpatient programs. Not residential rehab as the only option.

The honest version:

The product available today is different from the product your parents or older siblings might have used. The teen brain is the most vulnerable population. If you choose to use anyway, knowing this — lower potency, less frequency, no concentrates / dabs, no driving, no daily use — reduces risk meaningfully even if it doesn't eliminate it. The fully no-risk option is no use until ~25.`,
    takeaways: [
      "Modern THC products are dramatically more potent than what's in old framing. Concentrates run 60-90%; edibles run 100mg+.",
      "Teen-specific risks are real: ~1 in 6 develop use disorder; cognitive effects persist; psychotic-disorder risk elevated.",
      "Daily use, use on waking, use to handle emotions, school slipping = cannabis use disorder territory. Treatable.",
      "SAMHSA helpline anonymous and free: 1-800-662-HELP. School counselor or pediatrician also work."
    ]
  },
  {
    id: "pills-and-counterfeits",
    category: "pills_and_counterfeits",
    title: "Pills, study drugs, and the fentanyl reality",
    summary: "The single most dangerous substance issue in modern teen life: counterfeit pills containing fentanyl. This article is about not dying.",
    readMinutes: 4,
    body: `If you read one article in this section, read this one. Fentanyl deaths in teens have multiplied in the last 5 years, and almost all of them are from counterfeit pills — pills that look like Xanax, Percocet, Adderall, Oxycodone, or other prescriptions, but contain fentanyl instead.

The reality:

- **You cannot tell.** Counterfeit pills are pressed to look identical to real ones. They have the right markings, the right color, the right shape. There is no visual cue.
- **The dose is uneven.** Even within a batch from the same source, one pill might have 0 fentanyl and the next might have a lethal dose. There's no "test a little first" that works.
- **A lethal dose of fentanyl is tiny.** 2 milligrams — less than what fits on a pencil tip — can kill an opioid-naive person.
- **Most teens who die from fentanyl thought they were taking something else.** That's the pattern. Not a heroin habit; a single pill bought from someone they knew.

The categories of pills involved:

- **"Xanax" / "Percs" / "OxyContin" / counterfeit benzos and opioids.** These have been the leading source of teen fentanyl deaths.
- **"Adderall" sold by non-medical sources.** Increasingly contaminated. The fake-Adderall fentanyl deaths are real.
- **Almost any pressed pill from a non-pharmacy source.** Marketplace doesn't matter — Snapchat, in person, "friend of a friend."

The bottom-line rule:

**A pill not from a pharmacy bottle with your name on it has unknown contents.** Not "probably fine." Unknown. This is true for the friend who has them, the older sibling who has them, the trustworthy-seeming source. None of them can know what's actually in the pill.

If you or a friend is going to use anyway:

- **Test it.** Fentanyl test strips are legal in most US states, cheap, and detect fentanyl in pills, powders, or substances dissolved in water. They're not perfect (rare false negatives) but they catch most contaminated product. Available from harm-reduction organizations and many pharmacies.
- **Don't use alone.** Have someone sober with you.
- **Naloxone (Narcan) on hand.** Reverses opioid overdose, available over the counter at pharmacies in all US states as of 2023. Free in many states for teens to carry.
- **Start with a much smaller dose than you'd think.** This doesn't help if the fentanyl distribution within the pill is uneven (it often is), but for non-pressed forms it lowers risk.
- **Never mix with alcohol, benzos, or other depressants.** Respiratory depression is what kills.

Signs of opioid overdose (memorize):

- **Unresponsive.** Won't wake to shouting, sternal rub.
- **Blue lips, fingernails, or skin.**
- **Slow or no breathing.** Sometimes gurgling, choking sounds.
- **Pinpoint pupils.**

What to do, in order:

1. **Call 911 immediately.** Most US states have Good Samaritan laws — calling for help in a drug emergency protects the caller and (in most cases) the person overdosing from possession charges. Save them first, sort the legal questions later.
2. **Administer naloxone if available.** Nasal spray in one nostril. Wait 2-3 minutes. If no response, second dose in the other nostril.
3. **Rescue breathing.** Tilt head back, chin up, one breath every 5 seconds.
4. **Recovery position once they're breathing.**
5. **Stay until paramedics arrive.** Naloxone wears off in 30-90 minutes; opioid is still in their system; they can re-overdose.

Study-drug misuse (Adderall, Vyvanse, Ritalin):

Aside from the fentanyl contamination risk on non-medical sources, taking someone else's prescription stimulants has its own risks:
- Cardiac issues, especially if you have an undiagnosed heart condition.
- Sleep disruption that compounds badly over a school week.
- Diminishing returns — your body adapts, dose drift happens.
- It rarely produces the studying outcomes people imagine (some studies show no academic benefit in non-ADHD users).

If you genuinely have attention problems, see a doctor. There's a real, supervised path that doesn't involve random pills from a classmate.

Resources:

- SAMHSA: ${SAMHSA_HELPLINE}
- Naloxone (Narcan): over the counter at pharmacies
- Fentanyl test strips: harm-reduction orgs, some pharmacies, online
- Local Good Samaritan law: search your state's name + "Good Samaritan overdose law"

The point of this article is not to encourage use. The point is: if you or a friend are going to do this, the harm-reduction information is critical, and not having it has killed teens who would otherwise be fine.`,
    takeaways: [
      "Counterfeit pills containing fentanyl are the single highest-risk substance issue for teens right now.",
      "You cannot visually identify a counterfeit. Pharmacy-bottle-with-your-name = known. Anything else = unknown.",
      "Carry Narcan (OTC in all US states). Carry fentanyl test strips. Don't use alone. Don't mix with depressants.",
      "Overdose response: 911 immediately (Good Samaritan laws protect you), then naloxone, then rescue breathing, then stay."
    ]
  },
  {
    id: "friends-and-emergencies",
    category: "friends_and_emergency",
    title: "When a friend is in trouble: the amnesty mindset",
    summary: "Most overdose deaths happen because someone hesitated to call. Knowing the mindset ahead of time saves the second person at the same party.",
    readMinutes: 3,
    body: `The hardest thing about substance emergencies is the moment of hesitation. Someone's in trouble. You're not sober. You're worried about getting in trouble, parents finding out, school finding out, the person being mad. While you weigh those things, the person stops breathing.

The mindset to set ahead of time, before it ever happens:

**In a medical emergency, the call gets made. Period.**

Not "should I wait and see." Not "let's call their friend who knows them." Not "let them sleep it off." Not "let's drive them to the hospital." A medical emergency = 911 immediately.

Worry about everything else after they survive.

What "good Samaritan" laws actually cover:

Most US states have laws that protect people who call 911 in a drug or alcohol emergency from being charged for:
- Drug possession (in many states)
- Underage drinking
- Some paraphernalia possession
- Being present at the scene

This applies to BOTH the person calling and the person in trouble, in most states. It doesn't cover everything (selling, supplying, etc.), but the common situation — a few teens at a party where someone overdoses — is exactly what these laws were written to cover.

You can look up your state's law before you ever need it. Search the state name + "Good Samaritan overdose law."

How to actually call:

1. **State clearly:** "My friend is unresponsive and not breathing normally."
2. **Address.** Where are you, specifically.
3. **Stay on the line.** Dispatchers will give you instructions while paramedics are en route.
4. **Don't worry about the questions about substances.** Tell them what was taken if you know — it changes treatment. It's not going to get redirected to police as a priority over the medical response.

What to do BEFORE paramedics arrive:

- Stay with the person.
- If they're breathing but unresponsive — recovery position (on side, left preferred, top knee bent).
- If they're not breathing — rescue breathing (head tilted back, chin up, one breath every 5 seconds).
- If you have naloxone and you suspect opioids — administer.
- Don't put them in cold water or shower. Doesn't help; can hurt.
- Don't induce vomiting unless 911 dispatcher tells you to.

What to NOT do:

- Don't drive them yourself. Sometimes the right call is wait 5 minutes for paramedics; not drive at panic-speed across town.
- Don't move them around unnecessarily.
- Don't try to "walk it off."
- Don't try to make them throw up.

Specific warning signs that warrant a call even if it's not "the worst case yet":

- Breathing under 8 breaths per minute.
- Skin color changes (especially blue around lips, nails).
- Vomiting while unresponsive.
- Seizures.
- Can't be woken with shaking and shouting.
- After mixing substances (especially involving opioids, benzos, or alcohol-plus-depressants).

The framing that matters:

A teen who calls 911 and gets a friend revived is not "the teen who got everyone in trouble." They are the teen who saved a life. Friends sober and unsober have made this call and saved each other for as long as parties have existed. It is a thing you can do.

Aftermath conversations:

If you've been in a situation like this — whether you called or you didn't — that's worth talking to a trusted adult or counselor about. Witnessing or being involved in a substance emergency is genuinely scary, and it changes you. Carrying it alone makes it heavier.`,
    takeaways: [
      "Pre-commit: in a medical emergency, the call gets made. Not 'let me think.'",
      "Most US states have Good Samaritan laws — calling protects both you and the person in trouble for the common scenarios.",
      "Stay, put in recovery position, give rescue breathing or naloxone if needed. Don't drive them, don't 'walk it off'.",
      "If you've been through a substance emergency — witnessed or involved — counselor / trusted adult helps process it."
    ]
  },
  {
    id: "when-use-is-a-problem",
    category: "when_use_is_a_problem",
    title: "When use stops being occasional",
    summary: "Most teen substance use doesn't become a long-term problem. Some does. Here's how to recognize it without shame or denial.",
    readMinutes: 3,
    body: `Most teens who try substances don't develop ongoing problems. Some do. The distinction matters and most teens never see it explained cleanly.

Pattern indicators that occasional use has shifted:

**Frequency.** Once a month is different from twice a week is different from daily. Daily use of any substance in adolescence is a yellow-to-red flag.

**Function.** Use that's about a moment (going to a party, a specific night) is different from use that's handling something — anxiety, sleep, social discomfort, low mood. The handling-something pattern tends to escalate.

**Tolerance.** Needing more of the same thing to get the same effect is the body adapting. Tolerance escalation is one of the earliest signs of physical dependence.

**Withdrawal effects.** Feeling off, anxious, irritable, sleep-disrupted, or physically uncomfortable when you can't use is dependence.

**Loss of control.** Using more than you meant to, more often than you meant to, stopping later than you meant to. Repeatedly.

**Failed attempts to stop.** You've decided to take a week off; you couldn't. You've decided to cut back; you didn't. The intention and the action don't match.

**Cost to other parts of life.** School slipping, friends drifting, hobbies dropping, money going to the thing, relationships strained. Tracks of cost.

**Hiding it.** From parents, friends, partners, doctors. The hiding is often a more reliable signal than the use itself.

How clinicians diagnose substance use disorder (rough version, not for self-diagnosis): if 2-3 of those patterns are present, it's a mild substance use disorder. 4-5 = moderate. 6+ = severe. The threshold for "I should talk to someone" is much lower than diagnosis.

Why teens often don't notice the shift:

- It's gradual.
- Friend groups normalize each other's use.
- "I can stop anytime" is a script the brain produces faithfully, even when not true.
- Acknowledging it feels like admitting weakness, which feels worse than continuing.

What to do if you recognize some of this in yourself:

**Tell one person.** A counselor, a doctor, a trusted adult, an aunt, a coach — anyone whose reaction won't be panic or punishment. The first person doesn't have to be your parents.

**SAMHSA helpline: ${SAMHSA_HELPLINE}.** Anonymous, free, 24/7. They route you to local resources. Will not call your school or parents.

**School counselor.** In most states, school counselors are confidential except for immediate-danger situations. You can talk to them without it going to the principal or parents.

**Pediatrician.** Doctors are trained to handle this. Many states have laws protecting teen-doctor confidentiality on substance use specifically. Worth asking what's confidential before sharing.

**Therapist.** Substance-focused therapy (motivational interviewing, CBT) works. Outpatient is the default; residential is rare and for severe cases.

What's not the right answer:

- Trying harder. Use disorders aren't a willpower issue; they're brain-and-body chemistry.
- White-knuckling alone. Isolation makes everything worse.
- Replacing one substance with another.
- Waiting until it's "really bad." Earlier intervention works better. The shame of "is this bad enough yet" is part of what keeps people stuck.

A note for parents and trusted adults reading over a teen's shoulder:

If you're a teen reading this and worried someone you love is in this pattern, you're not the one who can fix it. You can express concern, you can tell a trusted adult, you can be a friend. The actual recovery work is theirs and a professional's. Loving someone with a substance issue is its own kind of hard, and there are resources for that too (Al-Anon, Alateen, family therapy).

Finally:

This is a hopeful topic, even though it doesn't read that way. Teens who get help early have very good outcomes. The treatment field is significantly better than it was a generation ago. People recover. The point of recognizing the pattern is to act on it, not to be ashamed of it.

Crisis: if substance use is paired with thoughts of not being here, that's a stop-everything-and-talk-to-an-adult moment. The Crisis page link at the bottom of every Kai screen has resources.`,
    takeaways: [
      "Frequency / function / tolerance / withdrawal / loss of control / failed attempts to stop / cost to life / hiding it — the patterns.",
      "Earlier intervention works better. The bar for 'I should talk to someone' is much lower than diagnosis.",
      "SAMHSA helpline (1-800-662-HELP), school counselor, pediatrician — confidential, won't get you in trouble.",
      "Use + dark thoughts → crisis-page resources + adult, now."
    ]
  },
  {
    id: "why-this-section-exists",
    category: "vaping_nicotine",
    title: "Why this section exists at all",
    summary: "Most substance content for teens is either fear-based or dismissive. Neither works. This is the case for harm reduction.",
    readMinutes: 2,
    body: `Most substance education teens receive falls into one of two failure modes:

**Fear-based.** Scare tactics, exaggerated claims, "this will ruin your life." Teens recognize the exaggeration immediately. The result: when they encounter a substance and don't have an immediate catastrophic reaction, they discount everything else they were told. The fear-based version damages the credibility of legitimate warnings.

**Dismissive.** "Everyone tries it." "Just be careful." "It's no big deal." This version underplays real risks (modern THC potency, counterfeit pill mortality, alcohol poisoning) and leaves teens without the specific information that prevents the dangerous outcomes.

**Harm reduction** is a third stance: name what's actually dangerous, name what's somewhat less dangerous, give specific information that reduces risk, and respect that teens make choices. The research support for harm reduction in adolescent populations is consistent and growing.

What harm reduction means in this section:

- Honest information about specific substances, not generic substance-panic copy.
- Specific medical red flags that save lives in emergencies.
- The Good Samaritan / amnesty framing for emergencies.
- Real escalation paths (SAMHSA, school counselor, pediatrician) that don't punish teens for asking.
- No instruction on how to use substances. The article tells you what's risky; not how to use them.
- No moralizing. No shame-based framing.

What this section is NOT:

- An endorsement of substance use.
- A substitute for a real conversation with a doctor, counselor, or trusted adult.
- Specific medical advice. If you're in a situation, call ${SAMHSA_HELPLINE} or 911.

Why this matters specifically for the teen audience:

- The risk landscape for current teens (fentanyl-contaminated counterfeits, 90% THC concentrates, modern nicotine devices) is different from anything previous generations encountered at the same age. Generic advice doesn't fit.
- Adolescents have specific vulnerabilities (developing brain, faster dependence formation) AND specific protective factors (most teens age out of risky use; treatment outcomes are good when initiated early).
- The single best correlate of staying safe around substances is having someone non-judgmental to talk to. That person is rarely the school. It's sometimes parents. It's often a counselor.

What this section hopes you take away:

If you're a teen reading this and you don't currently use substances: this information arms you for what other people might be doing around you, and gives you the medical red flags that could matter on a specific night.

If you're a teen reading this and you do use: this information lowers the risk profile of decisions you're already making, without lecturing you about them.

If you're a teen reading this and you're worried about your use: there are real, specific, confidential resources, and your situation is more treatable than it feels right now.

Kai is an AI. It is not a substitute for a trusted person. It is an okay place to start thinking, and it's a worse place than a real adult or clinician to get specific advice about your specific situation.`,
    takeaways: [
      "Fear-based education backfires; dismissive education underplays real risks. Harm reduction is the third stance.",
      "This section gives risk information and emergency red flags, not how-to instruction.",
      "Adolescent risk landscape is genuinely different now (fentanyl, 90% THC, modern nicotine devices).",
      "Kai is a starting point. A real adult or clinician is the better place for specific advice."
    ]
  }
];

export const SUBSTANCES_CATEGORY_LABEL: Record<SubstancesCategory, string> = {
  vaping_nicotine: "Vaping + nicotine",
  alcohol: "Alcohol",
  cannabis: "Cannabis",
  pills_and_counterfeits: "Pills + counterfeits",
  friends_and_emergency: "Friends + emergencies",
  when_use_is_a_problem: "When use is a problem"
};
