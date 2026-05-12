/**
 * Motivation + procrastination primer. The "why can't I start" trap,
 * intrinsic vs extrinsic drive, perfectionism-induced freeze, the
 * 5-minute start, and what motivation actually feels like (vs what
 * teens are told it should feel like).
 *
 * Voice rules (strict):
 *   - No "just do it" / "stop being lazy" / "grindset" / "no excuses".
 *   - Procrastination is named as anxiety + avoidance most of the time,
 *     not a discipline failure.
 *   - No "10x productivity" / hustle-culture cliches.
 *   - No diagnostic claims (ADHD, executive dysfunction). Describe behavior,
 *     point to a professional if patterns are chronic and impairing.
 *   - Intrinsic motivation is named as the durable kind, but the article
 *     doesn't shame extrinsic motivation — most school is structurally extrinsic.
 *   - No prescription about career paths or what teens "should" be motivated by.
 */

export type MotivationCategory =
  | "starting"
  | "drive"
  | "freeze"
  | "energy"
  | "consistency"
  | "when_stuck";

export type MotivationArticle = {
  id: string;
  category: MotivationCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const MOTIVATION_ARTICLES: ReadonlyArray<MotivationArticle> = [
  {
    id: "the-5-minute-start",
    category: "starting",
    title: "The 5-minute start: why you can't begin (and how to anyway)",
    summary: "Starting is harder than continuing. Make starting smaller until it's not.",
    readMinutes: 3,
    body: `Most people don't have a finishing problem. They have a starting problem. Once you're 20 minutes into something, you usually keep going. The mountain is the first step, not the climb.

Why starting is so hard:
- **Anticipation is worse than the actual task.** Sitting down to write a paper is harder than writing the first paragraph. Your brain runs through the whole thing in advance — every hard part — and the projected pain feels real.
- **You judge the task by its endpoint.** The brain doesn't see "spend 25 minutes." It sees "write the whole essay, perfectly, in one sitting." The size of the task as imagined is much bigger than the task as done.
- **The first sentence has to be perfect.** Perfectionism shows up at the start of every task. The first sentence isn't allowed to be bad, which means it can't get written.

The 5-minute start:
- **The deal is: do this for 5 minutes, then you're allowed to stop.** Not "do this until it's done." Five minutes. The 5-minute version is so small your brain doesn't trigger the avoidance loop.
- Set a timer.
- Almost every time, you don't stop at 5 minutes. The hard part was starting. Once you're in motion, momentum carries.
- If you do stop at 5, that's still 5 more than 0. Sometimes 5 is what you had today.

Variants that work for different tasks:
- **For writing:** "Just write the first sentence, even badly. You're allowed to delete it after." Garbage first drafts are how all real writing works.
- **For chores / cleaning:** "Just put on the music and stand in the room." That's the start. Action follows.
- **For workouts:** "Just put on the clothes and go to the spot." Often that's enough; sometimes you skip. Either is a win compared to scrolling on the couch.
- **For studying:** "Open the book. Read one page." Tiny entry-point.

What kills the 5-minute start:
- Phone in the room. The 5 minutes turn into 5 seconds before the algorithm reels you back.
- Picking the hardest part first. Start with the easiest, most concrete piece — the one that has the most obvious next move.
- Saying "I'll start in 10 more minutes." That 10 turns into 60 turns into "I'll start tomorrow." The 5-minute start is now or it's not.

Once you're in motion, motivation often shows up. Most people think motivation comes first, then action. It usually goes action → motivation. Start tiny; let the rest follow.`,
    takeaways: [
      "Starting is the mountain. Once you're 20 minutes in, you usually keep going.",
      "The 5-minute start: do the thing for 5 minutes, then you're allowed to stop. Most of the time you won't.",
      "Action → motivation, not motivation → action. Don't wait to feel ready.",
      "Phone out of the room. Hardest part is the entry, not the work."
    ]
  },
  {
    id: "procrastination-is-anxiety",
    category: "freeze",
    title: "Procrastination is usually anxiety, not laziness",
    summary: "The thing you're avoiding is the thing you're scared of. Naming the fear is the start of moving.",
    readMinutes: 3,
    body: `Most of the time, procrastination isn't a discipline problem. It's avoidance of something specifically uncomfortable about the task. The brain isn't being lazy; it's protecting you from a felt threat.

A few common procrastination triggers (and what they actually are):

**Fear of doing it badly.** "What if my essay is bad?" The brain prefers no essay (uncertain quality) to a real essay (definitely judged). Procrastination becomes a way of avoiding the verdict.

**Fear of starting and not finishing.** "What if I start studying and realize I don't understand any of this?" Starting risks confirming a feared truth. Not starting preserves the maybe.

**Resentment at the task itself.** "This assignment is stupid and I shouldn't have to do it." The procrastination is a quiet protest. Often there's truth in it — the work is dumb, the system is unfair, the requirement makes no sense — but the procrastination doesn't actually solve any of that.

**Decision overload.** "I don't know where to start." Many small choices feel like one giant choice. The brain stalls.

**Bad sleep, bad food, bad regulation.** Procrastination spikes hard when the body's underslept and underfed. This one's often missed — "I can't focus" gets read as character when it's biology.

**Boredom that hasn't named itself.** Some tasks are genuinely tedious. The brain refuses. Procrastination is the protest. The fix isn't pep talks; it's getting through the boring part faster.

What helps:

1. **Name the actual fear.** Out loud. "I'm scared this essay will be bad and I'll get a B." "I don't know where to start and I'm afraid of looking stupid." Specificity drains some of the charge.

2. **Make the next step small enough that the fear doesn't apply.** "Write the title of the essay and the prompt at the top of the page." The fear of writing a bad essay doesn't apply to writing a title. Now you're in motion.

3. **Time-box, don't task-box.** "I'm going to work on this for 25 minutes" beats "I'm going to finish this." Time is finite; the task feels infinite. The time-box gives the brain a clear endpoint.

4. **Separate the doing from the judging.** "Right now I'm writing badly on purpose. Editing comes later." This works for almost every kind of work.

5. **Take care of the body.** Sleep, food, water, ten minutes of movement. If you're chronically procrastinating, check the base layer before assuming it's a discipline issue.

When to take it seriously:

If you can't start almost any sustained task, if every assignment becomes a crisis, if you're stuck in chronic shame about it for months — that's worth bringing to a counselor. Not because something is "wrong with you," but because chronic executive struggles can have specific, treatable patterns underneath them (anxiety, attention regulation issues, depression). Getting professional eyes on it can change things faster than white-knuckling alone.`,
    takeaways: [
      "Procrastination is usually fear, not laziness. The task contains something specifically scary.",
      "Naming the fear out loud drains some of the charge.",
      "Make the next step small enough that the fear doesn't apply.",
      "Chronic, life-impairing procrastination → counselor. There are treatable patterns underneath."
    ]
  },
  {
    id: "intrinsic-vs-extrinsic",
    category: "drive",
    title: "Why some things are easy to keep doing (and most school stuff isn't)",
    summary: "Intrinsic motivation lasts. Extrinsic motivation works short-term and burns out. Both are real.",
    readMinutes: 4,
    body: `Motivation comes in two flavors that researchers have studied extensively: intrinsic (you do it because doing it feels meaningful, interesting, or like you) and extrinsic (you do it because of an external reward or pressure — grade, money, parent expectation, avoiding consequence).

A few things to know:

**Intrinsic motivation is durable.** Activities you'd do without anyone watching, without a grade, without praise, are the ones you'll keep coming back to over years. They survive bad weeks, bad teachers, bad weather.

**Extrinsic motivation works in the short term and erodes over time.** It can get you through a semester. It rarely gets you through ten years. People who chose careers entirely for extrinsic reasons (money, parents, prestige) often hit a wall in their late 20s or 30s — the extrinsic fuel runs out.

**Most of school is structurally extrinsic.** You're studying for grades, college admissions, parent approval. That's not a moral failing on your part — it's how the system is built. Expecting yourself to feel intrinsically motivated about every subject is unfair.

**Intrinsic can be built — but not forced.** If you've been doing something only for extrinsic reasons and start to find moments of genuine interest, intrinsic motivation can grow. Forcing yourself to "love" a subject doesn't work; getting curious in small ways sometimes does.

**Extrinsic rewards can damage existing intrinsic motivation.** There's research on this: if you love drawing and someone starts paying you to draw, sometimes the love quietly leaves and only the work remains. This is called the "overjustification effect." Worth knowing if you're picking what to monetize.

What this means for you:

- **Notice which of your activities are intrinsic and protect them.** The ones you do without prompting, that you'd do alone, that you don't post about. These are the load-bearing ones for your wellbeing.
- **For extrinsic tasks (most of school), don't try to manufacture intrinsic motivation.** Just get them done with the structure described in the other articles in this section. Save the intrinsic energy for things that actually pull you.
- **Look for the intrinsic in the extrinsic.** Even in a class you don't love, there's often one piece — a topic, a project, a skill — that pulls you. Lean into that piece. The rest is admin.
- **Be careful about turning hobbies into hustles.** If you have something you love doing for its own sake, monetizing it carries a real cost. Not always wrong, but not free.

A note on what motivates you: parents, schools, and social feeds will all tell you what should motivate you (money, prestige, achievement). Some of those things might genuinely motivate you. Some won't. The ones that really do are something you discover, not pick from a menu. Pay attention to what you actually do — that tells you what motivates you more than what you say.`,
    takeaways: [
      "Intrinsic motivation is durable; extrinsic burns out. Both are real.",
      "Most of school is structurally extrinsic. Expecting intrinsic feelings about everything is unfair to yourself.",
      "Pay attention to what you do without anyone watching. That's where intrinsic lives.",
      "Monetizing what you love carries a cost. Worth thinking through before turning hobbies into hustles."
    ]
  },
  {
    id: "perfectionism-freeze",
    category: "freeze",
    title: "When perfectionism freezes you",
    summary: "If the task has to be perfect, it can't be started. Lower the bar to begin; raise it to finish.",
    readMinutes: 3,
    body: `Some procrastination is fear of doing it badly. Some is something more specific: the freeze where you can't start because nothing you produce will be good enough — for the teacher, for the grade, for the version of yourself that should be doing this.

The math: if the bar at the start is "perfect," your only option is to not start. You can't write a perfect first sentence. You can't draw a perfect first line. You can't play a perfect first note. So you delay starting until "later" — which never comes, or comes the night before in panic.

The shift:

**Different bar to start, different bar to finish.** Starting requires the lowest possible bar. Finishing can require a real bar. Confusing the two is what makes perfectionists freeze.

- **Starting bar:** "Anything on the page." First sentence: bad on purpose. First sketch: ugly on purpose. First take: rough.
- **Finishing bar:** "Good enough for this assignment / context." Real standards, but applied after the rough draft exists.

The mantra: you can't edit a blank page.

What helps if you're a perfectionism-freezer:

1. **Make the first version intentionally ugly.** Write "VERSION 1 - bad on purpose" at the top. Take the pressure off explicitly. You're not trying to make this good — you're trying to make it exist.
2. **Set a "minimum viable draft" target.** "I will write 500 ugly words." "I will sketch 5 bad ideas." "I will practice the piece all the way through once, badly." Then stop. Now you have something to revise instead of nothing to start.
3. **Time the bad first version.** "I have 30 minutes to make the bad version. Then I stop." The constraint makes perfectionism impossible by definition — perfect can't happen in 30 minutes, and you knew that going in.
4. **Notice when you're re-doing instead of revising.** Re-doing = starting over from scratch because the first version felt embarrassing. Revising = improving what's there. Real improvement is in revising. Endless re-doing is perfectionism in a productive disguise.

A specific note on creative work:

If you do anything creative — writing, drawing, music, design — the freeze hits especially hard. Almost every working artist has the same advice: the only way past it is volume. Make a lot of bad stuff. The good stuff comes from sifting through the bad stuff. You don't get to skip the bad-stuff stage. People who try to skip it usually stop making anything.

If perfectionism is freezing not just academic work but most of your life — extra-curriculars, friendships, conversations, decisions — that's a bigger pattern, and a counselor can help. Perfectionism-as-driver is one of the most well-studied things in therapy, with concrete tools that work.`,
    takeaways: [
      "Lower the bar to start; raise it to finish. Confusing the two is what freezes you.",
      "You can't edit a blank page. The first version exists to be revised, not to be good.",
      "Write 'bad on purpose' at the top. Removes the verdict.",
      "Perfectionism freezing your whole life → counselor. It's well-studied and treatable."
    ]
  },
  {
    id: "energy-management",
    category: "energy",
    title: "Manage energy, not time",
    summary: "You have 168 hours a week. The variable that matters more is energy, not hours.",
    readMinutes: 3,
    body: `Teens are taught to manage time — calendars, schedules, hour-by-hour planning. That works to a point. But the real bottleneck on what you get done isn't usually time. It's energy.

A few things worth knowing about your energy:

**You have peak hours.** Most people have 2–4 hours a day where their brain works at full speed. For some teens it's late morning; for others, evening; for some, late at night. These are non-negotiable for hard work — papers, complex problem sets, anything that demands focus.

**You have low hours.** The hours where your brain is foggy, distractible, irritable. Trying to write a paper during your low hours is a tax on you for no return. Use these hours for chores, easy review, decompression, sleep.

**Energy is finite per day.** Willpower, focus, and decision-making all draw from the same well. By 7pm of a hard school day, you have less willpower than you did at 7am. This is not a moral failing; it's measurable.

**Energy can be rebuilt.** Sleep is the biggest input. Real food (not just sugar). Movement. Time outside. Time off screens. None of these are luxuries; they're how the well refills.

What this means in practice:

- **Defend your peak hours.** Don't waste them on email/chats/scroll. Hard work first when the brain works best.
- **Don't try to grind through your low hours.** Switch tasks. Take an actual break (not a scroll break — a walk, lying down, real rest).
- **Plan a hard day with an easy night.** If you have to focus hard for 4 hours after school, plan something low-effort for after. Trying to do hard work back-to-back-to-back wears you flat.
- **Track when you focus best.** For two weeks, write down when you actually got good work done. The patterns will surprise you. Build the rest of your schedule around those windows.

The energy thieves:

These quietly drain energy you'd otherwise have for what matters:
- **Bad sleep.** Singular biggest one. Most teens are running on 6 hours when they need 9.
- **Scrolling.** Feels passive; isn't. Pulls 30–90 minutes of energy without giving any back.
- **Group chats that get cruel.** Even reading them costs.
- **Caffeine after 2pm.** Wrecks sleep, which wrecks tomorrow.
- **Eating breakfast/lunch that crashes you 2 hours later.** Pure sugar + simple carbs hit and crash.
- **Doing easy stuff first.** "I'll just check email." Now your peak hour's gone.

Energy isn't a finite character trait. It's a resource you can shape, mostly by paying attention to what gives and takes. Teens who learn this in high school have a real advantage going forward.`,
    takeaways: [
      "Energy is the bottleneck more than time. Defend your peak hours.",
      "Willpower and focus are finite per day. Plan accordingly.",
      "Sleep, food, movement, time off screens = how the well refills.",
      "Track when you actually get good work done. Build your schedule around those windows."
    ]
  },
  {
    id: "consistency-over-intensity",
    category: "consistency",
    title: "Consistency beats intensity, almost always",
    summary: "30 minutes a day for 30 days beats a 15-hour cram. Almost every important skill is built this way.",
    readMinutes: 3,
    body: `Most of what teens are taught about achievement emphasizes intensity — big effort, big sacrifice, big breakthrough. The reality of how people actually get good at things is much quieter: small daily reps over a long time.

A few things research consistently shows:

**Spaced practice beats massed practice.** Studying for 4 sessions of 30 minutes over a week produces better retention than one 2-hour session. The brain consolidates between sessions; spacing it out is the consolidation.

**Daily reps build skill faster than occasional intense bursts.** Practicing piano 20 minutes a day beats 3 hours on Saturday. Same total time per week, much better progress.

**Skills compound.** 1% better every day = 37x better in a year. The math sounds suspicious but actually holds for skills with reps you can count. You don't see the compounding for the first months, which is why most people quit before it shows.

**Burnout follows intensity, not consistency.** Crunching a project at the cost of sleep, food, friendships works once. The body adapts and the next crunch costs more. Consistent moderate effort doesn't trigger the same wear.

What this looks like in practice:

- **For studying:** 25-minute sessions, every day or most days, beats 4-hour weekend sessions. The brain remembers what it sees regularly; the brain dumps what it sees once.
- **For a skill (instrument, sport, art):** Daily practice, even 15–20 minutes, beats weekend intensity. The skill rewards the rep count, not the hour count.
- **For a habit (exercise, journaling, reading):** Daily small beats weekly big. Make the daily version small enough that you can do it on bad days too. The streak builds the identity. "I work out 3x a week, hard" is fragile. "I do something physical every day, sometimes small" is sturdy.
- **For long-term projects:** A page a day = a 300-page book in a year. Hard to imagine; easy to do. The trick is the cadence, not the genius.

The shape of the cadence:

- **Show up, even small, even bad.** A 5-minute lazy practice still beats zero. The streak matters more than the quality on any given day.
- **Reduce friction.** Equipment ready. Time blocked. No deciding-each-day. Decisions kill streaks.
- **Forgive breaks.** Missing one day isn't the end of the streak; doubling down to "make up" for it is what breaks streaks.
- **Track loosely.** A simple list of days-done helps motivation. Don't make tracking another perfection task.

Why this is hard:

The system around you (school, social media, the culture) rewards intensity. Big tests, big games, big launches. You'll get less external praise for consistency. The praise comes from the work, not from people watching. That's why consistency is rare — it has no audience.

If you can build the consistency muscle as a teenager, you'll outrun most adults on this for the rest of your life. Most never learn it.`,
    takeaways: [
      "Daily small reps beat occasional intense bursts, almost always.",
      "Spaced practice beats massed practice. The brain consolidates between sessions.",
      "Consistency has no audience. The reward is in the work, not the praise.",
      "Miss a day, don't double down. Doubling-down to 'make up' is what breaks streaks."
    ]
  },
  {
    id: "when-stuck-completely",
    category: "when_stuck",
    title: "When you're completely stuck (and what's next)",
    summary: "Some weeks the system breaks down. That's information, not failure. Here's the move.",
    readMinutes: 3,
    body: `Sometimes everything in this primer fails. You know the techniques and you can't use them. You're behind on multiple things and the pile feels impossible. You feel slow, heavy, foggy, ashamed, and the gap between where you are and where you should be feels too big to close.

This happens to almost everyone at some point in adolescence. It's information, not a verdict.

A practical move sequence:

**1. Subtract before you add.**
The pile is too big. Don't try to solve the pile; reduce the pile. Drop something. Postpone something. Communicate to a teacher / parent / coach that you need a different timeline on one thing. People are often more willing than you expect, especially if you ask before the deadline rather than after.

**2. Take care of the base layer.**
Before any productive move, fix the base for 48 hours: 8+ hours of sleep, real food, water, time outside, less scroll. You can't problem-solve from depletion. The base layer is not optional.

**3. Pick one task. Not the most important — the most doable.**
The brain rebuilds momentum from completed tasks. The most important task is usually the heaviest, which is why you can't start it. Pick the easiest concrete one. Do it. Now you have a completed thing. The next task is now easier.

**4. Get someone in the loop.**
Tell one person what's happening — a parent, a teacher, a friend, a counselor. Not for advice. For company. Shame in isolation gets heavier; shame named gets lighter. You don't have to perform the version of yourself who has it all together.

**5. Examine the bigger pattern, gently.**
If you're stuck this week, that's one week. If you've been stuck most weeks for months, that's a pattern, and a pattern deserves real attention — a counselor, possibly a psychiatrist, possibly a learning evaluation. Chronic stuckness is one of the most common entry points to discovering an undiagnosed attention regulation issue, anxiety pattern, or depression. None of these are character flaws. They're identifiable and treatable.

When to escalate harder:

- If you've stopped going to school and don't know why → trusted adult, now.
- If you've been deeply unmotivated and joyless for more than two weeks → counselor.
- If the stuckness is paired with thoughts of not being here → that's a stop-everything-and-talk-to-an-adult moment. Crisis page link is at the bottom of every screen.

A reframe:

Stuckness is not a verdict on who you are. It's a state. States change. The work right now isn't to push through; it's to get the conditions right so you can move again. That includes asking for help. People who become good at this skill as teenagers do better as adults than people who white-knuckle alone.`,
    takeaways: [
      "When stuck: subtract before adding. Drop something. Ask for a different timeline before the deadline.",
      "Fix the base layer (sleep, food, water, time outside) for 48 hours before any productive move.",
      "Pick the easiest task, not the most important. Momentum rebuilds from completions.",
      "Months-long stuckness, or stuckness + dark thoughts → counselor. There are treatable patterns underneath."
    ]
  }
];

export const MOTIVATION_CATEGORY_LABEL: Record<MotivationCategory, string> = {
  starting: "Starting",
  drive: "What drives you",
  freeze: "Freeze + perfectionism",
  energy: "Energy",
  consistency: "Consistency",
  when_stuck: "When stuck"
};
