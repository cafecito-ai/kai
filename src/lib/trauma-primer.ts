/**
 * Trauma + difficult experiences primer. What trauma actually is, the body's
 * stress-response physiology, hypervigilance / numbness / dissociation,
 * the ACEs research, post-traumatic growth, and when to see a therapist.
 *
 * Voice rules (strict):
 *   - No casual use of the word "trauma" ("that was so traumatic") — the
 *     article models precise language.
 *   - No "good trauma / bad trauma" framing. Trauma is about the body's
 *     response, not a ranking.
 *   - No "everyone has trauma" dismissal; some people don't, and saying it
 *     erases people's specific experiences.
 *   - No "trauma is your superpower" / "what doesn't kill you makes you
 *     stronger" toxic positivity. Post-traumatic growth is real but not
 *     guaranteed.
 *   - No diagnostic claims. The primer describes patterns and points to
 *     clinicians; never says "you have PTSD."
 *   - Trauma in childhood is treatable. The primer doesn't catastrophize.
 *   - Abuse / acute trauma → trusted adult + 988 + childhelp hotline.
 *   - No re-traumatizing detail. The articles describe patterns, not
 *     graphic events.
 */

export type TraumaCategory =
  | "what_trauma_is"
  | "stress_response"
  | "aces_and_childhood"
  | "after_a_hard_event"
  | "complex_trauma"
  | "healing_and_growth";

export type TraumaArticle = {
  id: string;
  category: TraumaCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

/** US-based childhood abuse / neglect hotline. 24/7, confidential. */
export const CHILDHELP_HOTLINE = "1-800-422-4453 (Childhelp)";

/** Crisis Text Line. Works across many crisis categories. */
export const CRISIS_TEXT_LINE = "Text HOME to 741741";

/** RAINN (Rape, Abuse & Incest National Network) sexual assault hotline. */
export const RAINN_HOTLINE = "1-800-656-4673 (RAINN)";

export const TRAUMA_ARTICLES: ReadonlyArray<TraumaArticle> = [
  {
    id: "what-trauma-actually-is",
    category: "what_trauma_is",
    title: "What trauma actually means",
    summary: "Trauma is the body's response to an experience, not the experience itself. This distinction matters a lot.",
    readMinutes: 4,
    body: `The word "trauma" gets used a lot in modern teen vocabulary — sometimes precisely, often loosely ("that movie was traumatic," "my parents are so traumatizing"). The clinical and research definition is narrower and more useful.

**Trauma is the body's overwhelmed response to an event.**

Two people can experience the same event — a car accident, a parent's divorce, a friend's death, a violent assault — and only one of them ends up with trauma. The event matters, but what matters more is whether the body's stress system got overwhelmed in a way that altered how it responds to future stimuli.

Trauma is not:
- Just "something bad that happened." Bad things happen to everyone; not all of them become trauma.
- A character flaw or weakness. Trauma responses are biological, not personality.
- Inevitable from a given event. The same event can produce trauma in one person and not in another.
- Permanent. Many trauma responses resolve, sometimes on their own, often with help.

Trauma is:
- The body and brain remaining in a stress-response state long after the danger has passed.
- A specific set of physical and psychological patterns (covered in the next article).
- Treatable. The trauma field has developed evidence-supported approaches that work for most people who try them.

**The clinical distinction:**

Therapists generally distinguish:
- **Acute trauma:** response to a single event (a serious accident, a one-time assault, a sudden loss, a natural disaster).
- **Chronic trauma:** response to ongoing repeated exposure (long-term abuse, chronic medical conditions, war / displacement).
- **Complex trauma:** typically chronic trauma starting in childhood, especially involving caregivers or systemic safety.

These have different treatment paths and different effects, but they share the underlying physiology.

**What's NOT trauma (in the clinical sense):**

This is uncomfortable to say in current culture, but useful: not every hard experience produces trauma. Some hard things produce ordinary grief, sadness, anger, frustration. Calling everything "traumatic" dilutes a word that needs to keep meaning something specific.

This doesn't minimize the experiences. A bad breakup is genuinely hard. A teacher humiliating you is hurtful. A friend's betrayal is painful. They might or might not become trauma — depends on the body's response, not on whether you "earned" the trauma label.

**Why this distinction matters:**

- It tells you when to seek a specific kind of help. Trauma-informed therapy (EMDR, trauma-focused CBT, somatic experiencing) is different from general therapy.
- It validates without inflating. Your experience doesn't need to be "trauma" to deserve care.
- It protects the word. People with actual trauma responses get taken less seriously when the word is used loosely.

**Adverse Childhood Experiences (ACEs):**

The most influential framework in the trauma field is the ACEs study, which identified 10 categories of childhood adversity correlated with adult health outcomes:
- Emotional / physical / sexual abuse
- Emotional / physical neglect
- Witnessing violence in the home
- Parental separation / divorce
- Parental mental illness
- Parental substance abuse
- Parental incarceration

The original study (Felitti et al., 1998) found a dose-response relationship: more ACEs = higher risk of various adult physical and mental health outcomes. The pattern has been replicated thousands of times.

This is important context, with a caveat:

- High ACE scores correlate with elevated risk, NOT with destiny. Many people with high ACE scores have good lives; many with low ACE scores struggle.
- The framework left out important adversities (community violence, racism, poverty, bullying, illness, foster care).
- Knowing your ACE count is useful as information, not as a prediction.

**The honest takeaway:**

Trauma is a real, biological response to overwhelming experience. It's not the experience itself, not everyone gets it from the same events, and it's treatable. If you're using the word "trauma" loosely about everyday hard things, that's fine in casual conversation but worth knowing it has a more specific meaning when it comes to treatment. If you have actual trauma responses, the field has gotten significantly better at treating them in the last 20 years.`,
    takeaways: [
      "Trauma is the body's overwhelmed response to an event — not the event itself. Same event, different responses.",
      "Acute / chronic / complex are different categories with different treatment paths.",
      "Not every hard experience produces trauma. Using the word loosely dilutes its clinical meaning.",
      "ACEs correlate with risk, not destiny. Many people with high ACE scores have good lives."
    ]
  },
  {
    id: "stress-response-physiology",
    category: "stress_response",
    title: "What the body actually does when overwhelmed",
    summary: "Fight, flight, freeze, fawn. The classic four. Plus what each one feels like from the inside.",
    readMinutes: 4,
    body: `When the body's stress system perceives a threat, it activates a sequence of responses that have been refined over millions of years of evolution. Understanding what those responses feel like, from the inside, helps you recognize what's happening when it happens to you.

The four classic responses:

**1. Fight.**

The body activates for confrontation. Adrenaline + cortisol spike. Heart rate up, breath fast and shallow, blood pumps to large muscles, vision narrows, jaw tightens.

What it feels like:
- Anger that erupts faster than your thinking
- Wanting to argue, push back, hit something
- Tight chest, clenched fists
- "Hot" feeling in face and chest
- Sometimes a sense of righteous clarity ("they deserve this")

When this is the dominant response: you may have a pattern of getting "fight-y" under stress — arguing with parents, escalating with peers, intense in school disagreements.

**2. Flight.**

The body activates for escape. Similar adrenaline/cortisol but routed toward leaving rather than confronting.

What it feels like:
- Urgent need to leave, immediately
- Racing thoughts about exits
- Restless legs, can't sit still
- Stomach drops; sometimes nausea
- Avoidance of specific places / people / topics

When this is the dominant response: you may avoid hard conversations, leave situations early, distract via phone / scroll / busy work, struggle with feeling pinned down.

**3. Freeze.**

The body becomes immobilized. Adrenaline still high, but motor activity shuts down. This is the "deer in headlights" response. Common when fight and flight aren't possible (smaller person, no exit, no allies).

What it feels like:
- Going still, sometimes paralyzed
- Disconnected from the body, fuzzy thinking
- Can't speak, can't move
- Time feels slow or weird
- Sometimes a strange calm that's actually shutdown

When this is the dominant response: you may go quiet in conflicts, "blank" during exams, find yourself unable to act when needing to.

**4. Fawn.**

A less-known response: the body tries to defuse threat by appeasing the threat-source. This is most common in people who grew up with unpredictable or threatening caregivers.

What it feels like:
- Auto-agreeing, even when you don't agree
- Compulsive helpfulness during conflict
- Inability to say no
- Reading other people obsessively to anticipate their needs
- Feeling responsible for other people's emotions

When this is the dominant response: you may struggle with boundaries, over-apologize, find yourself doing things you don't want to do because someone seemed displeased.

**Why this matters:**

These are not personality traits. They're survival responses. Everyone has all four available. People who experienced ongoing childhood stress often have a "preferred" response that becomes the default — the one that worked best in their early environment. This is biological, not chosen.

Knowing your dominant response is useful because:
- You can name what's happening when it happens ("I'm in fight mode right now").
- You can recognize when a current situation isn't actually dangerous but your body is reacting as if it is.
- Therapy approaches differ depending on your dominant response.

**The fifth response: tonic immobility / collapse.**

Beyond freeze is a deeper shutdown — the body essentially "plays dead." Heart rate drops, dissociation deepens, the person may not be able to recall the event clearly afterward. This is most common in sexual assault and severe medical trauma. The fact that someone didn't fight or flee is not consent or compliance — it's a biological response the body chose to keep them alive.

This is one of the most important things victims of acute trauma can hear: "I froze" doesn't mean "I let it happen." The body chose freeze because fight and flight weren't safe options.

**Dissociation.**

A related response is dissociation — a sense of being outside your body, watching yourself from above, feeling unreal or far away. This is common during overwhelming events and can persist as a trauma response.

Dissociation is the brain's way of distancing from unbearable input. It served you in the moment. It becomes a problem when it shows up outside of danger — during normal life, during conversations, during intimate moments.

**Co-regulation.**

A key piece of trauma physiology is that the body regulates better with another body present — specifically, with a calm body. This is called co-regulation. It's why being held by someone safe calms you faster than self-soothing alone. It's why therapy works partly through the therapist's presence, not just their words.

For teens with trauma responses, having one calm, predictable person in your life is one of the strongest protective factors.

**The takeaway:**

The body's stress responses are not failures. They are biology working as designed, sometimes in environments they weren't designed for. Understanding what's happening doesn't fix it, but it makes it less confusing and shameful, and points to specific treatments that work.`,
    takeaways: [
      "Four stress responses: fight, flight, freeze, fawn. Plus deeper shutdown (tonic immobility) and dissociation.",
      "Your dominant response was shaped by what worked in early environment. Biology, not character.",
      "Freezing during assault is not consent. It's a biological choice the body made to keep you alive.",
      "Co-regulation (being with a calm body) is one of the strongest protective factors."
    ]
  },
  {
    id: "aces-and-childhood-adversity",
    category: "aces_and_childhood",
    title: "Adverse childhood experiences: the research, plainly",
    summary: "ACEs are correlated with adult outcomes, but they're not destiny. Knowing your number is data, not a prediction.",
    readMinutes: 4,
    body: `The ACEs study is the most influential research in modern trauma. It's worth understanding what it actually says — and what it doesn't.

**The 10 categories the original study measured:**

Abuse (count if it happened repeatedly before age 18):
1. Emotional abuse
2. Physical abuse
3. Sexual abuse

Neglect:
4. Emotional neglect (no one cared)
5. Physical neglect (basic needs unmet)

Household dysfunction:
6. Mother / female caregiver treated violently
7. Substance abuse in the home
8. Mental illness in the home
9. Parental separation or divorce
10. Household member incarcerated

You count one point per category that applies, for a score of 0-10.

**What the research consistently finds:**

- Higher ACE scores correlate with elevated risk of: depression, anxiety, substance use, suicide attempts, heart disease, autoimmune conditions, obesity, certain cancers, early death.
- The relationship is dose-dependent — more ACEs, higher risk.
- ACE score 4+ is associated with notably elevated risk across categories. About 1 in 8 adults have a score of 4 or higher.
- The mechanism is partly behavioral (early adversity → coping strategies like substance use → health problems), partly biological (chronic stress alters HPA axis, immune function, brain development).

**What the research is often misread as:**

- ACEs are NOT destiny. Many people with high ACE scores have good adult outcomes. Resilience is real.
- ACEs do NOT mean you'll definitely develop these conditions. They mean elevated statistical risk in populations, not certainty for individuals.
- The list isn't exhaustive. Major adversities not captured by the original study include: community violence, racism, poverty, homelessness, foster care system involvement, bullying, serious childhood illness, immigration trauma.
- ACEs don't "expire" — they happened. But their effects are highly modifiable through later experience, relationships, and treatment.

**What protects against ACE-related outcomes:**

The research has gotten clearer on protective factors:

1. **One stable, caring adult.** Even one. A grandparent, an aunt, a coach, a teacher, a neighbor. This is the single most consistent protective factor across studies.
2. **Sense of belonging.** A community, religious group, sports team, school where someone notices when you're not there.
3. **Skill mastery.** Becoming genuinely good at something, anything. Music, sport, art, academic, vocational.
4. **Social-emotional skills.** Knowing how to manage emotions, communicate, problem-solve. Learnable.
5. **Self-efficacy.** A sense that you can affect your own life. Built through agency, choice, mastery.

Notice: most of these are accessible at any age. ACE damage isn't done. The brain remains plastic into your 20s and beyond.

**For teens reading this with a high count:**

A few things worth knowing:

- You're not broken. The patterns you might recognize in yourself (hypervigilance, trust issues, intense reactions, dissociation, difficulty regulating emotions) are normal responses to abnormal environments. They were adaptive in the original context.
- These patterns are treatable. Trauma-focused therapy (TF-CBT for adolescents, EMDR for many people, dialectical behavioral therapy for emotional regulation issues) has strong evidence.
- You don't need to remember everything in detail to heal. Healing doesn't require re-experiencing in the way old therapy models assumed.
- A high ACE score is not a curse. People with high counts have changed lives, written books, raised healthy kids, lived well. Genetics plus current relationships plus access to treatment matter more than the count alone.

**For teens reading this with a low count:**

A few things:

- Low ACE doesn't mean nothing's hard for you. People with low ACEs still have struggles; they just look different.
- The list misses many real adversities. Your specific hard things may not be on it.
- You can still be helpful to friends with higher counts. Co-regulation by a safe person is one of the most powerful protective factors.

**The current state of ACE research:**

The original Kaiser-CDC study was from a mostly white, middle-class HMO population in San Diego in the 1990s. Subsequent research has confirmed the basic findings across populations but has also expanded the framework to include other forms of adversity.

The 988 / Crisis Text Line / Childhelp resources exist for teens currently in adverse home situations: 988 (general crisis), text HOME to 741741 (Crisis Text Line), and **${CHILDHELP_HOTLINE}** for ongoing abuse / neglect.

**The honest summary:**

ACEs are real, the research is solid, and knowing your number is useful self-knowledge. Just don't confuse risk-elevation with destiny. The most consistent protective factor is one stable, caring adult — which means relationships you build now matter materially for how the rest of your life goes.`,
    takeaways: [
      "10 ACE categories, dose-response with adult health outcomes. Score 4+ = elevated risk across many conditions.",
      "ACEs are correlation with risk, not destiny. Many people with high scores have good outcomes.",
      "One stable, caring adult is the single most consistent protective factor. Skill mastery, belonging, self-efficacy follow.",
      "Active abuse / neglect → 1-800-422-4453 (Childhelp), 988 (crisis), 741741 (Crisis Text Line)."
    ]
  },
  {
    id: "after-a-hard-event",
    category: "after_a_hard_event",
    title: "After something hard happens: what's normal in the days and weeks after",
    summary: "Most acute stress responses resolve within a month. Knowing what's normal vs. what suggests deeper trauma matters.",
    readMinutes: 4,
    body: `If something serious has just happened to you — an accident, an assault, a violent event you witnessed, a sudden loss, a near-miss — your nervous system is doing a lot of work in the days and weeks after. Knowing what's normal vs. what suggests deeper trauma helps you know when to seek help.

**The first 72 hours:**

Most acute stress responses look like this:
- Shock, numbness, unreality (sometimes alternating with sharp emotion)
- Sleep disruption (insomnia or hypersomnia)
- Appetite changes
- Flashes of the event, often in fragmented ways
- Tearfulness or sudden emotion
- Hypervigilance (jumpy, scanning for threats)
- Avoidance of related places / topics / people
- Physical symptoms: headache, nausea, fatigue
- Difficulty concentrating
- Reaching for substances to cope
- Difficulty articulating what happened

All of these are normal acute stress reactions. They don't mean you have PTSD. PTSD requires symptoms persisting more than a month plus specific patterns.

**The first month:**

Most people's acute responses gradually fade over 2-4 weeks. You might still:
- Have occasional intrusive memories
- Feel emotionally raw
- Be hyper-aware of safety
- Need extra sleep or food
- Feel disconnected from normal life
- Avoid the location, conversations, similar situations

By the end of the first month, most people are functioning roughly normally, with awareness of the event but not constant disruption.

**Signs that warrant earlier (rather than later) help:**

- Intrusive memories that don't fade or get worse over weeks
- Inability to function at school, work, or in basic life tasks
- Avoidance becoming severe (can't leave the house, can't sleep alone, can't see related people)
- Strong dissociation (feeling outside your body, lost time, fuzzy thinking) persistent
- Sleep severely disrupted for more than a couple of weeks
- Substantial change in personality or behavior
- Thoughts of not being here
- Substance use as the main coping strategy
- Self-harm

Any of these → tell an adult, see a clinician.

**What helps in the early days:**

- **Tell someone trusted.** The person you can predict will help, not punish. Doesn't have to be the perfect person; just one.
- **Basic care.** Sleep when you can. Eat regularly. Hydrate. Move gently. Avoid alcohol / drugs as a coping strategy — they're tempting and they often make things worse.
- **Routine.** Predictable rhythms help the nervous system settle. Skip activities that aren't essential right now, but maintain the basic structure of your days if you can.
- **Co-regulation.** Time with safe, calm people. Doesn't have to involve talking about what happened.
- **Limited media.** Consuming graphic or related content can re-activate the stress response. News, social media, related shows — pull back during the acute period.
- **Gentle movement.** Walking, yoga, slow swimming. Helps discharge the energy the stress system loaded into the body.

**What doesn't help:**

- **Pretending it didn't happen.** "Moving on" via suppression usually delays the work the nervous system needs to do.
- **Telling the story repeatedly to people who can't really receive it.** Rehashing without a useful frame can re-traumatize. A trauma therapist can structure this; random people can't.
- **Major decisions right now.** Defer big choices if possible.
- **Alcohol / substances.** Initially feels like relief; tends to interrupt the nervous system's natural processing.
- **Scrolling.** The phone is rarely a good companion during acute stress. Real bodies are.

**Different kinds of acute events have different specifics:**

**After a physical or sexual assault:**
- Medical care is important even if there's no visible injury (STI risk, evidence collection if you choose).
- RAINN's National Sexual Assault Hotline: **${RAINN_HOTLINE}**. They can route you to local resources and help you think through what you want to do.
- Reporting to police is your choice. There's no one right answer. Many factors go into this decision.
- A trauma-informed counselor is the single best clinical resource.

**After a sudden death:**
- See the grief primer. Acute grief and acute trauma overlap when the death is sudden / violent.
- Time off school is usually warranted; school counselors can help with this.

**After witnessing violence:**
- "Vicarious trauma" is real. Witnessing serious events affects your nervous system, sometimes substantially.
- The same advice applies: care, sleep, food, safe people, professional help if it's not resolving.

**After an accident:**
- Physical recovery and psychological recovery have separate timelines. Both deserve attention.
- Acute stress disorder is a real diagnosis that can develop in the first month after an accident; trauma therapy can address it before it becomes PTSD.

**The window for early intervention:**

Trauma research shows that intervention in the first weeks after an event can prevent acute stress from becoming PTSD. This is one of the cases where seeing a therapist sooner rather than later matters.

If you've been through something serious and you're not sure whether to talk to someone — talk to someone. The downside is small (a few sessions you don't need). The upside is preventing months or years of harder problems.`,
    takeaways: [
      "Acute stress responses (sleep, intrusion, avoidance, hypervigilance) in the first 2-4 weeks are normal. PTSD requires >1 month + specific patterns.",
      "Watch for: not improving over weeks, severe avoidance, persistent dissociation, dark thoughts. These warrant earlier help.",
      "Care + co-regulation + routine + gentle movement helps. Alcohol / scrolling / pretending generally don't.",
      "Early intervention can prevent PTSD. Sooner is better. RAINN (1-800-656-4673) for sexual assault. Trauma-informed counselor."
    ]
  },
  {
    id: "complex-trauma-patterns",
    category: "complex_trauma",
    title: "Complex trauma: when the hard things were ongoing",
    summary: "Complex trauma comes from repeated exposure, often in childhood, often with caregivers involved. The patterns are different.",
    readMinutes: 4,
    body: `When trauma happens once, the patterns are usually about that event. When trauma was chronic — ongoing childhood abuse, prolonged neglect, growing up with a parent's untreated severe mental illness or addiction, sustained bullying, repeated medical procedures, living in a violent environment — the patterns are different and more pervasive.

This is called *complex trauma* (or *complex PTSD* in some frameworks). It's not yet a formal DSM diagnosis in the US (it's recognized in the WHO's ICD-11), but it describes a real, identifiable pattern.

**Common features of complex trauma:**

- **Difficulty regulating emotions.** Big reactions to small triggers. Or numbness that comes and goes. The emotional volume knob feels broken.
- **Persistent negative self-concept.** "I'm fundamentally bad / worthless / unlovable." Not a passing thought; a baseline belief.
- **Difficulties in relationships.** Trust issues, fear of abandonment, fear of intimacy, attraction to people who hurt you, difficulty sustaining closeness.
- **Hypervigilance as a baseline state.** Always scanning. Sleep disrupted. Hard to relax.
- **Dissociation as a coping mechanism.** Spacing out, losing time, feeling unreal, watching yourself from outside.
- **Somatic symptoms.** Chronic pain, GI issues, autoimmune problems, sleep problems, headaches. The body keeps the score.
- **Difficulty with authority and structure.** Sometimes deep mistrust of teachers, doctors, institutions.
- **Identity confusion.** Not sure who you are. Adapt to whoever you're with.
- **Sometimes interpersonal violence patterns.** Drawn into harmful relationships repeatedly, or repeating harmful patterns yourself.

These are not character flaws. They are adaptations to an environment where you were not safe — adaptations that helped you survive then but cause problems now.

**Specific kinds of complex trauma you might recognize:**

**Growing up with a parent with severe untreated mental illness.**
- The parent's moods became your weather.
- You learned to read their state constantly.
- You felt responsible for their wellbeing.
- Stability of the household depended on their state, not on schedules or rules.

**Growing up with parental substance abuse.**
- Walking on eggshells.
- Unpredictable consequences for small things.
- Hiding the family situation from peers.
- Carrying adult responsibilities (parentification).

**Chronic emotional abuse.**
- Constant criticism, humiliation, contempt.
- Being made to feel responsible for the abuser's emotions.
- Threats, shaming, isolation from supports.
- Gaslighting (being told your reality isn't real).

**Sexual abuse or assault by family member.**
- One of the most psychologically damaging because the perpetrator is the supposed protector.
- Often comes with intense secrecy, shame, and confusion.
- The body's freeze response often kicks in, then becomes a chronic state.

**Chronic medical trauma.**
- Repeated painful procedures, especially in early childhood.
- Loss of bodily autonomy.
- Hospital settings as both safe and unsafe simultaneously.

**Bullying that lasted years.**
- Sustained social attack across childhood/adolescence.
- Hypervigilance about social rejection.
- Lasting effects on self-worth and trust.

**Foster care / system involvement.**
- Multiple placements, multiple primary caregivers.
- Lack of stable attachment figure.
- Often combines with other adversities.

**War, displacement, immigration trauma.**
- Multiple losses (home, country, language, community).
- Often paired with parental trauma — the parents carrying their own.
- Specific cultural complexity.

**Why this matters for teens:**

If any of this describes your childhood or your current situation, you're carrying something specific. The patterns above are not "issues with you." They are wired-in responses to environments that weren't safe.

The good news is that complex trauma responds to treatment. Multiple approaches have evidence:

- **Trauma-focused cognitive behavioral therapy (TF-CBT)** for adolescents.
- **EMDR (Eye Movement Desensitization and Reprocessing)** for many trauma types.
- **Dialectical behavioral therapy (DBT)** for the emotional regulation difficulties.
- **Internal Family Systems (IFS)** for working with the parts of self that carry trauma.
- **Somatic experiencing / somatic-based therapies** for the body-level work.
- **Schema therapy** for the deeper identity patterns.

For severe cases, residential or intensive outpatient programs exist. Many teens have access through their insurance (or Medicaid/CHIP in the US), school counselor referrals, or community mental health.

**Specific situations require specific help:**

- **If you're currently being abused** (physically, sexually, emotionally): Childhelp **${CHILDHELP_HOTLINE}**. Confidential, 24/7. They route to local protection resources. School counselors are mandated reporters but can also help.
- **If you experienced sexual abuse or assault** at any point: RAINN **${RAINN_HOTLINE}**. Has specific support for survivors of childhood sexual abuse.
- **If you're in foster care**: ask your caseworker about therapy specifically for trauma. State Medicaid usually covers it.
- **For LGBTQ+ teens** with family rejection or related trauma: Trevor Project (1-866-488-7386) has trauma-informed support.

**What healing looks like:**

This is the part media gets wrong. Healing complex trauma is not:
- A single therapeutic breakthrough.
- Forgiving everyone who hurt you.
- Letting it go.
- Cutting everyone off forever.
- Reaching a state where you never react to triggers.

Healing is more often:
- Slow, sometimes nonlinear.
- Building one safe relationship at a time.
- Learning to recognize triggers and not react automatically.
- Integrating the experience into a life that's bigger than it.
- Developing self-compassion, slowly.
- Sometimes years of work.

It's worth it. People who heal from complex trauma describe lives that include real joy, real connection, real meaning. The patterns soften. The hypervigilance can ease. New relationships can be different from old ones.

You're not the events that happened to you. You're the person doing the work of integration. That's a different identity, available to you.`,
    takeaways: [
      "Complex trauma comes from chronic exposure, often in childhood, often with caregivers involved. It's a distinct pattern.",
      "Features: emotional regulation difficulty, negative self-concept, relationship difficulty, hypervigilance, dissociation, somatic symptoms.",
      "Multiple evidence-supported treatments (TF-CBT, EMDR, DBT, IFS, somatic, schema therapy). Find a trauma-trained therapist, not just any therapist.",
      "Currently being abused → Childhelp (1-800-422-4453), school counselor (mandated reporter), 988. Sexual abuse → RAINN (1-800-656-4673)."
    ]
  },
  {
    id: "healing-and-growth",
    category: "healing_and_growth",
    title: "Healing, post-traumatic growth, and the work that actually helps",
    summary: "Healing trauma is possible. Growth from trauma is real, but not required and not automatic.",
    readMinutes: 4,
    body: `Two things are true:

1. Trauma responses are real and persistent without treatment.
2. Healing is possible. The trauma-treatment field has gotten substantially better in the last 20-30 years.

This article is about what actually helps, what doesn't, and how to think about "post-traumatic growth" without buying the toxic-positivity version of it.

**What actually helps (evidence-supported):**

**1. Trauma-trained therapy.**

The biggest single thing. Not just any therapist — a therapist trained specifically in trauma work. Some approaches with strong evidence:

- **EMDR (Eye Movement Desensitization and Reprocessing).** Counterintuitive on first look (rapid eye movements while recalling memories), strong evidence for many trauma types. Often shorter than traditional talk therapy.
- **Trauma-Focused CBT (TF-CBT).** Specifically for children and adolescents. Structured, evidence-supported.
- **Prolonged Exposure (PE).** Gradual, structured re-engagement with traumatic memories in a safe context.
- **Cognitive Processing Therapy (CPT).** Focuses on the meanings made of the trauma.
- **Somatic Experiencing.** Body-based, works with the nervous system's stress responses.
- **Internal Family Systems (IFS).** Works with the parts of self that carry trauma.

How to find one:
- Psychology Today therapist finder (psychologytoday.com), filter by trauma + your insurance.
- School counselors can usually refer.
- Many therapists list specialties on their websites.
- Ask about training in specific modalities (EMDR, TF-CBT, etc.).

**2. Safe relationships.**

The relationships you have now matter as much as the relationships that caused trauma. People who heal usually do so partly through experiencing safe attachment in current life — a trustworthy friend, a stable family member, a therapist, eventually a partner.

You don't have to wait until you're "healed" to build these. The relationships are part of the healing.

**3. Body-based practices.**

Trauma lives in the body. Practices that engage the body help discharge what stays stored:
- Yoga (especially trauma-informed yoga)
- Tai chi / qigong
- Dance / movement
- Walking, especially in nature
- Swimming
- Strength training
- Breathwork

Daily practice over time matters more than which specific practice you choose.

**4. Sleep, food, basic biology.**

The body can't heal trauma when it's running on fumes. Sleep hygiene, real food, water, movement, time outside — the boring infrastructure of healing.

**5. Medication, sometimes.**

For some people, medication (SSRIs, sleep aids, sometimes specific PTSD medications like prazosin for nightmares) is useful adjunct to therapy. A psychiatrist (not just a therapist) handles this. Medication doesn't "cure" trauma — it makes the work of therapy more accessible by reducing acute symptoms.

**6. Specific things that help in early stages:**

- Learning your stress responses and their triggers.
- Building a "window of tolerance" — increasing what you can be present with without dissociating or panicking.
- Practicing self-compassion (not self-love affirmations; actual self-compassion).
- Naming what happened — to yourself, to a safe person, to a therapist.

**What mostly doesn't help (or actively hurts):**

- **Forced forgiveness.** "You need to forgive them to heal" is not supported by research. Some people heal without forgiving; some forgiveness is healthy, some is premature.
- **Cutting off all support.** "I just have to focus on myself" tends to leave people more isolated and stuck.
- **Pure cognitive reframing.** "Just think differently about it" doesn't work because trauma isn't primarily in the cognitive layer.
- **Talking about it endlessly without structure.** Re-telling without therapeutic frame can re-traumatize.
- **Substance use.** Common, understandable, makes things worse over time.
- **Avoiding everything related.** Avoidance is a trauma symptom that maintains the trauma.
- **Trauma-as-personality.** Building your whole identity around "I'm a trauma survivor" can entrench the patterns. Trauma is something that happened to you; it isn't you.

**Post-traumatic growth — the honest version:**

Post-traumatic growth (PTG) is a research-supported phenomenon: some people, after working through trauma, report meaningful changes in:
- Sense of personal strength.
- Closer relationships.
- New possibilities or paths.
- Spiritual / existential change.
- Appreciation for life.

This is real. People do come through trauma with depth and capacity they didn't have before. It's been documented across many populations.

But:
- **PTG isn't automatic.** It happens with active processing, not just time.
- **PTG doesn't require you to be grateful for what happened.** You can grow from working through trauma without endorsing the trauma.
- **PTG and ongoing pain coexist.** Growing doesn't mean done hurting.
- **"What doesn't kill you makes you stronger" is wrong.** Things that don't kill you sometimes leave you weaker, sometimes leave you stronger, depending on what happens after.

The pressure on trauma survivors to be "transformed" by their experience is another form of toxic positivity. You don't have to become wiser or more compassionate or more grateful because of what happened. You're allowed to heal without finding meaning in it. The meaning, if any comes, is yours to find — not anyone else's to demand.

**A frame that helps:**

Healing trauma is less like fixing a broken bone and more like learning a second language. The first language (the trauma responses) doesn't go away; you become fluent in a second language (regulated, connected, present) and over time, you live more in the second language than the first.

You don't forget the first language. You stop having to live there.

**Where to start:**

If you're identifying with what's in these articles and don't know where to start:

1. **Tell one trusted person** what you're going through. Doesn't have to be everything; doesn't have to be the perfect person.
2. **Get a therapist** with trauma training. School counselor can help find one. Insurance covers it; Medicaid usually covers it; sliding-scale community mental health exists.
3. **Take basic care of the body.** Sleep, food, water, gentle movement, time outside.
4. **Limit re-traumatizing input.** News cycles, certain media, certain people, scroll behavior that re-activates.
5. **Be patient with yourself.** This is years of work. Worth doing.

If you're in immediate crisis (suicidal thoughts, active abuse, danger): 988 for crisis support, 911 if there's immediate medical danger, ${CHILDHELP_HOTLINE} for child abuse / neglect, ${RAINN_HOTLINE} for sexual assault. The Crisis page link at the bottom of every Kai screen has more.

Healing is possible. People do it every day. You're not alone in this.`,
    takeaways: [
      "Trauma-trained therapy (EMDR, TF-CBT, PE, IFS, somatic, CPT) > generic therapy. Ask specifically about trauma training.",
      "Healing is partly cognitive, partly relational, partly somatic. All three layers matter.",
      "Post-traumatic growth is real but NOT required. You can heal without being grateful for what happened.",
      "Crisis: 988 (general), Childhelp 1-800-422-4453 (active abuse), RAINN 1-800-656-4673 (sexual assault), 911 (immediate danger)."
    ]
  },
  {
    id: "what-trauma-is-not",
    category: "what_trauma_is",
    title: "Words and casual use: what trauma is not",
    summary: "Naming things precisely matters. A short list of things that are real but not trauma.",
    readMinutes: 3,
    body: `The word "trauma" has gone mainstream, which is mostly good — more people seek help, more conversations happen, more services exist. It's also led to dilution. Things that are real and significant but aren't clinically trauma sometimes get labeled that way, and the result is the word becomes less useful when actual trauma is being discussed.

This article isn't to police anyone's vocabulary — use words as feels right in casual conversation. It's to give you the precision you'd want if you ever needed to describe what you're actually experiencing to a clinician or a researcher.

**Things that are hard but typically aren't trauma:**

**A bad breakup.**
Painful, sometimes devastating, often produces grief responses. Becomes trauma only if it involved abuse, was experienced as a threat to safety, or the body got stuck in a chronic stress-response state afterward. Most breakups don't.

**Parental divorce.**
Significant, often grief-producing, sometimes destabilizing. Becomes trauma if it involved abuse, violence, or chronic instability. Most divorces in themselves aren't trauma even though they're hard.

**An embarrassing moment.**
The "trauma response" of cringing at a memory from 2 years ago is not trauma in the clinical sense. It's social pain, which is real, and which the brain processes through similar circuitry — but the body usually moves through it.

**A bad teacher / coach / boss.**
Painful, often unfair, sometimes lasting psychological effects. Generally not trauma unless involved sustained abuse, threats, or violence.

**Family conflict you grew up with.**
Hard, sometimes significantly hard. Becomes trauma at the level of complex trauma when it included specific patterns (abuse, neglect, gaslighting, threats, instability). General conflict alone usually isn't.

**A friend ghosting you / friend group drama.**
Real social pain. Not trauma in the clinical sense (with rare exceptions involving systematic bullying / harassment).

**Watching a hard movie / reading a hard book / hearing a hard story.**
Can produce activation, sometimes vivid. Not trauma. (Vicarious trauma from sustained professional exposure — first responders, therapists, journalists — is different.)

**Why the precision matters:**

When someone says "I'm traumatized by what happened" loosely, two things happen:

1. The listener may not understand whether they're saying "I'm sad / hurt / mad" or "I have a clinical trauma response that requires specific treatment."
2. People with actual trauma can feel dismissed when their experience gets lumped in with everyday hard moments.

This isn't about silencing or hierarchizing pain. It's about having multiple words for multiple things.

**Better words for hard things that aren't trauma:**

- "That hurt." (For social pain.)
- "I was really upset by that." (For acute emotional reactions.)
- "That's grief / I'm grieving." (For loss.)
- "That's been really stressful." (For acute or chronic stress.)
- "I'm struggling with that." (For ongoing difficulty.)
- "That was painful." (For most emotional injury.)
- "I felt unsafe." (For specifically threat-experiences.)
- "I was overwhelmed." (For overload that didn't necessarily become trauma.)
- "That was hard for me." (Universally true.)

These are all real and valid. None of them have to be "trauma" to deserve attention.

**When the word IS the right one:**

- When an event was so overwhelming that the nervous system kept responding to it after the event ended.
- When you're experiencing intrusive memories, severe avoidance, hyperarousal, or dissociation lasting beyond a month.
- When something that should be safe now (a relationship, a place, a body sensation) triggers your stress response.
- When you experienced acute danger to your physical safety or witnessed violence.
- When you experienced abuse — physical, sexual, severe emotional.
- When something altered how you experience the world afterward.

If those describe your experience, "trauma" is the right word, and seeking trauma-specific treatment is the move.

**A note on memes and content:**

A lot of teen mental health content online uses "trauma" loosely. "When you're traumatized by..." about ordinary teen life. This is not accurate clinical use. It's also not necessarily harmful — but it can leave teens uncertain about whether they have "real" trauma or not.

The clinical question isn't whether you've earned the label. The clinical question is: what's happening in your nervous system right now, and what kind of help would address it?

A general therapist can address ordinary hard things. A trauma-trained therapist is appropriate for clinical trauma. Both are legitimate kinds of help.

**The takeaway:**

Use language as feels natural in casual conversation. Get precise when it matters — when you're describing what you need to a clinician, when you're trying to understand your own experience, when you're deciding what kind of help to seek. "Trauma" is a powerful word; saving it for when it accurately applies preserves its power.`,
    takeaways: [
      "Many hard things aren't clinical trauma — breakups, divorce, embarrassment, friend drama, family conflict.",
      "Precision matters when you're describing your experience to a clinician or trying to figure out what help you need.",
      "Better words for hard things: hurt, sad, mad, grief, stress, overwhelmed, struggling, painful, unsafe.",
      "Trauma is real, treatable, and deserves the right word. Saving the word for when it applies keeps it useful."
    ]
  }
];

export const TRAUMA_CATEGORY_LABEL: Record<TraumaCategory, string> = {
  what_trauma_is: "What trauma is",
  stress_response: "Stress response",
  aces_and_childhood: "ACEs + childhood",
  after_a_hard_event: "After a hard event",
  complex_trauma: "Complex trauma",
  healing_and_growth: "Healing + growth"
};
