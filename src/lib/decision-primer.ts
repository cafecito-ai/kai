/**
 * Decision-making primer. Practical heuristics for the growing-stakes
 * decisions of late adolescence: reversible vs irreversible, cognitive
 * biases that affect teen decisions specifically, when to defer, when to
 * decide, regret minimization, and when to ask for help.
 *
 * Voice rules (strict):
 *   - No "trust your gut" / "follow your heart" as universal advice. Sometimes
 *     gut is right; often it's not. Both are tools, not algorithms.
 *   - No "always do what feels right" — feelings are data, not verdicts.
 *   - Honest about cognitive biases without making teens feel broken for
 *     having them — everyone has them.
 *   - Don't moralize specific choices. The primer teaches how to decide,
 *     not what to decide.
 *   - For consequential decisions involving safety (substance use,
 *     relationships, etc.), points to the relevant primers.
 *   - When decision paralysis is severe / chronic → counselor (could
 *     indicate anxiety or other patterns worth professional eyes).
 */

export type DecisionCategory =
  | "decision_frames"
  | "biases_to_know"
  | "reversibility"
  | "when_to_defer"
  | "regret_and_recovery"
  | "decision_with_others";

export type DecisionArticle = {
  id: string;
  category: DecisionCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const DECISION_ARTICLES: ReadonlyArray<DecisionArticle> = [
  {
    id: "kinds-of-decisions",
    category: "decision_frames",
    title: "Three kinds of decisions (they don't all need the same treatment)",
    summary: "Big / small isn't the most useful frame. Reversible / irreversible, value-driven / fact-driven, urgent / patient matter more.",
    readMinutes: 4,
    body: `Most teen decision-making advice flattens all decisions into "big" or "small." The actually useful frames are different and getting them right saves time and stress.

**Frame 1: Reversible vs irreversible.**

A reversible decision is one you can undo or change course on if it doesn't work out. An irreversible decision can't be undone, or undoing it costs significantly more than the decision itself.

Reversible decisions:
- Which class to take this semester (mostly).
- Which friend to study with this week.
- What to wear today.
- What to order for dinner.
- Whether to try a new activity.
- Most short-term commitments.

Irreversible (or expensive-to-reverse) decisions:
- Whether to drop out of school.
- Whether to have sex with someone (some things you can't un-experience).
- Whether to share an explicit image (digital permanence).
- Whether to join the military.
- Whether to use a substance you might get addicted to.
- Whether to get a tattoo.
- Whether to commit to a particular college (some, not all).
- Pregnancy.

The rule that follows: **reversible decisions deserve less analysis than people give them. Irreversible decisions deserve more analysis than people give them.**

For reversible decisions: pick something, try it, adjust. The cost of "the wrong choice" is small because you can change course. People who agonize for hours over reversible decisions waste effort that doesn't improve outcomes.

For irreversible decisions: slow down. Ask multiple people. Take days or weeks. Examine your reasoning. If you can't defer it, at least be sure you've thought about it carefully.

**Frame 2: Value-driven vs fact-driven.**

A value-driven decision depends on what you want or care about. A fact-driven decision depends on what's true.

Most decisions involve both, but the proportion varies.

Value-driven (mostly):
- What career to pursue.
- Whether to date someone.
- What religion to practice.
- Where to live (after a certain point).
- Whether to have kids someday.

Fact-driven (mostly):
- Whether this medication interacts with that one (ask a doctor).
- What does the data say about which study method works.
- Which of these two cars is more reliable.
- Whether this investment is a scam.

For value-driven decisions, the work is mostly understanding what you value (which other primers in this engine address). For fact-driven decisions, the work is getting accurate information from reliable sources.

The common error: treating value-driven decisions as if they have a "right answer" findable through research. Reading more articles about whether to date someone won't tell you whether to date them. Reading more articles about whether engineering is "a good major" won't tell you if it's right for you.

**Frame 3: Urgent vs patient.**

Urgent decisions need to be made soon, with whatever information you have. Patient decisions allow you to gather more information first.

The trick: most decisions feel more urgent than they are. The pressure to decide right now is often manufactured (by salespeople, by social context, by your own anxiety).

If a decision feels urgent, ask: what specifically forces this timeline? Sometimes the answer is real (a deadline, a perishable opportunity). Sometimes the answer is "I just want to be done with this," which isn't the same thing.

A specific principle: **the more important a decision, the more suspicious you should be of urgency around it.** People making good long-term decisions usually defer to think when they can. People rushing you into a big decision are often working an angle.

**Putting it together:**

When you're facing a decision, run it through the three frames:

1. Reversible or irreversible?
2. Value-driven or fact-driven?
3. Urgent or patient?

A reversible, fact-driven, patient decision (which math textbook to use): low stakes, gather a bit of info, just pick.

An irreversible, value-driven, urgent decision (whether to take an offer that closes Friday): slow down despite the urgency, think hard about your values, consult people you trust.

The frames don't decide for you. They tell you how much process is appropriate.

**A specific note on "trust your gut":**

"Gut" gets a lot of credit it doesn't always deserve. Intuition is good at things you've practiced (the experienced chess player's intuition about a move; the experienced doctor's intuition about a diagnosis). It's less good at novel situations, especially ones with biases at play.

For teen decisions, "gut" is sometimes:
- Real pattern recognition you can't yet articulate.
- Fear pretending to be wisdom.
- Social pressure pretending to be conviction.
- Excitement pretending to be alignment.

Useful question: "What is my gut actually telling me, and how do I know it's right?" If you can't articulate the answer, your gut is information, not a verdict.`,
    takeaways: [
      "Reversible vs irreversible matters most. Reversible decisions deserve less analysis; irreversible deserve more.",
      "Value-driven vs fact-driven: don't try to research your way to value answers, and don't decide values-only on fact questions.",
      "Urgency is often manufactured. The more important the decision, the more suspicious of urgency you should be.",
      "'Gut' is sometimes real wisdom, sometimes fear / pressure / excitement in disguise. Articulate what it's telling you."
    ]
  },
  {
    id: "biases-teens-should-know",
    category: "biases_to_know",
    title: "Cognitive biases that affect teen decisions specifically",
    summary: "Everyone has biases. Some hit teen decisions harder than adult ones. Knowing the patterns helps you not get caught by them.",
    readMinutes: 4,
    body: `Human brains have predictable patterns of getting things wrong. These are called cognitive biases, and they're well-documented. Knowing the common ones helps you catch them in your own thinking — and recognize them when they're being used against you (in marketing, social pressure, manipulation).

These hit teen decisions especially hard:

**1. Present bias / hyperbolic discounting.**

Your brain weights immediate consequences much more than future ones — disproportionately. A small reward now feels like more than a larger reward later. The teen brain has this bias more strongly than the adult brain (the prefrontal cortex is still developing).

Where this shows up:
- Procrastinating because the cost of starting feels heavy compared to the future cost of not starting.
- Spending money on impulse purchases instead of saving for things you'd value more.
- Late-night decisions about anything (tired brain weights now even more heavily).
- Substance use that promises immediate effect against future cost.

**Counter-move:** When a decision involves trading present comfort for future benefit (or vice versa), specifically think about your future self. Not as a stranger; as a person who will deal with the consequences. "What would Future-Me wish Present-Me had done?"

**2. Social proof / conformity bias.**

You're more likely to do something if other people are doing it. Adolescent brains weight this signal heavily — peer behavior is a stronger predictor of teen behavior than adult behavior is of adult behavior.

Where this shows up:
- Going along with friend group decisions even when you'd choose differently alone.
- Trying substances because peers are.
- Believing things "everyone says" without checking the evidence.
- Adopting opinions of your friend group on issues you haven't thought about independently.

**Counter-move:** Imagine the decision without the group. Would you choose this alone? If not, that's data. (This doesn't mean always defy the group — sometimes the group is right. It means know the difference between agreeing with them and going along.)

**3. Sunk cost fallacy.**

You're more likely to continue a course of action because of effort already invested, even when the future case for it is weak.

Where this shows up:
- Staying with a hobby / sport / activity because you've been doing it for years.
- Staying in a relationship because of how long you've been together.
- Continuing a friendship that isn't working because of shared history.
- Sticking with a college major because you've already taken classes.

**Counter-move:** The right question is "from where I am now, would I choose to keep going?" — not "is what I've already invested too much to walk away from?" The past is the past; the decision is about the future.

**4. Loss aversion.**

Losses feel about twice as bad as equivalent gains feel good. This causes risk-aversion in some contexts and odd risk-seeking in others.

Where this shows up:
- Holding onto things you don't really want because giving them up feels bad.
- Defending bad decisions because admitting them feels like a loss.
- Avoiding new opportunities because the chance of failure looms larger than the chance of gain.

**Counter-move:** Frame decisions in terms of what you're choosing toward, not what you're giving up. The mathematics is the same; the felt experience changes.

**5. Confirmation bias.**

You notice and remember information that supports what you already believe, and discount information that contradicts it.

Where this shows up:
- Researching a decision you've already made and finding "evidence" you were right.
- Reading sources that confirm your political views and dismissing others.
- Asking friends who'll agree with you instead of friends who'll push back.
- Interpreting ambiguous events as confirming your existing read of a relationship.

**Counter-move:** Deliberately seek the strongest case against your current position. If you can't articulate why someone smart might disagree, you don't understand the issue yet.

**6. The IKEA effect / endowment effect.**

You value things you've created or own more than equivalent things you didn't.

Where this shows up:
- Overvaluing your own ideas, plans, work.
- Difficulty letting go of stuff you own.
- Defending your own decisions even when evidence has shifted.

**Counter-move:** Ask: would I value this if it weren't mine?

**7. Affect heuristic.**

You judge the goodness or badness of something based on how it makes you feel, not on its actual properties.

Where this shows up:
- Avoiding doctors / dentists because they feel scary, not because they are.
- Choosing classes by which teacher you "like" (sometimes useful, often not the best signal for learning).
- Avoiding people who remind you of someone who hurt you, even though they're different.

**Counter-move:** When a decision is high-stakes, separate the "how it feels" question from the "what's actually true" question.

**8. Availability heuristic.**

You judge how likely something is by how easily you can think of examples.

Where this shows up:
- Worrying disproportionately about rare scary events (shark attacks, plane crashes) because they're vivid in media.
- Underestimating common slow harms (sun damage, sedentary life, undertreated anxiety) because they're less memorable.
- After a friend gets into a hard college, overestimating the chance you will too.
- After a friend goes through something bad, overestimating the chance you will too.

**Counter-move:** When in doubt, ask "what are the base rates?" — not "what comes to mind?"

**9. Optimism bias / pessimism bias (depending on the day).**

People generally over-estimate good outcomes for themselves and underestimate bad ones — except when in low-mood states, where it can reverse.

Where this shows up:
- "It won't happen to me" thinking around real risks.
- Underestimating how long things will take ("planning fallacy").
- Overconfidence in plans that depend on everything going right.

In depressed states:
- "Things will never get better" feels certain even when there's no evidence.
- Catastrophizing about the future.

**Counter-move:** Notice your baseline state when deciding. Decisions made from elevated mood are different from decisions made from depressed mood, and both can be off in different directions.

**The bigger frame:**

You can't eliminate biases. Everyone has them. You can:

- **Notice them in real time.** Just naming "I might be doing X bias right now" changes things.
- **Build in friction for high-stakes decisions.** Sleep on it. Talk to someone. Wait 24 hours.
- **Consult people who don't share your stake.** They'll see what you can't.
- **Pre-commit to specific decision rules** when you're calm, before the moment.

The teens who learn to recognize their own biases by 18 have a real edge for the rest of their lives. Most adults still don't.`,
    takeaways: [
      "Everyone has biases. Knowing the patterns is the move, not pretending you're above them.",
      "Present bias, social proof, sunk cost, confirmation bias, affect heuristic hit teen decisions hard.",
      "Counter-moves: future-self thinking, alone-test, ask 'from where I am now', seek the strongest counter-case.",
      "Pre-commit to decision rules when calm. The moment is the wrong time to design your decision process."
    ]
  },
  {
    id: "reversibility-as-key-frame",
    category: "reversibility",
    title: "Reversibility: the most useful question",
    summary: "Of all the questions you can ask about a decision, 'can I undo this?' is one of the highest-leverage.",
    readMinutes: 3,
    body: `Of all the decision-making frames, one stands out as a high-leverage default: ask, every time, whether the decision is reversible.

The taxonomy:

**Fully reversible.**
The decision can be undone at low cost. Try it; if it doesn't work, change course. Examples: what class to take (drop period). Which book to read. Which song to listen to. Which Discord server to join.

For these: don't overthink. Pick something and try it. Optimizing time-to-information beats optimizing the choice.

**Mostly reversible.**
The decision can be undone but at moderate cost (time, money, social, emotional). You can change course, but it'll cost something. Examples: most jobs, most relationships, where you live, which college you choose (within limits).

For these: more thought, but don't paralyze. Choose carefully, commit, then re-evaluate at natural checkpoints.

**Hard to reverse.**
Undoing is possible but expensive — significant time, money, social cost, or emotional cost. Examples: dropping out and going back later (possible but harder), tattoos (removable but expensive and imperfect), pregnancy and parenthood (many paths, all costly to traverse).

For these: serious thought. Talk to people. Consider edge cases.

**Functionally irreversible.**
Once done, you can't undo. Some things can't be unsaid. Some experiences can't be un-experienced. Some commitments lock in for years. Examples: sharing an explicit image (digital permanence), some substance use (addiction risk), violent acts.

For these: maximum analysis. Defer if at all possible. Multiple consultations. Sleep on it for nights, not hours.

**Why this matters:**

Most people give all decisions roughly equal mental effort. Some people obsess over reversible decisions and rush through irreversible ones. The asymmetry is the bug. Calibrating effort to reversibility is the move.

**Specific applications:**

**Trying a new activity, sport, hobby:** Mostly reversible. Just try it. The cost of "wasting time" on something that doesn't fit is small; the cost of not trying things is missing out on what would have worked.

**Whether to date someone:** Mostly reversible. Breakups are real but the relationship is reversible. Don't agonize for months about whether to start; you'll find out by starting.

**Whether to share a nude image:** Functionally irreversible (per the online safety primer). Digital permanence makes this one of the highest-stakes decisions for teens.

**Whether to try a substance:** Variable. Most substances are reversible after one use; some carry real addiction risk that escalates. Specific risks depend on the substance (see substances primer).

**Which college to attend:** Mostly reversible. Transferring is normal and well-supported. But irreversible-feeling pressure makes teens treat this as bigger than it is.

**Major surgery / permanent body modification:** Functionally irreversible. Worth maximum analysis.

**A specific principle:**

**For functionally irreversible decisions: when in doubt, defer.** The penalty for taking longer is rarely as bad as the penalty for getting it wrong. "I'm not ready to decide" is usually a complete answer to pressure.

**For reversible decisions: when in doubt, do.** Trying things produces information you can't get without trying. The cost of trying and stopping is almost always less than the cost of never trying.

**The teen-specific application:**

Adolescent brains under-weight long-term consequences (present bias, from the previous article). This means teens systematically underestimate the cost of irreversible decisions and overestimate the cost of reversible ones.

Knowing this is the work-around. When something feels urgent and exciting: pause. Check whether it's reversible. If not, slow down even though every part of you wants to act.

**When the reversibility is unclear:**

Some decisions are harder to classify. Some seem reversible but actually aren't (committing to a particular friend group can lock you out of others). Some seem irreversible but turn out to be flexible (dropping out is often re-enterable).

When in doubt, ask:
- "If I do this and it doesn't work, what does undoing it look like?"
- "What would I have to do, give up, or pay to reverse course?"
- "Are there second-order effects that won't reverse even if the primary decision does?"

These questions clarify the actual reversibility.

**One example to sit with:**

The most consequential reversibility error teens make: treating something casual as low-stakes, then realizing later it had irreversible effects. A photo shared "just to one friend." A drink "just to fit in." A casual hookup with someone in your friend group. The first instance of a substance you didn't think you'd come back to.

The honest move: assume some "casual" decisions have irreversible tails. The category errors come from misreading "casual" as "reversible."`,
    takeaways: [
      "Reversibility is the highest-leverage question to ask about most decisions.",
      "Calibrate effort to reversibility: fully reversible = act fast; irreversible = maximum care + defer if possible.",
      "Teen brains under-weight long-term consequences. Knowing this is the work-around.",
      "Some 'casual' decisions have irreversible tails. The category error matters."
    ]
  },
  {
    id: "when-to-defer",
    category: "when_to_defer",
    title: "When 'not yet' is the right answer",
    summary: "Some decisions don't need to be made today. Knowing when to defer is its own skill.",
    readMinutes: 3,
    body: `One of the most underrated decision skills is recognizing when "not yet" is the right answer. Some decisions feel urgent that aren't. Some genuinely require more time than is being offered. The skill is knowing the difference.

**Reasons to defer:**

**1. The information isn't here yet.**

Some decisions depend on facts you don't have access to. Trying to decide before the facts arrive is guessing, not deciding.

Example: choosing a college before you have all the financial aid packages back. Some teens commit early and regret it when the actual numbers come in. Wait for the data.

**2. Your state is wrong.**

Major decisions made when tired, hungry, drunk, high, after a fight, in acute grief — often regrets. The decision should be made when you're regulated.

Example: deciding whether to break up with someone in the middle of an argument. The state isn't right for the decision. Tomorrow, after sleep, after food, the question looks different. (Sometimes the same answer; the *quality* of the decision is better.)

**3. The pressure is from someone else's timeline.**

Salespeople, recruiters, romantic partners, friends — sometimes other people apply pressure that isn't actually about the decision. The pressure benefits them or matches their preference; it doesn't reflect a real deadline.

Example: a friend pushing you to commit to plans, a relative pressuring a college choice, a recruiter pushing a sign-by-date. Sometimes the deadline is real (admissions deadlines); sometimes it's manufactured.

**4. You'll know more in [N] weeks.**

Some decisions are easier after specific events. Wait for those events.

Example: deciding whether to drop a class before you've taken a major test. Wait until you have a real data point.

**5. You're decision-fatigued.**

Decision-making is metabolically expensive. By the end of a day with many decisions, the brain makes worse ones. By the end of a hard week with many decisions, even more so.

If the decision can wait until you're not depleted, that's almost always better.

**6. The decision is permanent and you have any doubt.**

For functionally irreversible decisions, doubt is information. If you have doubts, that's data — wait for them to resolve. (Sometimes they don't, and you have to decide anyway. But often they do, and waiting saves you a bad outcome.)

**Reasons NOT to defer:**

**1. The deadline is real and missing it has real cost.**

Some deadlines actually matter. Missing a college application deadline. Missing a registration window. Missing a flight. These aren't always the dramatic ones; some real deadlines are quiet.

**2. Avoidance is the actual motivator.**

Sometimes "I need more time" is anxiety wearing a productivity costume. If you've been deferring something for weeks or months and haven't done any actual analysis or information-gathering, you're not deferring — you're avoiding.

**3. The cost of delay exceeds the cost of a slightly worse decision.**

Some decisions are good-enough-but-fast over best-but-slow. If the situation continues to cost you while you deliberate (an active conflict, an ongoing problem), waiting itself has cost.

**4. Indecision is itself a decision.**

By not deciding, you decide. Not asking someone out is a decision. Not signing up for the class is a decision. Not telling the truth is a decision. Some "deferrals" are just dressed-up default choices.

**The practical question:**

When you're not sure whether to decide now or defer, ask:

- "Is there something specific that will be different in [day / week / month] that would help me decide?"
- "Is the cost of being wrong higher than the cost of waiting?"
- "Am I deferring to think, or to avoid?"
- "Whose timeline is forcing this?"

If "what would be different in a week" has a real answer, defer. If you can't articulate one, the decision isn't going to get better with time — you're avoiding.

**A specific technique: the 10/10/10.**

Suzy Welch's 10/10/10 question is sometimes useful for borderline decisions:

- How will I feel about this in 10 minutes?
- How will I feel about this in 10 months?
- How will I feel about this in 10 years?

The three time horizons often disagree, and the disagreement is information. Decisions that look good at 10 minutes but bad at 10 years are present-bias-driven. Decisions that look bad at 10 minutes but good at 10 years are usually the worth-doing-anyway ones.

**A specific principle:**

**The bigger the decision, the more you should be willing to make people uncomfortable by saying "I need to think about this."** It's a real sentence. Most people respect it. The ones who don't are showing you something.`,
    takeaways: [
      "Defer when: information's missing, state is wrong, pressure is manufactured, decision fatigue, irreversible-with-doubt.",
      "Don't defer when: real deadline, you're avoiding, ongoing cost, indecision is itself a default choice.",
      "Ask: 'Is there something specific that will be different next week that would help me decide?'",
      "'I need to think about this' is a real sentence. The bigger the decision, the more you should be willing to use it."
    ]
  },
  {
    id: "regret-and-recovery",
    category: "regret_and_recovery",
    title: "When you decided wrong (and how to recover)",
    summary: "Every person who's lived has made decisions they regret. The skill is recovering, not avoiding.",
    readMinutes: 4,
    body: `One of the things rarely taught is that bad decisions are not the end of meaningful lives. Most people who've lived well have made decisions they regret. The skill that separates them isn't never-getting-it-wrong; it's recovering well.

This article is about regret and what comes after.

**Two kinds of regret:**

**Regret of action.** I did the thing, and it didn't work out.
**Regret of inaction.** I didn't do the thing, and now I wish I had.

The research is consistent: in the short term, people regret actions more (the embarrassment, the visible cost). In the long term, people regret inactions more (the unlived life, the road not taken). This shifts as you age.

For teens: the bias toward regretting actions can lead to over-cautious lives. The lasting regret of "I never tried" is often quieter but heavier than the regret of "I tried and it didn't work."

**The patterns of healthy regret recovery:**

People who recover from bad decisions tend to do some version of:

**1. Acknowledge it clearly.**

"I made a bad call. Here's what I did wrong." This sounds simple; it's hard. Most people minimize ("it wasn't that bad"), externalize ("they made me do it"), or catastrophize ("I've ruined everything") instead of just clearly naming it.

Clear naming is the foundation. Without it, you can't actually learn or move.

**2. Separate the decision from the outcome.**

A good decision can have a bad outcome (you decided to study, and still got a bad grade because the test was unfair). A bad decision can have a good outcome (you procrastinated, and got lucky on the topics). Don't judge decisions only by outcomes; judge them by whether you used good process given what you knew.

This matters because: if you blame yourself for outcomes that were partly luck, you'll be miserable. If you congratulate yourself for outcomes that were partly luck, you won't learn.

**3. Extract the specific lesson.**

"I was overconfident about how much time I had" is a specific lesson. "I'm bad at decisions" is not. Specific lessons let you do something different next time. Identity-level conclusions don't.

A specific lesson should be:
- About a particular kind of decision or context.
- Concrete enough that you could apply it later.
- Actionable — a thing to do differently, not just a feeling.

**4. Repair what's repairable.**

Some decisions cause harm to others. Repair when you can:
- Apologize specifically and unconditionally.
- Make material amends where possible.
- Change behavior, not just words.

This isn't about earning forgiveness. It's about the integrity of being someone who acts on their values. The other person decides whether to forgive; that's not your call.

**5. Accept what can't be repaired.**

Some things can't be undone. Some hurts can't be made right. Some opportunities are genuinely gone. Acceptance isn't endorsement; it's accurate recognition.

Living well after irreversible mistakes means carrying them without being destroyed by them. The mistakes shape you; they don't have to define you.

**6. Don't carry it forever.**

Excessive guilt after a sufficient amount of repair and learning becomes its own problem. Some people keep punishing themselves long after the proportional response is complete. This isn't moral; it's stuck.

If you've acknowledged, extracted lessons, repaired what's repairable, and changed your behavior — at some point, you put it down. Continuing to carry it after that point doesn't help anyone, including the person you hurt.

**Specific cases:**

**You made a bad call that hurt yourself only.**
Acknowledge, learn, move. Don't make it into a story about how you're broken. Most people make several of these in adolescence.

**You made a bad call that hurt someone else.**
Acknowledge to them (if appropriate; sometimes contact is the wrong move). Apologize. Make amends where you can. Change your behavior. Accept their response.

**You made a bad call with lasting consequences.**
Acknowledge. Learn. Accept what can't change. Find a way to live well with the consequences. Sometimes this needs a counselor.

**You made a decision in adolescence that you'd never make now.**
Almost everyone has these. The fact that 24-year-old you would never do what 14-year-old you did doesn't mean 14-year-old you was broken. The brain you have now is literally not the brain you had then.

**You wish you'd done something you didn't.**
Sometimes there's still a chance. Take it if you can. If not — examine what you can do now that lives the value the inaction violated. The friendship you didn't tend to: tend to a current one. The opportunity you didn't take: take the next one.

**About forgiveness — yours, not theirs:**

Self-forgiveness is sometimes harder than other-forgiveness. The internalized critic (see self-talk article) often won't let go.

A few useful frames:

- **The person who made the decision was you-at-that-moment-with-that-information-and-that-brain.** That person doesn't exist anymore. Punishing current-you for past-you's decisions is targeting the wrong person.
- **You're allowed to grow past your worst moments.** You're not required to define yourself by them.
- **Specific amends + changed behavior over time is the work.** Continued self-flagellation isn't the work; it's avoidance disguised as morality.

**Chronic regret rumination → counselor.**

If you find yourself stuck in obsessive replay of past decisions for months, unable to put them down despite your best efforts, that's the territory of OCD, anxiety, depression, or trauma — all treatable. A counselor can help. The rumination isn't moral; it's a stuck cognitive pattern, and there are tools that work.

**The longer arc:**

Most people who live well have a small graveyard of bad decisions in their past. They're not erased; they're integrated. Often they're the source of significant growth, hard-earned wisdom, or specific capacities to help others.

You don't need to optimize for never making bad decisions. You need to learn to recover.`,
    takeaways: [
      "Bad decisions aren't the end. Recovery is the actual skill. Most people who live well have a graveyard of past mistakes.",
      "Separate the decision quality from the outcome. Good decisions can have bad luck; bad decisions can have lucky outcomes.",
      "Extract specific lessons. 'I was overconfident about timing' beats 'I'm bad at decisions.'",
      "Chronic regret rumination (months, can't put it down) is treatable. Counselor."
    ]
  },
  {
    id: "deciding-with-others",
    category: "decision_with_others",
    title: "When to ask for help, and from whom",
    summary: "Asking for help on decisions is a skill. So is choosing who to ask.",
    readMinutes: 3,
    body: `Many teen decisions get made privately, sometimes badly, because asking for help feels like weakness. It isn't. Most adults who are good at decision-making consult others routinely. The skill isn't avoiding consultation; it's knowing when and whom.

**When to consult someone:**

- **Big decisions.** The bigger the decision, the more value in outside perspective.
- **Decisions outside your experience.** Someone who's been through similar has information you don't.
- **Decisions where you're uncertain.** Talking aloud is often when the uncertainty resolves.
- **Decisions where you're emotional.** A calmer outside perspective sees what you can't.
- **Decisions you're rationalizing.** If you can hear your own justifications and they sound thin, you need someone to push back.

**When NOT to consult someone (or to consult fewer):**

- **Small reversible decisions.** Just decide. Asking everyone about lunch is decision fatigue spread to others.
- **Highly personal value decisions.** Some choices are yours alone. Other people's input is sometimes noise.
- **When you've already decided.** Be honest if you have. Asking for validation isn't consulting; it's a different need.

**Who to consult:**

The trick isn't just to ask people. It's to ask the right people. Different people are useful for different decisions.

**For value-driven decisions (what do I want?):**
- Older friends or family who've been through similar transitions.
- Mentors who have lived lives you respect.
- A counselor / therapist who can hold space for your actual answer rather than push their own.
- Sometimes: someone who knows you well and won't tell you what you want to hear.

**For fact-driven decisions (what's true?):**
- Subject-matter experts. Doctors for medical, lawyers for legal, financial advisors for money (be careful of biased advisors).
- People with direct experience of the thing you're considering.
- Multiple sources for important facts (don't trust one source for high-stakes information).

**For decisions involving other people:**
- Sometimes: the people involved. Ask their perspective directly.
- Sometimes: someone with relationship wisdom who's outside the situation.
- Almost never: their friends, your friends, the broader social network. Triangulation creates more problems than it solves.

**For decisions about identity / direction:**
- Someone who'll let you arrive at your own answer rather than telling you theirs.
- A counselor / therapist (this is what they're trained for).
- An elder you respect — not just anyone older, but someone whose path you admire.

**Who NOT to consult (usually):**

- **People with stakes in the outcome.** Their advice is usually distorted by what benefits them.
- **People who agree with you reliably.** They're not adding information.
- **Friend group consensus.** Groupthink is real.
- **Social media polls.** Genuinely terrible for any non-trivial decision.
- **People in worse shape than you.** Their pattern-matching isn't reliable.

**How to consult well:**

**1. Frame the question clearly.**

"What should I do about [thing]" is too vague. "I'm deciding between X and Y, here's what I'm thinking, what am I missing?" gives the other person something to engage with.

**2. Listen for what surprises you.**

The most useful advice usually surprises you. If everyone confirms what you already think, you might not be hearing what's actually being said.

**3. Don't outsource the decision.**

You're asking for input, not for someone to decide for you. After listening, the decision is still yours.

**4. Notice if you're asking for permission.**

Sometimes "what should I do?" is actually "give me permission to do what I want." That's a different question and worth being honest about. If you've already decided and want validation, say so — and watch whether the person can give it honestly.

**5. Don't ask too many people.**

Consulting 10 people produces 10 opinions and confusion. 1-3 carefully chosen people produces signal. Adolescents in particular often over-consult.

**A note on parents:**

Parents are sometimes the right people to consult and sometimes not. Depends on:
- Whether they have skin in the game (sometimes yes, sometimes that distorts).
- Whether they can hear your actual question vs. impose their preferred answer.
- Whether your relationship is good enough for the conversation to be useful.

You can consult parents on some decisions and not others. You can use parents for value-validation and not for fact-finding (or vice versa). You don't owe them every decision; you also don't owe them no decision.

**A note on therapists / counselors:**

For decisions involving identity, mental health, relationships, or anything you're stuck on — a therapist or counselor is sometimes the best person. They're trained to help you think rather than tell you what to do. Many schools have counselors; insurance covers therapy in many cases; Medicaid usually covers it.

**A note on going alone:**

Some decisions are yours alone, and consulting too many people dilutes that. Personal values, identity, what you really want — sometimes the work is solitary. Honoring that is also a skill.

**The longer arc:**

Adults who make good decisions across their lives tend to build a small circle of people they consult repeatedly. Different people for different kinds of questions. Most importantly, they choose people who give them honest feedback, not flattering feedback.

Building this circle starts now. Notice who pushes back on you usefully. Notice who tells you what you want to hear. Notice who has good judgment about their own life. These are clues about who'll be useful when you really need it.`,
    takeaways: [
      "Asking for help on decisions is a skill, not weakness. Most adults who decide well consult others.",
      "Who you ask matters as much as that you ask. Different people for different decision types.",
      "Don't outsource the decision. Don't ask 10 people. Don't confuse seeking permission with seeking input.",
      "Build a small circle of honest-feedback people now. Notice who pushes back usefully."
    ]
  },
  {
    id: "decision-paralysis",
    category: "decision_frames",
    title: "When you can't decide at all",
    summary: "Decision paralysis happens. Knowing what to do about it (and when it's signaling something else) matters.",
    readMinutes: 3,
    body: `Sometimes you face a decision and just can't move. Hours, days, weeks pass. The options stay open; you don't pick. The cost of not deciding starts to exceed the cost of any specific choice. This is decision paralysis, and it's real.

**Common causes:**

**1. The decision feels bigger than it is.**

Sometimes a reversible decision gets weighted as if it's irreversible. You're choosing your major; in your head it's choosing your whole life. The mismatch creates paralysis.

Counter-move: ask, honestly, what changes if you choose wrong? Often the answer is "less than I'm acting like." For most decisions, the wrong choice costs some weeks or months, not your whole future.

**2. Perfectionism.**

You're waiting for the "perfect" option to become obviously correct. It often never does. Real decisions usually involve trade-offs; the perfect choice isn't waiting for you to find it.

Counter-move: accept that you're choosing between imperfect options. Pick the best available imperfect option. Move.

**3. Fear of regret.**

You're afraid you'll regret whatever you choose. So you choose nothing, which itself produces regret.

Counter-move: notice that not choosing is itself a choice. The "stay paralyzed" option produces guaranteed regret (the unchosen life); the "decide and live" option produces possible regret. Possible is better than guaranteed.

**4. Information overload.**

You've researched the decision so much that the options have multiplied and you can't compare them.

Counter-move: stop researching. Pick 2-3 criteria that actually matter to you, evaluate options on those, ignore the rest. Don't add new information without removing equivalent old information.

**5. The decision is genuinely close.**

Sometimes options really are roughly equivalent. The brain has been waiting for a tie-breaker that doesn't exist.

Counter-move: flip a coin. Notice your reaction to the result. If you're disappointed with the outcome, you had a preference; go with the opposite. If you're fine with the result, the options really were equivalent and either is fine.

**6. Avoidance, not paralysis.**

Sometimes "I can't decide" is avoidance of doing the work that follows the decision. The decision feels stuck because deciding means starting.

Counter-move: notice this. Often the resistance to deciding is actually resistance to doing.

**7. Anxiety presenting as paralysis.**

Some "indecision" is really anxiety — fear of any action, fear of being wrong, fear of judgment. This is different from genuinely not knowing what you want.

Counter-move: if every decision feels paralyzing — not just this one — that's a clue that the issue is anxiety, not the specific decision. A counselor or therapist can help with this pattern.

**A practical sequence for getting unstuck:**

If you're in paralysis:

1. **Name the decision specifically.** Write it down. Often "I can't decide" is vague enough to stay paralyzing.

2. **List the actual options.** Three or four. Not 12.

3. **Identify 2-3 criteria you actually care about.** Not every possible factor. The two or three that matter.

4. **Evaluate each option on those criteria.** Rough is fine.

5. **Notice your reaction.** If one option clearly stands out, go with it. If it's close, see step 8.

6. **Run the 10/10/10.** How will you feel in 10 minutes, 10 months, 10 years?

7. **Imagine each path forward.** Picture yourself one year into each option. Which version of yourself feels more like the right version?

8. **If still tied: pick by coin flip and watch your reaction.** Or pick by which has more upside. Or pick by which you'd be less embarrassed to have chosen.

9. **Commit and move.** Once you've chosen, stop second-guessing. Acting on the choice produces information; the indecision was producing none.

**When decision paralysis is chronic:**

If most decisions feel impossible — not just this one — that's worth taking seriously. It's a recognizable pattern that shows up in:

- **Anxiety disorders.** Decision paralysis is a core feature.
- **Depression.** Loss of capacity to weight options.
- **OCD.** Compulsive analyzing without resolution.
- **Trauma.** Difficulty trusting your own judgment after experiences where your judgment was overridden.
- **ADHD.** Difficulty filtering and committing.

If you recognize chronic decision paralysis in yourself: a counselor or therapist is the right move. There are specific, effective approaches for this pattern. White-knuckling alone doesn't usually work for chronic versions; treatment does.

**The longer arc:**

People who decide well aren't people who never face hard decisions. They're people who've learned to commit imperfectly and adjust. The skill isn't being right; it's being willing to move with incomplete information and update as you learn.

This skill grows with practice. Each decision is reps. The teens who treat smaller decisions as practice for bigger ones end up better at decisions by 20 than peers who agonize over everything.`,
    takeaways: [
      "Decision paralysis is real. Often it's a sign the decision feels bigger than it is, or perfectionism, or avoidance.",
      "Practical sequence: name it specifically, list real options, pick 2-3 criteria, evaluate, run 10/10/10, commit.",
      "Chronic decision paralysis (most decisions, not just this one) is treatable. Counselor.",
      "Deciding well is a skill that grows with reps. Treat smaller decisions as practice for bigger ones."
    ]
  }
];

export const DECISION_CATEGORY_LABEL: Record<DecisionCategory, string> = {
  decision_frames: "Decision frames",
  biases_to_know: "Biases to know",
  reversibility: "Reversibility",
  when_to_defer: "When to defer",
  regret_and_recovery: "Regret + recovery",
  decision_with_others: "Deciding with others"
};
