/**
 * Daily mood + energy log.
 *
 * Design choices (deliberate):
 *   - localStorage only. Never sent to the server. Same posture as cycle (#36),
 *     hydration (#37), and screen-time (#44). Mood is sensitive teen data;
 *     legal/privacy review (D6) hasn't happened.
 *   - Mood is a 5-point scale: very_low, low, neutral, good, great. Not 1-10.
 *     Fine-grained scales create false precision and invite obsessive tracking.
 *     A 5-point scale is what most clinical mood logs use (PHQ-2-style).
 *   - Energy is a separate axis (low / medium / high). Mood and energy don't
 *     always move together — useful to track separately (e.g., low mood + high
 *     energy can signal agitation; low mood + low energy can signal depression).
 *   - NO streaks ("3 good-mood days in a row!"). Streak-shaming on mood is
 *     particularly harmful when you have a bad day.
 *   - The contextual escalation message is the load-bearing piece: if the last
 *     14 days show ≥7 days at low/very_low, surface the counselor message
 *     CALMLY ("worth a real conversation"), not as alarm.
 *   - One-button "Reset all data" always available.
 */

export type Mood = "very_low" | "low" | "neutral" | "good" | "great";
export type Energy = "low" | "medium" | "high";

export type MoodEntry = {
  /** ISO date YYYY-MM-DD in user's local time. */
  date: string;
  mood: Mood;
  energy?: Energy;
  /** Optional short freeform note. */
  note?: string;
};

export type MoodLogData = {
  entries: ReadonlyArray<MoodEntry>;
};

export const STORAGE_KEY = "kai_mood_log_v1";

/** Numeric scale used only for averaging. Don't expose this in UI. */
export const MOOD_VALUES: Record<Mood, number> = {
  very_low: 1,
  low: 2,
  neutral: 3,
  good: 4,
  great: 5
};

export const MOOD_LABEL: Record<Mood, string> = {
  very_low: "Very low",
  low: "Low",
  neutral: "Neutral",
  good: "Good",
  great: "Great"
};

export const ENERGY_LABEL: Record<Energy, string> = {
  low: "Low energy",
  medium: "Medium energy",
  high: "High energy"
};

export type MoodNudgeKey =
  | "no_data_yet"
  | "first_week"
  | "trend_steady"
  | "trend_lifting"
  | "trend_dipping"
  | "extended_low_pattern"
  | "low_mood_high_energy_pattern";

export type MoodNudge = {
  key: MoodNudgeKey;
  /** Always non-judgmental observation. Counselor escalation only at the
   * extended_low threshold (≥7 low/very-low days in last 14). */
  body: string;
  /** True when the nudge contains an explicit escalation suggestion. Used by
   * the UI to surface the Crisis page link more prominently. */
  escalate: boolean;
};

export function todayKey(asOf: Date = new Date()): string {
  const y = asOf.getFullYear();
  const m = String(asOf.getMonth() + 1).padStart(2, "0");
  const d = String(asOf.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function loadMoodLogData(): MoodLogData {
  try {
    if (typeof localStorage === "undefined") return { entries: [] };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw) as MoodLogData;
    if (!parsed || !Array.isArray(parsed.entries)) return { entries: [] };
    return { entries: parsed.entries.filter(isValidEntry) };
  } catch {
    return { entries: [] };
  }
}

export function saveMoodLogData(data: MoodLogData): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearMoodLogData(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function upsertEntry(data: MoodLogData, entry: MoodEntry): MoodLogData {
  if (!isValidEntry(entry)) return data;
  const without = data.entries.filter((e) => e.date !== entry.date);
  const next = [...without, entry].sort((a, b) => a.date.localeCompare(b.date));
  return { entries: next };
}

export function getEntryForDate(
  data: MoodLogData,
  date: string
): MoodEntry | undefined {
  return data.entries.find((e) => e.date === date);
}

/** Entries within the last N days inclusive of today. */
export function getRecentEntries(
  data: MoodLogData,
  asOf: Date,
  windowDays: number
): MoodEntry[] {
  const start = new Date(asOf);
  start.setDate(start.getDate() - (windowDays - 1));
  const startKey = todayKey(start);
  const endKey = todayKey(asOf);
  return data.entries.filter((e) => e.date >= startKey && e.date <= endKey);
}

/** Average mood as a 1-5 number; null if no entries in window. */
export function getRollingMood(
  data: MoodLogData,
  asOf: Date,
  windowDays: number
): number | null {
  const inWindow = getRecentEntries(data, asOf, windowDays);
  if (inWindow.length === 0) return null;
  const sum = inWindow.reduce((acc, e) => acc + MOOD_VALUES[e.mood], 0);
  return Math.round((sum / inWindow.length) * 10) / 10;
}

/**
 * Returns the count of low / very_low days in the last `windowDays`.
 * Used for the extended-low pattern escalation.
 */
export function countLowDays(
  data: MoodLogData,
  asOf: Date,
  windowDays: number
): number {
  const inWindow = getRecentEntries(data, asOf, windowDays);
  return inWindow.filter((e) => e.mood === "low" || e.mood === "very_low").length;
}

/** Threshold for surfacing the extended-low counselor nudge. */
export const EXTENDED_LOW_THRESHOLD_DAYS = 7;
export const EXTENDED_LOW_WINDOW_DAYS = 14;

/**
 * State machine for contextual nudges. Priority order:
 *   1. extended_low_pattern (≥7 low/very-low days in last 14) — always wins.
 *   2. low_mood_high_energy_pattern (3+ days in last 7 with low mood + high
 *      energy — possible agitation signal worth surfacing softly).
 *   3. trend_lifting / trend_dipping (last-7 avg shifted ≥0.5 vs prev-7).
 *   4. trend_steady (sufficient data, no notable shift).
 *   5. first_week (< 7 entries total).
 *   6. no_data_yet (0 entries).
 */
export function getNudge(
  data: MoodLogData,
  asOf: Date = new Date()
): MoodNudge | null {
  const totalCount = data.entries.length;
  if (totalCount === 0) {
    return {
      key: "no_data_yet",
      body: "Logging a mood once a day helps you see your own pattern over time. Nothing here is sent anywhere — it stays on this device.",
      escalate: false
    };
  }

  const lowCount = countLowDays(data, asOf, EXTENDED_LOW_WINDOW_DAYS);
  if (lowCount >= EXTENDED_LOW_THRESHOLD_DAYS) {
    return {
      key: "extended_low_pattern",
      body: `Your mood has been low or very-low ${lowCount} of the last ${EXTENDED_LOW_WINDOW_DAYS} days. That's enough to be worth a real conversation. A school counselor, a parent, or a therapist isn't overkill for this — it's the right next step. Persistent low mood is one of the most treatable things in mental health. You don't have to white-knuckle it.`,
      escalate: true
    };
  }

  // Low-mood + high-energy combo over last 7 days. Agitation pattern is worth
  // surfacing as information; not an alarm.
  const last7 = getRecentEntries(data, asOf, 7);
  const lowHighCombo = last7.filter(
    (e) => (e.mood === "low" || e.mood === "very_low") && e.energy === "high"
  ).length;
  if (lowHighCombo >= 3) {
    return {
      key: "low_mood_high_energy_pattern",
      body: "Several days this week show low mood but high energy. That combo can feel like restlessness, irritability, or pressure to act. If it's been heavy, naming it to someone or a counselor can help.",
      escalate: false
    };
  }

  if (totalCount < 7) {
    return {
      key: "first_week",
      body: "First week is just observation. After 7 days the log can show how your mood is shifting from week to week.",
      escalate: false
    };
  }

  const last7Avg = getRollingMood(data, asOf, 7);
  const prevAsOf = new Date(asOf);
  prevAsOf.setDate(prevAsOf.getDate() - 7);
  const prev7Avg = getRollingMood(data, prevAsOf, 7);
  if (last7Avg === null || prev7Avg === null) return null;
  const delta = last7Avg - prev7Avg;

  if (delta >= 0.5) {
    return {
      key: "trend_lifting",
      body: "Mood has been lifting compared to the week before. You changed something — worth noticing what.",
      escalate: false
    };
  }
  if (delta <= -0.5) {
    return {
      key: "trend_dipping",
      body: "Mood has been dipping compared to the week before. Not a verdict — just a pattern. Common things that drive a dip: bad sleep, hard week, friction in a relationship, season change. Worth checking the base layer.",
      escalate: false
    };
  }
  return {
    key: "trend_steady",
    body: "Mood has been steady week-over-week. Steady can mean fine, can mean stuck — only you know which one.",
    escalate: false
  };
}

function isValidEntry(value: unknown): value is MoodEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<MoodEntry>;
  if (typeof entry.date !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) return false;
  if (typeof entry.mood !== "string") return false;
  if (!Object.prototype.hasOwnProperty.call(MOOD_VALUES, entry.mood)) return false;
  if (entry.energy !== undefined && !["low", "medium", "high"].includes(entry.energy))
    return false;
  if (entry.note !== undefined && typeof entry.note !== "string") return false;
  return true;
}
