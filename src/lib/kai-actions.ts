import { Brain, Camera, HeartPulse, Moon, Sparkles, Smartphone, Target, Trophy, UsersRound, Utensils, type LucideIcon } from "lucide-react";

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

type PromptSource = "read" | "recent" | "default";

export type KaiPromptChip = {
  label: string;
  prompt: string;
  icon: LucideIcon;
  actionId: KaiActionId;
  source: PromptSource;
};

type PromptMessage = {
  role: "user" | "assistant" | string;
  content: string;
};

export const KAI_ACTIONS: Record<KaiActionId, KaiAction> = {
  talk: {
    id: "talk",
    label: "Talk it out",
    shortLabel: "Mind",
    route: "/mental?module=checkin&action=talk",
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
    route: "/health?module=food&action=food",
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
    route: "/health?module=sleep&action=sleep",
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
    route: "/health?module=stretch&action=stretch",
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
    route: "/health?module=scan&action=scan",
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
    route: "/goal?action=goal",
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
    route: "/loop?action=reset",
    reason: "Start smaller. Get steady, then choose.",
    prompt: "I need a reset",
    chip: "Reset",
    example: "I am overwhelmed and need to reset the day",
    tone: "bg-[#EEEAFF] text-[#7B6EF6]",
    icon: Sparkles
  },
  confidence: {
    id: "confidence",
    label: "Build confidence",
    shortLabel: "Confidence",
    route: "/mental?module=purpose&action=confidence",
    reason: "Confidence needs proof you can repeat, not fake hype.",
    prompt: "Help me feel more confident",
    chip: "Confidence",
    example: "I feel insecure and keep shrinking myself",
    tone: "bg-[#FFF7D6] text-[#9A6A00]",
    icon: Trophy
  },
  social: {
    id: "social",
    label: "Handle social pressure",
    shortLabel: "Social",
    route: "/mental?module=checkin&action=social",
    reason: "This needs context, a boundary, and one calm move.",
    prompt: "Help me handle social pressure",
    chip: "Social",
    example: "The group chat made me feel left out",
    tone: "bg-[#E4F7F4] text-[#218A7D]",
    icon: UsersRound
  },
  screen: {
    id: "screen",
    label: "Reset screen time",
    shortLabel: "Screen",
    route: "/mental?module=reset&action=screen",
    reason: "Protect attention for the next hour without guilt.",
    prompt: "Help me stop scrolling",
    chip: "Screen",
    example: "I keep doomscrolling and comparing myself",
    tone: "bg-[#EEEAFF] text-[#7B6EF6]",
    icon: Smartphone
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
    words: ["anxious", "anxiety", "stress", "stressed", "sad", "angry", "overthinking", "overthink", "behind", "feel"]
  },
  {
    action: "reset",
    weight: 3,
    words: ["reset", "spiral", "overwhelmed", "can't", "cant", "stuck", "panic", "breathe"]
  }
];

export function inferKaiAction(text: string): KaiAction {
  const normalized = text.toLowerCase();
  let best: { action: KaiActionId; score: number } | null = null;
  for (const rule of keywordRules) {
    const matches = rule.words.filter((word) => normalized.includes(word)).length;
    if (!matches) continue;
    const score = matches * (rule.weight ?? 1);
    if (!best || score > best.score) best = { action: rule.action, score };
  }
  return best ? KAI_ACTIONS[best.action] : KAI_ACTIONS.talk;
}

export function topKaiActions(): KaiAction[] {
  return [KAI_ACTIONS.talk, KAI_ACTIONS.food, KAI_ACTIONS.goal, KAI_ACTIONS.reset, KAI_ACTIONS.scan, KAI_ACTIONS.sleep, KAI_ACTIONS.stretch, KAI_ACTIONS.confidence, KAI_ACTIONS.social, KAI_ACTIONS.screen];
}

export function kaiPromptChips(): KaiAction[] {
  return [KAI_ACTIONS.talk, KAI_ACTIONS.confidence, KAI_ACTIONS.social, KAI_ACTIONS.screen, KAI_ACTIONS.food, KAI_ACTIONS.sleep, KAI_ACTIONS.stretch, KAI_ACTIONS.goal];
}

export function buildKaiPromptChips({
  messages,
  nextAction,
  mentalOnly = false,
  limit = 6
}: {
  messages: PromptMessage[];
  nextAction?: KaiAction | null;
  mentalOnly?: boolean;
  limit?: number;
}): KaiPromptChip[] {
  const ordered: KaiPromptChip[] = [];
  const used = new Set<KaiActionId>();

  const add = (action: KaiAction, source: PromptSource) => {
    if (used.has(action.id)) return;
    used.add(action.id);
    ordered.push({
      actionId: action.id,
      label: action.chip,
      prompt: promptForAction(action, source),
      icon: action.icon,
      source
    });
  };

  if (nextAction && (!mentalOnly || isMentalAction(nextAction.id))) add(nextAction, "read");

  for (const message of recentUserMessages(messages, 4)) {
    const action = inferKaiAction(message.content);
    if (mentalOnly && !isMentalAction(action.id)) continue;
    add(action, "recent");
    if (ordered.length >= limit) return ordered.slice(0, limit);
  }

  const defaults = mentalOnly
    ? [KAI_ACTIONS.talk, KAI_ACTIONS.confidence, KAI_ACTIONS.social, KAI_ACTIONS.screen, KAI_ACTIONS.reset, KAI_ACTIONS.goal]
    : kaiPromptChips();
  for (const action of defaults) {
    add(action, "default");
    if (ordered.length >= limit) break;
  }

  return ordered.slice(0, limit);
}

function recentUserMessages(messages: PromptMessage[], limit: number) {
  return [...messages].reverse().filter((message) => message.role === "user" && message.content.trim()).slice(0, limit);
}

function isMentalAction(actionId: KaiActionId) {
  return actionId === "talk" || actionId === "confidence" || actionId === "social" || actionId === "screen" || actionId === "reset" || actionId === "goal";
}

function promptForAction(action: KaiAction, source: PromptSource) {
  if (source === "read") return `Use what I just said and open ${action.label}.`;
  if (source === "recent") return `Keep going from my last message and help me with ${action.label}.`;
  return action.example;
}
