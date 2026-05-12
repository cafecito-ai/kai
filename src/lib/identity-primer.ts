/**
 * Identity + self-knowledge primer. Knowing who you are without performing it,
 * the social-media comparison trap, values clarification, the right to change,
 * inner self-talk, and getting to know yourself in a curious, low-stakes way.
 *
 * Voice rules (strict):
 *   - No "find your true self" / "manifest" / "live your truth" / "authentic self" cliches.
 *   - Identity formation is iterative, not a single destination — never frame it as
 *     "becoming who you really are" (locked in).
 *   - Comparison is normal wiring; the article doesn't shame it.
 *   - No prescription about who teens "should" be — religion, politics, identity,
 *     sexuality, gender are theirs to figure out, in their own time.
 *   - No "you are enough" platitude lines.
 *   - When self-talk is harshly critical or persistent, point to a counselor —
 *     not as failure, as a real-help signal.
 *   - No labels on the user (perfectionist, anxious, depressed).
 */

export type IdentityCategory =
  | "values"
  | "comparison"
  | "authenticity"
  | "change"
  | "self_talk"
  | "self_knowledge";

export type IdentityArticle = {
  id: string;
  category: IdentityCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const IDENTITY_ARTICLES: ReadonlyArray<IdentityArticle> = [
  {
    id: "values-clarification",
    category: "values",
    title: "What actually matters to you (not what you're told should)",
    summary: "Values are the compass underneath your decisions. Most teens have never been asked theirs.",
    readMinutes: 3,
    body: `A value is something that, when you act on it, you feel like yourself — and when you don't, you feel off, even if no one else noticed. Most teens carry values they've inherited (from parents, religion, school, the algorithm) without sorting which ones are theirs versus borrowed.

You don't pick values from a list. You notice them. A few prompts that help surface what's actually yours:

**When have you felt most alive recently?** Not most successful — most alive. A few specific moments. What were you doing? Who were you with? What was the value underneath that moment? (Connection? Creating something? Being trusted? Being challenged? Being outside?)

**When have you felt most off in the past month?** Not just sad — off, like you weren't acting like yourself. What value were you violating, or asked to violate? (Honesty? Loyalty? Independence? Fairness?)

**If no one were watching, what would you still do?** This filters out performance. The things you do when you're alone tell you a lot about what's yours.

**What do you defend automatically?** What kind of unfairness makes your stomach tighten? That reaction is values speaking before thought catches up.

A few values that come up often for teens but mean different things to different people:
- Honesty (in relationships? in public? both?)
- Loyalty (to friends? to family? to causes?)
- Independence (decision-making? identity? schedule?)
- Creativity (making things? thinking unusually? expression?)
- Achievement (excellence? recognition? mastery?)
- Justice (fairness? voice for others? structural change?)
- Connection (deep friendships? family? community?)
- Adventure (newness? risk? travel? challenge?)
- Growth (always learning? becoming?)
- Care (for people? for animals? for the planet?)

You don't need to land on a "top 5" or anything tidy. Just notice. Over months, the picture sharpens.

Values change a little as you grow. That's normal. Some core ones tend to hold; some surface ones shift. Re-checking them every year or so is a useful practice.

The reason this matters: when you know what you actually value, decisions get easier. Hard choices stop being "what should I do" and become "which of my values is this serving." That's a more honest question.`,
    takeaways: [
      "Values are what you notice — not what you pick from a list.",
      "Most-alive moments and most-off moments point to underlying values.",
      "What you do when no one's watching filters out performance.",
      "Knowing your values makes hard decisions feel honest instead of confusing."
    ]
  },
  {
    id: "comparison-trap",
    category: "comparison",
    title: "Why comparison hits so hard (and what helps)",
    summary: "Your brain compares automatically. Modern feeds make the math impossible. The wiring isn't broken — the environment is.",
    readMinutes: 3,
    body: `Comparison is not a personal flaw. Humans evolved to track where they stood in a small group of 50–150 people so they could survive socially. That wiring is still on.

The problem: you're not comparing yourself to 150 people you know. You're comparing yourself to the highlight reels of thousands of curated strangers, and the algorithm specifically serves you the most striking ones. The wiring built for a tribe is being used on a stadium.

A few things worth knowing:

**You compare upward, not laterally.** People naturally compare to those slightly better off, not equal or worse. That's why scrolling makes you feel behind — you're literally measuring yourself against the top end of every category.

**You compare your insides to other people's outsides.** They post the win, the trip, the polished result. You experience your own boring Tuesday. The comparison is structurally unfair.

**The feeds are not your life.** Twenty minutes of seeing what other people are doing can convince you that "everyone" is winning. Statistically, most people you see are also having boring Tuesdays — they're just not posting those.

**Specific kinds of comparison hit harder:**
- Body comparison (especially with edited photos) — body image distortion is real and well-documented.
- Achievement comparison (grades, awards, college acceptances) — particularly painful around junior/senior year.
- Relationship comparison (the friend group photos, the relationship posts) — feeds the loneliness.
- Aesthetic-life comparison (the dorm room, the outfit, the room tour) — manufactures a baseline that wasn't real.

What helps:
- **Unfollow accounts that consistently make you feel worse.** Not "block forever" — just create space. Your feed is editable.
- **Time-limit specific apps.** The apps designed to be addictive will pull you back; built-in limits help.
- **One-on-one time over scroll.** Real connection drains the comparison battery faster than anything else.
- **Notice the comparison out loud.** "I'm comparing myself to her right now." Named, it loses some grip.
- **Track what made you feel good this week.** Move attention from "what's everyone else doing" to "what worked for me." A short list, weekly.

If comparison feels constant and crushing and you can't put it down, that's worth bringing to a counselor. Not because you're broken — because they have tools that genuinely help, and white-knuckling it alone is exhausting.`,
    takeaways: [
      "Comparison wiring is real — you're not weak for falling into it.",
      "Feeds compare your insides to other people's outsides. Structurally unfair.",
      "Unfollow what makes you feel worse. Your feed is editable.",
      "Constant crushing comparison → counselor. They have tools."
    ]
  },
  {
    id: "performing-vs-being",
    category: "authenticity",
    title: "The cost of performing yourself all the time",
    summary: "Most teens perform a version of themselves online and at school. The cost is invisible until you're alone and don't recognize what's left.",
    readMinutes: 3,
    body: `There's a difference between adapting to context (you act a little different around your grandparents vs your best friend, fine) and performing yourself constantly across every context. The first is social fluency. The second is exhausting.

Signs you might be performing more than being:

- **You curate every photo before posting** (most teens do; the question is whether it's draining you).
- **You rehearse responses in your head before saying them**, even to close friends.
- **You feel a low-level anxiety any time someone might "see" you** — see your post, your story, your text.
- **You're sharper with the people closest to you** — because they're the ones you don't have energy left to perform for after the rest.
- **You're not sure what you actually think** about things, because you're always tracking what you should appear to think.
- **Time alone feels uncomfortable**, not restorative — because alone is the only time the performance stops.

The reason this happens: adolescence is when you're building an identity, and the modern environment has built-in audiences (group chats, social feeds, school). Performance is partly how you experiment with identity. That's normal.

The problem is when performance becomes the default and being yourself becomes the exception. You lose track of what's actually you versus what's the version you've been performing.

What helps:

- **Spaces with no audience.** A journal, a walk without your phone, a low-stakes friendship where you don't have to be on. These are not luxuries; they're how you keep yourself.
- **Notice when you're performing.** Not to stop — just notice. "I'm performing right now." Pure awareness. Over time, it gets easier to choose when to.
- **Pick one place where you don't perform.** Even one. A specific friend, a specific activity, a specific routine. Anchors matter.
- **Watch for the cost.** If you're exhausted, snapping at people you love, dreading time alone — the performance is too heavy.

The version of yourself you perform is real too — it's a version of you. The work isn't to "stop performing." It's to make sure there's a you underneath who's still recognizable when the show ends.`,
    takeaways: [
      "Adapting to context is fluency. Performing across every context is exhaustion.",
      "Watch for the tells: snappy with close people, dreading alone time, never sure what you think.",
      "Spaces with no audience (a journal, a walk, a low-stakes friend) are how you keep yourself.",
      "Notice the performance. Don't judge it. Pick at least one place where you don't perform."
    ]
  },
  {
    id: "right-to-change",
    category: "change",
    title: "You get to change. Often.",
    summary: "Identity at 14 isn't a contract for life. The pressure to be consistent is mostly other people's discomfort with your evolution.",
    readMinutes: 3,
    body: `One of the heavier things about adolescence is the assumption that you're supposed to be figuring out who you are — once, for good. You're not. You're figuring out who you are at 14. Then 15. Then 16. Then your twenties will reorganize most of it again. Then your thirties will reorganize what your twenties reorganized.

Identity isn't a destination. It's an iterative process. Locking it in at any age is the bug, not the feature.

What "changing" might look like:

- Dropping an interest you've had for years because you've outgrown it.
- Picking up something completely new — instrument, sport, hobby, style — even if it doesn't match who you've been.
- Changing how you dress, talk, or carry yourself.
- Reconsidering beliefs you grew up with — politically, religiously, philosophically.
- Outgrowing friendships that were once close (see the relationships primer).
- Coming out, deepening into who you are around gender / sexuality / identity, on your own timeline.
- Wanting different things from life than you thought you wanted at 13.

The friction when you change:

People around you will sometimes resist your evolution. Family wants you to stay the version they understood. Friends want you to stay the version they bonded with. Social feeds want you locked into a brand. The pressure to be consistent is mostly other people's discomfort with your becoming — not evidence that your change is wrong.

What helps:

- **Trial things in low-stakes ways.** You don't have to announce a transformation. You can just try a new sport for a month, wear something different for a week, listen to different music for a while. Not every change has to be a statement.
- **Give yourself permission to drop things.** A hobby you've had for 5 years is allowed to end. Outgrowing isn't betraying.
- **Notice the discomfort of others as data, not as a verdict.** People who love you adjust. People who needed a specific version of you sometimes don't. Both are real, neither means you should stop changing.
- **You don't owe anyone an explanation for your evolution.** Some changes are private. Some announce themselves. You decide which.

A specific note: some changes — identity, sexuality, gender, religion, political views — can be more charged in some families and communities. Your timeline is yours. You don't have to be out, public, or settled about anything before you're ready. A trusted adult or counselor can help you think through how and when, if you're navigating something heavy.`,
    takeaways: [
      "Identity is iterative, not a destination. Locking it in at any age is the bug.",
      "Other people's discomfort with your change is information about them, not a verdict on you.",
      "Try things in low-stakes ways. Not every change has to be a statement.",
      "Some evolutions deserve a trusted adult to think it through with. Pacing is yours."
    ]
  },
  {
    id: "self-talk",
    category: "self_talk",
    title: "The voice in your head: what it's saying, and who taught it",
    summary: "If you talked to a friend the way you talk to yourself, you'd lose the friend. Most teens haven't been told that's a fixable pattern.",
    readMinutes: 4,
    body: `Pay attention, for a day, to how you talk to yourself inside your own head. Most people are shocked at the tone when they actually notice it. "You're so stupid for forgetting that." "Why are you like this." "You always mess this up." "Nobody actually likes you." These are not unusual for teen self-talk — they're depressingly common.

A few things worth knowing:

**The voice was learned.** That tone in your head usually came from somewhere — a parent, a coach, a teacher, a friend, a moment, a culture. It's not yours by nature. You internalized it. Which means you can also un-internalize it.

**The voice is not the truth.** It can be loud, persistent, certain, repetitive — and still wrong. Volume is not evidence. "Nobody actually likes you" doesn't become true because it's loud.

**The voice gets meaner when you're tired, hungry, scrolling, or after social events.** This is information — those are the states to take it least seriously. The cruelest self-talk shows up when your defenses are lowest.

What helps:

- **Notice the voice as separate from you.** Not "I'm worthless" but "I'm having the thought that I'm worthless." That little gap creates room.
- **Ask: would I say this to a friend?** If your friend forgot something, would you say "you're so stupid"? Of course not. Apply the same standard inward.
- **Counter, don't suppress.** Telling the voice to shut up doesn't work. Adding a kinder voice next to it does. "I forgot to do X. That's annoying. It's also not evidence that I'm a bad person."
- **Track specific patterns.** Most self-talk runs the same loops — body-image criticism, achievement self-attack, social anxiety self-attack. Once you know your patterns, you can prepare for them.
- **Don't argue too much.** Endless internal debate ("but am I really worthless?") gives the voice oxygen. Notice it, name it, redirect — don't litigate it.

When the voice is constant, severe, or includes thoughts of not being here:

This is the moment for a counselor. Not someday. Now. Persistent harsh self-talk is one of the most treatable things in therapy — it has specific evidence-based protocols (CBT, ACT, others) that work. White-knuckling it alone is exhausting and unnecessary. The Crisis page link at the bottom of every screen has resources if it's an emergency.

This isn't weakness. It's the most useful kind of help to ask for, and you don't have to be in crisis to ask. Most teens who try therapy say they wish they'd started earlier.`,
    takeaways: [
      "The voice in your head was learned. That means it can be un-learned.",
      "Volume is not evidence. The loudest thoughts are not the most true.",
      "Notice the voice, don't argue with it. 'I'm having the thought that…' creates a gap.",
      "Persistent harsh self-talk is one of the most treatable things in therapy. You don't have to be in crisis to start."
    ]
  },
  {
    id: "self-knowledge-curiosity",
    category: "self_knowledge",
    title: "Getting to know yourself, in a low-stakes way",
    summary: "Self-knowledge is not a project you finish. It's a curiosity you keep.",
    readMinutes: 3,
    body: `The phrase "know yourself" is loaded. It sounds like a permanent destination. In practice, self-knowledge is more like a slow, ongoing curiosity — you notice things about yourself this year that you didn't last year, and you'll notice things next year you don't now.

A few low-stakes practices that build self-knowledge over time:

**Weekly notes.** Once a week, write a few sentences answering: What gave me energy this week? What drained me? What did I avoid? What surprised me? It doesn't have to be deep. Over months, patterns appear that you couldn't see in real time.

**Track when you feel most like yourself.** Different activities, different people, different times of day, different physical states. You'll notice that certain conditions consistently make you feel more like you. That's information for future life design.

**Notice your reactions, not just your decisions.** Your first reactions tell you more than your considered decisions. Your considered decisions are filtered through what you "should" feel. Your reactions are unfiltered. Both matter, but the reactions are more honest about who you are right now.

**Ask people you trust what they see.** People close to you notice things about you that you don't. Not what they want you to be — what they actually observe. "What's something you've noticed about me that I don't seem to notice myself?" is a good question for a parent, sibling, close friend.

**Try things on.** New hobbies, new clothing, new ideas, new music, new friend groups, new books. Self-knowledge isn't introspection alone — it's introspection plus experiment. You learn who you are partly by trying and noticing what fits.

**Sit with uncertainty.** A lot of self-knowledge questions don't have clean answers. "What do I want to do with my life" doesn't have to. "Who am I, really" doesn't have to. The teenage version of you is allowed to not have a fully sorted identity yet. The adult version of you won't either.

What to avoid:
- Personality tests as identity (MBTI, enneagram, etc.). Useful as conversation starters; not actual evidence of who you are.
- "Brand" thinking — picking an aesthetic or personality to perform consistently. Brands shrink you.
- Comparing your self-knowledge to others. People who seem certain of themselves are often performing that certainty.

Self-knowledge accumulates the same way trust does — slowly, quietly, in small noticings. Keep the curiosity. Don't force the answer.`,
    takeaways: [
      "Self-knowledge is a curiosity, not a destination. Patterns appear in months, not days.",
      "Weekly noticings (energy, drain, avoidance, surprise) build understanding over time.",
      "Reactions are more honest about who you are than considered decisions.",
      "Trying things on is part of how you learn what fits. Introspection plus experiment."
    ]
  },
  {
    id: "borrowed-vs-yours",
    category: "values",
    title: "Telling borrowed beliefs from your own",
    summary: "Most teens carry beliefs they've never examined. Sorting borrowed from yours is one of the harder, more useful kinds of work.",
    readMinutes: 3,
    body: `Most of what you believe right now — about politics, religion, success, love, your future, your body, your worth — was given to you. By family, by school, by friends, by the algorithm. That's not a flaw; it's how brains develop. But sorting which beliefs are actually yours versus which are borrowed is one of the more important things a teen can do.

A few prompts that help separate the two:

**Where did this belief come from?** Trace it back. "I think X about Y because…" If the answer is "that's just what my family believes" or "everyone at my school thinks that" or "I saw it online a lot" — it's borrowed. Not necessarily wrong. Just not necessarily yours yet.

**Have I tested it?** A borrowed belief is just inherited. A belief that's yours has been tested — by experience, by counter-evidence, by genuinely considering the opposite. You don't have to agree with the opposite; you just have to have actually considered it.

**Would I defend it if pressed?** Not snap at people who disagree — actually explain it, calmly, in your own words, with your own reasons. Borrowed beliefs collapse when pressed because there's no scaffold underneath. Examined beliefs hold up.

**Does it match what I observe?** Some beliefs hold up under your own observation. Some don't. If you've believed "X kind of person is always Y" and met five people who clearly aren't, the belief might be inherited and outdated.

Areas where this matters a lot during adolescence:

- **Politics and social issues.** A lot of teens inherit positions whole. Worth examining the actual evidence and considering counter-views before deciding what's yours.
- **Religion / spirituality.** Many teens drift away from or deeper into the faith they were raised in during these years. Either direction can be done with examination or by default. Examination is healthier.
- **Career assumptions.** "I'm going to be a doctor because everyone in my family is" is borrowed. "I want to be a doctor because I've shadowed three doctors and the work fits me" is yours.
- **Beliefs about your own worth.** Especially this one. "I'm not smart enough / good enough / lovable enough" is almost always inherited from someone or somewhere. Worth examining hard.
- **Beliefs about what success looks like.** The default script (good grades → good college → prestigious career → buy a house → retire) works for some people and crushes others. Worth asking what's actually yours.

What this isn't:
- Rebelling against everything you were raised with. Reflexive rejection is also borrowed — it's just borrowed from a contrarian source.
- Endless second-guessing of every belief. You'd never function. Pick a few that feel load-bearing and work on those.

What examination looks like in practice:
- Read or watch something that argues the opposite of what you believe. Not to be converted — to test your view.
- Talk to people who hold different beliefs respectfully, with real curiosity. Not to win — to understand.
- Notice when your gut reaction to a topic is "obviously X" — that's often where inherited belief lives, undefended.
- Be willing to update.

A note: examining the beliefs of family / community can be hard, sometimes scary. You don't have to do it loudly, fast, or in public. Your timeline is yours.`,
    takeaways: [
      "Borrowed beliefs come from family, school, friends, the algorithm. They're not yours yet just because they're in your head.",
      "Examined beliefs hold up under pressure because there's a scaffold. Borrowed ones collapse.",
      "Reflexive rejection is also borrowed — it's just borrowed from a contrarian source.",
      "Examination is slow, private, and yours. You don't owe anyone a public update."
    ]
  }
];

export const IDENTITY_CATEGORY_LABEL: Record<IdentityCategory, string> = {
  values: "Values",
  comparison: "Comparison",
  authenticity: "Performing vs being",
  change: "The right to change",
  self_talk: "Self-talk",
  self_knowledge: "Self-knowledge"
};
