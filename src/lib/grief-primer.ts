/**
 * Grief + loss primer. One of the most common but least-explained
 * experiences teens face. Covers death of a loved one, pet loss,
 * non-death loss (breakups, friendships, moves, identity changes),
 * anticipatory grief (terminal illness, decline), and complicated grief
 * patterns.
 *
 * Voice rules (strict):
 *   - Grief is not a problem to be solved. The product never tells teens
 *     they "should be over it by now."
 *   - No prescriptive "stages of grief." Kübler-Ross stages are described
 *     as one historical model that doesn't apply linearly to most people.
 *   - "Closure" framing is named as a myth, gently.
 *   - Non-death loss is treated as legitimate grief, not "lesser."
 *   - Grief paired with thoughts of not being here → counselor / Crisis page.
 *   - Cultural and religious differences in grieving are honored without
 *     prescribing any particular practice.
 */

export type GriefCategory =
  | "what_grief_is"
  | "death_of_loved_one"
  | "non_death_loss"
  | "anticipatory_grief"
  | "complicated_grief"
  | "what_helps";

export type GriefArticle = {
  id: string;
  category: GriefCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const GRIEF_ARTICLES: ReadonlyArray<GriefArticle> = [
  {
    id: "what-grief-actually-is",
    category: "what_grief_is",
    title: "Grief, plainly",
    summary: "Grief isn't a problem with you. It's the cost of caring about something that's now gone or changed.",
    readMinutes: 3,
    body: `Grief is the experience of loss landing in your body. It's not a disorder, it's not a failure, it's not something to "get through" on a schedule. It's the price of having cared about something — a person, an animal, a relationship, a place, a version of yourself, a future you imagined — that is no longer accessible to you.

A few things that are true about grief that aren't always said clearly:

**You don't grieve in stages.** The "five stages of grief" (denial, anger, bargaining, depression, acceptance) was Elisabeth Kübler-Ross's 1969 model of how dying people seemed to relate to their own approaching death. It was never meant as a sequence for grievers. It's been misapplied for decades. Real grief doesn't move in stages — it moves in waves, often unpredictable, sometimes circular, sometimes with whole categories you never visit.

**Grief is non-linear.** Some days are okay. Some weeks are okay. Then something — a song, a smell, a place, a date — drops you back into the depths. The intensity fades over time but rarely in a clean curve.

**Grief doesn't "end."** It changes shape. The sharp pain of the early weeks usually becomes a quieter weight that surfaces around anniversaries, holidays, and triggers. Most people who've grieved deeply say they don't "get over" the loss; they get used to carrying it. Both versions of you exist — the one who hurts and the one who's living.

**Grief is physical.** Chest tightness, exhaustion, brain fog, appetite changes, sleep disruption, immune system dips. The body registers loss as biological stress. This is not "in your head."

**Grief is cumulative.** Each new loss can stir up old ones. The friend dying in college often surfaces feelings about the grandparent who died when you were 8. This is normal.

**Closure is a myth.** The notion that there's a moment of "I have moved on" — a clean resolution — is mostly a media invention. Real grief doesn't close; it integrates.

What grief is NOT:

- A timeline. There's no "six weeks and you should be over it." There's no number.
- Weakness. Grieving deeply is the response of someone who loved deeply.
- A performance. Grieving loudly is not more valid than grieving quietly. Crying every day is not more valid than not crying.
- A competition. "Other people have it worse" doesn't apply to your grief. Your loss is your loss.
- A failure if it lasts. Grief that persists for months or years isn't broken; it's grief that hasn't transformed yet.

What helps right now is different from what helps in a month, in a year. The articles in this section break it apart.

If grief is making you have thoughts of not being here, that's the moment for a counselor — not because grief is wrong, but because grief plus those thoughts is dangerous and treatable. The Crisis page link is at the bottom of every Kai screen; 988 reaches the Suicide and Crisis Lifeline.`,
    takeaways: [
      "Grief isn't a problem. It's the cost of having cared.",
      "Stages of grief was never meant for grievers — it's been misapplied for decades. Grief moves in waves, not stages.",
      "Grief is physical: chest, sleep, appetite, brain fog. Real biology, not 'in your head.'",
      "Closure is a myth. Grief integrates; it doesn't end."
    ]
  },
  {
    id: "death-of-a-loved-one",
    category: "death_of_loved_one",
    title: "When someone you love dies",
    summary: "Death is the hardest thing many teens encounter. There are no good words; here are some honest ones.",
    readMinutes: 5,
    body: `If you're reading this because someone you love has died, I'm sorry. There aren't words that fix anything, and that fact has been true for everyone who's ever read these kinds of articles. What's here is what's true, not what's reassuring.

**The first days and weeks:**

The first hours after a death are often a strange combination of clarity, numbness, and unreality. Some people cry constantly. Some can't cry at all. Some laugh at random things and then feel guilty. Some can't remember the last 24 hours. Some are very practical and helpful with logistics; some can barely move. All of these are normal grief responses. None of them is the "right" way to feel.

A few specific things about the early weeks:

- **Your body will be exhausted in a way that doesn't make sense.** Grief uses more energy than people realize. Sleep more than you think you need.
- **Eating may be hard.** Your appetite is doing its own thing. Eat what you can. Don't beat yourself up if it's not nutritious — survival is the bar right now.
- **Crying isn't on a schedule.** You may cry at the grocery store, then not cry at the funeral. That's not a problem.
- **Decision-making is harder than usual.** Big decisions (where to live, what to study, who to date) are best deferred for at least the first few months if possible.
- **You'll forget things.** Names, appointments, what you walked into a room for. The brain is using its bandwidth on the loss. This will improve.

**About other people:**

People will say things. Some of them will help. Many will not.

Common things people say that often don't help:
- "Everything happens for a reason." (Often it doesn't.)
- "They're in a better place." (Maybe; you'd still rather they were here.)
- "I know how you feel." (You probably don't, exactly.)
- "Time heals all wounds." (Time changes wounds; it doesn't heal them.)
- "Let me know if you need anything." (Well-meaning, but the griever rarely calls.)

Things that do help, from people:
- Specific offers: "Can I bring dinner Tuesday?" "Can I sit with you for an hour?"
- Just showing up.
- Saying the name of the person who died. Many people avoid the name, thinking it will hurt; the griever often wishes more people would say it.
- Listening without trying to fix.
- Coming back weeks and months later, when the casseroles have stopped.

You don't have to make other people feel better about being uncomfortable around your grief. They're handling their own response; that's not your job to manage.

**About school / work / "moving on":**

In most cultures, you're expected to be back to functioning within a few weeks of even a major loss. This is not a realistic expectation; it's a cultural one. You're allowed to function poorly. You're allowed to miss school for the funeral and the days after, and beyond. You're allowed to tell teachers / coaches / employers that you're grieving and need accommodation, even months later.

If returning to school feels impossible: school counselors can often arrange reduced loads, extended deadlines, and other accommodations. They cannot do this if they don't know what's happening, so telling them is the move.

**About the person who died:**

A common grief response is replaying the relationship, especially the last interactions. "Did I say I loved them?" "Did we leave it on a fight?" "Should I have called more?" Almost every griever does this. Almost every griever finds things they wish had been different.

What's worth knowing:
- Relationships are full of ambivalence. You can love someone and have been frustrated with them; you can have not said what you wished you'd said. These are universal griever experiences, not unique failings.
- Imagined conversations with the person who died are common and often helpful. Writing them a letter is a known grief practice.
- Anger at the person who died — for leaving, for not taking care of themselves, for unfinished business — is normal. It doesn't mean you didn't love them.

**About the long arc:**

The intensity of the first weeks will fade. Most people who've been through a major death describe a similar timeline (with huge individual variation):
- **First days:** shock, fog, unreality, sometimes intense.
- **First weeks:** waves of sharp pain, exhaustion, periods of numb functioning.
- **First months:** the world starts to look "normal" but with a permanent shadow. Anniversaries, holidays, sensory triggers hit hard.
- **First year:** the first "first" of everything (first birthday, first holiday, first season) is brutal. Then the second time around is easier than the first.
- **Years later:** the loss is integrated. There's still grief, particularly around dates and triggers, but it's not the dominant feature of your life. The person you were before the loss isn't who you are now; the new you carries them.

**When grief becomes complicated:**

Most grief is hard but progresses. Some grief gets stuck — typically when there's been trauma, ambivalence, unresolved relationship issues, or the death was sudden / violent / unexpected. Signs that grief may need professional help (more on this in the "complicated grief" article):
- 6+ months in and the intensity isn't shifting at all.
- Unable to function at school, work, or in basic life tasks for extended periods.
- Persistent thoughts of joining the deceased, of dying yourself, of life not being worth continuing.
- Severe withdrawal or substance use.
- Inability to engage with memories or photos at all.

If any of this is true: a grief-specialized counselor. Most teens have never seen a therapist; this is one of the most useful reasons.

**A note about specific deaths:**

- **Death of a parent:** loses both the person and a structural piece of your life. School counselors, grief groups, family therapy are all worth exploring.
- **Death of a sibling:** often under-acknowledged. The "surviving sibling" carries a complex grief that includes parents' grief on top of their own.
- **Death of a friend:** can feel like the world should stop and people don't realize it. Friend death in adolescence is associated with lasting effects; worth getting support.
- **Suicide of someone close:** a uniquely complicated grief that needs specialized support. AFSP (American Foundation for Suicide Prevention) has resources at afsp.org.
- **Death of a child** (sibling, friend's child): one of the heaviest grieves; specialized support helps.

You're not alone in this. Teen grief is more common than people talk about. Help that fits exists.`,
    takeaways: [
      "The early days/weeks of grief are uniquely exhausting. Sleep more. Eat what you can. Defer big decisions.",
      "Other people will say things. Some help, many don't. You're not responsible for managing their discomfort.",
      "School counselors can help with accommodations. Telling them is the move.",
      "Grief integrates over years, doesn't end. 6+ months stuck with no shift = grief-specialized counselor."
    ]
  },
  {
    id: "non-death-loss",
    category: "non_death_loss",
    title: "Loss that isn't death",
    summary: "Breakups, friend endings, moving, parents divorcing, leaving childhood. These are real grief, even though they're often dismissed.",
    readMinutes: 4,
    body: `One of the more isolating things about teen grief is that most of what teens lose isn't a death. It's a friendship ending, a romantic breakup, parents divorcing, a beloved teacher moving away, a sports career ending, an identity changing, a friend group breaking up, moving cities, an illness in the family, a pet, the version of your family you used to have.

These are all real grief, and they're often dismissed — by adults ("you'll get over it"), by peers ("it was just a relationship"), and sometimes by the griever themselves ("it's not like someone died"). This dismissal makes the grief harder, not easier.

**What this kind of grief feels like:**

Often identical to death-grief in terms of body signals: exhaustion, chest tightness, sleep changes, appetite shifts, brain fog, crying jags, social withdrawal. The mind labels it differently, but the body doesn't care about the label.

Often more confusing because:
- There's no funeral, no socially-sanctioned grief period.
- The person/thing may still exist, just inaccessible.
- People around you may not recognize you're grieving.
- You may grieve someone you weren't supposed to love (a complicated parent, an ex who hurt you, a friend who turned out to be bad to you).

**Specific kinds of non-death loss:**

**Breakups (romantic).**
Especially the first big one. The brain reacts to romantic loss with the same neural circuitry as physical pain. Sleep, appetite, focus all drop. It is a real grief, even if adults around you forget that.

Things to know:
- Most teen breakups produce 2-12 weeks of significant grief. Lasting longer can mean you weren't ready for the relationship to end (different from "you should be over it"), the relationship was unusually deep, or there's complicating ambivalence (they hurt you, you hurt them, complicated reasons).
- The intensity of teen breakups is partly neurodevelopmental. The brain hasn't fully built the regulation systems that handle this in adulthood. The fact that it feels world-ending isn't immaturity; it's biology.
- Continuing to follow the ex on social media often prolongs the grief. This is one of the few clearly evidence-supported moves: unfollow for at least a few months.
- Don't make permanent decisions during acute breakup grief.

**Friend group dissolution.**
The friend group from middle school doesn't carry into high school. The high school crew scatters after graduation. Sometimes a falling-out ends a group at once. Each version is loss.

What to know:
- Friend grief is often underacknowledged but very real. You'll likely grieve some friend groups for years.
- Some of these are seasonal friendships — they served a function for a chapter and then didn't fit. That's not failure.
- Holding onto friend groups that don't fit anymore is sometimes a form of avoiding the grief.

**Parents divorcing or separating.**
The version of the family you grew up in is ending. Even if the divorce is "good" (both parents healthier, less fighting, etc.), there's grief for what was lost.

What helps:
- Family therapy (or individual therapy) helps a lot of teens during divorce.
- The two-house life takes adjustment. Most teens settle into it within months but the early period is rough.
- You're not responsible for your parents' feelings about each other. You're not the marriage counselor. This is not your fault and not your job to fix.
- It's okay to have complicated feelings about both parents.

**Moving.**
Losing access to your friends, your school, your neighborhood, your room, your routine. Often dismissed but a real and significant grief, especially for teens in the middle of high school.

What helps:
- The first 6-12 months in a new place are usually the hardest. It does typically get better.
- Stay in touch with people you left. Discord, FaceTime, occasional visits help.
- Joining one specific activity / sport / club in the new place builds connection faster than waiting for it to happen.

**Family illness (long-term).**
A parent with cancer, a sibling with chronic illness, a grandparent declining. Living with someone you love being sick — sometimes for years — is its own kind of grief, often called *anticipatory grief* (see next article).

**Identity loss.**
Losing the version of yourself you used to be: a sport you can no longer play (injury), a path you can't pursue (cost, talent ceiling), a religion you've left, a country / culture you've moved away from. All real grief.

**Pet loss.**
Some of the most genuine grief teens experience. Pets are often the most consistent, unconditional presence in a teen's life. Their death deserves real acknowledgment.

What to know:
- Pet grief is real. Don't let anyone — including yourself — minimize it.
- Some teens grieve a pet's death more visibly than they grieved a human's. This is okay.
- Marking the loss (a small memorial, a written goodbye, a planted tree) helps.

**What helps with non-death loss:**

The same things that help with death-grief:
- Acknowledge it as real grief. Name it.
- Don't compare your loss to "worse" losses; that doesn't help you process.
- Find one person who takes your grief seriously, even if others minimize it.
- Allow time. Most non-death losses follow a similar arc to death-grief, with the most intense period in the first weeks and gradual integration over months.
- For ongoing or complicated losses (divorce, long illness, identity work), a counselor is genuinely useful.

**A note on social comparison:**

Social media makes non-death grief harder. You see your ex moving on, the friend group you left meeting up, your former school posting prom photos. This is acute pain on top of the underlying loss. Time off the feeds during acute grief is genuinely protective.`,
    takeaways: [
      "Non-death loss is real grief. Body reacts the same way; only the label differs.",
      "Breakups, friend group endings, divorce, moving, identity changes, pets — all legitimate, often dismissed.",
      "Time off social media during acute non-death grief is genuinely protective.",
      "For ongoing / complicated non-death loss (divorce, long illness, identity), a counselor helps significantly."
    ]
  },
  {
    id: "anticipatory-grief",
    category: "anticipatory_grief",
    title: "Anticipatory grief: grieving someone who is still here",
    summary: "When someone is terminally ill or in decline, grief often starts before they die. This is normal, not premature.",
    readMinutes: 3,
    body: `If someone you love is dying — diagnosed with a terminal illness, in hospice, in late-stage dementia, declining from age — you may already be grieving. This is called anticipatory grief, and it's real and often unspoken.

What it feels like:

- Grieving someone who's still here. Sadness about what's coming and what's already changed.
- Guilt for grieving "too early," as if you're betraying them by feeling the loss.
- Exhaustion from the slow accumulation of changes, treatments, hospital visits, decisions.
- Anger at the situation, at doctors, at the universe, sometimes at the person themselves.
- Numbness as a kind of pre-emptive distance.
- The complicated awareness that you're losing them in pieces — capacity, memory, time, function — and the final piece (death) is still ahead.

This is grief. It's not premature; it's not selfish; it's not "getting ahead of yourself." Most family members of people with long terminal illnesses experience some form of this.

**What's specific about anticipatory grief:**

**1. You're grieving while caregiving.**
You may be in the role of supporting the dying person — emotionally, sometimes physically — while also processing your own grief. This is one of the hardest combinations there is. Your needs and theirs are sometimes in tension. Both are real.

**2. The timeline keeps shifting.**
"Six months to a year" can be three months or three years. The grief doesn't follow the calendar; it follows the unpredictable course of the illness. Long terminal illnesses are exhausting for everyone in part because of this uncertainty.

**3. There's often guilt about wanting it to be over.**
Most caregivers and family members eventually have the thought "I want this to end" — meaning the suffering, the watching, the waiting, the limbo. This thought is normal and not a moral failing. It often coexists with deep love. It doesn't mean you want them to die; it usually means you want the long dying to stop, which is different.

**4. You're often grieving multiple things at once.**
The future you imagined that's no longer happening. The person who's already changed (especially with dementia). The relationship that's altered. Your own role in the family that's shifting.

**5. Anticipatory grief doesn't fully prepare you for the actual death.**
A common myth is that "knowing it's coming" makes the actual death easier. Sometimes it does; often it doesn't. You can grieve for months in advance and still be devastated when it happens. That doesn't mean the anticipatory grief was wasted.

**What helps:**

- **Be in the time you have.** This sounds trite but is real. The present moments with the person — even hard ones — are what becomes the memory. Phones down. Be there.
- **Say what you want to say.** Forgiveness given and asked for; appreciation expressed; truth named. Hospice nurses report consistently that "I love you, thank you, I forgive you, please forgive me, goodbye" covers most of what people wish they'd said.
- **Take care of yourself, especially physically.** Caregiver burnout is real. Sleep. Eat. Step away when you can.
- **Talk to other family members.** Each family member is having their own version of this experience. Talking openly — not just about logistics — helps.
- **Get external support.** Therapists who specialize in anticipatory grief exist. Hospice organizations almost always offer family support, including for teens. Some are free regardless of whether the family is using hospice services.
- **Don't ignore your own life.** School, friends, the rest of life still continues. Maintaining some normal routines (even imperfectly) is protective.

**The role of teens specifically:**

Teen experience of anticipatory grief is often invisible to adults because the focus is on the dying person and the primary caregivers. Teens are sometimes told to "be strong for your mother" or "help out more" without anyone acknowledging that the teen is also losing someone.

Things to know if you're a teen in this:
- Your grief is real even though the dying person isn't your spouse or parent of young children.
- You're allowed to want time away from the situation. You're not required to be present every day.
- Talking to a counselor (school or outside) is one of the best moves you can make.
- Grandparent loss — even expected, late-life — is sometimes one of the deeper losses of adolescence. Don't dismiss your own grief.

**Resources:**

- Hospice organizations (search "hospice" + your city) often have free family support.
- The Compassionate Friends (compassionatefriends.org) supports families grieving the death of a child (anticipated or after).
- Camp Erin (eluna.network) is a national network of grief camps for kids and teens, often free.
- AFSP (afsp.org) for suicide-related loss.

**When to escalate:**

If anticipatory grief is paired with thoughts of not being here yourself, that's an immediate moment for a counselor or 988. The grief is real; the help is also real.`,
    takeaways: [
      "Anticipatory grief — grieving while the person is still alive — is normal during terminal illness or decline.",
      "Wanting the suffering / limbo to end is not the same as wanting them to die. Almost all caregivers think this.",
      "Knowing it's coming doesn't fully prepare you. Anticipatory grief doesn't replace post-death grief.",
      "Hospice + grief camps (Camp Erin) + AFSP are real, often-free resources. School counselor is the entry point."
    ]
  },
  {
    id: "complicated-grief",
    category: "complicated_grief",
    title: "When grief gets stuck",
    summary: "Most grief moves over time. Some gets stuck and needs help. Knowing the difference matters.",
    readMinutes: 4,
    body: `Most grief — even severe grief — gradually integrates over months and years. The pain transforms but you keep functioning, your relationships continue, your interests come back, you carry the loss alongside the rest of your life.

Some grief gets stuck. This has different names — *prolonged grief disorder*, *complicated grief* — and it's been recognized in the diagnostic literature for about a decade. It's not a failure of the griever. It's a real, identifiable pattern that responds to specific help.

**Signs grief may be stuck:**

The threshold is typically 6-12 months after the loss for adults; sometimes longer for teens because adolescent grief operates on different timelines. Worth taking seriously if multiple of these are present and not shifting:

- **Intense longing or yearning that hasn't faded.** Daily, overwhelming.
- **Inability to accept the death.** Persistent disbelief, repeatedly playing through it as if it might be different.
- **Persistent feelings that life is meaningless** since the loss.
- **Numbness or detachment** from people, activities, normal life.
- **Trouble engaging with positive memories** of the person.
- **Anger or bitterness** about the loss that hasn't softened.
- **Significant difficulty with normal activities** (school, work, relationships) due to the grief.
- **Identity confusion** — feeling like you've lost yourself, not just them.
- **Avoidance of reminders** that's pervasive (avoiding photos, places, conversations).
- **Persistent thoughts of joining the deceased** or wishing you had died too.

If 6+ of these are present 12+ months after a death, that fits the clinical pattern of prolonged grief disorder, which has specific treatment.

**Patterns that increase the risk of stuck grief:**

- **Sudden, violent, or unexpected deaths** (accident, suicide, homicide).
- **Death of a child** (regardless of age).
- **Multiple losses close together.**
- **Pre-existing depression, anxiety, or trauma.**
- **Complicated relationship with the deceased** (ambivalence, unfinished business, recent conflict).
- **Isolation during the grief.**
- **Substance use** that started or escalated after the loss.

**Why this matters:**

Stuck grief responds well to specific kinds of help. The most evidence-supported approach is *Complicated Grief Treatment* (sometimes called Prolonged Grief Disorder Therapy). It's a structured therapy, typically 16-20 sessions, that helps re-engage with memories, address avoidance, and integrate the loss. Most people who complete it report significant improvement.

This is different from general therapy. A therapist who specializes in grief is the right fit — not just any therapist.

**For teens specifically:**

- Teen grief often takes longer to integrate than adult grief, partly because the brain is still developing the regulation systems that handle this work.
- Teen complicated grief is more common after sibling death, suicide loss, and traumatic loss.
- Teens are sometimes told "you're young, you'll bounce back" when they're actually stuck. This dismissal delays help.
- If you've been carrying severe grief for 6+ months and nothing is shifting, that's worth bringing up to a parent, school counselor, or pediatrician.

**What complicated grief is NOT:**

- "Wallowing." This framing is wrong; stuck grief isn't a choice.
- A character flaw.
- Something that will fix itself if you just try harder.
- Lack of resilience.

It's a pattern that needs intervention. The intervention works.

**Suicide loss:**

Loss of someone close by suicide carries specific risk of complicated grief. Several factors:
- Guilt, often persistent ("should I have seen it," "could I have stopped it").
- Trauma elements if you found them or witnessed events.
- Stigma — silence around the death, others not knowing how to talk about it.
- Risk of identification — increased risk of suicidal ideation in survivors, especially teens.

If you're grieving a suicide loss, specialized resources help:
- **AFSP** (American Foundation for Suicide Prevention) at afsp.org — survivor support groups (online + in person), Survivor Day events, resources.
- **Alliance of Hope** at allianceofhope.org — survivor-of-suicide loss community.
- **Crisis Text Line** (text HOME to 741741) and **988** for any crisis moments.

This is one of the kinds of loss that especially benefits from professional grief therapy. Don't wait.

**Crisis:**

If grief is paired with active thoughts about ending your life, or making a plan, or having access to means — call **988** right now. Or **911** if there's immediate medical risk. The Crisis page link is at the bottom of every Kai screen.

This article is not telling you you're broken. It's telling you that when grief gets stuck, that's a known pattern with a known treatment. Help is real and works. Reaching for it is the move.`,
    takeaways: [
      "Most grief integrates over time. Some gets stuck — that's a real pattern (prolonged grief disorder), not a failure.",
      "6-12+ months in with no shifting, severe impairment, or persistent thoughts of joining the deceased = professional help.",
      "Complicated Grief Treatment is specific, structured, and effective. Not just any therapist — a grief specialist.",
      "Suicide loss carries specific risk. AFSP, Alliance of Hope, and 988 are real resources. Don't wait."
    ]
  },
  {
    id: "what-helps-and-what-doesnt",
    category: "what_helps",
    title: "What helps with grief (and what mostly doesn't)",
    summary: "After years of grief research, there's some honest signal on what helps and what doesn't. Most teen grief content is wrong.",
    readMinutes: 4,
    body: `Most generic grief advice doesn't match the research. After decades of grief studies, here's a more honest version of what actually helps:

**What helps:**

**1. Saying the loss is real.**

Acknowledgment matters. From yourself (saying out loud what you're going through), from others (people who say the deceased person's name, who listen to your story, who don't try to fix). The opposite — minimization, avoidance, "let's not talk about it" — is one of the most common barriers to grieving well.

**2. Time and patience with yourself.**

Grief doesn't move on a schedule. The cultural pressure to be "over it" by some specific point is harmful. Most major losses take a year for the sharpest pain to dull, multiple years to integrate, and the rest of your life to carry. None of that is excessive.

**3. Routines and basic care.**

The body is doing massive work during grief. Sleep, food, water, movement, time outside. Not as performance — as survival. Skipping these makes grief much harder.

**4. One trusted person who lets you grieve out loud.**

Not many. One. A best friend who listens without fixing. A therapist. A parent. A grandparent. An aunt. The person who lets you be a mess in front of them without making it weird.

**5. Rituals.**

Funerals, memorials, lighting candles, visiting graves, writing letters to the person, marking anniversaries. Cultures and religions have developed grief rituals for thousands of years because they work. Some people find their existing tradition helps; some people make their own.

**6. Continuing bonds.**

The "let go and move on" framing of grief is largely wrong, according to the field's research over the past 30 years. People grieve better when they maintain a continuing relationship with the deceased — not literally pretending they're alive, but allowing the relationship to evolve. Talking to the person internally, dreaming about them, doing things they would have liked, asking "what would they think" — all healthy.

**7. Grief groups and grief therapy.**

Being around other people who get it. Most cities have grief support groups (often free through hospice, hospitals, religious organizations). Online groups also exist. Grief-specialized therapy for harder grief.

**8. Engagement with life again, when you're ready.**

This is paradoxical: getting back into your life — school, work, hobbies, friends — is often what allows grief to move. Not as a distraction; as a way of being a person who's still alive while carrying loss. This usually starts to happen naturally a few months in, but sometimes needs gentle nudging.

**What mostly doesn't help (research is consistent):**

**1. "Just stay busy."**

Distraction in early grief can be necessary survival. As a long-term strategy, it backfires. Unprocessed grief returns harder.

**2. "Stay strong" / "be strong."**

This is code for "don't feel your feelings where I can see them." The opposite — letting yourself feel — is what allows grief to move.

**3. Forced cheerfulness or positive thinking.**

"At least…" sentences ("at least you had them as long as you did," "at least they aren't suffering anymore," "at least…") are dismissive of the grief. Even when factually true, they tell the griever their pain isn't legitimate.

**4. "Replacement" attempts.**

A new puppy two weeks after the old dog died, a rebound relationship after a major breakup, a new identity after losing the old one. These often delay grief rather than resolve it.

**5. Stages-based thinking.**

"I'm in the anger stage so I should be moving toward bargaining." No. Stages aren't how grief works. Trying to track yourself against stages just adds confusion.

**6. Comparison.**

"Other people have it worse" doesn't help. Your grief is yours regardless of how it compares.

**7. Major life decisions during early grief.**

Big career changes, moves, relationship decisions made in the first months of grief often regret. Defer big choices if you can.

**8. Alcohol and substances as the coping strategy.**

Numbing through substances is one of the most common grief-related risk factors. It interrupts the body's natural processing and frequently escalates into bigger problems. If you find yourself drinking / using more after a loss, that's worth telling someone.

**9. Social media doomscrolling.**

In acute grief, social media is often net-harmful — comparison, triggers, exhausting low-value engagement. Time off can be protective.

**10. "Closure."**

There's no closure. There's integration. Trying to find closure usually leads to disappointment because the thing you're chasing isn't real.

**Specific tools that have research support:**

- **Writing.** Journaling about the loss, writing letters to the deceased, writing about your relationship. Consistently shown to help with grief processing.
- **Grief therapy** for stuck grief (CGT / PGDT).
- **Continuing bonds practices.** Talking to them internally, dreams, doing things they loved.
- **Support groups specifically for your kind of loss** (sibling, parent, child, suicide, etc.).
- **Time in nature.** Repeated studies link nature time with grief processing.
- **Physical movement.** Walking, hiking, swimming, gentle exercise. The body needs to discharge what grief loads it with.

**The honest summary:**

Most grief eventually integrates if you let yourself grieve, take basic care of yourself, find one or two people who can be with you in it, and don't try to short-circuit the process. The people who struggle most with grief long-term are usually the ones who tried hardest to skip the early stages, deny the loss, or stay strong without support.

You're allowed to be a mess. That's what grief is supposed to look like.`,
    takeaways: [
      "Saying the loss is real + time + basic care + one trusted person + rituals + continuing bonds = the things that actually help.",
      "What mostly doesn't: 'stay busy,' 'be strong,' forced positivity, stages-thinking, replacement, alcohol, scroll, 'closure.'",
      "Writing, grief therapy (CGT/PGDT), support groups for your kind of loss, nature time, movement — all research-supported.",
      "Most grief integrates if you let it. The ones who struggle most long-term tried hardest to skip the early grief work."
    ]
  },
  {
    id: "supporting-a-grieving-friend",
    category: "what_helps",
    title: "When a friend is grieving",
    summary: "Most people are bad at supporting grief because they were never taught. A short guide.",
    readMinutes: 3,
    body: `Almost everyone who's been grieving has had the experience of friends saying the wrong thing, disappearing, or treating the grief like it should have been over weeks ago. This isn't malice; most people simply weren't taught how to support grief. If a friend of yours is grieving, here's a practical version.

**What to do early on:**

**1. Show up. Don't wait to be asked.**

The phrase "let me know if you need anything" puts the work on the griever, who is exhausted and won't ask. Instead, make specific offers:

- "Can I come sit with you Saturday?"
- "I'm bringing dinner Tuesday. What would you eat?"
- "Want to go for a walk together?"
- "Can I drive you somewhere this week?"

You don't need to ask their permission to bring food, send a card, or check in. Just do it.

**2. Say their person's name.**

Most grievers report that one of the most painful things is when no one says the deceased person's name. Use the name. Reference memories. "I was thinking about your dad's terrible jokes the other day" is gold to a grieving friend.

**3. Listen more than talk.**

Your friend doesn't need you to fix this. They don't need you to find meaning. They don't need your stories about your own losses (yet). They need to be heard. Ask: "How are you, really?" — and then be quiet while they answer.

**4. Don't say:**

- "Everything happens for a reason."
- "They're in a better place."
- "I know how you feel." (Even if you've lost someone, you don't know exactly how they feel.)
- "Time heals all wounds."
- "At least you had X years with them."
- "You'll get through this." (Yes, but they don't need it framed as something to "get through.")
- "Be strong."
- "Are you over it yet?" (Even gently. Especially gently.)

**5. Do say:**

- "I'm so sorry."
- "There aren't words. I'm here."
- "I'm thinking about you."
- "I loved your dad."
- "Tell me about her."
- "What do you need right now?"
- "I'm here. I don't need you to perform okay."

**What to do over the long arc:**

The casseroles stop in a few weeks. The texts taper. The world moves on. The griever is often left alone in their grief by month 2 or 3. This is when their friends matter most.

- **Mark anniversaries.** The death day. The person's birthday. Major holidays. A text saying "Thinking about you today" is huge. Most grievers say almost no one acknowledges these.
- **Keep showing up.** Months later, not just in the first week.
- **Bring it up.** Not "are you over it?" but "How are you doing with everything?" Lets them choose to talk or not.
- **Notice if they're getting worse, not better.** Grief that's intensifying months in, or paired with substance use, withdrawal, scary thoughts — these are signs to gently encourage professional help. "I'm worried about you. Would you be open to talking to a counselor?"

**What NOT to do:**

**1. Don't disappear.**

Many people avoid grievers because they "don't know what to say." The griever notices the absence. Show up imperfectly rather than not showing up.

**2. Don't make it about you.**

"I lost my grandma last year, so I get it" can be helpful in moderation; it can also derail the conversation. Read whether they want connection or whether they're being made to listen to your story.

**3. Don't pressure them to move on.**

Their timeline is theirs. "When are you going to start dating again?" "Shouldn't you be over it?" "You should join a [activity] — it'll help." Let them lead.

**4. Don't avoid the topic forever.**

The griever often wants to talk about the person who died. Pretending it didn't happen is its own kind of silence.

**5. Don't gossip about their grief.**

Asking other friends "how is she doing?" instead of asking her is gossipy. Talk to your friend, not about your friend.

**Crisis signals from a grieving friend:**

If a friend in grief expresses:
- Persistent thoughts of joining the deceased.
- Thoughts of not being here themselves.
- Significant withdrawal + substance use + scary statements.
- A specific plan or means to hurt themselves.

This is the moment to tell a trusted adult, even if your friend asked you not to. Grief + suicidal ideation is a real medical risk. Call 988 with them or for them if it's acute. The friendship survives this; the friend has to survive too.

**Taking care of yourself:**

Supporting a grieving friend is taxing. You're not their therapist. You can be a friend without being everything. Your own life still continues. Set some limits — if you need a break, take one (without disappearing entirely). Get your own support if you need it.

**The hardest version:**

If your friend's grief is for someone you also knew (a mutual friend, a member of their family you knew well), you may be grieving too. This is allowed. You can support each other rather than only one direction.

This is one of the most important skills you can develop as a young adult. Most adults are bad at it because they were never taught. Being someone people remember as "she was there for me when X died" is one of the most meaningful kinds of friendship there is.`,
    takeaways: [
      "Show up early, don't wait to be asked. Specific offers > 'let me know if you need anything.'",
      "Say the deceased person's name. Use memories. Most grievers desperately want their person remembered.",
      "Don't disappear, don't make it about you, don't pressure them to move on, don't say 'I know how you feel.'",
      "Friend's grief + suicidal ideation = tell a trusted adult / call 988, even if they asked you not to."
    ]
  }
];

export const GRIEF_CATEGORY_LABEL: Record<GriefCategory, string> = {
  what_grief_is: "What grief is",
  death_of_loved_one: "Death of a loved one",
  non_death_loss: "Loss that isn't death",
  anticipatory_grief: "Anticipatory grief",
  complicated_grief: "When grief gets stuck",
  what_helps: "What helps + supporting others"
};
