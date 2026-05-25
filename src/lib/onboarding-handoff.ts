import { KAI_ACTIONS } from "./kai-actions";
import type { EngineId } from "./types";

export type OnboardingMissionId = "mind" | "body" | "stretch" | "confidence" | "discipline" | "food" | "sleep" | "social" | "goals";
export type OnboardingVibeId = "stressed" | "locked_in" | "tired" | "motivated" | "lonely" | "confident" | "chaotic" | "bored";
export type OnboardingStressorId = "school" | "sport" | "friends" | "family" | "body" | "phone" | "future" | "motivation";
export type OnboardingPersonalityId = "quiet" | "competitive" | "creative" | "social" | "independent" | "overthinker";

export type OnboardingMission = {
  id: OnboardingMissionId;
  label: string;
  copy: string;
  engine: EngineId;
  route: string;
};

const personalityCopy: Record<OnboardingPersonalityId, string> = {
  quiet: "I open up slowly.",
  competitive: "I like a clear target.",
  creative: "I need room to think.",
  social: "People affect my mood.",
  independent: "Do not baby me.",
  overthinker: "My brain runs loops."
};

export function buildFirstKaiMessage({
  kaiName,
  vibes,
  stressors,
  personality,
  mission,
  context
}: {
  kaiName: string;
  vibes: OnboardingVibeId[];
  stressors: OnboardingStressorId[];
  personality: OnboardingPersonalityId;
  mission: OnboardingMission;
  context: string;
}) {
  const vibeText = vibes.length ? vibes.map((vibe) => vibe.replace(/_/g, " ")).join(", ") : "not totally sure yet";
  const stressText = stressors.length ? ` Loud stuff: ${stressors.map((stressor) => stressor.replace(/_/g, " ")).join(", ")}.` : "";
  const personalityText = personalityCopy[personality] ?? "I will learn your style.";
  const contextLine = context.trim() ? "I’ll remember the extra context you gave me." : "We’ll learn the rest as we go.";
  return `${kaiName} here. I’ve got your starting point: ${vibeText}. ${personalityText}${stressText} First focus is ${mission.label.toLowerCase()}. ${contextLine} Tell me what’s actually going on today, and I’ll open the right move.`;
}

export function actionForMission(mission: OnboardingMissionId) {
  if (mission === "body") return KAI_ACTIONS.scan;
  if (mission === "stretch") return KAI_ACTIONS.stretch;
  if (mission === "food") return KAI_ACTIONS.food;
  if (mission === "sleep") return KAI_ACTIONS.sleep;
  if (mission === "goals" || mission === "discipline") return KAI_ACTIONS.goal;
  if (mission === "confidence") return KAI_ACTIONS.confidence;
  if (mission === "social") return KAI_ACTIONS.social;
  if (mission === "mind") return KAI_ACTIONS.talk;
  return KAI_ACTIONS.talk;
}
