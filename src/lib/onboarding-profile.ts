const STORAGE_KEY = "kai_onboarding_profile_v1";

export type OnboardingProfile = {
  firstName?: string;
  focusAreas: string[];
  hardestLately?: string;
  followUps: Record<string, string>;
  summary?: string;
  updatedAt: string;
};

export function saveLocalOnboardingProfile(input: {
  responses: Record<string, string>;
  summary?: string;
}) {
  if (typeof localStorage === "undefined") return;
  const profile = profileFromResponses(input.responses, input.summary);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* localStorage is best-effort only */
  }
}

export function loadLocalOnboardingProfile(): OnboardingProfile | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function profileFromResponses(
  responses: Record<string, string>,
  summary?: string,
): OnboardingProfile {
  const followUps: Record<string, string> = {};
  for (const [key, value] of Object.entries(responses)) {
    if (key.startsWith("followup_") && value.trim()) {
      followUps[key.replace(/^followup_/, "")] = value.trim();
    }
  }
  return {
    firstName: responses.first_name?.trim() || undefined,
    focusAreas: splitFocusAreas(responses.focus_areas),
    hardestLately: responses.hardest_lately?.trim() || undefined,
    followUps,
    summary,
    updatedAt: new Date().toISOString(),
  };
}

export function profileFromApiPayload(payload: unknown): OnboardingProfile | null {
  if (!payload || typeof payload !== "object") return null;
  const intake = (payload as { intake?: unknown }).intake;
  if (!intake || typeof intake !== "object") return null;
  const rawResponses = (intake as { rawResponses?: unknown; raw_responses?: unknown }).rawResponses ??
    (intake as { raw_responses?: unknown }).raw_responses;
  const responses = parseResponses(rawResponses);
  if (!responses) return null;
  return profileFromResponses(
    responses,
    typeof (intake as { summary?: unknown }).summary === "string"
      ? (intake as { summary: string }).summary
      : undefined,
  );
}

export function profileKey(profile: OnboardingProfile | null) {
  if (!profile) return "none";
  return [
    ...profile.focusAreas,
    profile.hardestLately ?? "",
    ...Object.entries(profile.followUps).map(([key, value]) => `${key}:${value}`),
  ].join("|").toLowerCase();
}

function normalizeProfile(value: unknown): OnboardingProfile | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<OnboardingProfile>;
  return {
    firstName: typeof record.firstName === "string" ? record.firstName : undefined,
    focusAreas: Array.isArray(record.focusAreas)
      ? record.focusAreas.filter((item): item is string => typeof item === "string")
      : [],
    hardestLately: typeof record.hardestLately === "string" ? record.hardestLately : undefined,
    followUps:
      record.followUps && typeof record.followUps === "object" && !Array.isArray(record.followUps)
        ? Object.fromEntries(
            Object.entries(record.followUps).filter(([, v]) => typeof v === "string"),
          ) as Record<string, string>
        : {},
    summary: typeof record.summary === "string" ? record.summary : undefined,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString(),
  };
}

function parseResponses(raw: unknown): Record<string, string> | null {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === "string"),
    ) as Record<string, string>;
  } catch {
    return null;
  }
}

function splitFocusAreas(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
