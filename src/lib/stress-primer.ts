/**
 * Stress + pressure primer. Same article shape as BodyLiteracy / NutritionPrimer
 * / DigitalWellbeing. Focused on the kinds of pressure teens actually carry:
 * school, perfectionism, performance, social, family, body-stress connection.
 *
 * Voice rules (strict):
 *   - Acute stress and chronic stress are different. The product never says
 *     "stress is bad" — short-term stress is how the body adapts. Chronic
 *     unmanaged stress is what causes wear.
 *   - "Just relax" is poison. Never appears in copy.
 *   - Don't dismiss what's hard. Validate first, tactical second.
 *   - No diagnostic claims (anxiety disorder, depression, burnout-syndrome).
 *   - Persistent overload + functioning issues → trusted adult / clinician.
 *   - Productive vs unproductive pressure is named when relevant
 *     (chosen pursuit vs forced expectation).
 */

export type StressCategory =
  | "academic"
  | "perfectionism"
  | "performance"
  | "social"
  | "family"
  | "body_signals";

export type StressArticle = {
  id: string;
  category: StressCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const STRESS_ARTICLES: ReadonlyArray<StressArticle> = [
  {
    id: "academic-load",
    category: "academic",
    title: "When school is too much, all at once",
    summary: "Deadlines pile up faster than they get processed. Triage beats throughput.",
    readMinutes: 3,
    body: `Some weeks, the math is impossible. Three tests, two essays, a quiz, a project — all in a week that's already busy. Most students try to solve this through pure effort: more hours, less sleep, more stress. That approach almost always fails halfway through.

The move that actually works is triage. Not all assignments are equal in cost or in payoff. Some take ten minutes and count for 5% of a grade. Some take eight hours and count for 30%. Same letter on the schedule, very different shape.

A practical triage:
1. **List everything due in the next 7 days.** On paper. The pile in your head feels bigger than the pile on the page.
2. **Mark each by points + hours.** Points = how much it affects your grade. Hours = realistic time to do it well.
3. **Find your "must-protect" items.** High-points, high-hours. Those get the time you actually have.
4. **Identify the cheats** (high-points, low-hours OR low-points, low-hours quick wins).
5. **Identify what you can afford to do at 70%.** Some assignments survive being "good enough." Save the perfectionism for the items that matter.

The honest version: every student is making trade-offs. Pretending you can do everything at 100% is the trap. Picking which ones get 100% is the skill.

If the load is genuinely impossible even after triage — multiple AP classes plus a sport plus a job plus family stuff — that's a real conversation with a parent, teacher, or counselor. Asking for help is not weakness. It's information they actually need.`,
    takeaways: [
      "Triage beats throughput when the load is impossible.",
      "Make the list on paper — the in-head pile feels bigger than reality.",
      "Pick which items get 100% deliberately, not by accident.",
      "If the load is genuinely impossible after triage, that's a real conversation, not a personal failing."
    ]
  },
  {
    id: "perfectionism-cost",
    category: "perfectionism",
    title: "Perfectionism has a cost most teens don't notice until later",
    summary: "Always doing more, always being more — the engine runs on fear, not aspiration. It works, until it doesn't.",
    readMinutes: 3,
    body: `Perfectionism gets praised in school and on resumes. Teachers love it. Parents often celebrate it. The cost is invisible until you've been carrying it for a while.

Researchers distinguish two flavors. *Adaptive* perfectionism is high standards + flexibility — you want to do well, you push, but you also recover, take breaks, and let some things be good enough. *Maladaptive* perfectionism is high standards + rigidity + harsh self-judgment when anything falls short. The first one makes you better at things. The second one wears you down.

Signs the maladaptive version has shown up: trouble starting things because you're afraid they won't be good. Re-doing work that was already fine. Hiding mistakes. Feeling like a fraud even when grades / praise say otherwise. Pulling all-nighters not because you couldn't have started earlier but because nothing feels finished. A sense that you're only as valuable as your last achievement.

What helps:
- **Name it.** "I'm being a perfectionist about this paper" makes it visible. Visible patterns can be changed.
- **Define 'done' before you start.** A specific rubric, even one you make up — "essay is done when it answers the prompt, has 5 paragraphs, no obvious typos." Done. Move on.
- **Practice on-purpose-imperfect.** Send the text without re-reading it three times. Submit an assignment 2 minutes early. The world doesn't end.
- **Notice the engine.** Perfectionism is usually fear in a productive shape. Fear of being seen as not enough. Worth bringing to someone — a friend, a counselor — to look at directly.

This is hard to shift alone. If it's running your life, a counselor is the right call.`,
    takeaways: [
      "High standards good. Harsh self-judgment + rigidity bad. Notice which one is in the driver's seat.",
      "Define 'done' before you start a task. Otherwise it's never done.",
      "On-purpose-imperfect practice (send the text, submit early) trains the muscle.",
      "Perfectionism is usually fear in a productive shape. It often deserves real help to look at directly."
    ]
  },
  {
    id: "performance-anxiety",
    category: "performance",
    title: "Before the game / recital / speech: pre-performance nerves",
    summary: "Nerves before a performance aren't a bug. They mean you care. The goal isn't no-nerves — it's nerves you can use.",
    readMinutes: 3,
    body: `Pre-performance nerves are physiologically the same thing as pre-performance excitement. Increased heart rate, shallower breath, slight tunnel vision. Your body is preparing to perform. People who interpret it as "I'm excited" perform better than people who interpret it as "I'm anxious." Same body, different label, different outcome.

This isn't naive optimism. The research on cognitive reframing during performance prep is solid: athletes, musicians, public speakers who say *"I am excited"* out loud before a high-stakes moment perform measurably better than those who try to suppress the activation.

What actually helps in the hour before:
- **Warm up the system.** A short physical warmup (movement, dynamic stretches) gives the adrenaline somewhere to go besides your stomach.
- **Box breath (4-4-4-4) for 90 seconds.** Steady, not slowing-you-down. Box breath lives in the Mental engine BreathingPlayer.
- **One concrete thing you've done well before.** Not "you got this" — specific. "Last week's run-through was fine. The body remembers."
- **Reframe the nerves out loud.** "I'm excited" if you can land on it. "This is the body getting ready" if you can't.
- **Skip the caffeine an hour before.** Adding stimulant to an already-up system is the wrong direction.

After: cool down. The nervous system needs to come back down or it stays up. Walk. Slow breathing. Don't immediately scroll — your body is in a wave; let it crest and ride down.

Chronic pre-performance dread that ruins the activity itself is a different beast. If you used to love something and now mostly dread it, that's worth bringing to a counselor.`,
    takeaways: [
      "Pre-performance nerves are pre-performance readiness. Reframe, don't suppress.",
      "Warmup the body so the adrenaline has somewhere to go.",
      "Skip caffeine an hour before. Adding stimulant to a charged system backfires.",
      "Chronic dread (not nerves) that's killing the activity deserves a real conversation."
    ]
  },
  {
    id: "social-pressure",
    category: "social",
    title: "Group chats, popularity, and the math of fitting in",
    summary: "Adolescent brains are wired for peer attention. The wiring is real. The wiring doesn't have to win every decision.",
    readMinutes: 4,
    body: `Caring what your peers think is not weakness. It's adolescent neurodevelopment. The teen brain literally responds to social rejection with the same neural signature as physical pain. That's not metaphor.

This wiring exists for a reason: humans needed to belong to a group to survive, and adolescence is when we learn to navigate groups outside the family. The wiring is doing its job. The problem is that the modern social environment — group chats with 50 people, public comments, screenshots that travel, sudden shifts in who's in or out — is way more high-stakes than what the wiring evolved for.

Some patterns that show up:
- **Performing identity all the time.** Treating every text, post, choice of music as a referendum on who you are.
- **Reading the room obsessively.** Checking for who left you out, who's beefing with who, whether someone's vague-posted about you.
- **Doing things you don't actually want to do** because of who else is doing them, or to avoid the awkward "no."
- **Feeling worse after group chats** but not knowing why.

What helps:
- **Notice the cost.** What does "fitting in" cost you in time, energy, sleep, your own sense of self? Sometimes the cost is reasonable; sometimes it's enormous.
- **Have a small group of low-performance friendships.** People you can be unimpressive with. This is the real social infrastructure.
- **Practice "I'm not doing that."** Once. Then again. The first few feel terrible. They get easier.
- **Notice when the group chat is making it worse.** Sometimes muting it for a day is the right move. The world won't end.
- **Track who you feel like after each interaction.** Not who's "popular" — who leaves you feeling like a fuller version of yourself.

The teen years are when you're learning the difference between fitting in and belonging. Fitting in is a performance. Belonging is when the performance is unnecessary. The friends who allow belonging are the keepers.`,
    takeaways: [
      "Peer-attention wiring is real biology, not weakness. Modern environment makes it harder.",
      "Notice the cost of fitting in. Sometimes it's worth it; sometimes it isn't.",
      "Build a small set of low-performance friendships — people you can be unimpressive with.",
      "Belonging > fitting in. Belonging is when you don't have to perform."
    ]
  },
  {
    id: "family-pressure",
    category: "family",
    title: "Parent expectations: the version they want vs the one you're becoming",
    summary: "Most parents want you to thrive. Most parents also project the version of you they hope for. Both can be true.",
    readMinutes: 3,
    body: `One of the things almost every teen runs into: a gap between what your parents want for you and what you want for you. Sometimes it's small. Sometimes it's a canyon. Most of the time it's somewhere in between.

A few things that are worth knowing:

**Most parents project.** Their version of you is partly built from their own unfinished business — what they wished they'd done, what they fear for you, what they assume you should value. Even very good parents do this. It's not evidence they don't love you.

**Pressure isn't always the same thing as expectations.** Sometimes parents have high standards but flexible methods (you must do well, here are five paths). Sometimes they have rigid methods (you must do well in the specific way I want). The second one is the painful kind.

**You're not obligated to live their unfinished life.** This is the harder one. The version of you they imagined doesn't have to be the version you become. You can love them and disappoint them on a specific thing. Those are not contradictions.

**Communication helps more than you'd think.** Not arguing. Naming. "I know you want me to do X. Here's what I'm thinking about Y. Can we talk about it?" — calmer + specific + curious. This works better than most teens expect, especially over weeks of conversation rather than one big fight.

**Sometimes the gap is bigger than communication can close.** If your parents' version of you would require you to be someone you fundamentally aren't — wrong interests, wrong identity, wrong values — that's bigger than a conversation. A counselor or trusted adult can help name what's happening and what your options actually are.

What's not the answer: pretending to be the version they want until you can leave. That works short-term, costs more long-term. It also doesn't usually fool them as much as it feels like it does.`,
    takeaways: [
      "Parental expectations often include parental projection. Both can be true at once.",
      "Disappointing them on a specific thing is compatible with loving them.",
      "Calm + specific + curious conversations work better than big confrontations.",
      "If the gap is bigger than conversation, a counselor or trusted adult is the right call."
    ]
  },
  {
    id: "body-signals",
    category: "body_signals",
    title: "How chronic stress shows up in the body (and how to listen)",
    summary: "Tension headaches, stomach issues, sleep changes, low immune. The body keeps a running tab even when your mind ignores it.",
    readMinutes: 3,
    body: `Stress doesn't just live in your head. The body keeps a parallel ledger of every week you've been at full capacity. When it's been too much for too long, it sends signals through symptoms that are easy to misread as random.

Common signals of chronic stress in teens:
- **Tension headaches.** Especially across the temples or back of the neck. From clenched jaw and shoulders all day.
- **Stomach issues.** Vague abdominal pain, nausea, irregular appetite, IBS-style symptoms. The gut is wired tightly to the stress system.
- **Trouble falling asleep + waking at 3 a.m.** Your body is up because cortisol is elevated even when you want to sleep.
- **Getting sick more often.** Chronic stress quietly suppresses immune function.
- **Random crying / hair-trigger irritability.** Emotional buffer is drained; small inputs hit harder than they should.
- **Constant low-grade fatigue.** Not the "I had a hard practice" tired — the "I slept and I'm still tired" tired.
- **Lost interest in things you used to like.** This one matters most. When stuff that used to be fun feels flat, the system is overloaded.

These signals are information, not flaws. They mean the load is too much for too long. The fix isn't powering through — that's how the symptoms got there.

What helps in this state:
- **Subtraction first.** Pick one thing to drop or shrink, even temporarily. The full plate caused the problem; the plate has to get lighter.
- **Sleep, food, movement, hydration.** The base layer. None of these are negotiable when the body is in this state.
- **Talk to someone.** Not for advice — for the act of putting the load down briefly. Friends, family, counselors. Loneliness amplifies everything.

When to escalate: more than two of those signals lasting more than two weeks, OR loss of interest in things you used to like, OR thoughts about not being here — that last one is a stop-everything-and-talk-to-an-adult moment. The Crisis page link is always at the bottom of every screen.`,
    takeaways: [
      "Tension headaches, stomach issues, broken sleep, low interest — chronic stress wearing the body down.",
      "These are signals, not flaws. The system is asking you to subtract.",
      "Sleep + food + movement + hydration are non-negotiable when the body's in this state.",
      "Two or more signals for 2+ weeks, OR loss of interest in things you used to like, deserves real help."
    ]
  },
  {
    id: "stress-vs-distress",
    category: "academic",
    title: "Stress, distress, and the line between them",
    summary: "Stress is the body adapting. Distress is stress without recovery. Knowing which one you're in changes the response.",
    readMinutes: 2,
    body: `Stress is not the enemy. The body's stress response is how you actually adapt and grow — under load, the system gets stronger if there's recovery after.

The line worth knowing: stress with recovery is how you build. Stress without recovery is what wears the system down. Same physiology, different math.

Acute stress (a test, a hard practice, an argument that gets resolved) usually resolves on its own. The body comes back to baseline within hours. You sleep, you feel okay the next day, you carry on.

Distress is when the system doesn't get back to baseline. Stress on Monday hasn't cleared by Wednesday, then Wednesday adds more, then Friday adds more. The baseline shifts upward. Now sleeping is harder, fuse is shorter, body is tense more often. This is the state where stress starts costing you instead of building you.

How to tell which one you're in this week:
- **Stress that builds:** you can rest after it. Sleep comes back to normal. Mood resets between hard things.
- **Distress:** rest doesn't restore. Sleep is broken. Mood doesn't reset between hard things. Body symptoms (headaches, gut, fatigue) accumulate.

If you're in distress: subtract first, add second. Drop something. Reduce the next week's load. Talk to a person. The body needs time below the line, not better technique above it.

The product never frames stress as weakness. Some of the most challenging weeks of your life are weeks you're growing in real ways. Distress is different — that's the system asking for help.`,
    takeaways: [
      "Stress with recovery = growth. Stress without recovery = wear.",
      "Acute stress resolves within hours/days. Distress doesn't.",
      "Body signals (broken sleep, fatigue, accumulated tension) tell you you've crossed the line.",
      "In distress: subtract first. Don't try to perform your way out."
    ]
  }
];

export const STRESS_CATEGORY_LABEL: Record<StressCategory, string> = {
  academic: "Academic load",
  perfectionism: "Perfectionism",
  performance: "Performance",
  social: "Social",
  family: "Family",
  body_signals: "Body signals"
};
