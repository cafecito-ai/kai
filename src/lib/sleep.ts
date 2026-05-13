/**
 * Teen sleep guides. Different shape from workouts/stretches: instead of a
 * single timer driving every segment, wind-down routines mix active
 * (stretch 45s) with passive (read for 10 min, no phone) steps. The player
 * still moves linearly; the teen taps "Done" on the passive steps.
 *
 * Sleep-hygiene tips are short readable copy, not interactive content.
 *
 * Voice rules per spec Section 6 Physical engine:
 *   - Sleep as non-negotiable infrastructure (not optional, not optimization).
 *   - No "biohacking", no shame about screen time, no stack-of-supplements.
 *   - Teen sleep need (~8-10 hrs) is named directly; this is one of the
 *     few places where the product makes a flat factual claim.
 */

export type SleepStepKind = "timed" | "do";

export type SleepStep = {
  name: string;
  cue: string;
  kind: SleepStepKind;
  /** Required for timed steps. Ignored for "do" steps (user taps Done). */
  durationSeconds?: number;
};

export type SleepCategory = "quick" | "standard" | "extended" | "last_resort";

export type WindDownRoutine = {
  id: string;
  name: string;
  category: SleepCategory;
  totalMinutes: number;
  description: string;
  setup: string;
  steps: ReadonlyArray<SleepStep>;
};

/** Lower bound from American Academy of Sleep Medicine for teens 13-18. */
export const TEEN_SLEEP_HOURS = { min: 8, max: 10 } as const;

export function windDownRoutineDurationSeconds(routine: WindDownRoutine): number {
  return routine.steps.reduce((sum, step) => {
    if (step.kind === "timed") return sum + (step.durationSeconds ?? 0);
    // "do" steps have no enforced length — assume 60s for ratio checks.
    return sum + 60;
  }, 0);
}

export const WIND_DOWN_ROUTINES: ReadonlyArray<WindDownRoutine> = [
  {
    id: "last-resort-10",
    name: "Last-resort (10 min)",
    category: "last_resort",
    totalMinutes: 10,
    description: "When you should have been asleep an hour ago. Short, blunt, no productivity vibes.",
    setup: "In or near bed. Lights dim or off.",
    steps: [
      { name: "Phone face-down, away from bed", cue: "Across the room ideally. Plug it in over there.", kind: "do" },
      { name: "Bathroom and water", cue: "Don't skip — waking up at 3am thirsty resets you.", kind: "do" },
      { name: "Three slow breaths in bed", cue: "Inhale 4. Exhale 6. Three rounds.", kind: "timed", durationSeconds: 45 },
      { name: "Body scan, head to toes", cue: "Notice each part. Soften it. Don't fix anything.", kind: "timed", durationSeconds: 180 },
      { name: "If still awake, label thoughts", cue: "Each thought, just say 'thinking' in your head, then let it pass.", kind: "timed", durationSeconds: 180 }
    ]
  },
  {
    id: "quick-15",
    name: "Quick 15",
    category: "quick",
    totalMinutes: 15,
    description: "Fast wind-down for nights when you're already tired and the body is cooperating.",
    setup: "Bedroom door closed if you can. Toothbrush ready.",
    steps: [
      { name: "Lower screen brightness", cue: "Phone, laptop, TV. As dim as you can read without straining.", kind: "do" },
      { name: "Brush teeth + skin care", cue: "Whatever your version of it is. Slow movements, not rushed.", kind: "do" },
      { name: "Lay out tomorrow", cue: "Clothes, bag, charger. Future-you owes present-you.", kind: "do" },
      { name: "Lights low + phone away", cue: "Phone across the room. Bed light only.", kind: "do" },
      { name: "Two short stretches", cue: "Knees to chest, then reclined twist each side. 30s each.", kind: "timed", durationSeconds: 120 },
      { name: "Lights out + three breaths", cue: "Inhale 4, exhale 6. Three slow rounds. Eyes closed.", kind: "timed", durationSeconds: 60 }
    ]
  },
  {
    id: "standard-30",
    name: "Standard 30",
    category: "standard",
    totalMinutes: 30,
    description: "The recommended baseline. Pick this for school nights when nothing's urgent.",
    setup: "Roughly 30 min before your target sleep time.",
    steps: [
      { name: "Screens dim, last quick check", cue: "Any final reply that has to happen tonight. Brief.", kind: "timed", durationSeconds: 180 },
      { name: "Tidy your immediate space", cue: "Three things off the floor. Don't deep-clean.", kind: "timed", durationSeconds: 180 },
      { name: "Shower or face wash", cue: "Warm water cools the body afterward — that's the point.", kind: "do" },
      { name: "Lay out tomorrow", cue: "Clothes, bag, water bottle. Charger in its spot.", kind: "do" },
      { name: "Phone across the room", cue: "Plug it in. Bedroom is for sleep.", kind: "do" },
      { name: "Read or quiet thing for 10 min", cue: "Book, journal, slow music. No scroll. No autoplay.", kind: "timed", durationSeconds: 600 },
      { name: "Bed: knees-to-chest stretch", cue: "Pull both knees in. Hold 30s. Soft jaw.", kind: "timed", durationSeconds: 45 },
      { name: "Reclined twist (each side)", cue: "Knees over right, then left. 30s each. Two long breaths each.", kind: "timed", durationSeconds: 60 },
      { name: "Lights out + slow breath", cue: "Inhale 4, exhale 6. Until you stop counting.", kind: "timed", durationSeconds: 90 }
    ]
  },
  {
    id: "racing-brain-60",
    name: "Racing brain (60 min)",
    category: "extended",
    totalMinutes: 60,
    description: "For nights when you can't stop thinking. Longer, with a writing step so the loop has somewhere to land.",
    setup: "Start about an hour before sleep. Notebook and pen by the bed.",
    steps: [
      { name: "Screens dim, last quick check", cue: "5 min cap. Done before lights start changing.", kind: "timed", durationSeconds: 300 },
      { name: "Notebook brain dump", cue: "Write everything that's on your mind. Bullet points. Misspellings welcome.", kind: "timed", durationSeconds: 600 },
      { name: "Tomorrow's top three", cue: "Pick three things from the list that matter most. Star them.", kind: "timed", durationSeconds: 120 },
      { name: "Close the notebook", cue: "Put it down. Tomorrow's version of you takes it from here.", kind: "do" },
      { name: "Shower or face wash", cue: "Warm water. Slower than usual.", kind: "do" },
      { name: "Stretching: 8-minute floor flow", cue: "Knees to chest, twists, hamstring opener, child's pose. Slow.", kind: "timed", durationSeconds: 480 },
      { name: "Phone across the room", cue: "Plug it in. Out of arm's reach.", kind: "do" },
      { name: "Read for 15 min", cue: "Paper book if you have one. Fiction beats news.", kind: "timed", durationSeconds: 900 },
      { name: "Lights out + 4-7-8 breathing", cue: "Inhale 4, hold 7, exhale 8. Four rounds. Slow.", kind: "timed", durationSeconds: 180 },
      { name: "Body scan", cue: "Head to toes. Notice each part. Don't change anything.", kind: "timed", durationSeconds: 360 }
    ]
  }
];

export const SLEEP_CATEGORY_LABEL: Record<SleepCategory, string> = {
  last_resort: "Last resort",
  quick: "Quick wind-down",
  standard: "Standard",
  extended: "Extended"
};

export type SleepTip = {
  id: string;
  title: string;
  body: string;
};

/**
 * Sleep hygiene tips in teen-current language. Each is short enough to
 * read in one breath. No medical recommendations, no supplement advice.
 */
export const SLEEP_TIPS: ReadonlyArray<SleepTip> = [
  {
    id: "teen-need",
    title: "Teens actually need 8-10 hours",
    body: "This isn't optimization — it's the floor. Below 8 hours regularly affects mood, attention, immune response, and sport performance. Pick a wake time, count backward."
  },
  {
    id: "caffeine-cutoff",
    title: "Caffeine cutoff is earlier than you think",
    body: "Half of the caffeine in your 3pm coffee is still in you at 9pm. Energy drinks and pre-workout carry more than most coffee. Plan accordingly."
  },
  {
    id: "phone-away",
    title: "Phone away from bed, brightness all the way down",
    body: "Not because of magical blue light — because if it's by your bed, you'll check it. Across-the-room beats nightstand. Brightness low gives the body the dim cue."
  },
  {
    id: "cool-room",
    title: "Cool room, warm body",
    body: "Sleep wants core body temp to drop. Shower 60 min before, sleep with a window cracked or low thermostat. Warm shower into cool room is the cheat code."
  },
  {
    id: "rhythm",
    title: "Same bedtime ±30 min, even weekends",
    body: "Sleeping in on weekends jet-lags you on Monday. Hold the window within an hour of weekday timing if you can. Naps fill the rest."
  },
  {
    id: "twenty-minute-rule",
    title: "If you can't sleep in 20 min, get up",
    body: "Out of bed. Different room if possible. Read something boring under low light until you feel sleepy. Bed = sleep, not lying-awake-anxious."
  },
  {
    id: "naps",
    title: "Naps are fine if you keep them short",
    body: "Under 25 minutes refreshes without making you groggy. Over 45 minutes drops you into deep sleep and wrecks the night. Set an alarm."
  },
  {
    id: "late-workout",
    title: "Late workouts are fine — until the last hour",
    body: "Movement earlier in the day improves sleep quality. Intense work in the hour before bed pushes core temp up exactly when you need it down."
  }
];
