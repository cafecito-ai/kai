export type KaiActionId =
  | "talk"
  | "food"
  | "sleep"
  | "stretch"
  | "scan"
  | "goal"
  | "reset";

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
    route: "/mental?module=checkin",
    reason: "This sounds like something to get out of your head first."
  },
  food: {
    id: "food",
    label: "Log food",
    route: "/health?module=food",
    reason: "Fuel might be the easiest body win right now."
  },
  sleep: {
    id: "sleep",
    label: "Protect sleep",
    route: "/health?module=movement&action=sleep",
    reason: "Recovery is probably the move before more effort."
  },
  stretch: {
    id: "stretch",
    label: "Stretch it out",
    route: "/health?module=movement&action=stretch",
    reason: "A quick body reset can change the whole mood."
  },
  scan: {
    id: "scan",
    label: "Body scan",
    route: "/health?module=scan",
    reason: "Check posture and recovery without judging your body."
  },
  goal: {
    id: "goal",
    label: "Move a goal",
    route: "/engine/potential",
    reason: "This needs one clear next step, not more pressure."
  },
  reset: {
    id: "reset",
    label: "Reset today",
    route: "/loop",
    reason: "Start smaller. Get steady, then choose."
  }
};

const keywordRules: Array<{ action: KaiActionId; words: string[] }> = [
  {
    action: "food",
    words: ["food", "eat", "eating", "meal", "hungry", "protein", "calories", "snack", "breakfast", "lunch", "dinner", "fuel"]
  },
  {
    action: "sleep",
    words: ["sleep", "tired", "exhausted", "bed", "woke", "wired", "recovery", "nap", "insomnia"]
  },
  {
    action: "stretch",
    words: ["stretch", "tight", "sore", "mobility", "move", "movement", "stiff", "back hurts", "neck hurts", "posture"]
  },
  {
    action: "scan",
    words: ["scan", "body scan", "posture", "alignment", "physique", "form", "camera", "imbalance"]
  },
  {
    action: "goal",
    words: ["goal", "lock in", "discipline", "habit", "study", "school", "practice", "workout", "business", "create", "finish", "procrastinate"]
  },
  {
    action: "talk",
    words: ["anxious", "anxiety", "stress", "stressed", "sad", "angry", "lonely", "friends", "confidence", "overthinking", "overthink", "behind", "feel"]
  },
  {
    action: "reset",
    words: ["reset", "spiral", "doomscroll", "scroll", "overwhelmed", "can't", "cant", "stuck", "panic", "breathe"]
  }
];

export function inferKaiNextAction(text: string): KaiNextAction {
  const normalized = text.toLowerCase();
  for (const rule of keywordRules) {
    if (rule.words.some((word) => normalized.includes(word))) return KAI_NEXT_ACTIONS[rule.action];
  }
  return KAI_NEXT_ACTIONS.talk;
}
