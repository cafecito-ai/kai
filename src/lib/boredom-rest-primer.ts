/**
 * Boredom + downtime + rest primer. What boredom actually is, why teens
 * have less of it than any previous generation, the cognitive value of
 * unstructured time, the difference between rest and recovery, why
 * scroll-fillers aren't rest.
 *
 * Voice rules (strict):
 *   - No "the grind never sleeps" / hustle-culture framing.
 *   - No "if you're bored, you're boring" framing.
 *   - Boredom framed as a useful state, not a problem to be solved with
 *     stimulation.
 *   - Scrolling is named specifically as a poor substitute for rest.
 *   - Multiple kinds of rest distinguished (physical, mental, emotional,
 *     sensory, creative, social, spiritual — Saundra Dalton-Smith's framework).
 *   - Chronic exhaustion that doesn't recover with rest → counselor (could
 *     be depression, undertreated condition).
 *   - Not preachy about screen time specifically; the data is what it is.
 */

export type BoredomRestCategory =
  | "what_boredom_is"
  | "kinds_of_rest"
  | "scroll_vs_rest"
  | "unstructured_time"
  | "sleep_specifically"
  | "when_rest_doesnt_work";

export type BoredomRestArticle = {
  id: string;
  category: BoredomRestCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const BOREDOM_REST_ARTICLES: ReadonlyArray<BoredomRestArticle> = [
  {
    id: "boredom-is-useful",
    category: "what_boredom_is",
    title: "Boredom is a useful state, not a problem",
    summary: "The boredom most teens experience is the brain about to do something interesting. We trained ourselves out of it. Reclaiming it has real value.",
    readMinutes: 4,
    body: `Boredom has gotten a bad reputation. Most people treat it as a problem to be eliminated — the moment of "nothing to do" gets immediately filled with phone, video, chat, anything. The research on what boredom actually does to and for the brain suggests we've been wrong about it.

**What boredom is, neurologically:**

Boredom is the state of mild understimulation. The brain isn't getting strong external input, so it shifts into what's called the *default mode network* — a different pattern of activity that's associated with:

- Mind-wandering
- Memory consolidation
- Future-thinking and planning
- Self-reflection
- Creative idea generation
- Connecting unrelated concepts
- Processing emotions

Almost every report of a creative breakthrough, problem-solving insight, or life-direction realization comes from people in some version of this state — not in front of a screen, not actively working, but mind drifting in the shower, on a walk, lying in bed, riding a bus.

The phrase "I had this idea while I was doing nothing" describes this state.

**What gets lost when we fill all boredom:**

Modern teens have less true boredom than any previous generation. Whenever there's a gap — waiting for a friend, in a line, on the bus, before sleep, in a boring class — phone fills it. The result isn't more stimulation that's good for you; it's a brain that's almost never in default mode.

The costs accumulate:
- Less spontaneous creativity (the ideas that come from nowhere come from somewhere — specifically, default mode time).
- Worse memory consolidation (the brain needs idle time to process what it's learned).
- Less self-knowledge (knowing what you actually think requires time to think).
- More anxiety (filling every gap doesn't reduce anxiety; sometimes it amplifies it).
- Reduced ability to tolerate any unstimulated moment (the muscle atrophies).

This isn't moral panic about phones. It's specific neuroscience about what brains need to function well.

**The teen-specific issue:**

Adolescent brains do significant restructuring. The default mode network develops substantially during teen years. Brains that almost never use it during this developmental window may end up with reduced default-mode capacity in adulthood.

Translation: the practice of tolerating boredom in your teens shapes the adult brain you'll have. Teens who do this build neural infrastructure for creative, reflective, self-aware adult lives. Teens who don't have to build it later, often with more difficulty.

**What "good" boredom looks like:**

- Walking somewhere with no headphones.
- Sitting on a bench / porch / curb.
- Waiting for a friend without checking your phone.
- Lying down without going to sleep, without listening to anything.
- Standing in a line and just being there.
- Showering with no music.
- The 10 minutes before sleep without scrolling.

These don't have to be long. Five minutes of true boredom can produce significant default-mode activity. Six 5-minute windows across a day add up.

**The discomfort:**

If you haven't been bored much recently, real boredom feels weirdly uncomfortable. Restless, antsy, "I should be doing something." This is the muscle being weak from disuse. It builds back with practice. Most people who reintroduce boredom into their lives report:

- Days 1-3: uncomfortable, almost anxious without stimulation.
- Days 4-14: easier, sometimes pleasant.
- After 2-4 weeks: the boredom-tolerance returns. Ideas come more often. Self-knowledge increases. The phone feels different.

**A specific experiment:**

For one week, replace one default-scroll moment per day with boredom:
- The walk to / from class without earbuds.
- The 5 minutes before sleep without checking anything.
- The line at the cafeteria without your phone out.

Notice what happens. Most teens are surprised by what shows up — memories, ideas, small connections, sometimes uncomfortable feelings that needed to surface.

**A note on what's not boredom:**

Boredom-as-symptom-of-depression is different. The "nothing matters, nothing is interesting, time stretches painfully" feeling is anhedonia, and it's a depressive symptom rather than productive boredom. If you can't be interested in anything for weeks despite trying — that's a counselor conversation, not a "tolerate the boredom" situation.

The productive boredom this article describes is the mild understimulation that opens into mind-wandering. Anhedonia is heavier, doesn't open into anything, and persists.

**The longer arc:**

Adults who do creative or reflective work consistently say the same thing: their best ideas don't come at their desks. They come during walks, showers, drives, gardening, doing dishes — boring tasks that let the brain drift. People who never let their brains drift miss this entire dimension of cognition.

You don't have to be unproductive to be bored. You're not wasting time. You're using a different kind of time. Some of the highest-value time you spend is the time the culture trains you to fill in.`,
    takeaways: [
      "Boredom = brain enters default mode network. Memory consolidation, creativity, self-reflection happen there.",
      "Modern teens have less true boredom than any previous generation. The cost is real, especially during brain development.",
      "Boredom tolerance builds back with practice — 2-4 weeks. Discomfort is the muscle being weak from disuse.",
      "Anhedonia (nothing feels interesting for weeks, can't be moved by anything) is different — that's a counselor conversation."
    ]
  },
  {
    id: "seven-kinds-of-rest",
    category: "kinds_of_rest",
    title: "Seven kinds of rest (sleep isn't the only one)",
    summary: "If you sleep 9 hours and still feel exhausted, you might be confusing one kind of rest for all of them. Saundra Dalton-Smith's framework names what's missing.",
    readMinutes: 4,
    body: `One of the more useful frameworks in modern rest research comes from physician Saundra Dalton-Smith, who identified seven distinct kinds of rest. Most people focus on one (sleep) and wonder why they're still depleted. The model is intuitive once named.

**1. Physical rest.**

Sleep, yes — but also passive physical rest (sitting still, lying down, soft slow movement) and active physical rest (gentle stretching, walking, massage).

When you need this:
- Body feels heavy and sluggish.
- Soreness, tension, stiffness.
- Going from screen to screen without moving.

How to get it:
- 8-10 hours of sleep (teens) consistently.
- Stretching, yoga, slow walks.
- Lying down without sleeping, no phone.
- Naps (20 min, not longer).

**2. Mental rest.**

The kind of rest the cognitive part of your brain needs. Distinct from sleep — you can sleep 9 hours and still be mentally exhausted.

When you need this:
- Hard to focus, even on easy things.
- Racing thoughts you can't quiet.
- Decision fatigue (every choice feels heavy).
- Constant low-grade buzz of thinking-about-things.

How to get it:
- Brain breaks during work. Real breaks, not scroll breaks.
- Writing things down to get them out of your head.
- Single-tasking instead of multitasking.
- Time in nature.
- Meditation, breath practice, simple repetitive activities.

**3. Sensory rest.**

The senses get tired from constant input. Screens, music, conversations, notifications, busy environments — all sensory load.

When you need this:
- You feel "overwhelmed" without anything specifically being wrong.
- Loud spaces feel intolerable.
- Bright lights / strong smells / lots of people drain you fast.
- You want to be alone in a quiet room.

How to get it:
- Time in low-stimulus environments (your room with lights dim, quiet).
- Closing your eyes for a few minutes.
- Limiting screens.
- Less music or no music for a while.
- Time alone.

**4. Emotional rest.**

Distinct from social rest. Emotional rest is what you need when you've been doing emotional work — handling others' feelings, performing okay-ness, suppressing your own emotions.

When you need this:
- You've been "the strong one" for too long.
- People-pleasing has worn you out.
- You're tired of pretending to be fine.
- You can't access your own feelings clearly.

How to get it:
- Time with someone who lets you be exactly how you actually feel.
- Crying when you need to.
- Saying out loud how you're actually doing.
- Stopping the performance for a while.
- Therapy (this is exactly what therapy is for).

**5. Social rest.**

The depletion that comes from too much time with people, especially people who take more than they give.

When you need this:
- You're drained after social events even when they're "fun."
- Group settings exhaust you.
- You feel like you can't be alone enough.
- Friend obligations feel heavy.

How to get it:
- Time alone.
- Time with the people who are easy to be with (not just anyone — specifically the low-cost-to-you people).
- Saying no to optional social.
- Reducing time with people who drain you.

**6. Creative rest.**

The depletion creators get when they've been producing too much without enough input. Also affects anyone who has to constantly come up with ideas (school, problem-solving, content creation).

When you need this:
- Ideas feel forced.
- Nothing's interesting.
- You're going through the motions creatively.
- The well feels empty.

How to get it:
- Consuming art, music, writing made by other people.
- Time in nature.
- Time in beautiful spaces.
- Travel (doesn't have to be far — new environment counts).
- Letting yourself NOT create for a while.

**7. Spiritual rest.**

Whatever you call it — connection to something larger, sense of meaning, peace beyond yourself. For some people this is religious; for others it's nature, community, philosophy, art, music.

When you need this:
- Life feels pointless or hollow.
- Going through the motions.
- Disconnection from purpose.
- Feeling separate from everything.

How to get it:
- Whatever practice connects you. Could be religious. Could be time in nature. Could be making something. Could be being part of a community.
- Service — see the contribution article in the purpose primer.

**Putting it together:**

Most people are depleted in 2-3 of these and trying to fix it with sleep. Sleeping more won't help if what you actually need is social rest, sensory rest, or emotional rest.

A useful weekly check-in: which of the seven do I need this week? The answer is usually different week to week.

**For teens specifically:**

Modern teen life often produces depletion in:
- **Sensory** (constant screens, music, notifications)
- **Mental** (school + activities + always-on cognition)
- **Social** (group chats + school + activities)
- **Creative** (school's structure suppresses unstructured making time)

And often UNDER-supplied with:
- **Physical rest** (chronic sleep deprivation is normal)
- **Spiritual rest** (less religious / community time on average)

The combination produces a specific exhaustion that "I should just sleep more" doesn't address. Identifying which kind of rest you actually need is the move.

**When rest doesn't work:**

If you sleep 9 hours, take a quiet day, and still feel destroyed — that's worth taking seriously. Chronic exhaustion that doesn't respond to genuine rest can indicate:

- Depression
- Anxiety
- Iron deficiency / other nutritional deficiencies
- Thyroid issues
- Sleep apnea (yes, even in teens)
- Long COVID
- Other medical conditions

The honest move: see a pediatrician. They can run basic blood work and screen for the common causes. Don't power through chronic exhaustion as a personal failing.`,
    takeaways: [
      "Seven kinds of rest: physical, mental, sensory, emotional, social, creative, spiritual. Sleep is just one.",
      "Most people are depleted in 2-3 and try to fix it with sleep alone. Identifying which kind you need is the move.",
      "Teens often need sensory + emotional + creative rest most (modern life depletes these specifically).",
      "Chronic exhaustion that doesn't respond to genuine rest → pediatrician. Real medical causes exist; not character."
    ]
  },
  {
    id: "scrolling-is-not-rest",
    category: "scroll_vs_rest",
    title: "Scrolling isn't rest (the brain doesn't think so either)",
    summary: "You feel like you're resting when you scroll. The brain measurements disagree. The cost is invisible until you notice the patterns.",
    readMinutes: 3,
    body: `Most teens default to scrolling when they're tired. The phone is there, the friction is low, it feels like rest. Brain measurements during scrolling tell a different story.

**What's actually happening when you scroll:**

- **Visual cortex working continuously** processing images that change every 1-3 seconds.
- **Reward circuits firing** unpredictably (the variable-reward schedule is what makes it addictive — see the digital wellbeing primer).
- **Attention switching** constantly. Task-switch cost compounds.
- **Social comparison circuits active.** Even without conscious awareness, the brain processes who's prettier, smarter, doing better.
- **Stress hormones (cortisol) often elevated** during specific kinds of content.
- **Mind-wandering / default mode suppressed.** The brain doesn't drift while it's consuming content.

This is not rest. This is engagement masquerading as rest because it feels less effortful than focused work.

**The post-scroll experience:**

Notice what you feel like after a 20-minute scroll session:
- Often: slightly worse than before.
- Sometimes: anxious, unsettled, behind.
- Sometimes: vaguely sad without specific cause.
- Rarely: rested, refreshed, restored.

This is the data your body is giving you. It's accurate.

**Why it feels like rest in the moment:**

Scrolling is low-effort compared to schoolwork or active engagement. The brain interprets "less effortful than work" as "rest." But less effortful ≠ restorative. They're different things.

A specific analogy: eating candy is less effortful than eating a real meal. That doesn't make candy nutrition. Scrolling is the cognitive equivalent of candy. Pleasant in the moment, hollow as a category of nutrition for the brain.

**The actual rest activities:**

The activities that produce the rest signals in the body are mostly the opposite of scrolling:

- **Lying down with your eyes closed** (genuinely doing nothing).
- **Walking outside without input** (no headphones).
- **Conversation with someone you don't have to perform for.**
- **Showering / bathing.**
- **Eating slowly, paying attention to the food.**
- **Doing something with your hands** (cooking, drawing, building).
- **Being in nature without phone.**
- **Sleep.**
- **Sex (when present and connected).**
- **Repetitive low-effort tasks** (folding laundry, washing dishes, walking the dog).

Notice: most of these are pre-smartphone defaults. They worked for thousands of years. They still work.

**The compromise version:**

You don't have to never scroll. You can scroll. The issue is treating it as your primary rest strategy.

A reasonable structure:
- **30-60 min of real rest per day** before any scroll-rest. Whichever activities above feel like rest to you.
- **Scroll as entertainment, not as rest.** Knowing the category matters.
- **Notice the post-state.** If you feel worse after, that's information.

**A specific experiment:**

For one week, replace one default-scroll moment per day with one of the real-rest activities:

- The 20 minutes after dinner that's usually scroll → walk outside.
- The hour before sleep that's usually scroll → reading, conversation, lying down.
- The 30 minutes after school that's usually scroll → snack + 10-minute lie-down.

Notice the difference at the end of the week. Most teens are surprised.

**Why this matters now:**

Adolescence is when sleep, cognition, and emotional regulation patterns get installed for adulthood. Teens who learn to rest properly in these years build infrastructure that pays for decades. Teens who substitute scrolling for rest train a brain that struggles with rest later.

This isn't moralism about phones. It's specific physiology about what brains need.

**A note on what scrolling IS good for:**

- Entertainment (acknowledging it as that).
- Brief breaks from intense work.
- Specific connection (texting one friend you care about, not scrolling).
- Specific information-seeking (researching a thing).
- Specific creative consumption (a thing you want to see, not feed-served content).

The issue isn't the phone itself; it's defaulting to it as your rest tool. The phone is many things. Rest is rarely one of them.`,
    takeaways: [
      "Scrolling activates visual cortex, reward circuits, comparison circuits, attention-switching. Not rest, just lower-effort.",
      "Notice the post-state: scrolling often produces slightly-worse feelings; real rest produces restoration.",
      "Real rest: lying down, walking without input, conversation, sleep, repetitive low-effort tasks, time in nature.",
      "You can scroll. Just don't treat it as your primary rest. The category error matters."
    ]
  },
  {
    id: "value-of-unstructured-time",
    category: "unstructured_time",
    title: "Unstructured time: why it matters and where it went",
    summary: "Modern teen life has eliminated almost all unstructured time. The cognitive cost is significant. Reclaiming it is worth the strangeness.",
    readMinutes: 4,
    body: `Most teen life is fully scheduled: school, homework, activities, sports, social, family time, sleep. Even the "free" parts are usually filled (phone, planned hangouts, scheduled fun). True unstructured time — hours where nothing is planned, nothing is happening, you have no role and no agenda — has nearly disappeared.

This isn't nostalgic complaint. The cognitive value of unstructured time has been measured.

**What unstructured time produces:**

- **Self-knowledge.** Knowing what you actually want requires time to think about it, which requires time when you're not doing anything else.
- **Creativity.** The brain connects unrelated ideas during idle time. This is where original thoughts come from.
- **Long-term planning.** Big-picture thinking doesn't happen at desks; it happens during walks, showers, daydreaming.
- **Emotional processing.** Feelings get sorted in idle time. Constantly busy = constantly accumulating unprocessed feelings.
- **Identity formation.** Adolescents need time to figure out who they are. This requires time when they're not performing for anyone, including themselves.

These aren't optional. They're developmental requirements that the modern teen schedule often doesn't make room for.

**Where it went:**

Several forces have compressed teen unstructured time:

- **Academic pressure** has increased — more APs, more homework, more activities for college applications.
- **Phones fill all gaps.** Even when the schedule allows free time, the phone fills it with structured engagement (other people's content, feeds, notifications).
- **Parental scheduling** in the 2010s-2020s has been higher than previous generations. Free play / unscheduled hours dropped significantly.
- **The 24/7 group chat.** Even without explicit social activity, social engagement is constant.
- **Cultural valuation of productivity.** "Doing nothing" has become harder to defend, especially in pressure-cooker environments.

The result: many teens go for weeks without an hour that's truly unstructured. Some never had it as a baseline.

**What "unstructured" actually means:**

- No specific plan.
- No screen content directing your attention.
- No social obligation.
- No productivity goal.
- Just time + space + you.

Most teens haven't had a couple hours like this in months. When they do, the early experience is uncomfortable. Then it gets useful.

**What to do during unstructured time:**

The point is that there isn't a "what to do." Some options that often emerge:

- Lying on the floor / bed thinking.
- Walking around your neighborhood with no destination.
- Drawing / doodling without a purpose.
- Daydreaming.
- Writing in a journal without prompts.
- Looking out a window.
- Sitting outside.
- Playing music alone.
- Building / making something just because.
- Reading something not for school.

The brain wants to do something during unstructured time. It just doesn't want to do a *planned* something. Let it pick.

**The discomfort:**

If you haven't had real unstructured time, the first few sessions are weird:
- Restless. You'll want to grab the phone.
- Slightly anxious. The "I should be doing something" voice.
- Bored. Lower than expected stimulation.

This passes. Usually after 15-30 minutes of sitting with it. After several sessions, the discomfort decreases substantially.

**A specific practice:**

One hour per week of true unstructured time. Phone in another room. No specific plan. Whatever happens, happens.

The first few weeks: this feels hard. Most teens fail at it the first time, grab the phone after 10 minutes, treat it as a failure. It's not a failure; it's data about how depleted the muscle is.

By week 4-6: the hour starts feeling restorative. Sometimes the most useful hour of the week.

By week 8+: most teens who keep this practice expand it. They notice they're thinking more clearly, sleeping better, more emotionally regulated, having more original ideas.

**The teen-specific argument:**

Some of the most consequential thinking of your life happens in adolescence. Who you are. What you care about. How you want to live. What you reject from your upbringing. What you embrace. These thoughts require time to actually think.

A teen who never has unstructured time is constructing their adult identity in the margins between scheduled activities. That's possible but produces a different result than having actual time for it.

You're allowed to do nothing. You're allowed to have whole afternoons that don't accomplish anything visible. You're allowed to have time you can't justify in productivity terms.

The pressure not to is real. It comes from school, family, the culture, the algorithm. Defending unstructured time means pushing back on most of these.

**For parents reading along:**

The single most useful thing a parent can do for an adolescent's mental health is often to require less of them. Less scheduled activities. Less homework supervision. Less pressure to fill every gap. The teen brain needs time to drift; the schedule has to allow it.

If your teen seems exhausted, anxious, or disconnected, the answer is sometimes "drop one activity." Not add a mindfulness practice. Drop something.`,
    takeaways: [
      "Unstructured time = self-knowledge + creativity + planning + emotional processing + identity formation. Not optional.",
      "Modern teen schedules + phone-filled gaps have eliminated most true unstructured time. The cost is measurable.",
      "Practice: 1 hour/week with phone in another room, no specific plan. Discomfort fades in weeks; benefits compound.",
      "If exhausted: dropping an activity often does more than adding a wellness practice."
    ]
  },
  {
    id: "sleep-is-load-bearing",
    category: "sleep_specifically",
    title: "Sleep, with the urgency it actually deserves",
    summary: "Teen sleep needs are 8-10 hours. Average is around 7. The gap drives more problems than most teens realize.",
    readMinutes: 4,
    body: `Sleep is the most underrated mental and physical health practice in modern teen life. The data is clearer than most teen health data, and it's mostly being ignored.

**The basic facts:**

- **Teens need 8-10 hours per night** (American Academy of Sleep Medicine). 9 is roughly the median requirement.
- **About 70% of US high schoolers get less than 8 hours on school nights.**
- **About 30%+ get less than 6.**
- **The gap is bigger than for any other age group.**

The reasons are partly biological (teen circadian rhythms shift later — natural bedtime moves to 11pm-1am), partly social (school start times, screens, homework load, social schedules), and partly cultural (the framing of "sleeping is for the weak").

**What chronic sleep debt does:**

The list is long and well-documented:

- **Mood:** ~3x increased risk of depression, ~5x increased risk of suicidal thoughts (per CDC data).
- **Anxiety:** measurable increases in baseline anxiety.
- **Academic:** worse memory consolidation, worse problem-solving, worse test performance.
- **Risk-taking:** the prefrontal cortex (impulse control) functions worse on insufficient sleep. Driving accidents, substance use, sexual risk-taking all go up.
- **Immune:** sleep-deprived people get sick more often.
- **Weight:** sleep affects hunger hormones. Chronically sleep-deprived people have appetite dysregulation.
- **Body:** growth, skin, muscle recovery all happen during sleep.
- **Acne:** mostly hormonal but worse with poor sleep.
- **Sports performance:** drops measurably with sleep debt.

This isn't a list of slight effects. These are substantial and well-replicated.

**The "I'll catch up on the weekend" myth:**

You can't fully catch up. Sleeping 12 hours on Saturday after 5-6 hours Mon-Fri doesn't restore everything. Some effects (especially mood and metabolic) require consistent sleep across days, not weekend recovery.

This doesn't mean weekends don't help. They help. They just don't fully fix it.

**The phone-and-bedroom problem:**

The single biggest fixable input to teen sleep is the phone. Specifically:

- Phone in the bedroom delays sleep onset (notification disturbance, "just check one more thing").
- Blue light from screens suppresses melatonin (the sleep hormone) — partially mitigated by night-mode but not eliminated.
- Anxious / activating content right before bed (group chats, social media, news) keeps the nervous system in alert mode.
- Phone as alarm clock means you check it the moment you wake up, starting the day from a reactive state.

Single highest-leverage change: **phone OUT of the bedroom**. Buy a $15 alarm clock. Charge the phone in another room.

This is unpopular advice and most teens hate hearing it. It also works. Teens who've done this report significant changes in mood, focus, and sleep quality within 1-2 weeks. The data on phone-out-of-bedroom interventions is consistent.

**Other sleep inputs (research-backed):**

- **Consistent bedtime + wake time, even on weekends.** The body locks in better with consistency.
- **Cool dark quiet room.** Body temperature drops to enter sleep; warm rooms delay it.
- **No caffeine after ~2pm.** (Half-life is 5+ hours; energy drinks affect sleep more than people realize.)
- **No big meal within 2 hours of sleep.** Digestion competes with sleep.
- **Exercise during the day** (not within 2-3 hours of bed). Daytime movement supports nighttime sleep.
- **Daylight in the morning.** Specifically morning daylight resets circadian rhythms. 10 minutes outside without sunglasses helps.
- **Calming wind-down routine.** The body needs 30-60 minutes to transition. Switching from screen to bed isn't enough time.

**What if you can't sleep?**

Acute insomnia (a few nights of trouble) is normal during stress. Chronic insomnia (weeks/months) is worth addressing:

- **Don't lie in bed worrying about not sleeping.** Get up. Do something low-stimulation in low light. Return when sleepy.
- **Reduce sleep-pressure killers.** Naps after 3pm reduce nighttime sleep. Caffeine. Phone in bed.
- **Cognitive Behavioral Therapy for Insomnia (CBT-I).** The most effective treatment for chronic insomnia, with stronger evidence than sleep medications. Counselor-delivered, also available through apps.
- **Medical workup if chronic.** Sleep apnea exists in teens, especially with certain body types. Other medical issues can cause insomnia. A pediatrician can screen.
- **Mental health screen.** Depression, anxiety, and trauma all disrupt sleep significantly. Treating the underlying often resolves the sleep issue.

**Substances and sleep:**

- **Alcohol** initially sedates but disrupts the second half of the night. Not actually a sleep aid.
- **Cannabis** can shorten time-to-sleep but disrupts REM. Long-term users often have rebound insomnia when stopping.
- **Sleep aids** (melatonin, OTC sleep meds) have mixed evidence and shouldn't be a routine solution. Melatonin in small doses (0.3-0.5mg, not the 10mg gummies) has some evidence; bigger doses and chronic use have less.
- **Stimulants** (ADHD meds, energy drinks, study drugs) disrupt sleep when taken late.

**For teens with very early school start times:**

Some school districts have moved high school start times later because of the data on adolescent sleep biology. If yours starts at 7am, you're fighting biology. The honest workaround: go to bed earlier than feels natural (boring but effective). Light therapy in the morning. Cut caffeine after lunch. Naps after school (20 min, not 2 hours).

**The bottom line:**

If you fix one thing about your health right now, fix sleep. The return on investment is unusually high. Most other wellness things — exercise, nutrition, mood, focus — improve when sleep is consistent.

The thing your school health teacher told you is actually right: sleep matters more than you think. The science is clearer than ever.`,
    takeaways: [
      "Teens need 8-10 hours. Most get under 8. The gap drives mood, anxiety, focus, risk-taking, immune, weight effects.",
      "Phone out of the bedroom is the single highest-leverage change. Buy a $15 alarm clock. Works within weeks.",
      "Consistent bedtime + cool dark room + no caffeine after 2pm + morning daylight = research-backed defaults.",
      "Chronic insomnia → CBT-I (more effective than sleep meds), and screen for sleep apnea / mental health causes."
    ]
  },
  {
    id: "when-rest-doesnt-work",
    category: "when_rest_doesnt_work",
    title: "When you rest and you're still exhausted",
    summary: "Sometimes sleep doesn't fix it. Knowing the patterns matters.",
    readMinutes: 3,
    body: `If you're sleeping 9 hours, eating real food, getting outside, taking quiet days, and you're still exhausted — that's a real signal, not a personal failing. There are specific patterns that produce rest-resistant exhaustion, and each has a different path forward.

**The patterns:**

**Depression.**
Fatigue is one of the most reliable physical symptoms of depression. Even with adequate sleep, depression produces baseline exhaustion. Other signs that often accompany: low interest in things, low motivation, persistent low mood, hopelessness, slow thinking, appetite changes.

If depression is part of what's happening: counselor is the move. Not "try harder to rest." Not "you should be grateful." Real treatment exists and works.

**Anxiety.**
Chronic high anxiety burns energy continuously. The body is in low-grade alert state much of the time, which is exhausting even when you're "resting." Sleep may be disrupted (trouble falling asleep, waking at 3am, restless sleep). Even good sleep doesn't fully restore because the anxiety doesn't turn off.

If anxiety: same move. Counselor. Often treatable with therapy (CBT, ACT), sometimes with medication. The exhaustion lifts as the anxiety reduces.

**Iron deficiency.**
Common in teens, especially those with menstrual cycles. Iron deficiency anemia produces persistent fatigue that doesn't improve with sleep. Other signs: pale skin, shortness of breath on stairs, dizziness, brittle nails, cravings for ice / starch.

Pediatrician can run a basic blood panel. Treatment is straightforward (iron supplementation, dietary changes).

**Thyroid issues.**
Less common but real. Hypothyroidism produces fatigue, weight changes, mood changes, slowed thinking, cold sensitivity. Easy to test for with a blood panel.

**Sleep apnea.**
Even in teens. Snoring, witnessed pauses in breathing, waking up unrested despite long sleep. More common with certain body types but happens to anyone. A pediatrician can refer for a sleep study.

**Long COVID / post-viral fatigue.**
For some teens, fatigue persists for months after even a mild COVID infection (or other viral illness). The pattern is "I was sick, I recovered, but I never got my energy back." Real, increasingly recognized, has specific treatment approaches.

**Nutritional deficiencies.**
Vitamin D (very common in winter), B12, magnesium can all produce fatigue. Inexpensive to test and treat. A pediatrician can run the panel.

**Mononucleosis ("mono").**
Causes profound fatigue that lasts weeks to months. Worth testing if exhaustion came on with sore throat / swollen lymph nodes / fever in recent months.

**Chronic over-scheduling.**
Sometimes the issue is genuinely too much. Even with 9 hours of sleep, if your daytime hours are packed to capacity with school + activities + sports + social + family, you may be operating at deficit. Sleep is recovery; if the daily load exceeds what sleep can replenish, you accumulate debt.

The honest fix is subtraction. Dropping an activity. Reducing the schedule. This is hard culturally but sometimes the actual answer.

**ADHD / executive function patterns.**
Some teens with undiagnosed ADHD report exhaustion not because their bodies are tired but because they're working hard to compensate for executive function differences. The constant self-management is exhausting. Diagnosis + appropriate support often dramatically reduces this kind of fatigue.

**Trauma / chronic stress.**
Bodies under chronic stress (active abuse, ongoing family conflict, persistent threats) burn energy on threat response. The exhaustion is real and doesn't lift with sleep — it lifts when the chronic stressor is addressed.

**Eating disorders.**
Restriction, purging, and binge cycles all produce profound fatigue. Sometimes the fatigue is what brings teens to attention. See the body image primer.

**The path forward:**

If you've been exhausted despite genuine rest for more than 3-4 weeks:

1. **Pediatrician visit.** Ask for a basic workup: CBC (checks for anemia), thyroid panel, vitamin D, B12, iron studies. This is routine and inexpensive. Most pediatricians will do it if asked.

2. **Honest sleep audit.** Are you actually sleeping 8-10 hours, consistently, with quality sleep? Phone out of room? Or are you "sleeping 8 hours" but spending part of that on phone, with disturbed sleep?

3. **Mental health screen.** Does your provider screen for depression and anxiety? If not, ask. They have brief validated tools (PHQ-9, GAD-7) that take 5 minutes.

4. **Subtract before adding.** If your schedule is heavy, what could come off it for a month while you investigate?

5. **Counselor or therapist** if mental health is part of the picture, which it often is.

**What's NOT the answer:**

- **Pushing through.** Chronic fatigue ignored gets worse, not better.
- **Caffeinating harder.** Masks the issue, disrupts sleep, escalates.
- **Self-medicating** with stimulants, energy drinks, others' prescriptions.
- **Adding more wellness practices.** More yoga / meditation / smoothies doesn't solve an underlying medical or psychological cause.
- **Blaming yourself.** Chronic exhaustion is information, not laziness.

**The honest version:**

Most teens who are persistently exhausted have a specific identifiable cause. Most causes are treatable. The fix is investigation, not effort.

Don't power through this. See someone. It's worth the visit.`,
    takeaways: [
      "Rest-resistant exhaustion has specific causes: depression, anxiety, iron deficiency, thyroid, sleep apnea, mono, long COVID, ADHD, trauma, over-scheduling.",
      "Most are identifiable through routine pediatrician workup (CBC, thyroid, vitamin D, B12, iron). Easy to test.",
      "Chronic exhaustion ignored gets worse, not better. Pushing through is not the answer.",
      "Mental health screen alongside physical workup. Both PHQ-9 and GAD-7 take 5 minutes and catch most depression/anxiety."
    ]
  },
  {
    id: "rest-as-a-skill",
    category: "kinds_of_rest",
    title: "Rest is a skill (and you can practice it)",
    summary: "Most teens have never been taught how to rest. The 'just relax' framing skips the actual learnable skills.",
    readMinutes: 3,
    body: `One of the more underrated points about rest is that it's a learnable skill. Most teens have been told to "relax" or "take a break" their whole lives without anyone teaching them how. The skills exist; they're trainable.

**Skills involved in rest:**

**1. Recognizing depletion.**
Many teens don't notice they're tired until they're significantly tired. The body sends signals earlier (eyes feeling heavy, decision fatigue, irritability, distraction increasing). Learning to read these signals early is a skill.

Practice: once a day, check in: "How depleted am I, 1-10?" Build the noticing.

**2. Stopping.**
The ability to actually stop what you're doing is harder than it sounds. Many teens describe themselves as unable to stop — keep scrolling, keep working, keep talking, keep being available — even when tired.

Practice: practice ending things on time. End a study session at the time you said. End a hangout when you said. End a scroll session by setting a timer. The stop muscle builds.

**3. Tolerating non-doing.**
Sitting with the discomfort of not doing anything. This is the muscle most atrophied in modern teen life. (See the boredom article.)

Practice: 5 minutes of nothing per day. Phone away, eyes open or closed, just sitting. The discomfort decreases; the capacity grows.

**4. Identifying what kind of rest you need.**
Per the 7-kinds-of-rest article. Knowing whether you need physical, mental, sensory, emotional, social, creative, or spiritual rest.

Practice: weekly check-in: "What kind of rest is the most depleted for me right now?" Then act on the answer, not on the default.

**5. Single-tasking.**
Doing one thing at a time without switching. Rest, like work, is more restful when undivided.

Practice: when resting, fully rest. When walking, just walk. When listening to music, just listen. When eating, just eat. The single-tasked version is more restorative than the multitasked version.

**6. Sleeping well.**
The skill of going to bed when planned, falling asleep without phone, staying asleep, waking without grogginess. All learnable; all responsive to the practices in the sleep article.

**7. Building rest into your schedule.**
Most teens treat rest as what happens between activities, in margins. The teens who rest well treat it as scheduled — specific times and durations.

Practice: schedule rest like you schedule activities. "From 9pm to 10pm I'm doing nothing in particular." Then defend that time the way you defend other commitments.

**8. Saying no.**
Rest requires capacity. Capacity requires saying no to things. The teens who never say no end up rest-deprived because they keep saying yes.

Practice: say no to one optional thing per week. Notice that the world doesn't end.

**The cultural friction:**

Modern teen culture often makes these skills harder:

- The phone is always available; stopping is harder.
- Group chats demand availability; saying no costs social capital.
- Achievement culture frames rest as laziness.
- Productivity culture frames "doing nothing" as a problem.
- Social media rewards constant content engagement.

Building these skills means pushing against some of these forces. It's worth it, but it's not easy. Most teens who develop strong rest skills did so deliberately, sometimes against family / friend pressure.

**A specific frame:**

You don't owe anyone constant availability. You don't owe your schedule. You don't owe productivity all the time. The version of you that's well-rested is the version that shows up for everything else better.

Rest is not selfish; it's infrastructure. Without it, every other dimension of life works worse.

**The longer arc:**

Teens who develop rest skills now have a real advantage going forward. Most adults haven't learned them; many burn out in their 20s and 30s from lack of skill at restoring themselves. The teens who learn it early build sustainable lives instead of crash cycles.

This is some of the most boring-sounding advice in this engine. It's also some of the most consequential. The teens who take rest seriously across the rest of their lives have measurably better outcomes than the ones who don't.

**For acute moments:**

If you're reading this exhausted right now: stop reading. Go do nothing for 15 minutes. Come back later if you want. The article will be here.

If you're reading this in a hard week: name what kind of rest you need. Subtract one thing if you can. Sleep early tonight. Tomorrow is a different day.`,
    takeaways: [
      "Rest is a skill: recognizing depletion, stopping, tolerating non-doing, identifying kind needed, single-tasking, sleep, scheduling, saying no.",
      "Modern teen culture makes rest skills harder. Building them requires deliberate practice and sometimes pushing back.",
      "Rest is infrastructure, not selfishness. Every other dimension of life works better when you're rested.",
      "Teens who develop rest skills now have a real advantage going forward. Most adults never learned them."
    ]
  }
];

export const BOREDOM_REST_CATEGORY_LABEL: Record<BoredomRestCategory, string> = {
  what_boredom_is: "What boredom is",
  kinds_of_rest: "Kinds of rest",
  scroll_vs_rest: "Scroll vs rest",
  unstructured_time: "Unstructured time",
  sleep_specifically: "Sleep specifically",
  when_rest_doesnt_work: "When rest doesn't work"
};
