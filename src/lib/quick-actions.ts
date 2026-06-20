// quick-actions — the Home "talk to KAI" shortcuts (Can't Sleep, Feeling
// Stressed, Need Motivation, Need a Workout, Low Energy).
//
// Tapping one opens a BRAND-NEW chat (never continues an old thread) where KAI
// opens by understanding first — it asks what's actually going on before giving
// advice, and offers a few tappable causes to guide the user there. The cause
// chips each send a complete first-person message, so the fresh conversation is
// self-contained on the server (the opener is shown client-side, instantly, so
// it never depends on a model call landing).
//
// Data only — no React — so the openers/causes are unit-testable and the voice
// lives in one place.

export type QuickActionTopic =
  | "sleep"
  | "stress"
  | "motivation"
  | "workout"
  | "energy";

export interface QuickActionCause {
  /** Short label on the tappable chip. */
  label: string;
  /** Full first-person message sent to KAI when the chip is tapped. */
  message: string;
}

export interface QuickAction {
  topic: QuickActionTopic;
  /** Button label on Home. */
  label: string;
  /** KAI's understand-first opening line (shown immediately, no model call). */
  opener: string;
  /** A few likely causes to guide the user before advice. */
  causes: QuickActionCause[];
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    topic: "sleep",
    label: "Can't Sleep",
    opener:
      "Can't sleep? Yeah, that's the worst — lying there while your brain won't quit. I've got stuff that actually works, but it depends on what's going on. What's keeping you up?",
    causes: [
      { label: "My mind's racing", message: "I can't sleep — my mind won't stop racing." },
      { label: "I'm stressed", message: "I can't sleep because I'm stressed about something." },
      { label: "I feel anxious", message: "I can't sleep, I feel anxious and can't settle down." },
      { label: "Caffeine too late", message: "I think I can't sleep because I had caffeine too late." },
      { label: "Schedule's a mess", message: "I can't sleep, my sleep schedule is all over the place." },
    ],
  },
  {
    topic: "stress",
    label: "Feeling Stressed",
    opener:
      "Stress is loud — I hear you. Before I start throwing fixes at you, I want to actually get what's behind it. What's stressing you out the most right now?",
    causes: [
      { label: "School / grades", message: "I'm stressed about school and my grades." },
      { label: "Someone in my life", message: "I'm stressed about someone in my life." },
      { label: "Too much on my plate", message: "I'm stressed, I've got way too much on my plate." },
      { label: "Can't pin it down", message: "I'm stressed and I can't even pin down why — just on edge." },
    ],
  },
  {
    topic: "motivation",
    label: "Need Motivation",
    opener:
      "Motivation's running low — happens to everyone, even the people who look unstoppable. Let's find the real reason before I push you. What's it feeling like?",
    causes: [
      { label: "Can't get started", message: "I have no motivation, I just can't get myself started." },
      { label: "Burned out", message: "I'm not motivated, I think I'm kind of burned out." },
      { label: "Don't see the point", message: "I'm unmotivated, I don't really see the point lately." },
      { label: "Keep getting distracted", message: "I can't stay motivated, I keep getting distracted." },
    ],
  },
  {
    topic: "workout",
    label: "Need a Workout",
    opener:
      "Let's get you moving. Quick read first so I aim this right — where are you at today?",
    causes: [
      { label: "I've got a gym", message: "I want a workout — I have access to a full gym." },
      { label: "Just home stuff", message: "I want a workout I can do at home with no equipment." },
      { label: "Low on time", message: "I want a quick workout, I'm short on time today." },
      { label: "Low energy today", message: "I want to work out but my energy is low today." },
    ],
  },
  {
    topic: "energy",
    label: "Low Energy",
    opener:
      "Running on empty, huh? Before I just tell you to go for a walk, I want to figure out why the tank's low. What's today been like?",
    causes: [
      { label: "Barely slept", message: "My energy's low, I barely slept." },
      { label: "Haven't eaten well", message: "My energy's low and I haven't really eaten well today." },
      { label: "Stressed / drained", message: "My energy's low, I feel mentally drained and stressed." },
      { label: "Sat around all day", message: "My energy's low, I've been sitting around all day." },
    ],
  },
];

/** Look up a quick action by topic. Returns undefined for anything unknown
 *  (e.g. stale navigation state) so callers fall back to a normal chat. */
export function getQuickAction(topic: unknown): QuickAction | undefined {
  if (typeof topic !== "string") return undefined;
  return QUICK_ACTIONS.find((a) => a.topic === topic);
}
