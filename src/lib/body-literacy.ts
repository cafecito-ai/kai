/**
 * Body literacy primer. Short readable articles about how the teen body
 * actually works — growth, energy, hormones, recovery — in plain language.
 *
 * Voice rules:
 *   - Grade-8 reading level
 *   - No body shame or weight talk
 *   - No fixed timelines ("by 14 you should...")
 *   - No gendered assumptions where avoidable
 *   - No medical advice, no medication, no diagnosis
 *   - Frame "what's happening" not "what's wrong with you"
 *
 * Reviewed by the clinical reviewer (D5) before any teen sees them. Until
 * then they sit behind the same ClinicalReviewBanner gate the mental
 * engine uses, since body-development content has comparable sensitivity.
 */

export type BodyLiteracyCategory = "growth" | "energy" | "hydration" | "hormones" | "body_changes" | "recovery";

export type BodyLiteracyArticle = {
  id: string;
  category: BodyLiteracyCategory;
  title: string;
  /** One-sentence summary for the article-list view. */
  summary: string;
  /** Article body. Plain paragraphs separated by blank lines. */
  body: string;
  /** Three or four concrete takeaways the teen can act on. */
  takeaways: ReadonlyArray<string>;
  /** Estimated read time in minutes. */
  readMinutes: number;
};

export const BODY_LITERACY_ARTICLES: ReadonlyArray<BodyLiteracyArticle> = [
  {
    id: "growth-spurts",
    category: "growth",
    title: "Growth spurts: why your body suddenly needs more",
    summary: "Your body grows in bursts, not a straight line. Hunger and sleep tell you what's happening.",
    readMinutes: 3,
    body: `Teenage growth is not a smooth ramp. Most teens grow in bursts, with quieter months in between. A burst can add an inch or two over a few months, and you might not notice the change in the mirror — but your jeans will.

When you're in a growth burst, your body needs more of everything: more food, more sleep, more rest, more iron and calcium. This isn't optional. The body is literally building new tissue. Hunger spikes are not "lack of willpower" — they're the construction crew showing up to work.

Growth also costs energy. You might feel tired during a growth phase even when nothing else in your life changed. Sometimes joints ache (growing pains are a real thing, especially in knees and shins, usually at night). That's the body lengthening faster than the muscles can keep up.

A common pattern: hungrier than usual + sleeping more + feeling tired during the day + clothes start fitting differently. Two or three of those at once is usually a growth phase.

The product never tells you to push through this. If your body wants ten hours of sleep this week, that's information, not a problem.`,
    takeaways: [
      "Hunger and tiredness during a growth phase are signals, not weakness.",
      "Eat more when you're hungry. The body knows what it's doing.",
      "Sleep is when growth hormone peaks — protect it during growth bursts.",
      "Growing pains in knees and shins are common and usually pass."
    ]
  },
  {
    id: "energy-variability",
    category: "energy",
    title: "Why your energy is different every day",
    summary: "Day-to-day energy depends on sleep, food timing, stress, cycle, and ten other things. Variation is normal.",
    readMinutes: 2,
    body: `Some days you wake up sharp. Some days you wake up underwater. Same person, same diet, same routine — different energy.

Energy comes from several inputs running in parallel: last night's sleep, what you ate in the last six hours, hydration, stress, where you are in your hormonal rhythm (yes, everyone has one — see the hormones article), how recently you moved, and a dozen other things you can't see.

When your energy is low for a day, the move is not to optimize harder. The move is to ask which input is off and gently tilt that one. Tired? Earlier bedtime tonight. Brain foggy? Water first, then food. Wired but exhausted? Probably stress — five minutes of slow breathing changes more than five minutes of doomscrolling.

A useful frame: energy is information about the system, not a verdict on you. A flat day is data. Two flat days in a row is data with a pattern.`,
    takeaways: [
      "Variation day-to-day is normal and not a sign of anything wrong.",
      "Water → food → sleep, in that order, fixes most short-term energy dips.",
      "If you're wired but exhausted, the issue is usually stress, not energy.",
      "Track patterns over weeks, not days."
    ]
  },
  {
    id: "hydration-basics",
    category: "hydration",
    title: "Hydration: less complicated than you think",
    summary: "You don't need a giant water bottle calculator. You need to drink before you're thirsty and notice your pee color.",
    readMinutes: 2,
    body: `The water-tracking apps make hydration look like a math problem. It isn't. Three things matter and that's basically it.

One: drink before you feel thirsty. If you're thirsty, you're already mildly behind. Most people are mildly behind most of the day. Aim for spaced-out sips rather than chugging a whole bottle at once.

Two: pee color is the fastest signal. Light yellow = roughly right. Dark yellow = drink more. Clear water-color = you're actually overhydrated (more isn't always better). Morning pee is darker because you went all night without drinking; that's normal.

Three: what counts is most things with water in them. Water itself, yes. But also tea, milk, fruit, soup, watermelon. Coffee and caffeinated tea also count — they don't dehydrate you the way old health-class lessons claimed. The thing that doesn't fully count is straight alcohol or really sugary drinks; the body uses water to process them.

If you're active, sweating, or in heat, scale up. If you're sitting in AC reading, scale down.`,
    takeaways: [
      "Drink before you feel thirsty, in sips, throughout the day.",
      "Light yellow pee is your target. Clear means you're overdoing it.",
      "Most beverages and water-rich foods count toward hydration.",
      "Scale up for movement, sweat, and heat."
    ]
  },
  {
    id: "hormones-and-mood",
    category: "hormones",
    title: "Your hormones move your mood (and that's the boring truth)",
    summary: "Hormones aren't an excuse and they aren't a flaw. They're how the body runs. Knowing the rhythm helps.",
    readMinutes: 4,
    body: `Every teen body has hormone shifts — daily, weekly, and longer cycles. These move energy, mood, sleep, hunger, and how your skin feels. This is true regardless of your sex, gender, or how you understand your body.

Daily rhythm (everyone): cortisol peaks in the morning to wake you up. Melatonin rises in the evening to wind you down. If you're staring at bright screens late at night, melatonin gets delayed and sleep gets harder. If you're sleeping in until noon on weekends, the morning cortisol surge shifts and Monday gets brutal.

Monthly rhythm: people with menstrual cycles experience a roughly 28-day pattern of estrogen and progesterone. Energy and mood are usually highest in the week after a period and lowest in the few days before the next one. PMS isn't imaginary; it's the hormone drop hitting brain chemistry in real, measurable ways. Tracking the cycle (just noting the days, not optimizing) makes the pattern visible. It also helps you stop blaming yourself for a hard day that was always going to be hard.

Long arc: puberty rearranges a lot of these systems over years. Sleep needs spike, appetite shifts, body composition changes, skin behaves differently. None of these are signs of something wrong; they're signs of growing up. There's wide variation in timing across teens, but ranges that are well outside the typical pediatric onset window (roughly 8–13 for AFAB teens and 9–14 for AMAB teens, per NICHD) are worth bringing to a pediatrician — early or late onset can have specific medical reasons that are addressable.

What Kai never does: diagnose you, prescribe you anything, or tell you something is "off" with your body. If you have specific concerns, a doctor or trusted adult is the right call.`,
    takeaways: [
      "Morning sunlight + protected sleep window helps the daily rhythm.",
      "If you have a cycle, tracking the days makes the pattern obvious — and useful.",
      "PMS is real. Plan less-demanding stuff in the harder week if you can.",
      "Puberty timing varies enormously. Earlier or later than friends is not 'wrong'."
    ]
  },
  {
    id: "body-changes",
    category: "body_changes",
    title: "Body changes: nothing's broken, things are just changing",
    summary: "Acne, weight redistribution, growth pains, voice shifts, body hair — they're all part of the same process.",
    readMinutes: 3,
    body: `During puberty, the body rebuilds itself. Not metaphorically — physically. Skeleton lengthens. Muscles thicken. Skin and hair patterns change. Fat distribution shifts. Vocal cords change shape. All of this is driven by hormones, and all of it is normal.

What's also normal: it doesn't happen evenly. Different parts mature at different speeds. You might shoot up in height before you fill out, or fill out before you stretch up. Hands and feet often grow first, which is why you can feel temporarily clumsy. Mouth full of new adult teeth in a still-small face. Voice cracking. None of this is a flaw in the system.

Acne is the most common one teens worry about. It's hormonal at root — increased oil production plus a layer of new cells the skin is producing. Most cases respond to consistent gentle care (cleanser, moisturizer, sunscreen) and a doctor's input for the persistent kind. Aggressive routines often make it worse.

Body comparison is the thing that makes all of this harder. Social media shows the 1% of bodies that match a narrow aesthetic, edited to look even narrower. Your peers are also still changing — the body you compare to today won't be the same body in six months. Trying to map yourself onto an image is mapping yourself onto a moment, not a destination.

The product never grades your body or tells you what shape you should be. If you have a specific medical worry, a doctor is the right person, not an app.`,
    takeaways: [
      "Different body parts mature at different speeds. Uneven is normal.",
      "Skin changes during puberty are common; gentle care beats aggressive routines.",
      "Social media is a curated 1%, not the population.",
      "Persistent worries deserve a real doctor, not an algorithm."
    ]
  },
  {
    id: "recovery",
    category: "recovery",
    title: "Recovery is not laziness",
    summary: "Rest is when you build. Pushing through is often a way to make less progress, not more.",
    readMinutes: 2,
    body: `Movement breaks tissue down. Sleep, food, and downtime build it back up — usually a little stronger than before. The training adage is "you don't get stronger lifting weights; you get stronger recovering from lifting weights." Same for any sport.

If you train hard six days a week and feel worse at the end of the week than the start, you're under-recovering. The fix is not more discipline. The fix is more sleep, more food, and at least one full rest day. Your performance will go up, not down.

How to tell if you're under-recovering: resting heart rate creeping up, irritability, broken sleep despite tiredness, getting sick more, lifts that used to feel easy now feel heavy, motivation tanking. Two or three of these together is your body raising a hand.

Sore is fine. Sore is the body adapting. Hurt is not fine. Sharp pain, pain in a joint, swelling, pain that doesn't ease up after warming up — these are stop signals. Sore goes away in two days. Hurt sticks around.

Real recovery isn't doing nothing for hours. It's: enough sleep, enough food (especially protein and carbs after hard sessions), water, and not stacking high-intensity work onto a system that's still rebuilding from yesterday.`,
    takeaways: [
      "Sleep and food are training inputs, not optional add-ons.",
      "At least one full rest day per week, even for serious athletes.",
      "Sore vs hurt: sore fades in two days, hurt doesn't. Hurt is a stop signal.",
      "Watch for resting heart rate + irritability + bad sleep — that's the under-recovery flag."
    ]
  },
  {
    id: "fueling-for-growth",
    category: "energy",
    title: "Fueling a body that's still growing",
    summary: "Growing teens need more food, not less. Restriction during growth costs the body real currency it can't get back.",
    readMinutes: 3,
    body: `A teen body that's growing burns through more energy than an adult body of the same size. Not because of metabolism magic — because growing tissue costs energy. New muscle, new bone, new brain wiring all require fuel.

Teens often need meaningfully more food than they did as children, with active teens and athletes higher still. Specific numbers aren't useful here on purpose: targeting calories — especially during growth — is one of the fastest ways to develop a problematic relationship with food.

Here's the rule that actually helps: eat when you're hungry, eat enough that you're not hungry again in 90 minutes, include some protein and some carbs and some fat in most meals, and don't let any single thing become a "bad" food.

What restriction during growth costs you: real height (a body that's malnourished slows down or stops growing — height you'd otherwise get is gone permanently), bone density, period regularity if applicable, mental sharpness, mood stability, immune function. None of this comes back from "willpower". It comes back from food.

If you find yourself thinking about food a lot, weighing yourself often, skipping meals to "earn" later ones, or hiding what you eat — those are signs that the relationship is becoming a problem. Bring it to a trusted adult or a clinician. Kai is not a substitute for that.`,
    takeaways: [
      "Growing teens need more food than adults. That's biology, not a flaw.",
      "Eat when hungry. Include protein + carbs + fat at most meals.",
      "No single food is 'bad' — moralizing food is the problem, not the food.",
      "Persistent food-related thoughts deserve a real conversation with a clinician."
    ]
  }
];

export const BODY_LITERACY_CATEGORY_LABEL: Record<BodyLiteracyCategory, string> = {
  growth: "Growth",
  energy: "Energy",
  hydration: "Hydration",
  hormones: "Hormones",
  body_changes: "Body changes",
  recovery: "Recovery"
};
