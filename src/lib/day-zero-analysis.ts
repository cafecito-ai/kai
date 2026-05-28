import type { DayZeroMeta } from "./day-zero";
import type { OnboardingProfile } from "./onboarding-profile";

export type DayZeroAnalysis = {
  coreMission: string;
  desiredIdentity: string;
  likelyStruggles: string[];
  habitsToBuild: string[];
  homePriorities: string[];
};

export function analyzeDayZero(
  meta: DayZeroMeta | null,
  profile: OnboardingProfile | null,
): DayZeroAnalysis | null {
  const text = [
    meta?.quote ?? "",
    ...(profile?.focusAreas ?? []),
    profile?.hardestLately ?? "",
    ...Object.values(profile?.followUps ?? {}),
    profile?.summary ?? "",
  ].join(" ").toLowerCase();

  if (!text.trim()) return null;

  if (hasAny(text, ["basketball", "sport", "shooting", "training", "gym", "stronger", "muscle", "shape"])) {
    return {
      coreMission: "Become the athlete who trains, fuels, and recovers even when motivation is low.",
      desiredIdentity: "Disciplined competitor",
      likelyStruggles: ["Skipping recovery", "Waiting to feel ready", "Comparing progress too early"],
      habitsToBuild: ["Log one workout", "Eat recovery fuel", "Stretch after practice"],
      homePriorities: ["Training reps", "Recovery", "Fuel"],
    };
  }

  if (hasAny(text, ["confidence", "invisible", "social", "lonely", "friends", "relationships"])) {
    return {
      coreMission: "Become more visible to yourself first, then to other people.",
      desiredIdentity: "Quietly confident",
      likelyStruggles: ["Hiding when the day feels heavy", "Overthinking how others see you", "Avoiding small social reps"],
      habitsToBuild: ["Posture reset", "One eye-contact rep", "One honest journal line"],
      homePriorities: ["Confidence reps", "Mood check-ins", "Social courage"],
    };
  }

  if (hasAny(text, ["overthinking", "stress", "anxiety", "sad", "depressed", "mood", "mental"])) {
    return {
      coreMission: "Build a calmer system so hard feelings do not run the whole day.",
      desiredIdentity: "Grounded and self-aware",
      likelyStruggles: ["Spiraling before action", "Holding too much alone", "Letting one bad moment define the day"],
      habitsToBuild: ["Two-minute breathing reset", "Brain dump journal", "Sleep wind-down"],
      homePriorities: ["Mind", "Sleep", "One small next move"],
    };
  }

  if (hasAny(text, ["focus", "phone", "distracted", "procrastination", "productive", "school", "study"])) {
    return {
      coreMission: "Protect attention long enough to prove you can trust yourself.",
      desiredIdentity: "Focused builder",
      likelyStruggles: ["Phone loops", "Starting late", "Turning one delay into the whole day"],
      habitsToBuild: ["Ten-minute focus block", "Phone-down reset", "End-of-day plan"],
      homePriorities: ["Focus", "Screen reset", "Goal progress"],
    };
  }

  return {
    coreMission: "Build proof that you can keep showing up for yourself.",
    desiredIdentity: "Consistent and self-led",
    likelyStruggles: ["Starting too big", "Quitting after a missed day", "Forgetting the reason you began"],
    habitsToBuild: ["Daily check-in", "One useful log", "Small goal progress"],
    homePriorities: ["Consistency", "Daily score", "Growth"],
  };
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}
