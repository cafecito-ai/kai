import { Brain, Camera, HeartPulse, Moon, Sparkles, Target, Utensils, type LucideIcon } from "lucide-react";

export type KaiActionId =
  | "talk"
  | "food"
  | "sleep"
  | "stretch"
  | "scan"
  | "goal"
  | "reset";

export type KaiAction = {
  id: KaiActionId;
  label: string;
  shortLabel: string;
  route: string;
  reason: string;
  prompt: string;
  chip: string;
  example: string;
  tone: string;
  icon: LucideIcon;
};

export const KAI_ACTIONS: Record<KaiActionId, KaiAction> = {
  talk: {
    id: "talk",
    label: "Talk it out",
    shortLabel: "Mind",
    route: "/mental?module=checkin",
    reason: "This sounds like something to get out of your head first.",
    prompt: "I need to talk this out",
    chip: "Talk",
    example: "Something feels off and I need to say it",
    tone: "bg-[#E4F7F4] text-[#218A7D]",
    icon: Brain
  },
  food: {
    id: "food",
    label: "Log food",
    shortLabel: "Food",
    route: "/health?module=food",
    reason: "Fuel might be the easiest body win right now.",
    prompt: "Help me figure out what to eat",
    chip: "Food",
    example: "I have practice later and do not know what to eat",
    tone: "bg-[#FFF0EC] text-[#C86B31]",
    icon: Utensils
  },
  sleep: {
    id: "sleep",
    label: "Protect sleep",
    shortLabel: "Sleep",
    route: "/health?module=movement&action=sleep",
    reason: "Recovery is probably the move before more effort.",
    prompt: "Help me sleep better tonight",
    chip: "Sleep",
    example: "I slept badly and feel tired but wired",
    tone: "bg-[#EEF4FF] text-[#4267C8]",
    icon: Moon
  },
  stretch: {
    id: "stretch",
    label: "Stretch it out",
    shortLabel: "Move",
    route: "/health?module=movement&action=stretch",
    reason: "A quick body reset can change the whole mood.",
    prompt: "Give me a quick stretch reset",
    chip: "Stretch",
    example: "My body feels tight and I need a quick reset",
    tone: "bg-[#EAFBEF] text-[#2E8A54]",
    icon: HeartPulse
  },
  scan: {
    id: "scan",
    label: "Body scan",
    shortLabel: "Scan",
    route: "/health?module=scan",
    reason: "Check posture and recovery without judging your body.",
    prompt: "Help me check my posture",
    chip: "Scan",
    example: "Can we check my posture and what to improve safely?",
    tone: "bg-[#F4F1EB] text-[#1A1A1F]",
    icon: Camera
  },
  goal: {
    id: "goal",
    label: "Move a goal",
    shortLabel: "Goal",
    route: "/engine/potential",
    reason: "This needs one clear next step, not more pressure.",
    prompt: "Help me move one goal forward",
    chip: "Goal",
    example: "I keep procrastinating and need one move",
    tone: "bg-goalsWash text-goals",
    icon: Target
  },
  reset: {
    id: "reset",
    label: "Reset today",
    shortLabel: "Reset",
    route: "/loop",
    reason: "Start smaller. Get steady, then choose.",
    prompt: "I need a reset",
    chip: "Reset",
    example: "I am overwhelmed and need to reset the day",
    tone: "bg-[#EEEAFF] text-[#7B6EF6]",
    icon: Sparkles
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

export function inferKaiAction(text: string): KaiAction {
  const normalized = text.toLowerCase();
  for (const rule of keywordRules) {
    if (rule.words.some((word) => normalized.includes(word))) return KAI_ACTIONS[rule.action];
  }
  return KAI_ACTIONS.talk;
}

export function topKaiActions(): KaiAction[] {
  return [KAI_ACTIONS.talk, KAI_ACTIONS.food, KAI_ACTIONS.goal, KAI_ACTIONS.reset, KAI_ACTIONS.scan, KAI_ACTIONS.sleep, KAI_ACTIONS.stretch];
}

export function kaiPromptChips(): KaiAction[] {
  return [KAI_ACTIONS.talk, KAI_ACTIONS.food, KAI_ACTIONS.sleep, KAI_ACTIONS.stretch, KAI_ACTIONS.goal, KAI_ACTIONS.reset];
}
