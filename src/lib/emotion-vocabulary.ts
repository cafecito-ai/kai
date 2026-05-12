/**
 * Emotion vocabulary primer. The "feelings wheel" tradition + body-emotion
 * literacy. Naming emotions specifically is one of the best-evidenced
 * skills in clinical psychology for reducing emotional intensity
 * ("affect labeling").
 *
 * Voice rules (strict):
 *   - No "negative emotions" / "positive emotions" framing. Emotions are
 *     useful or unuseful in context, not morally categorized.
 *   - No "good vibes only", "high vibration", "positive thinking".
 *   - All emotions are valid information. The product never tells a teen
 *     they "shouldn't" feel something.
 *   - No diagnosis (clinical depression, generalized anxiety disorder).
 *   - Persistent low-mood / disconnection / numbness > 2 weeks → counselor.
 *   - Body cues for emotions are research-grounded (interoception literature).
 */

export type EmotionCategory =
  | "anger_family"
  | "sadness_family"
  | "fear_family"
  | "joy_family"
  | "shame_family"
  | "body_cues";

export type EmotionArticle = {
  id: string;
  category: EmotionCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const EMOTION_ARTICLES: ReadonlyArray<EmotionArticle> = [
  {
    id: "naming-it",
    category: "body_cues",
    title: "Why naming the exact feeling makes it lighter",
    summary: "Affect labeling is one of the most robust findings in emotion science. A precise name turns the volume down.",
    readMinutes: 3,
    body: `When you can name an emotion specifically — not "I'm bad" but "I'm frustrated and a little disappointed" — something measurable happens in the brain. Brain imaging studies repeatedly show that putting feelings into specific words activates the prefrontal cortex (thinking brain) and quiets the amygdala (alarm brain). The signal gets sorted from a roar into a sentence.

This is called *affect labeling*, and it's one of the better-evidenced skills in emotion science. It doesn't require believing anything; it works mechanically.

A few principles:

**Specificity matters.** "I feel bad" doesn't do much. "I feel embarrassed and a little angry at myself" does. The narrower the name, the more the brain settles. Going from one big lump to two or three named pieces almost always helps.

**You can feel more than one thing.** Most real emotional states are mixes — anger + hurt, fear + excitement, sadness + relief. Naming both pieces (not collapsing them into one) tracks reality.

**The wrong name keeps you stuck.** If you call sadness "weakness," you stop being curious about it and start fighting it. If you call anxiety "I'm broken," you can't work with it. Mis-naming makes things heavier.

**Some teens (and adults) are emotion-vocabulary-poor.** Not their fault — the culture often teaches a small set: "good," "bad," "fine," "stressed." That's it. The skill of having 30 specific words for emotional states is learnable at any age. The articles in this section cover the families.

How to practice:

- **Once a day, name what you're feeling out loud or in writing.** Be specific. Two or three words at most. Then notice what shifts.
- **Use a feelings wheel when you're stuck.** Plutchik wheel, Junto wheel — many exist. Look at it when the lump feels too big to name.
- **Watch the body for cues.** The body usually knows before the words do (body cues article in this section).

When a teen says "I don't know what I'm feeling" and means it, that's also data. Sometimes you're between emotions, in transition, or numb. The right response then isn't to force a label — it's to be patient and let the name surface.

This skill, practiced over months, gives you back significant agency over emotional intensity. It's not a magic trick; it's a workout for a specific brain pathway.`,
    takeaways: [
      "Affect labeling is well-evidenced — specific names turn down emotional volume.",
      "You can feel more than one thing at once. Most real states are mixes.",
      "Mis-naming keeps you stuck. 'Weakness' isn't a name for sadness.",
      "The skill is learnable. 30 specific words is better than 4."
    ]
  },
  {
    id: "anger-family",
    category: "anger_family",
    title: "The anger family: 12 words you might be missing",
    summary: "'Mad' is rarely the precise word. Inside the anger family are 12+ flavors that respond to different things.",
    readMinutes: 4,
    body: `Anger gets a bad rap. It's actually one of the most useful emotions — it tells you a boundary was crossed, a value was violated, or something you care about is at stake. The problem isn't anger itself; it's the difficulty of naming which kind it is, which makes it harder to respond well.

Some flavors inside the anger family, with what they usually point to:

- **Annoyed:** something small but repeated is grating. (The pen clicking. The same song again. The roommate's mess.) Usually solvable.
- **Frustrated:** you're trying to do something and being blocked. Effort > outcome.
- **Resentful:** a slow accumulation. You've been doing more than your share, or absorbing something repeatedly. The anger has compound interest.
- **Irritated:** low-grade buzz. Often a body-state issue (tired, hungry, sensory-overloaded) more than an event.
- **Indignant:** something feels unfair in a moral sense. Public or systemic.
- **Furious:** big, hot, taking up all the space. The body is fully in fight mode.
- **Bitter:** old anger that didn't get processed. Now it's coloring the present.
- **Outraged:** moral indignation, but bigger and harder to sit with. Often about something you can't immediately change.
- **Disgusted:** an extension of anger toward something morally repellent (or sensorily repellent).
- **Contemptuous:** anger + dismissal. The other person isn't even worth engaging with. (Especially worth noticing — contempt is corrosive in close relationships.)
- **Defensive-angry:** anger triggered by feeling criticized or attacked. Often masks fear or hurt underneath.
- **Hurt-angry:** when underneath the anger is real hurt, and the anger is the more comfortable feeling to access.

What this matters for:

- **Annoyed and frustrated have specific fixes.** Solve the small problem; remove the block. Don't escalate.
- **Resentful means an old conversation needs to happen.** Address the imbalance directly, or it builds.
- **Furious means take a step back before doing anything.** Decisions made from furious almost always have regrets.
- **Bitter and contemptuous deserve attention** — these are signs of older un-processed material. Counselor territory if persistent.

A note on "should I feel angry":

Almost every culture has rules about whose anger is allowed. Some teens (especially girls and femmes) are taught their anger is unattractive or scary; others are taught anger is the only emotion that's safe. Both teach you to mis-name what you're actually feeling.

You're allowed to feel anger. The skill is naming which flavor, sitting with it, and choosing what to do — not pretending it isn't there.

If anger feels chronic, overwhelming, or you're worried about what you might do — that's a real moment to bring in a counselor. There are concrete protocols (DBT, anger management work, trauma-informed therapy) that genuinely help.`,
    takeaways: [
      "Anger is information about a boundary, value, or stake. It's not the enemy.",
      "Annoyed / frustrated / resentful / furious / bitter all need different responses.",
      "Defensive-angry and hurt-angry usually mask softer feelings underneath.",
      "Chronic, overwhelming, or scary anger → counselor. There are protocols that work."
    ]
  },
  {
    id: "sadness-family",
    category: "sadness_family",
    title: "The sadness family: what's actually going on",
    summary: "Sadness has more flavors than most teens are taught. Each one points to a different need.",
    readMinutes: 4,
    body: `Sadness is the emotion most often suppressed in adolescence. It carries cultural baggage — "be strong", "stop crying", "you're fine" — that makes it harder to name. But sadness is one of the more useful emotions when you can hear it: it's almost always pointing to something you lost, miss, or care about.

Some flavors inside the sadness family:

- **Sad** (the base): something is missing, ended, or harder than it should be.
- **Disappointed:** the gap between what you hoped for and what happened.
- **Hurt:** an action or word landed on something tender. Often someone close.
- **Lonely:** the gap between the connection you have and the connection you need. (See the relationships primer.)
- **Grief:** loss that has weight — a person, a pet, a friendship, an opportunity, a version of your life. Big or small, grief is its own thing.
- **Homesick:** a kind of grief for a place or a time. Can hit even when you're "home."
- **Nostalgic:** a softer kind of homesickness — for a version of yourself, or a moment that's passed. Mixed with warmth.
- **Despondent:** sadness with a hopelessness flavor. The future stops feeling like it has good things in it.
- **Heartbroken:** the specific shape of romantic or close-friend loss.
- **Melancholy:** a quiet, atmospheric sadness — often without a single cause. Like weather.
- **Empty / hollow:** when sadness has been so persistent that the system numbs out. This one needs attention.
- **Tearful:** the body is ready to cry; the situation may or may not feel like it warrants it.

What each one might be asking for:

- **Sad / disappointed / hurt:** acknowledgment. Naming it. Sometimes a friend to sit with you. Time.
- **Lonely:** real connection — one-on-one, low-stakes. (See loneliness article.)
- **Grief:** doesn't want a fix. Wants to be felt. The way out is through. Don't push through too fast.
- **Homesick / nostalgic:** information about what your life is missing right now.
- **Despondent / empty / hollow:** these need attention from outside yourself. A trusted adult, a counselor. Especially if they've been around for more than a couple of weeks.
- **Heartbroken:** time, the people who love you, and not pretending you're fine before you are.

A few honest things about sadness:

- **Crying is regulation, not weakness.** Tears release stress hormones; the body literally feels different after. The "be strong, don't cry" framing was always nonsense from a biology standpoint.
- **Sad with a reason is different from sad without one.** Both are valid. Sad-without-a-reason that lasts more than two weeks is worth a counselor.
- **Cultural and family scripts about sadness vary a lot.** Some homes let everyone feel everything; others teach that sadness is unacceptable. The latter doesn't make sadness wrong — it makes the home harder for sad-feeling humans to live in.

When to escalate:

If sadness — especially the despondent, empty, hollow flavors — has been around for more than two weeks, OR is paired with thoughts of not being here, that's the moment for a counselor. Not later. Now. Persistent low mood is one of the most treatable things in mental health. Concrete protocols work. The Crisis page is always one click away if it's acute.`,
    takeaways: [
      "Sadness is information about loss, missing, or what you care about. Useful, not weak.",
      "Different flavors need different responses — disappointment, grief, loneliness, despondence aren't interchangeable.",
      "Crying is regulation, not weakness. The body literally resets afterward.",
      "Sadness for >2 weeks, or with hopeless thoughts → counselor. Treatable, real help."
    ]
  },
  {
    id: "fear-family",
    category: "fear_family",
    title: "The fear family: anxiety, dread, panic, and what they're for",
    summary: "Fear gets named 'anxiety' a lot, but the family is richer — and each flavor responds to different things.",
    readMinutes: 4,
    body: `Fear is the most over-named emotion in modern adolescence — "I have anxiety" gets used for almost any flavor of fear feeling. The fear family is actually quite varied, and naming the specific flavor changes what helps.

Some flavors inside the fear family:

- **Worried:** future-focused, low-grade, often about something specific. ("Will I pass this test?")
- **Anxious:** future-focused but more diffuse, often body-tense. May or may not have a clear object.
- **Nervous:** anticipation of something specific, often before performance. Can be reframed as readiness. (See pre-performance article in the stress primer.)
- **Afraid:** immediate fear of a clear threat. Body in alarm.
- **Dread:** anticipating something you don't want to do, often inflating its size. Specific to teens during exam weeks, college decisions, hard conversations.
- **Panic:** sudden, intense, body-flooded. May feel like heart attack. Usually peaks in 10-20 min if you let it.
- **Hypervigilant:** the body is scanning constantly for threat even when none is present. Often a sign the nervous system is overloaded.
- **Apprehensive:** quieter dread — uncertainty + a sense something won't go well.
- **Insecure:** fear about your standing — am I good enough, will they like me, do I belong.
- **Helpless:** fear plus the sense that you can't do anything about it. Heavier than fear alone.
- **Spooked:** sudden, sharp, usually short-lived. Body startle.
- **Existential dread:** the big-picture flavor — about death, meaninglessness, the future of the world. More common in teens than adults often realize.

What each one usually needs:

- **Worried:** information. Often googling, planning, or asking someone resolves it. Sometimes it needs a "I've worried enough, putting this down" decision.
- **Anxious (diffuse, body-tense):** the body is the entry point. Slow breath, movement, getting outside, eating real food. The body talks the brain back from anxious-state better than logic does.
- **Nervous (pre-performance):** reframe as excitement; warm up the body. See stress primer.
- **Dread:** subtract before adding. The thing is rarely as big as the anticipation. Often the 5-minute start dissolves dread.
- **Panic:** ride it out. Do not fight it (fighting prolongs it). Slow exhale longer than inhale. Cold water on face if available. It peaks and falls.
- **Hypervigilant:** sustained nervous-system regulation work. Often a counselor-level conversation if it's chronic.
- **Insecure:** harder. Often connected to identity work (see identity primer). Sometimes a counselor.
- **Helpless:** usually means the actual situation needs an adult in your life, not just a personal coping skill.
- **Existential dread:** allow it. These are real questions. Talking to thoughtful people helps; pretending you don't have them doesn't.

A note:

You can have these fears and not have an anxiety "disorder." Most teens experience most of these regularly. That's adolescence in the modern world, not pathology.

When to escalate:

- Panic that's frequent or interferes with school/sleep → counselor.
- Hypervigilance that doesn't let up → counselor.
- Fear that prevents you from going places, doing normal things, or being around people → counselor.
- Any fear paired with thoughts of not being here → urgent, talk to an adult, Crisis page resources.

Counselors and therapists have very specific, effective tools for fear-family work (CBT, exposure work, somatic approaches). It's some of the highest-success treatment in mental health.`,
    takeaways: [
      "Fear has more flavors than 'anxiety' — naming the specific one changes what helps.",
      "Anxious states often need body-first interventions (breath, movement, food, outdoors).",
      "Panic peaks and falls — don't fight it; long exhales help.",
      "Frequent panic, sustained hypervigilance, or fear preventing normal life → counselor. Highly treatable."
    ]
  },
  {
    id: "joy-family",
    category: "joy_family",
    title: "The joy family: noticing the good ones too",
    summary: "Teens are taught to name what's wrong. Naming what's right matters too — different flavors of good feelings teach you what you actually want.",
    readMinutes: 3,
    body: `Most emotion vocabulary work focuses on the heavy emotions, because those are the ones that hurt most when un-named. The joy family is just as varied — and worth learning to name, because what gives you each kind of good feeling tells you a lot about what your life should have more of.

Some flavors inside the joy family:

- **Happy** (the base): broad good feeling. Vague — worth pushing for more specific.
- **Content:** quiet, settled, not wanting anything different. Often missed because it's not loud.
- **Excited:** anticipation of something good. Body activated, future-focused.
- **Delighted:** small, unexpected good. The thing that made you laugh you didn't see coming.
- **Joyful:** big, expansive, body-light. Often connected to specific moments (concerts, holidays, reunions).
- **Grateful:** awareness of something specifically good in your life right now. Especially useful — researchers find naming gratitude shifts mood more than most "happiness practices."
- **Proud:** when you did something hard or meaningful well. Not arrogance — earned.
- **Curious:** the under-celebrated joy. Wanting to know, follow, explore. One of the most useful emotional states for life direction.
- **Hopeful:** future-focused, optimistic but not naive. The opposite of dread.
- **Inspired:** moved by someone else's work, person, or example. Often the seed of new directions.
- **Connected:** the specific good feeling of really being with people you care about.
- **At peace:** settled, in flow, no urgent needs. Often missed because it's quiet.
- **Awe:** specific kind of joy — bigness, beauty, mystery. Stargazing, music that hits, nature, art. Worth seeking deliberately; awe has measurable benefits.
- **Relief:** the specific good feeling of something hard being over. Distinct from happiness; often gets confused.

What this matters for:

**Knowing the names builds the felt experience.** People who can name a wider range of emotions actually feel them more often. The vocabulary isn't just description — it's part of the recognition system.

**Each flavor points to something different in your life.** Connected = relationships are working. Curious = follow what's pulling you. Awe = make space for whatever creates it. Proud = these are the activities that should stay.

**Track when you feel each.** What were you doing? Who were you with? What conditions made it possible? This is one of the better ways to design a life that has more of what works for you.

**Joy is not the same as feeling good all the time.** Joy coexists with hard things. You can be sad and grateful at the same week. The flavors aren't mutually exclusive.

A specific note for teens:

Modern teen life can leave very little time for the quiet flavors (content, at peace, awe, connected). These get crowded out by the louder, more stimulating ones (excited, scrolling-buzz, performance-buzz). Worth defending time for the quiet joys deliberately — they're load-bearing for wellbeing in ways the loud ones aren't.`,
    takeaways: [
      "Joy has flavors too — naming them builds the felt experience.",
      "Each flavor tells you what to design more of into your life.",
      "Gratitude and awe have measurable mood effects. Worth seeking deliberately.",
      "Defend time for quiet joys (content, at peace, connected). Modern life crowds them out."
    ]
  },
  {
    id: "shame-and-guilt",
    category: "shame_family",
    title: "Shame vs guilt: a distinction worth knowing",
    summary: "Guilt is 'I did a bad thing.' Shame is 'I am a bad thing.' The difference matters a lot.",
    readMinutes: 3,
    body: `Shame and guilt are often used interchangeably, but they're different emotions with different consequences. Brené Brown's work made this distinction widely known; the underlying research is older and solid.

**Guilt** is about a behavior. "I did something bad." Guilt is usually useful — it points you toward an apology, a repair, or a change. People who feel guilt about specific actions tend to repair more, learn faster, and trust themselves more over time.

**Shame** is about identity. "I am bad." Shame doesn't point to a fix — it points to hiding. Shame makes you want to disappear. Sustained shame is one of the strongest predictors of poor mental health outcomes in adolescence.

The same event can produce either, depending on how you frame it:

- *Guilt response:* "I lied to my parent. That was wrong. I should tell them the truth or apologize."
- *Shame response:* "I lied to my parent. I'm a terrible person. I'm a liar."

The first is actionable. The second is paralyzing.

A few things worth knowing:

**Shame thrives in isolation.** Saying it out loud to a trusted person almost always reduces it. Naming it ("I'm feeling ashamed about X") reduces its power.

**Shame is often learned.** Many teens grew up in homes where shame was a discipline tool ("you should be ashamed of yourself"). That tool installs a voice that's hard to dislodge. The voice can be retrained; see the self-talk article.

**Body-shame and sexual-shame are particularly common in adolescence** because of bodies changing + social comparison + a lot of cultural baggage. Both are extremely well-suited to therapy work; they're treatable.

**Shame after social rejection or screwing up publicly is intense and short** if you let it move through. Shame that becomes a self-story ("I'm the person who…") is what does long-term damage.

**Guilt has limits too.** Excessive guilt about things you can't control, or things that aren't actually your responsibility, isn't useful. Some teens carry guilt for family dynamics, for siblings' problems, for parental moods — these usually aren't yours. A counselor can help sort what belongs to you from what doesn't.

What helps with shame:

1. **Say it out loud to a trusted person.** Shame loses 50% of its weight when it's spoken aloud. The thing you can't tell anyone is the thing that needs telling.
2. **Distinguish behavior from identity.** "I did X" — fine. "I am X" — be careful. Identity statements are sticky.
3. **Notice the source.** Sometimes shame was installed long before this moment. Worth examining where it came from.
4. **If it's heavy and chronic, get real help.** Shame work is what therapists do well. CBT, ACT, and specifically Internal Family Systems are all known to work with shame.

If shame is paired with thoughts of not being here, that's a stop-everything-and-talk-to-an-adult moment. Crisis page link is at the bottom of every screen.`,
    takeaways: [
      "Guilt = 'I did something bad' (actionable). Shame = 'I am bad' (paralyzing).",
      "Shame thrives in isolation. Saying it out loud reduces it materially.",
      "Be careful with identity-statements vs behavior-statements. Identity sticks.",
      "Chronic shame is treatable. Counselors have specific tools that work."
    ]
  },
  {
    id: "body-cues",
    category: "body_cues",
    title: "Your body knew before your brain did",
    summary: "Emotions show up in the body before the words arrive. Interoception is the skill of reading the signals.",
    readMinutes: 3,
    body: `One of the most useful skills you can build is *interoception* — the ability to sense what your body is doing internally. Heart rate, breath, gut, muscle tension, temperature. These signals often tell you what you're feeling before your conscious mind has the word.

Most emotions have a fairly reliable body signature. Knowing the signatures lets you catch an emotion early, before it escalates.

Some patterns to know:

**Anger family:**
- Tight jaw, clenched fists, heat in chest/face
- Heart rate up
- Shallow upper-chest breathing
- Sometimes urge to move (pace, hit, throw)

**Fear / anxiety family:**
- Tight chest, butterflies / nausea in stomach
- Cold hands, sometimes cold feet
- Heart rate up, breath shallow
- Tunnel vision or hyper-alert vision
- Sometimes urge to flee or freeze

**Sadness family:**
- Heavy chest, lump in throat
- Drooping posture, low energy
- Slower breathing, sometimes shallow
- Eyes wet or pressure behind them
- Often a slight "caving in" feeling

**Shame family:**
- Hot face, blush
- Want to hide / make yourself smaller
- Looking down
- Stomach drops

**Joy family:**
- Loose shoulders, open chest
- Easy breathing
- Body warm but not hot
- Mouth wants to smile
- Eyes feel "open"

**Hunger / tiredness / dehydration** also pose as emotional states. Many "I feel anxious" episodes in teens are actually low blood sugar + dehydration. Worth checking before assuming it's psychological.

How to build interoception:

1. **Body scan, once a day.** 1-2 minutes. Start at your head, work down. What's tight, what's loose, what's warm, what's cold, what's neutral. No agenda — just noticing.
2. **Pause before responding.** When something happens — text, comment, news — instead of immediate reaction, take 5 seconds: what's the body doing? Often you'll catch the emotion before it captures you.
3. **Match name to body signature.** "My chest is tight, my breath is shallow, I'm scanning — I'm anxious about something." The body is data.
4. **Don't override body signals.** "Tired" is real information. "Hungry" is real information. "I need to be alone for an hour" is real information. Teens are often taught to push through; the body keeps the score either way.

A note on interoception and trauma:

People who've been through serious adversity sometimes have disrupted interoception — the body either screams too loudly (hypervigilance) or goes quiet (numbness/dissociation). Both are real, both are workable. Trauma-informed therapy, somatic experiencing, and body-based practices (yoga, qigong, certain martial arts) have evidence for rebuilding interoception. If reading your body feels impossible, that's not a personal failing — it's a learnable skill with real help available.

Interoception is one of the more underrated mental-health skills. It's the foundation under affect labeling, regulation, self-care, and trusting your gut.`,
    takeaways: [
      "Each emotion family has body signatures. Knowing them catches emotions early.",
      "Hunger / tiredness / dehydration often pose as emotional states. Check the base layer first.",
      "Daily body-scan (1-2 min) builds the skill over weeks.",
      "Disrupted interoception (numbness, hypervigilance) is workable with real help."
    ]
  }
];

export const EMOTION_CATEGORY_LABEL: Record<EmotionCategory, string> = {
  anger_family: "Anger family",
  sadness_family: "Sadness family",
  fear_family: "Fear family",
  joy_family: "Joy family",
  shame_family: "Shame + guilt",
  body_cues: "Naming + body cues"
};
