/**
 * Friendship + relationship primer. Peer health, conflict + repair, romantic
 * basics, loneliness, recognizing harmful patterns, and boundaries.
 *
 * Voice rules (strict):
 *   - Friendships matter and they're harder in adolescence than adults remember.
 *     Don't minimize ("you'll make new friends" / "just talk to them").
 *   - No diagnosis (toxic person, narcissist, sociopath). Describe behaviors,
 *     not labels.
 *   - Romantic content is age-appropriate, consent-centered, non-prescriptive
 *     about identity / orientation / who teens "should" date.
 *   - Loneliness is normal and not a personal failing. The piece never frames
 *     it as "you need more friends" — it frames the actual experience.
 *   - When a relationship pattern looks unsafe or controlling, direct teens
 *     to a trusted adult — describe the pattern, don't label the person.
 *   - No "boys will be boys", "girls are catty", or any gender essentialism.
 */

export type RelCategory =
  | "friendship"
  | "conflict"
  | "romantic"
  | "loneliness"
  | "warning_signs"
  | "boundaries";

export type RelArticle = {
  id: string;
  category: RelCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const REL_ARTICLES: ReadonlyArray<RelArticle> = [
  {
    id: "what-makes-a-friendship-work",
    category: "friendship",
    title: "What actually makes a friendship work",
    summary: "Reliability, reciprocity, low-stakes time together, the ability to repair after hurt. The rest is decoration.",
    readMinutes: 3,
    body: `Most teen friendships are intense — peer relationships matter more during adolescence than at any other point in life. That's neurology, not a personal quirk. The friendships you build in these years lay tracks for how you do relationships later.

A few things research and lived experience both point to as the load-bearing pieces:

**Reliability.** They show up when they said they would. They text back, eventually. They don't disappear when something better comes along. The friendships that last are not the most exciting ones; they're the ones where you can predict, roughly, what the other person will do.

**Reciprocity.** Over time, both sides contribute roughly the same energy. Not transactionally — friendships have phases where one person needs more, and that's fine — but across the year, both sides are giving and both sides are receiving. If you're always the one initiating, always the one absorbing problems, always the one bending plans — that's worth noticing.

**Low-stakes time together.** The friendships that go deep are the ones where you've been bored together. Hung out doing nothing. Walked to get food and not had anything particular to say. High-pressure socializing (parties, big group settings) doesn't build this kind of closeness; quiet time does.

**The repair muscle.** Every friendship hurts at some point. The good ones survive that hurt because both people can talk about it. Not "let's forget about it" — actually name what happened, hear the other side, apologize if needed. Most teen friendships die not from the fight but from never repairing the fight.

Some patterns that aren't actually load-bearing, even though they feel like they should be:
- Identical taste in music / shows / aesthetic
- Same friend group
- Talking constantly (over-texting can mask not-actually-deep)
- High emotional intensity all the time

What's load-bearing is much quieter than what's exciting.`,
    takeaways: [
      "Reliability, reciprocity, low-stakes time together, and the repair muscle — these are the load-bearing four.",
      "Bored-together time builds deeper closeness than high-energy socializing.",
      "Friendships die from un-repaired hurt more than from the hurt itself.",
      "Intensity feels like depth but isn't always the same thing."
    ]
  },
  {
    id: "friendship-decay",
    category: "friendship",
    title: "When a friendship is fading",
    summary: "Some friendships end because something broke. Most just decay because the conditions changed. Both are normal.",
    readMinutes: 3,
    body: `Friendships fade. Some end with a fight, but most just slowly stop. Different schools, new sports, new groups, different schedules — the conditions that built the friendship change, and the friendship doesn't survive the new conditions.

This is not a failure. It happens to most friendships people make in their lives. The point of a friendship is not always to last forever; sometimes it's to be there during the years you needed it.

Signs a friendship is fading rather than just busy:
- The check-ins keep getting shorter and farther apart.
- When you do see each other, the conversation feels surface-level.
- You're aware of effort — like you're working at it where it used to be easy.
- You don't naturally think of them when something good or bad happens.
- They feel the same way (this part is mutual; if it's one-sided, that's something else).

What's worth trying:
- **Name it gently.** "I feel like we haven't really hung out in a while. Want to do something?" Sometimes the friendship was waiting on someone to make the first move.
- **Try the low-stakes version.** Not a big plan — a walk, getting food, doing a thing together that you both like. Big plans put pressure on a friendship that's already weakened.
- **Match the energy.** If they're not putting in effort, don't keep absorbing the cost of the friendship. Some friendships are seasonal; that's allowed.

What's worth letting go:
- A friendship you have to perform in.
- A friendship where you're always the one keeping it alive.
- A friendship that takes more energy than it gives back, for months on end.

You don't have to formally "break up" with most friendships. Most fade gracefully if you stop forcing them. The hard part is letting that be okay.

Side note: when several friendships fade at once (after a big change — new school, breakup, moving) it can feel like everyone is leaving. Usually it's that the conditions shifted, not that you became unlovable. New conditions take time to build new friendships.`,
    takeaways: [
      "Fading is normal. Most friendships are seasonal, not lifelong.",
      "Naming it gently and trying the low-stakes version is the move before letting go.",
      "Friendships that need constant performance from one side aren't worth maintaining.",
      "Several fading at once usually means conditions changed, not that you did."
    ]
  },
  {
    id: "conflict-and-repair",
    category: "conflict",
    title: "The repair conversation: how to actually have a hard talk",
    summary: "Most teens (and adults) duck the repair conversation. The ones who can have it have closer friendships.",
    readMinutes: 4,
    body: `If you can name a hurt to a friend without it becoming a war, your friendship gets stronger. If you can't, hurts accumulate silently until the friendship cracks. The repair conversation is a skill — almost no one is born good at it.

A simple structure that works:

**1. Pick the moment.** Not in front of others. Not during a fight. Not over text if you can help it — text strips tone and most repair conversations don't survive missing tone. In person or on a call. Calm-ish.

**2. Open with what happened, not who you are.** "When you canceled last weekend without telling me, it felt like our hangout didn't matter to you." Not "You're a bad friend." The first one is a moment; the second is a verdict. People can engage with a moment. People defend against a verdict.

**3. Name the feeling, not the diagnosis.** "I felt hurt" not "I have abandonment issues." "I felt left out" not "You're being a bad friend." Feelings invite conversation. Diagnoses invite defensiveness.

**4. Listen for what they didn't see.** Most of the time, the other person didn't know they hurt you. Or they thought you were fine because you didn't say anything. Or they were dealing with something separately. Listen. Don't pre-write their response in your head.

**5. The apology, if it comes.** A real apology has three parts:
   - "I'm sorry I did X" — naming the specific thing.
   - "I understand it made you feel Y" — naming the impact.
   - "Here's what I'll do differently" — naming what's next.
   A "sorry you feel that way" is not an apology. It's a deflection.

**6. Decide if it's repaired.** Sometimes one conversation closes it. Sometimes it takes a few. Sometimes you realize this person isn't actually able to hear you on this, and you have to decide what to do with that.

What to skip:
- **Bringing up old grievances.** This conversation is about the specific thing. Old fights are old fights.
- **Going to others to "build your case" first.** That's relationship politics. It poisons the actual conversation.
- **Demanding immediate agreement.** Sometimes people need time to sit with what you said. That's fair.

The friendships that survive into adulthood are the ones where both people can do this. It's worth practicing even when it feels hard.`,
    takeaways: [
      "Moment, not verdict — describe what happened, not who they are.",
      "Feelings invite conversation; diagnoses invite defensiveness.",
      "A real apology names the thing, names the impact, and names what's next.",
      "Friendships that survive into adulthood have two people who can have this conversation."
    ]
  },
  {
    id: "romantic-basics",
    category: "romantic",
    title: "First relationships: what mutual respect actually looks like",
    summary: "The product doesn't have an opinion on who you date or when. It has an opinion on what good treatment looks like.",
    readMinutes: 4,
    body: `Whether you're dating, thinking about dating, not interested in dating, or somewhere in between — this isn't a piece about whether to. It's a piece about what good treatment looks like in any relationship that has romantic feeling involved.

A few things that hold up across all kinds of relationships:

**You can be yourself around them.** Not the most polished version, not the version you perform for the group chat. The actual you. If you're constantly editing what you say or do to keep them comfortable, that's information about the relationship, not about you.

**They're curious about your life beyond them.** Your other friendships, your interests, your family, your future. They don't try to be your entire world. Healthy relationships have a "we" but they also leave space for both "I"s.

**They handle "no" well.** Anything from "no, I don't want to do that tonight" to "no, I'm not ready for that physically." A "no" should never make them angry, guilt-trippy, or cold. The way someone responds to your no tells you a lot.

**They want what's good for you, even when it's inconvenient for them.** They're happy when you succeed. They support things that take time away from them. They don't quietly resent your other commitments.

**The physical pace is mutual.** Anything physical happens when both people genuinely want it — not because one person pressured the other, not because "everyone's doing it," not because they don't want to seem inexperienced. Slow is fine. Stopping is fine. Saying no after saying yes is fine.

**They communicate when something's wrong.** Not perfectly — no one does this perfectly — but they try. They don't disappear without explanation, give silent treatment, or expect you to read their mind.

A note about social media and dating:
- The relationship doesn't owe the internet anything. Whether to post about someone is your choice. Pressure to make it public is its own red flag.
- DM history, follower lists, who-liked-what — these are easy to obsess over and don't actually tell you what's true in your relationship. The relationship is between the two of you, not the algorithm.

About identity:
- Who you're attracted to is yours to figure out, in your own time. You don't owe anyone a label, a coming-out, or an explanation.
- The same standards above apply regardless of who you're with.

If something in your relationship doesn't match the patterns above, that's information. Not a verdict — sometimes early relationships have rough patches that improve. But chronically not having these is a sign worth listening to. The next article in this section covers warning signs that go past "rough patch."`,
    takeaways: [
      "You can be yourself around them — not the performed version.",
      "How someone handles 'no' is information.",
      "Physical pace is mutual, always. Slow is fine; stopping is fine.",
      "Healthy relationships have a 'we' AND room for two 'I's."
    ]
  },
  {
    id: "loneliness",
    category: "loneliness",
    title: "What loneliness actually feels like (and why it's not a personal failing)",
    summary: "Loneliness is more common in teens than at almost any other age. It's not the same as being alone. And it's not because you're broken.",
    readMinutes: 3,
    body: `One of the more painful things teens sometimes carry is loneliness in the middle of crowded days. You can be at school, in groups, in group chats, at lunch with people, and still feel completely alone. That gap between "surrounded" and "actually connected" is its own kind of hurt.

A few honest things:

**Loneliness is at an all-time high in adolescents.** The data is consistent across countries. It's not a you-problem; it's a generational and structural thing. Social media replacing in-person time, busier schedules, less unstructured hanging out, the specific shape of modern teenage life — these all contribute. You're not broken because you feel this way.

**Loneliness is not the same as being alone.** You can be alone and content. You can be in a crowd and lonely. The variable is the quality of connection, not the quantity of people.

**Loneliness is often a signal, not a symptom.** It's the body telling you "you need more real connection." Like hunger telling you you need food. The signal is doing its job.

What it actually feels like (in case the word doesn't quite fit):
- A kind of dull weight that's there even when nothing's wrong.
- Feeling like nobody really knows you, even though people know your name.
- Scrolling for hours not because you want to but because you don't know what else to do.
- Wanting to text someone and not having anyone you actually want to text.
- Feeling like everyone else is in on something you're not.

What helps:
- **One-on-one time over group time.** Real connection happens in pairs and threes, not crowds. If you have a friend, even one, ask them to do something one-on-one. Skip the bigger plan.
- **Doing things side-by-side, not face-to-face.** Going for a walk, doing homework together, watching something — easier to actually talk in motion than in a planned hangout.
- **Reducing scroll.** Scrolling makes loneliness worse. It feels like connection (you're seeing people!) but it's not. Cutting it back, even by 30 minutes a day, helps.
- **A weekly something.** A class, a club, a sport, a regular activity. Repetition + shared context is how friendships actually build. Trying to make friends from zero in big crowds is hard. Showing up to the same thing every week is the cheat code.
- **Naming it to someone.** Not asking for advice. Just saying "I've been feeling kind of lonely lately." Naming it out loud often makes it feel less crushing. Friends, family, counselor — any of them.

When to escalate:
- If loneliness is paired with thoughts of not being here, that's a stop-everything-and-talk-to-an-adult moment. The Crisis page link is always available.
- If you've been deeply lonely for months and nothing is shifting, a counselor or trusted adult is worth bringing in. This is real, and they can help. It's not weakness.`,
    takeaways: [
      "Loneliness is at an all-time high in teens — structural, not personal failing.",
      "Loneliness ≠ being alone. The variable is quality of connection.",
      "One-on-one time and side-by-side activities build connection. Crowds don't.",
      "Months of unshifting loneliness or loneliness + dark thoughts → talk to a trusted adult."
    ]
  },
  {
    id: "warning-signs",
    category: "warning_signs",
    title: "When a relationship pattern is harmful (and what to do)",
    summary: "The point isn't to label the person. The point is to recognize the pattern. Patterns predict.",
    readMinutes: 4,
    body: `Some relationships — friendships, romantic, family — develop patterns that hurt the people inside them. This piece doesn't diagnose anyone. It names patterns. If you see these in a relationship in your life, that's information worth taking seriously.

**Control disguised as care.**
"I just don't want you hanging out with them because they're a bad influence." "I'm only checking your phone because I love you." "If you really loved me, you wouldn't go." Caring people don't restrict who you see, what you do, or where you go on your own. Restriction wrapped in care language is still restriction.

**The cycle: love-bomb → distance → repair → love-bomb again.**
Some relationships run on a high-low cycle. Intense closeness, then a sudden cold spell or fight, then a dramatic reconciliation, then back to intense closeness. The intensity feels like proof the relationship is real. It's actually a pattern that's hard on the nervous system and gets harder to leave over time.

**Isolation from other people.**
Slowly, you see your other friends less. The relationship takes more and more of your time and attention. They subtly (or directly) criticize your other relationships. You realize you've stopped texting people you used to be close to. Isolation is one of the most consistent warning patterns; healthy relationships expand your world, they don't shrink it.

**Big feelings used as control.**
"If you do X, I'll never speak to you again." "You're going to make me hurt myself." "I can't be without you." These statements transfer responsibility for someone else's feelings onto you. No relationship is healthy if your behavior is being managed through their threats — even ones about themselves.

**Crossed physical limits, even once.**
A push during an argument. A grab. Anything physical that wasn't agreed to. There's no version of this that's a one-time thing in a healthy relationship.

**You're constantly anxious before seeing them.**
The kind of anxious where you're already managing them in your head before they're in the room. What mood will they be in? What will set them off? Walking on eggshells, even part of the time, is information.

**Sexual pressure.**
Being pressured into anything physical you don't want. "If you loved me you would." Repeated asking after a clear no. Acting hurt or angry when you say no. Doing things while you're not in a state to fully consent. Any of these is a hard signal. Your body is yours.

If you see two or more of these patterns happening regularly in any relationship in your life — friend, partner, family member — that's worth bringing to a trusted adult. Not for them to "fix" the situation, but to help you think through what's happening and what you want to do.

Resources for harder situations:
- A trusted adult (parent, relative, teacher, coach, counselor).
- A school counselor — they're trained for exactly this.
- For relationships involving dating violence: Love is Respect (text LOVEIS to 22522, or call 1-866-331-9474, or chat at loveisrespect.org).
- The Crisis page link at the bottom of every Kai screen has full crisis resources.

This is not your fault. People in harmful relationships often blame themselves. The patterns above are the responsibility of the person doing them, not the person experiencing them.`,
    takeaways: [
      "Patterns predict. Two or more of these happening regularly is information, not paranoia.",
      "Healthy relationships expand your world; harmful ones shrink it.",
      "Big feelings used as threats (about you, about them) are control, not love.",
      "Any pattern here → a trusted adult or counselor. This isn't yours to handle alone."
    ]
  },
  {
    id: "boundaries",
    category: "boundaries",
    title: "Boundaries: the soft no, the firm no, the leaving",
    summary: "Boundaries are not walls. They're the line between what you'll keep and what you won't. They take practice.",
    readMinutes: 3,
    body: `A boundary is a statement about what you will and won't do — in a friendship, a family situation, a relationship, a group chat, anywhere. It's not a punishment. It's not an ultimatum. It's information.

A few useful frames:

**Soft no:** "Not tonight, I'm wiped." "I'm not really into that, but you do you." "Can we do something else?" These don't require an explanation or a fight. The other person can take it or push back; if they push back too much, you'll see something.

**Firm no:** "I'm not doing that." Period. No justification needed. If someone is asking you to do something physical you don't want, something that would betray someone else's trust, something that crosses a line for you — the firm no is enough. You don't have to explain. "Why not?" "Because I'm not doing that."

**Leaving:** The boundary above the firm no. If someone keeps pushing past your no, the boundary becomes "I leave." Leave the room. Leave the chat. Leave the relationship if the pattern keeps happening. This is allowed.

What boundaries are not:
- A speech you have to give.
- A justification to someone who's not going to honor it.
- An expectation that the other person will agree.
- A threat ("If you do X, I'll do Y").

You can have boundaries without telling anyone in advance. Often it's the action — what you do or don't do — that holds the line, not the words.

Some specific boundary patterns that come up often:

- **Group chats that get cruel.** You can mute. You can leave. You don't owe an exit speech.
- **A friend who vents to you constantly and never asks how you are.** "Hey, I want to be there for you, but I'm also kind of drained right now." Or just: be less available for a while. The friendship will adjust or it won't.
- **A family member who keeps bringing up your weight / grades / one thing that hurts.** "I'm not going to talk about that. Tell me about something else." Repeated as needed.
- **A romantic partner who pushes physically.** Firm no. If the pushing continues, that's not a boundary issue — that's a different conversation, often with a trusted adult.

The hardest boundary skill is letting people be upset that you held a line. Most people don't like being told no. That's okay. Their disappointment isn't proof you were wrong.

If you find yourself unable to say no anywhere in your life — friends, family, partner — it's worth talking to someone about that pattern. Counselors are very good at helping people learn this. It's a skill, not a personality trait.`,
    takeaways: [
      "Soft no, firm no, leaving — three escalating tools. Use whichever fits the moment.",
      "You don't owe a justification for a no, especially a firm one.",
      "Others being upset that you held a line isn't proof you were wrong.",
      "If you can't say no anywhere, that's a real and learnable skill — a counselor can help."
    ]
  }
];

export const REL_CATEGORY_LABEL: Record<RelCategory, string> = {
  friendship: "Friendship",
  conflict: "Conflict + repair",
  romantic: "Romantic",
  loneliness: "Loneliness",
  warning_signs: "Warning signs",
  boundaries: "Boundaries"
};
