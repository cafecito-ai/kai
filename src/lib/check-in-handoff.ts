const STORAGE_KEY = "kai_check_in_chat_handoff_v1";
const MAX_AGE_MS = 60 * 60 * 1000;

export type CheckInChatHandoff = {
  id: string;
  mood: number;
  moodLabel: string;
  mind: string;
  better: string;
  reflection: string;
  window: "morning" | "evening" | "other";
  createdAt: string;
};

export function saveCheckInChatHandoff(
  input: Omit<CheckInChatHandoff, "id" | "createdAt">,
): CheckInChatHandoff | null {
  if (typeof sessionStorage === "undefined") return null;
  const handoff: CheckInChatHandoff = {
    ...input,
    id: `checkin_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    createdAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(handoff));
    return handoff;
  } catch {
    return null;
  }
}

export function readCheckInChatHandoff(now: Date = new Date()): CheckInChatHandoff | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckInChatHandoff>;
    if (!parsed.id || !parsed.createdAt || typeof parsed.mood !== "number") return null;
    const age = now.getTime() - new Date(parsed.createdAt).getTime();
    if (!Number.isFinite(age) || age > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      id: String(parsed.id),
      mood: parsed.mood,
      moodLabel: String(parsed.moodLabel ?? ""),
      mind: String(parsed.mind ?? ""),
      better: String(parsed.better ?? ""),
      reflection: String(parsed.reflection ?? ""),
      window:
        parsed.window === "morning" || parsed.window === "evening" || parsed.window === "other"
          ? parsed.window
          : "other",
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}
