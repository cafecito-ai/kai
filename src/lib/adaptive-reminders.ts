import type { OnboardingProfile } from "./onboarding-profile";

export type ReminderPlan = {
  style: "competitive" | "calm" | "accountability" | "reward";
  label: string;
  cadence: string;
  examples: string[];
};

export function buildAdaptiveReminderPlan(profile: OnboardingProfile | null): ReminderPlan {
  const text = [
    ...(profile?.focusAreas ?? []),
    profile?.hardestLately ?? "",
    ...Object.values(profile?.followUps ?? {}),
    profile?.summary ?? "",
  ].join(" ").toLowerCase();

  if (hasAny(text, ["basketball", "sport", "gym", "training", "competition", "winning", "stronger"])) {
    return {
      style: "competitive",
      label: "Competitive nudges",
      cadence: "Before practice, after training, and at night.",
      examples: [
        "Get one rep on the board.",
        "Recovery counts. Log the fuel.",
        "Protect tomorrow's legs.",
      ],
    };
  }

  if (hasAny(text, ["stress", "anxiety", "overthinking", "sad", "depressed", "calm", "sleep"])) {
    return {
      style: "calm",
      label: "Calm reminders",
      cadence: "Soft check-ins, never pressure-heavy.",
      examples: [
        "Take the next breath, then the next step.",
        "A two-minute reset counts.",
        "Tonight is part of the comeback.",
      ],
    };
  }

  if (hasAny(text, ["confidence", "social", "lonely", "friends", "invisible", "accountability"])) {
    return {
      style: "accountability",
      label: "Accountability nudges",
      cadence: "One social or confidence rep per day.",
      examples: [
        "Do the visible thing once.",
        "Posture up. One real interaction.",
        "Future you needs one honest rep.",
      ],
    };
  }

  return {
    style: "reward",
    label: "Streak + reward nudges",
    cadence: "Morning setup and evening closeout.",
    examples: [
      "Win the next ten minutes.",
      "Keep the streak honest.",
      "One log turns the day on.",
    ],
  };
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}
