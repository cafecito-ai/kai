/**
 * Focus + study primer. Cognitive-science-grounded study practices, the cost
 * of multitasking, time-blocking, environment design, retrieval practice +
 * spaced repetition.
 *
 * Voice rules (strict):
 *   - No hustle-culture or "grindset" language.
 *   - No diagnostic claims (ADHD / executive dysfunction / processing disorder).
 *     Chronic study problems → trusted adult + learning evaluation as a real
 *     option, not as a verdict on the teen.
 *   - The phone-as-context-switcher problem is named honestly, not moralized.
 *   - Time-blocking and pomodoro are presented as adaptable tools, not
 *     mandates. Different brains work different ways.
 *   - Retrieval practice / spaced repetition are well-evidenced and should be
 *     named with their actual research findings.
 *   - No advice that requires resources the teen may not have (private tutor,
 *     specific app subscriptions, separate study room).
 */

export type FocusCategory =
  | "myth_of_multitasking"
  | "time_blocks"
  | "environment"
  | "retrieval_practice"
  | "spaced_repetition"
  | "when_stuck";

export type FocusArticle = {
  id: string;
  category: FocusCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const FOCUS_ARTICLES: ReadonlyArray<FocusArticle> = [
  {
    id: "multitasking-myth",
    category: "myth_of_multitasking",
    title: "You can't actually multitask (no one can)",
    summary: "What feels like multitasking is rapid task-switching. The cost is real and measurable. Phones make it worse.",
    readMinutes: 3,
    body: `One of the most consistent findings in cognitive science: humans don't multitask. What looks like multitasking is the brain rapidly switching between tasks — and each switch has a cost.

The actual mechanics:

**Task-switching takes time.** Every time your attention moves from a paragraph to a text and back, the brain has to reload the previous context. Reload time ranges from a few seconds (small switches) to several minutes (deep work to social media and back).

**Quality drops, not just speed.** Switching doesn't just make you slower; it makes the work worse. Studies on students working with social media notifications running show 20-40% lower comprehension on what they were studying, even when they perceived their focus as fine.

**You're worse at multitasking than you think you are.** People who self-identify as good multitaskers actually perform WORSE on attention tasks than people who don't. The confidence is uncorrelated with the skill (and slightly anti-correlated).

**Phones make this dramatically worse.** Just having a phone face-down on the desk degrades focus, even if you never look at it — the brain spends background cycles wondering about it. Research is consistent here.

What this means in practice:

- **Single-tasking is the actual skill.** One thing, one window, one tab, one focus, for a chunk of time. Boring; effective.
- **The phone goes to another room.** Not just face-down, not just on silent — physically separate from where you're working. This is the single highest-leverage focus change most teens can make.
- **Notifications off, not just muted.** Every push notification, even seen and dismissed, triggers a task-switch.
- **Browser tabs are notifications too.** Open tabs the brain treats as ambient interruption potential.
- **Background music with vocals is task-switching too**, for many people. Instrumental, ambient, or nothing tends to work better for actual focus work. (Some brains do better with vocals; experiment.)

A note on what people mean when they say "I work better with music":

Some of this is true. Background sound can mask distractions and provide a consistent ambient state that helps you settle in. The problem isn't sound — it's content. Lyrics, video, podcasts, lecture-style audio all engage language processing, which competes with reading/writing for the same brain real estate. Instrumental tracks, white/brown/pink noise, and "lofi study mix" type content largely work because they have no lexical content.

Honest summary: if you've been doing homework with TikTok in the background and feeling smart about your multitasking, you've been doing the same homework 20-40% worse than you could have. The fix is dull but reliable: one thing at a time, phone out of the room, vocals off, tabs closed.`,
    takeaways: [
      "Humans don't multitask — they task-switch, with measurable costs (20-40% lower comprehension under notifications).",
      "Confidence in multitasking is anti-correlated with skill. People who feel good at it are worse at it.",
      "Phone in another room is the single highest-leverage focus change. Face-down on the desk isn't enough.",
      "Vocals compete with reading/writing. Instrumental / ambient / nothing works better for most brains."
    ]
  },
  {
    id: "time-blocks",
    category: "time_blocks",
    title: "Time blocks: pomodoro and the variants",
    summary: "Working in defined chunks beats trying to power through. The classic 25/5 isn't the only pattern — find what fits.",
    readMinutes: 3,
    body: `Working in defined chunks with clear breaks beats trying to focus for hours. The brain isn't built for sustained attention without recovery — even highly trained focusers (researchers, writers, athletes) work in cycles.

The classic pattern is the pomodoro: 25 minutes of focused work, 5-minute break, 25/5, 25/5, then a longer 15-30 minute break after 3-4 cycles. It's a starting point, not a mandate. Different brains and different work suit different patterns.

Why time blocks work:

**They make focus finite.** "Work until done" has no edge; the brain dreads it. "Work for 25 minutes" has a clear endpoint, which makes starting easier.
**They build in recovery.** Attention is a finite per-session resource. The break is when consolidation happens.
**They make tracking effort more honest.** "I studied for 2 hours" is fuzzy. "I did four 25-minute blocks" is real.
**They reduce the pull of phones during the work block.** You know there's a break in 25 minutes. You can wait.

Variants that work for different people:

- **25/5 (classic pomodoro):** good default. Works for most academic work.
- **50/10:** longer block, longer break. Better for deep work like writing essays, projects that need long-context loading.
- **15/3:** very short. Good for tasks you hate or for getting started when motivation is low.
- **90-minute ultradian:** based on the body's natural 90-minute attention cycle. Work hard for 90 minutes, then take a 20-minute real break (walk, food, lying down). Strong pattern for sustained study days.

The break is the key part:

A 5-minute break that's spent on TikTok is not a break — it's a different task. The break should genuinely rest the attention system:

- Stand up, walk around.
- Look out the window for 30 seconds.
- Get water.
- Do nothing.

What it should NOT be:
- Phone, social media, group chats.
- A different cognitive task (don't switch from math to reading a hard book).
- "Just one quick text" that becomes 20 minutes.

A specific note on "I just push through and study for 3 hours straight":

Sometimes this is real deep work and your patterns differ from average. More often, what's happening is dissociated attention — your brain is partially there, partially zoned out, and you don't notice the dilution. People who time-block and people who power-through usually do roughly the same total focus time per hour; the time-blockers feel less destroyed at the end.

When time blocks don't work:

Some neurodivergent brains find clock-based structure makes things harder, not easier. Hyperfocus periods don't want to be interrupted. If pomodoro feels like it's making things worse, try: "I work until natural attention dip, then take a real break, then go again." Listen to your own rhythms.`,
    takeaways: [
      "Time blocks beat power-through. Brain isn't built for sustained attention without recovery.",
      "Classic 25/5 is a starting point. 50/10 for deep work, 90-min ultradian for sustained days, 15/3 for hated tasks.",
      "The break has to be a real break — walking, water, looking out a window. Phone-time isn't a break.",
      "If clock-based structure makes things harder, listen to your own attention rhythms instead."
    ]
  },
  {
    id: "study-environment",
    category: "environment",
    title: "Designing the environment so willpower doesn't have to fight",
    summary: "What's in your study space determines how hard you have to fight to focus. Most teens fight a losing battle against their setup.",
    readMinutes: 3,
    body: `Willpower is a finite resource. The more you have to use it to fight distractions, the less you have for the actual work. Smart environment design means you don't have to fight in the first place.

A few principles:

**Friction matters.** Make the right thing easy, the wrong thing hard. Phone in another room = wrong thing has friction. Notebook and pencil on the desk = right thing is easy. Tiny differences compound over a study session.

**Visual field is attention's input.** What's in your sight line drives where your attention goes. A messy desk piled with other obligations distracts you. A surface with only the thing you're working on focuses you.

**Sound shapes focus.** Vocals compete with reading/writing. Constant noise from family/roommates is its own drain. Find the quietest reasonable spot you have access to, or use headphones with instrumental / ambient sound to mask interruptions.

**Light matters.** Natural light if possible. Otherwise consistent, bright-enough indoor light. Working in a dim room makes the brain sleepy, which makes focus harder. Working under flickering or weird-temperature light can be subtly fatiguing.

**Body posture matters.** Studying flat on a bed is the worst common position — the body thinks it's bedtime. A chair, a flat surface for the work, feet on the floor or stable — better signal that you're working.

A practical setup for most teens:

- A specific spot that's "study spot." Same place each time helps the brain settle faster.
- Phone in another room or in a drawer.
- Notifications off everywhere except things you genuinely cannot miss.
- Notebook and pen on the desk (writing things by hand boosts retention; see retrieval practice).
- Water, real food if needed. Not sugar — sugar crashes you mid-session.
- One tab, one window, one task. Close everything else.
- A clock or timer visible (helps with time-blocking).
- Headphones if there's household noise or if instrumental music helps you settle.

Things to remove from the visual field:

- Other assignments not currently being worked on (they create anxiety).
- Mess that isn't directly part of work.
- Anything that triggers a different identity than "studying" (game console, art supplies, etc.).

The honest part:

Some teens don't have ideal study conditions — small apartments, loud families, no desk, shared room. This is real. The principles still apply, just adapted. Library, school library, coffee shop, friend's house, common spaces at off-hours — any of these can serve. Sometimes the best environment is literally not your own room.

If your environment is making consistent focus genuinely impossible, that's a real conversation to have with a parent, counselor, or trusted adult. Sometimes the answer is access to the school library after hours, or a shared accommodation that's quieter. Worth asking for.`,
    takeaways: [
      "Willpower is finite. Make the right thing easy, the wrong thing hard — don't rely on fighting.",
      "Visual field, sound, light, posture — all shape attention. The setup matters before any technique.",
      "One spot, same place each time, phone in another room, one tab, one task, written tools out.",
      "Bad home conditions for studying are real. Libraries, school libraries, common spaces can be the answer."
    ]
  },
  {
    id: "retrieval-practice",
    category: "retrieval_practice",
    title: "Re-reading is the trap. Retrieval is the move.",
    summary: "Highlighting and re-reading feel productive and don't work. Pulling information OUT of your brain is what builds it.",
    readMinutes: 4,
    body: `One of the most consistent findings in cognitive science: the most common ways students study are also among the least effective. Re-reading textbooks, highlighting, watching review videos passively — these feel productive but produce surprisingly little durable learning.

What works better, by a large margin: *retrieval practice*. Putting the book down and trying to recall the material from memory. Closing the notes and writing what you remember. Doing practice problems before you've fully studied. Quizzing yourself.

The mechanics:

**Pulling information out is different from putting it in.** Reading is input. Retrieval is output. The brain encodes information differently the second time it has to fish it out of memory — and that encoding is what makes it stick.

**Re-reading creates familiarity, not knowledge.** When you see the material a second time, it feels familiar. The brain interprets familiarity as "I know this." But familiarity and recall are different things. You can feel like you know it and still not be able to use it on a test.

**Practice tests are study sessions, not just assessments.** Doing a practice test before you've "finished studying" produces better outcomes than studying first and testing later. The act of trying to retrieve — even when you fail — strengthens the memory.

What this looks like in practice:

- **Read a section. Close the book. Write down everything you remember.** Then re-open and see what you missed. That gap is the most valuable information you can have — those are the things to focus on next.
- **Practice problems before the chapter feels "done."** If the problems are hard, that means you found the gaps. Hard ≠ bad. Hard = useful.
- **Flashcards with the answer obscured.** Anki and similar apps automate this. Even paper flashcards work.
- **Teach it to someone else (or pretend to).** Explaining the concept out loud, in your own words, is a form of retrieval. The Feynman technique formalizes this.
- **Quiz yourself in dead time.** Walking between classes, in the shower, on the bus. Recall a concept from earlier this week. Even 60 seconds counts.

What to do less of:

- **Re-reading the chapter.** Almost zero return after the first read.
- **Highlighting.** Feels active; isn't. Highlighting just marks the page; doesn't build the memory.
- **Watching review videos passively.** Same trap as re-reading.
- **Copying notes from one notebook to a neater one.** This is busy work, not learning.

A specific note on note-taking:

Notes are useful — but how they're useful matters. Writing notes by hand (versus typing) consistently shows better retention in studies, probably because handwriting is slower, which forces summarization and processing. The Cornell method, mind maps, or other active formats beat plain transcription. The best notes are condensed and have you working with the material, not copying it verbatim.

If you've been studying mostly through re-reading and highlighting and feel like your study time produces small returns — this is probably why. Switching to retrieval-based study can double or triple the efficiency of the same study hours.`,
    takeaways: [
      "Retrieval (recall) builds learning. Re-reading and highlighting build familiarity, not knowledge.",
      "Close the book and write what you remember. The gaps you find are the most valuable signal.",
      "Practice problems before the material feels 'done' — hard problems show you what to focus on.",
      "Notes by hand, in active formats, beat verbatim typed transcription."
    ]
  },
  {
    id: "spaced-repetition",
    category: "spaced_repetition",
    title: "Why studying 5 nights for 30 minutes beats studying 1 night for 3 hours",
    summary: "Same total time. Vastly different outcomes. Spacing is one of the most reliable findings in learning science.",
    readMinutes: 3,
    body: `If you study 3 hours the night before a test, you may pass it. If you study 30 minutes a night for the 6 nights before, you'll do measurably better — same total time, better outcomes. This is the *spacing effect*, one of the most reliable findings in the science of learning.

The mechanism:

**Memory consolidates during gaps.** Between study sessions, the brain quietly works on what you've seen — strengthening some connections, pruning others. Cramming doesn't give the brain time for any of this.

**Repeated retrieval over time is what makes memory durable.** Each time you remember something after a gap, the memory becomes harder to forget. The forgetting curve flattens.

**Cramming produces familiarity that fades.** What you "knew" the night before the test can be gone two weeks later. Spaced studying produces knowledge that lasts months.

**Spacing has a multiplier effect.** 5x30 minutes spaced over a week is roughly 2x as effective for long-term retention as 1x150 minutes in a single session.

In practice:

- **Review tonight, again tomorrow, again in 3 days, again in a week.** Diminishing intervals — the longer between reviews, the better, until you hit the edge of forgetting.
- **Anki and similar spaced-repetition apps do this math for you.** They show you cards just before you'd forget them. Especially powerful for vocabulary, formulas, dates, anything memorize-heavy.
- **Daily 10-minute review of yesterday's class** beats hour-long weekend study sessions. Compounds beautifully.
- **Distribute test prep.** If a test is in 10 days, doing some today, some midweek, some the day before is far more effective than the night-before cram.

What this means for the planner side of your brain:

Most teens are taught to plan studying around when they have time — "I'll do the math problems Tuesday night." A better question is: when will I review what I learned today? Even a 10-minute revisit before bed of the day's material has outsized effects on what sticks.

The combination is unusually effective:

Retrieval practice (recall, not re-read) + spaced repetition (spread over time, not crammed) is the closest thing learning science has to a magic combo. Both findings have stood up across decades of replication. Most teens learn neither.

Caveats:

- **Spacing works less well for understanding-heavy material** (like a complex proof, a hard concept) where you actually need a long uninterrupted session to load context. Spaced study after that initial session is still helpful, but you need the deep first session.
- **Spacing requires planning.** Cramming is what happens when you don't plan. The fix is calendar discipline more than knowing about spacing.
- **It feels worse than cramming, sometimes.** Spaced sessions don't produce the urgent "I'm getting it!" feeling of a cram. Knowledge is sticking; you just don't feel it as obviously.

If you can get one study habit right in your teens, this is one of the highest-impact ones. The compound effect over a high school career is enormous.`,
    takeaways: [
      "Spacing > cramming, even for the same total time. Memory consolidates during gaps.",
      "Daily 10-minute review of today's material beats hour-long weekend sessions.",
      "Retrieval practice + spaced repetition is the closest thing to a learning-science magic combo.",
      "Spacing requires planning. Calendar discipline matters more than knowing about it."
    ]
  },
  {
    id: "when-focus-is-broken",
    category: "when_stuck",
    title: "When focus genuinely won't come (and what that might mean)",
    summary: "Some weeks the techniques fail. That's information. Here's how to read it and what to consider.",
    readMinutes: 3,
    body: `Some days, all the right techniques don't work. You sit down, phone in another room, time block set, retrieval practice planned — and the brain just won't engage. Read three sentences, drift. Try to recall, blank. Twenty minutes of attempting; nothing.

This is normal occasionally. It's information when it's chronic.

Common causes of broken focus that aren't about studying technique:

**Sleep debt.** The brain runs on sleep. Under 7 hours for several nights = focus collapse. This is by far the most common cause. Most teens are chronically underslept; many don't connect it to study issues.

**Hunger / under-fueling.** Skipped breakfast, light lunch, blood sugar dropping at 3pm = focus impossible at 4pm. Body needs fuel before brain can work.

**Hydration.** Yes, really. Mild dehydration measurably impairs concentration. Drink water.

**Bad weeks.** Friend drama, family stress, breakup, big game tomorrow — the mind has open tabs even when the screen says "study." Focus is hard when emotional bandwidth is taken.

**Sustained high stress / anxiety.** Cortisol levels affect the hippocampus (memory) and prefrontal cortex (focus) directly. A genuinely high-stress week makes focus mechanically harder.

**Hormonal cycles.** For teens with menstrual cycles, focus and energy vary across the month. Knowing your pattern helps plan.

**Time of day.** Some brains focus best in morning, some at night. Working against your own peak hours is fighting yourself.

**The wrong task.** Sometimes "I can't focus" actually means "I don't know what to do next" or "this task is poorly defined and I'm stalling." Re-defining the task can unstick things faster than more focus.

When to take it seriously:

If focus problems are chronic — months of trouble starting and finishing assignments, falling behind in multiple classes, despite trying the techniques in this primer, despite sleeping and eating reasonably — that's worth bringing to a trusted adult and potentially a counselor.

Several things can underlie persistent focus issues:
- Sleep that looks adequate but actually isn't (sleep disorders are surprisingly common in teens).
- Anxiety or depression — both can present primarily as "I can't focus" before other symptoms.
- Attention regulation issues (what's often called ADHD) — these are real, identifiable, and treatable. A learning evaluation can sort out what's happening.
- Vision issues, hearing issues, processing differences — sometimes the problem is mechanical, not motivational.
- Real exhaustion from over-scheduling.

None of these are character flaws. All of them have specific paths forward once identified. A counselor or pediatrician can be the entry point.

What's not the right move:
- Caffeinating harder. Short-term boost, longer-term wreckage of sleep, which makes focus worse.
- Self-medicating with stimulants (other people's prescriptions, "study drugs"). Real risks; not actually a substitute for diagnosis and proper treatment when needed.
- Shame spiraling. "Why can't I just do this" is the least useful thought; usually keeps you stuck longer.

The honest read: if you've genuinely tried the techniques, slept and eaten reasonably, and focus is still impossible week after week, that's a signal — not a verdict — to look for what's underneath. Help exists and works.`,
    takeaways: [
      "Some days the techniques fail and that's normal. Check sleep, food, water, hydration, emotional bandwidth first.",
      "Chronic focus issues despite trying — worth a counselor / learning evaluation. Real treatable patterns may underlie it.",
      "Self-medicating with caffeine or other people's stimulants is the wrong direction.",
      "Persistent 'I can't focus' before other symptoms can be anxiety or depression in disguise."
    ]
  },
  {
    id: "deep-vs-shallow-work",
    category: "time_blocks",
    title: "Deep work vs shallow work — knowing the difference",
    summary: "Not every task needs deep focus. Knowing which kind of work you're doing matters for how you plan your day.",
    readMinutes: 3,
    body: `Cal Newport's distinction is useful for teens: *deep work* is cognitively demanding work that benefits from sustained, undistracted attention (writing an essay, solving hard problems, understanding a difficult concept, learning a complex skill). *Shallow work* is logistically necessary but doesn't require sustained focus (emails, admin, easy review, organizing notes, simple repeated tasks).

Most students confuse the two and get this wrong:

- They try to do deep work in the cracks of their day (between classes, during a free period with people around).
- They use their peak energy hours on shallow work that doesn't need it.
- They feel busy but don't get the deep work that actually matters done.

The fix:

**Identify your deep-work hours.** Most people have 2-4 hours per day when their brain is sharpest. For some it's first thing in the morning, for others late evening. Defend these for deep work. Don't spend them on shallow stuff.

**Identify your shallow-work hours.** The hours when you're foggy, tired, between things. Use these for admin: emails, organizing, simple tasks, cleaning up notes, planning. These are also fine for the easier kinds of homework.

**Match the task to the hour.** Hard problem set in deep-work hours. Vocabulary review in shallow-work hours. Reverse this and you'll be miserable and behind.

**Protect deep-work hours from shallow interruptions.** A 25-minute "let me just check email" during your deep-work hour breaks the most valuable focus you have. Save shallow tasks for the shallow hours.

Specific examples for teens:

**Deep work:**
- Writing essays (especially the first hard draft)
- Hard math / physics problems
- Reading dense material (textbooks, complex articles)
- Learning a new concept
- Practicing a skill (instrument, sport drills, art)
- Studying for a hard test using retrieval practice

**Shallow work:**
- Reading easy material
- Reviewing already-learned material
- Organizing folders/notes
- Replying to messages
- Filling out forms
- Watching a review video
- Easy homework / repetition-style problems

The honest distinction:

Some tasks are genuinely deep-work tasks and most teens treat them as shallow. Essays especially — most students write them while distracted, then wonder why the result is mediocre. An essay written in one focused 90-minute session is almost always better than one written in five distracted 20-minute sessions.

Some tasks are genuinely shallow and don't deserve deep-work time. Spending your peak morning hour organizing notes is a waste of the morning.

The skill is sorting your daily list into deep and shallow, and matching each to the right hour. This is one of the highest-impact things you can learn at any age, and most adults never do.`,
    takeaways: [
      "Deep work needs sustained focus. Shallow work doesn't. Don't mix them.",
      "Defend your peak 2-4 hours for deep work. Don't burn them on email or admin.",
      "Essays, hard problems, dense reading = deep. Organizing, easy review, messages = shallow.",
      "Match the task to the hour. The skill is sorting, not just doing."
    ]
  }
];

export const FOCUS_CATEGORY_LABEL: Record<FocusCategory, string> = {
  myth_of_multitasking: "The multitasking myth",
  time_blocks: "Time blocks",
  environment: "Environment",
  retrieval_practice: "Retrieval practice",
  spaced_repetition: "Spaced repetition",
  when_stuck: "When focus breaks"
};
