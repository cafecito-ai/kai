/**
 * Teen nutrition primer. Companion content to BodyLiteracy (PR #33) but
 * focused specifically on food: meal timing, snacks, pre/post-sport,
 * hunger cues, common myths. Reuses the same article shape as
 * body-literacy.ts so the components can share patterns.
 *
 * Voice rules per spec Section 6 Physical engine — strict:
 *   - Never moralize food. No "good" or "bad" food.
 *   - Never quote calorie targets.
 *   - Never encourage restriction during growth.
 *   - Never push specific supplements or weight-loss aids.
 *   - Never frame food as something to "earn."
 *   - Hunger and fullness are information. Trust them.
 *   - Persistent food-related thoughts → direct to a clinician.
 */

export type NutritionCategory = "fuel" | "meals" | "sport_fueling" | "intuitive" | "myths" | "emotional";

export type NutritionArticle = {
  id: string;
  category: NutritionCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const NUTRITION_ARTICLES: ReadonlyArray<NutritionArticle> = [
  {
    id: "food-as-fuel",
    category: "fuel",
    title: "Food is information, not morality",
    summary: "A cookie is not a moral failure and a salad is not a virtue. Both are inputs.",
    readMinutes: 2,
    body: `One of the most useful shifts a teen can make about food is to stop ranking foods on a moral scale. There is no "good food" and no "bad food." There's food that fuels you well right now, and food that fuels you less well right now, and that's it.

Diet culture trains everyone — adults and teens — to feel guilt or pride about eating. That guilt does not improve health. The research is pretty clear: the more people moralize food, the worse their relationship with eating tends to become.

What actually matters is the pattern over weeks, not the rating of any single meal. A teen body that gets enough total food, enough variety, and enough specific nutrients (protein, fat, fiber, iron, calcium for now) will be fine. The exact composition of any given meal almost never matters as much as the conversation about it.

The product never grades your meal. When you log a fuel note, it captures what happened and how it felt. That's the data. The "should have" version of the meal is not.`,
    takeaways: [
      "No food is morally good or bad — that framing causes harm.",
      "The pattern over weeks matters; the single meal almost never does.",
      "Trust the basics: enough total food, enough variety, enough protein/fat/fiber/iron/calcium.",
      "If food carries guilt or pride, that's a sign the relationship needs attention — not the food itself."
    ]
  },
  {
    id: "breakfast-actually-matters",
    category: "meals",
    title: "Breakfast actually matters (but not the way ads claim)",
    summary: "Eating in the first 1-2 hours after waking helps focus, mood, and energy. The 'most important meal' is hype; consistent fueling is the actual point.",
    readMinutes: 2,
    body: `Old health-class lessons made breakfast sound magical. It's not. What's actually happening: after 8-10 hours of sleep, your blood sugar and energy stores are low. Putting food in early-ish refills the tank for the morning.

Teens who skip breakfast tend to have worse focus, worse mood by mid-morning, and to overeat later — not because of metabolism slowdown (that's a myth), but because by lunch they're so hungry that decision-making goes out the window.

What "breakfast" means is flexible. A real meal is great. A piece of toast with peanut butter and a banana is fine. Yogurt with some granola is fine. Yesterday's leftovers are fine. Cereal is fine. There's no shape this has to take.

If you genuinely can't eat right when you wake up (some teens have a small morning hunger window), bring something to eat in the first class or on the way to school. That counts.`,
    takeaways: [
      "Eat in the first 1-2 hours after waking, even if small.",
      "Skipping breakfast doesn't 'save' anything — you'll overeat or crash later.",
      "Breakfast can be anything edible. Leftovers and 'unconventional' breakfast count.",
      "If mornings are rough, pack something portable."
    ]
  },
  {
    id: "snacks-are-meals",
    category: "meals",
    title: "Snacks are meals, smaller",
    summary: "Snacks aren't cheating or extra. Most teens need food every 3-4 hours; snacks fill the gap.",
    readMinutes: 2,
    body: `Adults who diet sometimes treat snacks as morally suspect — extra eating, willpower failures. For a growing teen, that framing is broken. Your body is bigger, more active, and more metabolically demanding than an adult body of similar size. You need food more often, not less.

A practical pattern: real meal every 4-5 hours, snack between if you're hungry. That works out to breakfast → snack → lunch → snack → dinner for most school days, plus maybe something after homework or practice.

A snack that actually does its job has two of these three: protein, fat, fiber. Just sugar gets you a quick spike and a fast crash; the others slow that down. Examples: apple + peanut butter, cheese stick + crackers, hummus + carrots, yogurt + nuts, leftovers in smaller form. Granola bar is fine; "100% sugar" gummies less so as a daily move.

If you keep getting "hungry but no time" — pack snacks. Future-you saves present-you's afternoon.`,
    takeaways: [
      "Hungry between meals is normal — eat.",
      "A good snack has protein + fat or protein + fiber, not just sugar.",
      "Pack ahead. Hungry-at-school is a setup, not a moral test.",
      "Snacking on a growing body is fueling, not cheating."
    ]
  },
  {
    id: "pre-post-sport",
    category: "sport_fueling",
    title: "Pre- and post-sport fueling without the supplement aisle",
    summary: "Real food works. You don't need pre-workout powder or recovery shakes — you need timing and a snack.",
    readMinutes: 3,
    body: `If you play a sport or train hard, your fueling timing matters more than your specific food choices. Here's the working version of what actually helps.

Before practice (60-90 min out): something with carbs and a little protein. Banana + peanut butter. Toast + cheese. Yogurt + granola. Aim for an amount that sits well — too much food too close to game time will make you sluggish; too little and you'll bonk. You'll learn your own dose.

If you can only eat 15 minutes before, go simple carb only — fruit, a small bar, a few crackers. Not a full meal.

After practice (within 30-60 min): something with both carbs and protein, similar size. Chocolate milk is actually one of the better recovery snacks (cheap, has both, hydration). A turkey sandwich works. A bowl of cereal with milk. A real dinner if practice is right before dinner.

The supplement-industry version of this — pre-workout powders, recovery shakes, BCAAs, electrolyte pre-mix — is marketing to adults, and most of it adds nothing for teens beyond what real food gives you. Water is your most important sport supplement.

Hydration: extra water on practice days. If practice is long or hot, add some electrolytes (a sports drink in the half-strength version works fine).`,
    takeaways: [
      "Pre-practice: carbs + a little protein, 60-90 min out.",
      "Post-practice: carbs + protein within an hour. Chocolate milk is a real option.",
      "Real food beats supplement-aisle products for teens.",
      "Hydration is your most important 'supplement' — water plus electrolytes for long/hot sessions."
    ]
  },
  {
    id: "hunger-and-fullness",
    category: "intuitive",
    title: "Reading your own hunger and fullness",
    summary: "Hunger and fullness cues are real data. Tracking apps will tell you when to eat; your body tells you better, if you listen.",
    readMinutes: 3,
    body: `Apps and meal plans try to externalize hunger — eat at this time, in this amount, of this food. For most healthy teens, that pattern slowly disconnects you from the cues your body sends naturally, which then makes things harder long-term.

The cues are real. Stomach growling is one signal. Energy dipping, brain getting fuzzy, slight irritability — all hunger signals that often arrive before the growl. Fullness cues are subtler: less interest in the food, taste flattening, a sense of "I could stop here."

A practical scale teens find useful: 0 = empty/painfully hungry, 5 = neutral, 10 = uncomfortably full. Try to eat when you're around 3-4, and stop when you're around 6-7. That's a rough working range — not a rule, not a target.

What disrupts these cues: chronic dieting, eating while distracted (phone, TV), labeling foods as forbidden (forbidden foods become loud), and ignoring hunger for hours then over-correcting later.

What restores them: eating without phone (some of the time, anyway), sitting down to eat (some of the time), giving yourself permission to have any food (paradoxically calms the urge), and paying attention to how you feel an hour or two after.`,
    takeaways: [
      "Hunger cues come before the growl: energy dip, fuzzy thinking, irritability.",
      "Eat at 3-4 on a 0-10 hunger scale; stop at 6-7.",
      "Chronic dieting and food labeling break these cues over time.",
      "Some meals without a phone help you re-tune."
    ]
  },
  {
    id: "diet-myths",
    category: "myths",
    title: "Common food myths teens should ignore",
    summary: "Carbs aren't the enemy. Eating at night doesn't make food more fattening. Detox cleanses aren't a thing.",
    readMinutes: 3,
    body: `Some food beliefs floating around — especially on social media — are not just wrong, they're harmful for growing teens. A short list:

"Carbs make you gain weight." False. Carbs are your brain's preferred fuel and your muscles' primary fuel for any intense activity. Growing teens often need more carbs than adults realize.

"Eating after 8pm makes food more fattening." False. Total intake over time matters; the clock doesn't change calorie math. If you're hungry at 9pm, eat.

"Fat makes you fat." False. Dietary fat is essential — for hormones, brain development, vitamin absorption (A, D, E, K). The teen brain is roughly 60% fat by dry weight. Don't fear it.

"Detox teas / juice cleanses fix your body." False. Your liver and kidneys already detoxify you 24/7. Cleanse products mostly just dehydrate you and sometimes contain laxatives. They are not medicine.

"Skipping meals is willpower." False. Skipping meals during growth costs height, bone density, hormonal regulation, and mental focus. There is no metabolic upside to under-eating during teen years.

"You need supplements to be healthy." Mostly false. Most teens eating roughly varied food get what they need. Specific exceptions (vitamin D in low-sun climates, iron for menstruating teens with low intake) deserve a conversation with a doctor — not a TikTok protocol.

If something on social media tells you a food group is poison or that a supplement will transform you, that's marketing, not health information.`,
    takeaways: [
      "Carbs and fat are both essential — fearing food groups backfires.",
      "Detox cleanses are marketing. Your liver does the work.",
      "Skipping meals during growth costs real currency.",
      "Supplement advice belongs to doctors, not TikTok."
    ]
  },
  {
    id: "eating-around-feelings",
    category: "emotional",
    title: "Eating around feelings",
    summary: "Eating when you're sad, stressed, or bored is human. It only becomes a problem when it's the only tool you have.",
    readMinutes: 3,
    body: `Sometimes you eat because you're hungry. Sometimes you eat because something feels hard, or boring, or numb, and food gives you a quick mood shift. That's not a moral failure. Human beings have used food for comfort for as long as there's been food. The wedding cake, the birthday cake, the bad-day pint of ice cream — these are part of how culture works.

Where it becomes a pattern worth noticing: when food is the only tool you have for hard feelings, or when eating-when-not-hungry happens daily, or when it's followed by guilt or hiding. None of those mean you're broken. They mean the system needs more tools.

Some other tools that help with the same feelings food was trying to handle:
- Sad / lonely → talking to someone, even briefly. Walk + call.
- Bored → a small, doable thing. Music, a stretch, a tiny project.
- Stressed → breath. The 4-7-8 pattern lives in the Mental engine.
- Numb / dissociated → cold water on the face, a few jumping jacks, anything that brings the body back online.
- Tired → real rest, not "I'll just eat to get through the next hour."

What this is NOT: a rule against ever eating for comfort. Comfort eating in small doses is fine and human. The work is on having more than one option in the toolbox.

If food has started feeling out of your control — bingeing, hiding what you eat, dread around meals, ritualized weighing of yourself — that's the moment to bring it to a trusted adult or a clinician. Kai is not a substitute for that.`,
    takeaways: [
      "Eating for comfort sometimes is human; eating for comfort always is a signal.",
      "Match the tool to the feeling — boredom and stress and sadness all have non-food responses.",
      "Comfort eating is not the issue; lack of other tools is.",
      "Loss of control around food deserves a real conversation with a clinician — not an app."
    ]
  }
];

export const NUTRITION_CATEGORY_LABEL: Record<NutritionCategory, string> = {
  fuel: "Fuel",
  meals: "Meals",
  sport_fueling: "Sport fueling",
  intuitive: "Reading your body",
  myths: "Myths",
  emotional: "Feelings + food"
};
