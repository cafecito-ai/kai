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
    route: "/mental?module=checkin&action=talk",
    reason: "This sounds like something to get out of your head first."
  },
  food: {
    id: "food",
    label: "Log food",
    route: "/health?module=food&action=food",
    reason: "Fuel might be the easiest body win right now."
  },
  sleep: {
    id: "sleep",
    label: "Protect sleep",
    route: "/health?module=sleep&action=sleep",
    reason: "Recovery is probably the move before more effort."
  },
  stretch: {
    id: "stretch",
    label: "Stretch it out",
    route: "/health?module=stretch&action=stretch",
    reason: "A quick body reset can change the whole mood."
  },
  scan: {
    id: "scan",
    label: "Body scan",
    route: "/health?module=scan&action=scan",
    reason: "Check posture and recovery without judging your body."
  },
  goal: {
    id: "goal",
    label: "Move a goal",
    route: "/goal?action=goal",
    reason: "This needs one clear next step, not more pressure."
  },
  reset: {
    id: "reset",
    label: "Reset today",
    route: "/loop?action=reset",
    reason: "Start smaller. Get steady, then choose."
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
    action: "talk",
    weight: 3,
    words: ["anxious", "anxiety", "stress", "stressed", "sad", "angry", "lonely", "friends", "friend", "confidence", "insecure", "overthinking", "overthink", "behind", "feel", "social", "relationship"]
  },
  {
    action: "reset",
    weight: 3,
    words: ["reset", "spiral", "doomscroll", "scroll", "screen time", "phone", "overwhelmed", "can't", "cant", "stuck", "panic", "breathe"]
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
