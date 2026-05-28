const STORAGE_KEY = "kai_journey_reflections_v1";

export const JOURNEY_MILESTONES = [0, 30, 90, 365] as const;

export type JourneyMilestone = (typeof JOURNEY_MILESTONES)[number];

export type JourneyReflection = {
  milestone: JourneyMilestone;
  text: string;
  updatedAt: string;
};

export function readJourneyReflections(): JourneyReflection[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isJourneyReflection);
  } catch {
    return [];
  }
}

export function saveJourneyReflection(
  milestone: JourneyMilestone,
  text: string,
): JourneyReflection {
  const clean = text.trim().slice(0, 1000);
  const next: JourneyReflection = {
    milestone,
    text: clean,
    updatedAt: new Date().toISOString(),
  };
  const all = readJourneyReflections().filter((item) => item.milestone !== milestone);
  if (clean) all.push(next);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(all.sort((a, b) => a.milestone - b.milestone)),
  );
  window.dispatchEvent(new Event("kai:journey-changed"));
  return next;
}

export function clearJourneyReflection(milestone: JourneyMilestone): void {
  const all = readJourneyReflections().filter((item) => item.milestone !== milestone);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("kai:journey-changed"));
}

function isJourneyReflection(value: unknown): value is JourneyReflection {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<JourneyReflection>;
  return (
    JOURNEY_MILESTONES.includes(item.milestone as JourneyMilestone) &&
    typeof item.text === "string" &&
    typeof item.updatedAt === "string"
  );
}
