export type KaiActionId =
  | "talk"
  | "food"
  | "sleep"
  | "stretch"
  | "scan"
  | "goal"
  | "reset"
  | "confidence"
  | "social"
  | "screen";

export type KaiNextAction = {
  id: KaiActionId;
  label: string;
  route: string;
  reason: string;
};

export const KAI_NEXT_ACTIONS: Record<KaiActionId, KaiNextAction> = {
  talk: {
    id: "talk",
    label: "Talk it out",
    route: "/task/talk",
    reason: "This sounds like something to get out of your head first."
  },
  food: {
    id: "food",
    label: "Log food",
    route: "/task/food",
    reason: "Fuel might be the easiest body win right now."
  },
  sleep: {
    id: "sleep",
    label: "Protect sleep",
    route: "/task/sleep",
    reason: "Recovery is probably the move before more effort."
  },
  stretch: {
    id: "stretch",
    label: "Stretch it out",
    route: "/task/stretch",
    reason: "A quick body reset can change the whole mood."
  },
  scan: {
    id: "scan",
    label: "Body scan",
    route: "/task/scan",
    reason: "Check posture and recovery without judging your body."
  },
  goal: {
    id: "goal",
    label: "Move a goal",
    route: "/task/goal",
    reason: "This needs one clear next step, not more pressure."
  },
  reset: {
    id: "reset",
    label: "Reset today",
    route: "/task/reset",
    reason: "Start smaller. Get steady, then choose."
  },
  confidence: {
    id: "confidence",
    label: "Build confidence",
    route: "/task/confidence",
    reason: "Confidence needs proof you can repeat, not fake hype."
  },
  social: {
    id: "social",
    label: "Handle social pressure",
    route: "/task/social",
    reason: "This needs context, a boundary, and one calm move."
  },
  screen: {
    id: "screen",
    label: "Reset screen time",
    route: "/task/screen",
    reason: "Protect attention for the next hour without guilt."
  }
};

const keywordRules: Array<{ action: KaiActionId; words: string[]; weight?: number }> = [
  {
    action: "scan",
    weight: 5,
    words: ["body scan", "scan my body", "check my posture", "posture check", "alignment", "physique", "form check", "camera", "imbalance", "uneven"]
  },
  {
    action: "stretch",
    weight: 4,
    words: ["stretch", "tight", "sore", "mobility", "stiff", "back hurts", "neck hurts", "hips", "shoulders", "warm up", "cool down"]
  },
  {
    action: "food",
    weight: 4,
    words: ["food", "eat", "eating", "meal", "hungry", "protein", "calories", "snack", "breakfast", "lunch", "dinner", "fuel", "pre practice", "after practice"]
  },
  {
    action: "sleep",
    weight: 4,
    words: ["sleep", "tired", "exhausted", "bed", "woke", "wired", "recovery", "nap", "insomnia", "can't sleep", "cant sleep"]
  },
  {
    action: "goal",
    weight: 3,
    words: ["goal", "lock in", "discipline", "habit", "study", "school", "homework", "practice", "workout", "business", "create", "finish", "procrastinate", "procrastinating", "assignment", "test"]
  },
  {
    action: "confidence",
    weight: 5,
    words: ["confidence", "confident", "insecure", "self worth", "self-worth", "self respect", "self-respect", "believe in myself", "hard on myself", "shrinking myself", "not good enough"]
  },
  {
    action: "social",
    weight: 5,
    words: ["lonely", "loneliness", "friends", "friend", "social", "relationship", "left out", "rejected", "drama", "group chat", "people judging", "awkward", "fitting in"]
  },
  {
    action: "screen",
    weight: 5,
    words: ["doomscroll", "doomscrolling", "scroll", "scrolling", "screen time", "phone", "tiktok", "instagram", "snapchat", "social media", "comparing myself", "comparison", "notifications"]
  },
  {
    action: "talk",
    weight: 3,
    words: ["anxious", "anxiety", "stress", "stressed", "sad", "depressed", "depression", "empty", "numb", "hopeless", "lonely", "angry", "overthinking", "overthink", "behind", "feel"]
  },
  {
    action: "reset",
    weight: 3,
    words: ["reset", "spiral", "overwhelmed", "can't", "cant", "stuck", "panic", "breathe"]
  }
];

export function inferKaiNextAction(text: string): KaiNextAction {
  const normalized = text.toLowerCase();
  let best: { action: KaiActionId; score: number } | null = null;
  for (const rule of keywordRules) {
    const matches = rule.words.filter((word) => normalized.includes(word)).length;
    if (!matches) continue;
    const score = matches * (rule.weight ?? 1);
    if (!best || score > best.score) best = { action: rule.action, score };
  }
  return best ? KAI_NEXT_ACTIONS[best.action] : KAI_NEXT_ACTIONS.talk;
}
