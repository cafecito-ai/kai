/**
 * Digital wellbeing primer. Same article shape as BodyLiteracy (#33) and
 * NutritionPrimer (#35). Focused on phones, apps, social media, and
 * attention — the part of teen life that adults rarely understand.
 *
 * Voice rules (strict):
 *   - Don't shame teens for phone use. Adults built the system.
 *   - Don't claim social media "causes" the teen mental health crisis.
 *     The evidence is correlational and uneven across groups.
 *   - Acknowledge that phones and social media also have real value
 *     (community, identity, creativity).
 *   - Tactical, not preachy. Give teens agency, not lectures.
 *   - No "kids these days" framing.
 *   - Persistent overuse + low mood → suggest a trusted adult, not
 *     diagnosis.
 */

export type DigitalCategory = "research" | "mechanics" | "social_comparison" | "sleep" | "focus" | "agency";

export type DigitalArticle = {
  id: string;
  category: DigitalCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const DIGITAL_ARTICLES: ReadonlyArray<DigitalArticle> = [
  {
    id: "phones-and-mood",
    category: "research",
    title: "What the data actually says about phones and mood",
    summary: "The research is messier than the headlines. Effects exist, are uneven across teens, and are not the whole story.",
    readMinutes: 4,
    body: `If you've read a headline lately, you've heard that phones are wrecking teen mental health. The research is more complicated than that.

What is reasonably well-established: heavy social media use (3+ hours a day) correlates with higher rates of anxiety and depression, especially in adolescent girls. Late-night phone use correlates with worse sleep. Comparison-heavy platforms (visual feeds, filtered photos) correlate with worse body image. None of this is in dispute.

What is NOT well-established: that phones *cause* the teen mental health crisis. Correlation ≠ causation, and the size of the correlation in most studies is small. Teens who are already struggling often turn to phones more, which can show up in the data as "phones caused the struggle" when the actual arrow is the other way around.

What is genuinely useful to know about yourself: do you feel worse after using a specific app? Better after others? More distracted than you'd like? Sleeping less? Those are real, observable patterns that don't require a moral panic to be worth changing.

The product isn't here to take your phone away. It's here to help you notice your own patterns and adjust the ones that aren't working — which is what the rest of these articles cover.`,
    takeaways: [
      "Heavy social media use correlates with anxiety/depression, especially in teen girls.",
      "Correlation isn't causation — teens already struggling often use phones more.",
      "Your own patterns are observable: what you feel after using each app is real data.",
      "Adjust based on your patterns, not someone else's panic."
    ]
  },
  {
    id: "doomscroll-mechanics",
    category: "mechanics",
    title: "Why scrolling is engineered to be hard to stop",
    summary: "Infinite feeds, variable rewards, autoplay — every UX choice is designed to keep you in the app. Knowing the mechanic is half the battle.",
    readMinutes: 3,
    body: `Doomscrolling isn't a personal failing. It's the predictable outcome of design choices that are very, very good at their job.

The core mechanic: variable reward. Like a slot machine, you don't know what the next post will be — funny, boring, infuriating, beautiful. Your brain stays engaged because the *next* one might be worth it. Casinos pay billions for this; apps do it for free with your attention.

The reinforcing details: infinite scroll (no natural stopping point), autoplay (the next video starts before you decide), pull-to-refresh (a literal slot-machine motion), notifications (manufactured urgency), red-dot badges (manufactured incompleteness).

What helps:
- **Add friction.** Move the app off your home screen. Log out daily. Use grayscale mode. Each extra second to access is a second to ask "do I want to?"
- **Set a hard endpoint.** "I'll close this when I see two posts I've already seen" works better than "I'll just check for a minute."
- **Replace, don't subtract.** "Don't scroll" is a vacuum your brain fills. "Read three pages of my book" is a real default.
- **Notice the body.** Tight jaw, shallow breath, eye strain — those are the body saying "this isn't fun anymore."

You are not weak for falling into a 90-minute scroll. The product was tuned for exactly that outcome. Naming the mechanic is the first move to stepping around it.`,
    takeaways: [
      "Variable reward is the engine — your brain isn't broken, the app is the slot machine.",
      "Friction beats willpower. Move the app, log out, use grayscale.",
      "Replace the scroll with a concrete default, don't try to just stop.",
      "Body cues (tight jaw, shallow breath) tell you when to put the phone down."
    ]
  },
  {
    id: "highlight-reel",
    category: "social_comparison",
    title: "Social media is a highlight reel of a highlight reel",
    summary: "What you see is filtered, lit, posed, and selected. Comparing your bloopers to someone's edits is a rigged game.",
    readMinutes: 3,
    body: `Every photo and video you see on social media has been through several filters before it reached you. Some are technical (literal filters, lighting, angle, editing app). Some are selection-level (the person took 50 photos and posted the one). Some are platform-level (the algorithm shows you the most engaging content, which means the most extreme content).

You are watching the highlight reel of someone else's highlight reel of someone else's highlight reel. Then you compare it to your unedited Tuesday morning. That comparison is rigged.

What makes this worse in adolescence: comparison is a normal developmental task. Teen brains are wired to look at peers and ask "am I doing this right?" The peer group used to be ~30 kids at your school. Now it's hundreds of millions of people, pre-filtered for impressiveness. The math doesn't work.

What helps:
- **Curate aggressively.** Unfollow or mute accounts that consistently make you feel worse. This is not "missing out" — it's basic environmental design.
- **Add inputs that aren't social.** Music. Reading. Real-world hobbies. The more inputs your sense of self gets from non-comparison sources, the less weight the comparison ones carry.
- **Notice the post-pattern.** If after 20 min of a specific app you feel small, that's information. Trust the body.
- **Remember the math.** The person you're comparing to is also comparing themselves to someone, who is also comparing themselves to someone. Everyone is the audience member in someone else's show.`,
    takeaways: [
      "Every image has been filtered, selected, and algorithm-ranked. The comparison is rigged.",
      "Teen brains naturally compare to peers. Hundreds of millions of curated peers is a math problem.",
      "Unfollow / mute aggressively. Curation is not deprivation.",
      "Add non-social inputs to your sense of self — music, hobbies, real-world friends."
    ]
  },
  {
    id: "phones-and-sleep",
    category: "sleep",
    title: "Phones and sleep: the one thing where the data is loud and clear",
    summary: "Late-night phone use wrecks teen sleep through three different mechanisms. Of all the digital habits to change, this one has the highest return.",
    readMinutes: 2,
    body: `Most "phones are bad" claims are murky in the research. Phones in bed at night are not. The evidence is loud and consistent: late phone use ruins teen sleep through three separate mechanisms.

One: the content itself. Funny videos, drama, comments — all keep your brain alert exactly when you need it to slow down. Even "wholesome" scrolling produces dopamine spikes that are the opposite of sleep architecture.

Two: light. Less about "blue light" magic (that's overblown) and more about: bright screens an inch from your face tell your circadian rhythm it's still daytime. Melatonin (the body's natural sleep hormone) gets delayed. You feel "tired but wired" because half of you wants to sleep and the other half thinks it's noon.

Three: time. Every minute on the phone past your target sleep time is a minute you don't sleep. Teens consistently report sleeping later than they intended because "just checking" turned into 90 minutes.

What works:
- **Phone across the room.** Not on the nightstand. Not face-down on the bed. Across the room.
- **Hard cutoff before bed.** 30 minutes works. 60 minutes works better.
- **Replace the bedtime scroll.** Book, journal, audio show with a sleep timer.
- **If you use it as an alarm, get a real alarm.** Sub-$10 fixes the whole problem.`,
    takeaways: [
      "Late phone use hurts sleep via content + light + time.",
      "Phone across the room beats every other change. Not on the nightstand.",
      "30 min cutoff before bed works. 60 min works better.",
      "Stop using your phone as your alarm clock. Cheap analog alarms exist."
    ]
  },
  {
    id: "notification-math",
    category: "focus",
    title: "The notification math",
    summary: "If you get 100 notifications a day, you're context-switching every 9 minutes. That's not a focus problem, it's a setup problem.",
    readMinutes: 2,
    body: `Most teen phones generate between 80 and 200 notifications a day. Even at the low end, that's a context switch every 12 minutes of your waking time. At 200, it's every 5 minutes.

Research is depressing on context switching: each one costs ~25 minutes to fully recover from. The math doesn't work — you can't recover from a 25-minute hit every 5 minutes. So your brain stops trying. The feeling of being constantly behind, foggy, can't-focus is the predictable outcome.

The fix isn't willpower. It's the notification settings. Most apps default to alerting you for everything; the apps don't care about your attention.

Tactical:
- **Open Settings → Notifications.** For each app, ask: do I need to know in real time? If no, turn it off. Most messages are not real-time.
- **Group similar apps.** Maybe one mail account beeps; the rest poll on your schedule.
- **Silence all of social.** You'll check those apps when you want to, not when they want you to. You will not miss anything important.
- **Keep emergencies on.** Phone calls and texts from immediate family are real-time. Almost nothing else is.

Many teens who do this report that their phone feels usable for the first time in years. Less behind. Less foggy. Same number of notifications they care about, none they don't.`,
    takeaways: [
      "100 notifications/day = a context switch every ~9 min. The math is impossible.",
      "App defaults are not designed for you. They're designed for the app.",
      "Turn off notifications for everything that doesn't need to interrupt you.",
      "Keep calls and family texts on; everything else can wait until you check."
    ]
  },
  {
    id: "apps-that-help",
    category: "agency",
    title: "Apps that help you, apps that don't",
    summary: "Some apps return real value for the time. Some take time and give nothing back. Knowing which is which is a real skill.",
    readMinutes: 3,
    body: `Not all screen time is the same. The "screen time" number on your phone treats reading a book on an e-reader the same as 90 minutes of scrolling — but those have wildly different effects on you.

A working framework: did the app give back at least as much value as it took? Some categories where the math usually works:
- **Reading apps** (e-books, long-form articles). Yes — you learned something, time passed deliberately.
- **Messaging with people you actually know.** Yes for real conversations, no for parasocial drift.
- **Creating things** — music apps, writing, drawing, video editing. Usually yes — output, not just input.
- **Learning** — Duolingo-style, YouTube tutorials you actually use. Yes, but with the caveat that "learning" can become a procrastination shape.
- **Specific information** — directions, recipes, weather, schedule. Yes — defined input, defined output.

Categories where the math usually doesn't work:
- **Infinite scroll feeds.** No — the design is to maximize time, not your benefit.
- **Comparison-driven platforms.** No — even if you feel "fine" during, the after-feeling is often worse.
- **Game-as-time-killer.** Sometimes yes (decompression is real) — sometimes no (90 minutes lost feeling worse).

The test isn't "is this app good or bad." It's: at the end of 20 minutes with this app, do I feel like I gained or lost something? The honest answer is good information.

This is not a guilt frame. Some scrolling is fine. The frame is: pay attention to what you actually feel after, and adjust based on the data your body gives you.`,
    takeaways: [
      "Not all screen time is the same. Reading ≠ scrolling ≠ creating.",
      "Test: after 20 min with this app, did I gain or lose something?",
      "Reading, creating, real conversations, specific information usually return value.",
      "Infinite scroll feeds usually don't. Not because they're evil; because they're not for you."
    ]
  },
  {
    id: "real-default",
    category: "agency",
    title: "Replace the scroll with a real default",
    summary: "Saying 'I'll stop scrolling' is fighting yourself. Having a default that's already lined up wins quietly.",
    readMinutes: 2,
    body: `One of the most useful tactical moves with phones: don't try to *stop* doing something. Set up what you'll do instead.

Every scroll session is your brain reaching for "something to fill this moment." If the only available something is the app, you'll grab the app. If something else is already lined up — easier to start than to open the phone — you'll grab that one a percentage of the time.

What "lined up" looks like:
- **A book on the kitchen counter.** Visible, easy. Don't have to find it.
- **A guitar / sketchbook / Rubik's cube on the desk.** A real thing in the world, not behind a tap.
- **Tomorrow's plan on a sticky note.** When bored, the brain asks "what now?" — give it an answer.
- **A note in your phone's home screen** that says *"What were you reaching for? Anything else?"* — only mildly annoying, breaks the autopilot.

This isn't about heroic willpower. It's about lowering the activation energy for the thing you want to do, and raising it slightly for the thing you don't.

Teens who try this for two weeks often report that they didn't quit social media — they just spent less time on it, because the friction nudged them toward defaults that were better lined up. Quiet wins beat heroic ones.`,
    takeaways: [
      "Don't try to stop a habit. Replace it with a default that's easier to start.",
      "Visible physical objects (book, guitar, sketchbook) beat invisible intentions.",
      "Raise friction on the app. Move it. Log out. Grayscale.",
      "Lower friction on the alternative. Put the book where the phone normally lives."
    ]
  }
];

export const DIGITAL_CATEGORY_LABEL: Record<DigitalCategory, string> = {
  research: "What the data says",
  mechanics: "How it works",
  social_comparison: "Comparison",
  sleep: "Sleep + phones",
  focus: "Focus + notifications",
  agency: "Your defaults"
};
