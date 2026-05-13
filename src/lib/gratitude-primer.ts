/**
 * Gratitude + savoring primer. Practice articles grounded in positive-psychology
 * research (three-good-things, savoring, gratitude letter, hedonic adaptation
 * & contrast). The antidote to comparison-driven negativity bias.
 *
 * Voice rules (strict):
 *   - No toxic positivity. "Just be grateful" is poison. The article never says
 *     gratitude is for solving real problems or distress.
 *   - Gratitude is not denial. Naming what's good doesn't require pretending
 *     what's hard isn't there.
 *   - No "manifest" / "high vibration" / "good vibes only" / "law of attraction".
 *   - Don't promise outcomes ("daily gratitude makes you 25% happier"). Cite
 *     research carefully — name effects without overclaiming.
 *   - Use language that respects bad weeks. "Some weeks the practice is harder
 *     and that's data" not "force yourself to find three things".
 *   - Severe persistent inability to find anything good > 2 weeks → counselor.
 */

export type GratCategory =
  | "why_it_works"
  | "daily_practice"
  | "savoring"
  | "letter_writing"
  | "hard_weeks"
  | "for_others";

export type GratArticle = {
  id: string;
  category: GratCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const GRAT_ARTICLES: ReadonlyArray<GratArticle> = [
  {
    id: "why-gratitude-actually-works",
    category: "why_it_works",
    title: "Why gratitude works (and what it doesn't fix)",
    summary: "Naming what's already good in your life nudges attention away from comparison and threat. It's a small lever — but a reliable one. It's not a fix for actual problems.",
    readMinutes: 3,
    body: `Gratitude as a "practice" gets eye-rolled a lot, often for good reason. A lot of online wellness content promises gratitude will rewire your brain, summon money, or solve depression. The actual research is narrower and more useful.

What the evidence actually shows:

**The brain has a negativity bias.** Survival wiring means threat and loss register more strongly than safety and gain — by roughly 3-to-1 in attention studies. This is why one critical comment ruins a day where ten compliments did nothing. Modern feeds amplify this even further.

**Naming what's good shifts the ratio.** Studies on three-good-things journaling (writing down three good things from the day + why each happened) show consistent small-to-medium effects on mood and life satisfaction in the weeks after starting. The effects are real and reproducible. They are also smaller than people claim.

**The mechanism is attention, not magic.** When you deliberately scan for what was good in a day, your brain gets a little better at noticing the same kinds of things automatically. It's a workout for an attention pathway, like any other repetitive skill.

**What gratitude does NOT do:**
- It does not fix actual problems. A grateful person in a bad situation is still in a bad situation.
- It does not treat clinical depression. (It can be a helpful adjunct to treatment; it's not a replacement for one.)
- It does not require positivity in the face of real hard things. Gratitude and grief, gratitude and anger, gratitude and fear — these all coexist. The practice doesn't ask you to pretend.

**The honest version:** Gratitude is a small lever that pulls attention slightly in a direction that helps over time. Used alongside other things — sleep, movement, real connection, real conversation about what's actually hard — it adds up. By itself it's not a system.

Why this matters for teens specifically:

Adolescent brains are wired toward comparison (see identity primer). The feed environment hits this wiring relentlessly. A small daily counter-practice that pulls attention toward what's already good is unusually useful at this age. The research effects appear to be at least as strong in teens as in adults.

Practiced for a few weeks, what you'll usually notice: small shifts in how heavy a normal day feels, slightly easier recovery from setbacks, occasionally a felt "this is enough" moment that wasn't there before. Not euphoria. A baseline lift. That's what the research actually shows; anyone promising more is selling.`,
    takeaways: [
      "Negativity bias is real wiring. Gratitude practice slightly tilts attention back.",
      "Three-good-things research is solid but modest. Real effects, not magic.",
      "Gratitude and hard feelings coexist — practice doesn't require pretending.",
      "It's a small lever. Used alongside other things, it adds up; by itself, it isn't a system."
    ]
  },
  {
    id: "three-good-things",
    category: "daily_practice",
    title: "Three good things: the practice in one paragraph",
    summary: "The simplest researched-backed gratitude practice. 3 minutes a day. Most teens stop after a week — the ones who keep it past two weeks usually notice something.",
    readMinutes: 2,
    body: `Once a day — at night works best for most people — write down three things that went well today, and one sentence on why each one happened. That's it.

That's the practice from Seligman and colleagues' original three-good-things research. It sounds too small to do anything. The studies are clear: practiced consistently for a couple of weeks, it produces small-to-medium effects on mood, with some studies showing the effects persisting months after stopping.

A few details that matter:

**Write it.** Not "think about it." Writing engages a different part of the brain than thinking, and writing it down makes the effect sturdier. A notebook, a notes app, a journal — anywhere counts.

**Include the "why."** This is the part most people skip. "I had a good run today" is fine. "I had a good run today because I went earlier and the weather wasn't terrible and my legs felt loose for the first time in a week" is much better. Why-statements force specificity and surface what conditions actually create good moments — useful data.

**Small things count.** Most people first do this and write huge things — "I'm grateful for my family." Boring after week one. The practice works better with small specific stuff: "the latte was actually good today," "[friend] sent me a meme that made me laugh," "I finished the chapter I'd been putting off." Tiny is the point.

**Bad days are allowed.** Some days, finding three things is hard. Two is fine. One is fine. If it's a truly terrible day, "I made it through this day" is allowed to count. The point is the scanning, not the inventory.

**Stop forcing it after a couple of weeks if it doesn't fit.** Not every practice fits every person. If you've done it for two weeks and feel nothing, that's data — try a different practice (savoring, gratitude letter, etc.). Not all good things work for everyone.

The cadence:

- Daily for 1-2 weeks is the threshold most research uses.
- After that, 3-4x/week sustains most of the effect for most people.
- You don't have to do it forever. Some people use it during hard periods and stop when things lift. That's fine.`,
    takeaways: [
      "Three things + one 'why' each, daily, at night, written down. That's the whole practice.",
      "Small specific stuff > big abstract things. 'The latte was actually good' beats 'I'm grateful for my family'.",
      "Bad days are allowed. The point is the scanning, not the inventory.",
      "Two weeks is the threshold. If nothing shifts, try a different practice — not all good things work for everyone."
    ]
  },
  {
    id: "savoring",
    category: "savoring",
    title: "Savoring: stretching out the good moments",
    summary: "Most teens speed through good moments to get to the next thing. Savoring is the practice of deliberately staying with a good one.",
    readMinutes: 3,
    body: `Savoring is the deliberate practice of stretching out a positive moment — staying with it, noticing it, letting it land. It's a different skill from gratitude. Gratitude is "look back and name what was good." Savoring is "look forward, sideways, or right now and stay with what IS good."

The case for it:

**Most people speed through good moments.** You finish a song you love and immediately scroll. The meal ends and you're up. The hug ends and you're checking your phone. Modern attention training has us optimized for moving on. The good moments register at a fraction of their actual size because we're rushing past them.

**Savoring works by interrupting the rush.** You stay with the good thing for a few extra seconds — and the brain's reward circuitry, which usually fires briefly and resets, gets to run longer. The effect on memory of that moment is significant.

How to do it:

There are a few specific savoring moves. Different ones work for different people:

**1. Anticipatory savoring.** Before a thing you're looking forward to, spend a minute thinking about it. The dinner you're heading to, the show you're going to watch, the friend you're about to see. Anticipation IS part of the pleasure of an experience; teens often skip it by being on their phone right up to the moment.

**2. In-the-moment savoring.** While the good thing is happening, deliberately notice it. "This song hits hard." "The food is really good." "This conversation is one of the best I've had." You don't have to say it out loud; saying it internally is enough.

**3. Memory savoring.** Bring back a specific good memory deliberately. Hold it for 30 seconds. The mood it brings is real and present even though the moment was past.

**4. Sharing.** Tell one person — a friend, a parent, anyone — about something good that happened. Not as a brag. Just as a "this was nice." The act of sharing it stretches the good feeling out and often deepens it.

What to skip:

- **Trying to savor a bad moment.** That's denial, not savoring.
- **Stretching a fading feeling.** Sometimes a moment is over. Trying to grab it back makes you miss the next one. Savoring isn't grabbing.
- **Performing savoring (for the algorithm).** "Oh I'm savoring this latte ✨" loses the point. The practice is internal.

The 10-second version:

If all this feels like too much, the simplest version: when a good thing happens, take 10 seconds to actually notice it instead of going to the next thing. That's a complete savoring move. Done daily, it accumulates.

A note on hard weeks:

Some weeks have very few savorable moments. That's data, not a failing. On hard weeks, lower the bar — "the shower was warm," "the cat was nice," "I finished one homework thing." Savor small. The point is the muscle, not the size of the moment.`,
    takeaways: [
      "Savoring stretches good moments by interrupting the rush past them.",
      "Anticipatory + in-the-moment + memory + sharing — four flavors. Different ones work for different people.",
      "The 10-second version: notice a good thing for 10 seconds before going to the next. That counts.",
      "Hard weeks → lower the bar. Small savor still builds the muscle."
    ]
  },
  {
    id: "gratitude-letter",
    category: "letter_writing",
    title: "The gratitude letter: the strongest single intervention",
    summary: "Writing (and ideally delivering) a letter to someone who shaped you is one of the most effective single moves in positive psychology.",
    readMinutes: 3,
    body: `Of all the gratitude practices researched, the gratitude letter consistently shows the largest single-session effects. It works like this: pick someone whose impact on you you've never fully named, and write them a letter saying it. Specific. Concrete. Sincere. Then — and this is the part with the most evidence — deliver it. Read it to them in person, or send it.

A few things to know:

**The size of the effect is unusual.** Studies that randomly assign people to the gratitude-letter exercise versus a control task show effects on mood that last for a month or more after a single completion. For an intervention that takes 30 minutes, that's a strong finding.

**It works because of two things at once:** the act of articulating what someone did and what it meant (which forces specificity you don't normally reach) AND the act of letting them know (which strengthens a real relationship). Both parts matter; just writing it without delivering has a smaller effect, though still positive.

How to do it:

**1. Pick a person.** Not necessarily the biggest name in your life. Often the person whose impact has been under-named. A coach who shaped you. A teacher who saw something. A relative you've never properly thanked. A friend who showed up at a hard time. The one who comes to mind first when reading this is usually the right one.

**2. Write the letter.** 200-300 words is plenty. Aim for specificity:
   - One or two specific things they did.
   - What the impact was on you, named clearly.
   - What it means to you now.

**3. Deliver it.** Three options:
   - **In person, reading it aloud.** Hardest but most impactful. Both people often cry.
   - **Send it.** Email, text, paper letter, voice memo. Less intense; still significant.
   - **For someone who has died:** read it aloud somewhere meaningful (their grave, the place you used to be together, alone in your room). The effect on you is still substantial.

**4. Don't expect a specific reaction.** Some people respond profoundly. Some get awkward. Some say thanks and never mention it. All of these are fine. The exercise is for you regardless.

When to do this:

- **At a transition** (graduating high school, leaving home, end of a long relationship/era) is a classic timing.
- **After a hard week** as a re-grounding move.
- **For someone who is aging or ill** — don't wait. People wait too long, then it's too late.

What to avoid:

- **Don't bring up old hurts in the same letter.** This is a gratitude letter. Mixing in resentment turns it into something else.
- **Don't write it to someone harmful** in your life. "I'm grateful you taught me resilience" to someone abusive is not what this is. Real gratitude letters go to people who actually contributed positively.

Once a year is a reasonable cadence. Some teens do it as an end-of-year practice. The cumulative effect — both on you and on the relationships you write to — is unusually high-value for a low-time investment.`,
    takeaways: [
      "The strongest single positive-psychology intervention. 30 minutes, effects lasting a month+.",
      "Write to someone whose impact you've never fully named. Be specific. 200–300 words.",
      "Deliver it if you can — in person, sent, or read aloud for someone who's gone.",
      "Don't mix in old grievances. This letter is one thing only."
    ]
  },
  {
    id: "hard-weeks",
    category: "hard_weeks",
    title: "When gratitude feels fake or impossible",
    summary: "Some weeks, finding anything good feels like a lie. Forcing it then can backfire. Here's how to think about it.",
    readMinutes: 3,
    body: `Most online gratitude content skips the part where, on certain weeks, finding three good things feels like denial. If you're depressed, in grief, in real ongoing pain — being told to "just be grateful" lands as gaslighting, not as help. It's worth knowing what the research and lived experience actually say about hard weeks.

A few honest things:

**Forced gratitude can backfire.** Some studies on people in low-mood states find that forcing gratitude practice makes them feel worse, not better — because each forced item highlights the gap between "things should feel good" and "they don't." Grateful-while-depressed is not always a productive combination.

**Gratitude doesn't compete with hard feelings.** The practice isn't asking you to feel grateful instead of sad, angry, or scared. Those are valid. The practice is about widening the lens to include both, not replacing one with the other.

**On hard weeks, switch practices.** If three-good-things feels fake, try:
- **One-good-thing.** Just one. Truly the minimum.
- **Savoring small.** The shower was warm. The cat was around. The song was decent. Just notice.
- **Gratitude for hard things' partial absence.** "Things weren't as bad as Tuesday." "I got through this." "I had food today." This counts. It's not "be positive" — it's noticing the difference between "really bad" and "really bad but I'm here."
- **Skip the practice for a week or two.** Stopping a practice you can't engage with right now is wisdom, not failure.

**What heavy weeks actually need:**

If a week feels heavy enough that gratitude feels impossible:

1. **Base layer.** Sleep, food, water, movement, time outside. The most boring advice in the world; also the only thing that reliably moves a depressive shape.
2. **One person.** Tell one person you trust that you're having a hard week. Not for advice — for the act of putting some weight down.
3. **Subtract.** Drop a thing. The week is too heavy; reducing the load is more useful than adding a practice.
4. **Wait it out.** Some hard weeks pass on their own once the conditions change. Don't make decisions you can't take back during them.

When it's more than a hard week:

If "finding anything good feels impossible" lasts more than two weeks, or pairs with thoughts of not being here, that's the moment for a counselor. Persistent inability to feel positive emotion (anhedonia) is one of the more recognizable signs of clinical depression — and clinical depression is treatable. Not someday. Now. The Crisis page link is at the bottom of every Kai screen if it's acute.

This isn't weakness, and it doesn't mean gratitude is fake. It means your system needs more than a journaling practice can provide right now. Help exists, and it works.`,
    takeaways: [
      "Forced gratitude in a depressive state can backfire. The research is clear.",
      "On hard weeks, downsize to one-good-thing, savor small, or skip the practice entirely.",
      "What heavy weeks need: base layer + one person + subtract + wait.",
      "Anhedonia for >2 weeks (or paired with dark thoughts) → counselor. Clinical depression is treatable."
    ]
  },
  {
    id: "gratitude-for-others",
    category: "for_others",
    title: "Telling people what they mean to you",
    summary: "The smaller, daily cousin of the gratitude letter. Hard for many teens — the social return is high.",
    readMinutes: 2,
    body: `Most teens (and adults) under-tell the people in their lives what they appreciate about them. Partly this is awkward — sincere appreciation feels exposing. Partly it's modeled — many homes don't really do it. The research on its effects is solid: people who get told what they mean to someone are happier; the person telling them is also happier; the relationship is sturdier.

Simple version:

Once a week, tell one person specifically what you appreciate about them. Not "you're a good friend." Specific. "What you did last weekend when I was stressed about the test — sending me that video — actually made the day better." Or to a parent: "I know I haven't said this — what you said about [thing] last month helped me figure something out."

Two rules:

1. **Specific, not abstract.** "You're great" is empty. "You did X and it meant Y" is real.
2. **No transactional ask attached.** Appreciation that comes right before "and also can you do Z" reads as currency. Keep them separate by at least a day.

Why this is harder than it sounds:

For a lot of teens, sincere appreciation is more vulnerable than insults. Naming what someone means risks being uncool, awkward, or unreturned. The discomfort fades with practice. The people you tell will almost universally remember it.

What it builds:

- Stronger relationships, faster. The friendships that last are usually with people who occasionally name what works.
- A skill that pays for decades — in romantic relationships, work, parenting, friendship. Most adults are bad at this.
- A different orientation in yourself. You start scanning for appreciation-worthy moments, which feeds the practices in the other articles.

The texting version:

If saying it in person feels too much, text it. Voice memos work too. Anything is better than nothing. Don't make the perfect medium the enemy of saying the thing.`,
    takeaways: [
      "Telling specific people what they specifically mean to you is high-value, under-practiced.",
      "Specific, not abstract. 'You did X and it meant Y' beats 'you're great'.",
      "Keep appreciation separate from requests. Don't make it transactional.",
      "Awkwardness fades with practice. The people you tell almost universally remember it."
    ]
  },
  {
    id: "hedonic-adaptation",
    category: "why_it_works",
    title: "Why you stop noticing good things (and what to do about it)",
    summary: "Hedonic adaptation is the brain getting used to new conditions, fast. It's why upgrades wear off — and why savoring/contrast helps.",
    readMinutes: 3,
    body: `One of the more frustrating things about being human: you adapt to most positive changes faster than you'd expect. The new phone is incredible for two weeks, then it's just your phone. The promotion thrills you for a month, then it's the baseline. The relationship is amazing in month one, then it's normal life. This is called *hedonic adaptation*, and it's wired in.

The same is true in the other direction (mostly). Bad things hit hard, then dull. The recovery from setbacks is often faster than people predict.

What this means in practice:

**Most things you imagine will make you happier won't, for long.** This is depressing only if you didn't know. Once you know, you can stop chasing the next upgrade so hard.

**Contrast restores noticing.** When you go without a thing for a while, then have it again, you notice it. The first hot shower after camping. The first quiet morning after a busy week. The internet after losing it for an hour. This is contrast — and it's a built-in tool the brain hands you for free.

**Savoring works partly because it interrupts adaptation.** Stretching out a good moment delays the moment when the brain normalizes it. It doesn't stop adaptation forever, but it slows it down on the moments you care most about.

**Comparison defeats adaptation when it's downward, not upward.** This is rarely taught: when you compare your life to someone with more (upward comparison), adaptation accelerates — your stuff feels smaller. When you compare to your own life a few years ago, or to people with materially less, contrast restores some of the value. Both kinds of comparison are tools; teens (and adults) use the wrong one too much.

A teen-specific note:

The phone is the largest accelerator of upward comparison in modern adolescence. The algorithm reliably serves you upward — wealthier, prettier, smarter, more achieving people. Adaptation to your own life happens fast under that pressure. This is one of the strongest mechanisms behind teen unhappiness today; the wiring isn't broken, the input is unfair.

What helps:

- **Periodic absences.** Going without a thing for a week — a phone, a food, an activity — restores noticing. Almost everyone who does this reports the "first time again" feeling on return.
- **Lookback comparison.** Once in a while, think about your life two or three years ago. What's better now? Most teens haven't checked. The list is usually longer than they'd guess.
- **Savor the changes.** When you adapt fast to a good change, deliberately stay with it on the first day, the first week. Anchor it.
- **Notice when comparison is making you adapt faster.** Catch the scroll-fed "everyone has more than me" loop. That's adaptation in motion. Less of that = slower adaptation = more durable enjoyment of what you have.

The honest takeaway:

You can't escape adaptation. You can slow it down. The people who seem to be happier over time aren't getting more; they're noticing what they have for longer.`,
    takeaways: [
      "Hedonic adaptation: you get used to good and bad faster than expected. Wired in.",
      "Contrast (going without, then having) restores noticing. The brain hands this tool to you for free.",
      "Savoring works partly because it interrupts adaptation, slowing normalization.",
      "Upward comparison accelerates adaptation. The feed environment makes this constant; awareness helps."
    ]
  }
];

export const GRAT_CATEGORY_LABEL: Record<GratCategory, string> = {
  why_it_works: "Why it works",
  daily_practice: "Daily practice",
  savoring: "Savoring",
  letter_writing: "Letter writing",
  hard_weeks: "Hard weeks",
  for_others: "For others"
};
