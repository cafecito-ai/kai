/**
 * Screen-time tracker (active component, not a content catalog).
 *
 * Design choices (deliberate):
 *   - localStorage only. Never sent to the server. Reason: sensitive teen
 *     self-report data; legal/privacy review (D6) hasn't happened. Same
 *     posture as cycle.ts (#36) and hydration.ts (#37).
 *   - NO daily target ("you should use less than X hours"). The product
 *     doesn't tell teens what their right number is — it shows them their
 *     own pattern and lets them decide.
 *   - NO streaks ("3 days under target!"). Streaks gamify reduction and
 *     turn a self-knowledge tool into a control tool.
 *   - NO scoring or leaderboard. Comparison to other teens would be poison.
 *   - Pattern nudges are non-judgmental observations the user can use or
 *     ignore — "average is up 2hrs from last week" not "you're using too much".
 *   - The user can delete all their screen-time data with one button at any
 *     time. Hard requirement for a sensitive self-report tool.
 */

export type ScreenTimeEntry = {
  /** ISO date YYYY-MM-DD in the user's local time. */
  date: string;
  /** Hours of screen time that day. 0–24. */
  hours: number;
  /** Optional short freeform note from the teen. */
  note?: string;
};

export type ScreenTimeData = {
  entries: ReadonlyArray<ScreenTimeEntry>;
};

export const STORAGE_KEY = "kai_screen_time_v1";

/** Recommended teen range, per AAP / WHO guidelines. NOT a target — context. */
export const TEEN_SCREEN_REFERENCE = {
  /** Most public-health bodies recommend recreational screens stay under
   * this many hours for teen wellbeing. Schoolwork screens not counted. */
  recreationalDailyHours: 2,
  /** Above this is associated with worse sleep and mood outcomes in research,
   * but it's an association, not a verdict on any individual. */
  highAssociationDailyHours: 5
} as const;

export type ScreenTimeNudgeKey =
  | "no_data_yet"
  | "first_week_observation"
  | "average_steady"
  | "average_up_significant"
  | "average_down_significant"
  | "sleep_window_pattern";

export type ScreenTimeNudge = {
  key: ScreenTimeNudgeKey;
  body: string;
};

/** Pure helper: today's date in YYYY-MM-DD using the user's local time. */
export function todayKey(asOf: Date = new Date()): string {
  const year = asOf.getFullYear();
  const month = String(asOf.getMonth() + 1).padStart(2, "0");
  const day = String(asOf.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Load screen-time data, namespaced by user ID (Codex P1 fix on the
 * tracker family: shared browsers would leak data between teens).
 *
 * Pass the Clerk user.id when signed in, null otherwise.
 */
import { clearKey, loadJSON, saveJSON } from "./local-storage";

export function loadScreenTimeData(userId: string | null = null): ScreenTimeData {
  const raw = loadJSON<ScreenTimeData>(STORAGE_KEY, userId, { entries: [] });
  if (!raw || !Array.isArray(raw.entries)) return { entries: [] };
  return { entries: raw.entries.filter(isValidEntry) };
}

export function saveScreenTimeData(data: ScreenTimeData, userId: string | null = null): void {
  saveJSON(STORAGE_KEY, userId, data);
}

export function clearScreenTimeData(userId: string | null = null): void {
  clearKey(STORAGE_KEY, userId);
}

/**
 * Add or replace today's entry. If an entry for the same date already exists,
 * it is replaced (most-recent self-report wins).
 */
export function upsertEntry(
  data: ScreenTimeData,
  entry: ScreenTimeEntry
): ScreenTimeData {
  if (!isValidEntry(entry)) return data;
  const without = data.entries.filter((e) => e.date !== entry.date);
  const next = [...without, entry].sort((a, b) => a.date.localeCompare(b.date));
  return { entries: next };
}

export function getEntryForDate(
  data: ScreenTimeData,
  date: string
): ScreenTimeEntry | undefined {
  return data.entries.find((e) => e.date === date);
}

/**
 * Average hours across the last `windowDays` entries that exist within the
 * window (does not extrapolate from missing days — missing means "didn't log").
 * Returns null if there are zero entries in the window.
 */
export function getRollingAverage(
  data: ScreenTimeData,
  asOf: Date,
  windowDays: number
): number | null {
  const start = new Date(asOf);
  start.setDate(start.getDate() - (windowDays - 1));
  const startKey = todayKey(start);
  const endKey = todayKey(asOf);
  const inWindow = data.entries.filter(
    (e) => e.date >= startKey && e.date <= endKey
  );
  if (inWindow.length === 0) return null;
  const sum = inWindow.reduce((acc, e) => acc + e.hours, 0);
  return Math.round((sum / inWindow.length) * 10) / 10;
}

/**
 * Non-judgmental observation about the user's pattern. Returns null when
 * there isn't enough data to say anything responsibly.
 *
 * Rules:
 *   - 0 entries → encouragement to start, no judgment.
 *   - 1–6 entries → "first-week observation, see what builds".
 *   - 7+ entries → compare last-7-day average to previous-7-day average.
 *     - delta within ±20% → "average steady".
 *     - delta >+20% → "average up", neutral phrasing.
 *     - delta <-20% → "average down", neutral phrasing.
 *   - If the most recent 3 entries are all ≥ highAssociationDailyHours →
 *     surface the sleep-window pattern note (since research is consistent
 *     here, and surfacing it once at this threshold is responsible).
 */
export function getNudge(
  data: ScreenTimeData,
  asOf: Date = new Date()
): ScreenTimeNudge | null {
  const count = data.entries.length;
  if (count === 0) {
    return {
      key: "no_data_yet",
      body: "Logging a few days helps you see your own pattern. Nothing here is sent anywhere — it stays on this device."
    };
  }
  if (count < 7) {
    return {
      key: "first_week_observation",
      body: "First week is just observation. After 7 days the tracker can show you how your average is shifting."
    };
  }

  const last7 = getRollingAverage(data, asOf, 7);
  const prevAsOf = new Date(asOf);
  prevAsOf.setDate(prevAsOf.getDate() - 7);
  const prev7 = getRollingAverage(data, prevAsOf, 7);

  // Heavy-recent-use note: if the last 3 entries are all very high AND those
  // entries are actually in the recent window (Codex P2: a teen who logged
  // three heavy days then stopped for weeks shouldn't keep seeing the
  // "your last three days" framing). Require entries within the past
  // 5 calendar days, in the local timezone.
  const windowStart = new Date(asOf);
  windowStart.setDate(windowStart.getDate() - 4);
  const startKey = todayKey(windowStart);
  const endKey = todayKey(asOf);
  const recent3 = data.entries
    .filter((e) => e.date >= startKey && e.date <= endKey)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  if (
    recent3.length === 3 &&
    recent3.every((e) => e.hours >= TEEN_SCREEN_REFERENCE.highAssociationDailyHours)
  ) {
    return {
      key: "sleep_window_pattern",
      body: "Your last three days are above 5 hours. Research links sustained heavy use to worse sleep — that's the most reliable link, not mood or anything else. If you want to test it, try cutting the last hour before bed for a few nights and see what changes."
    };
  }

  if (last7 === null || prev7 === null) return null;
  const delta = last7 - prev7;
  const relativeDelta = prev7 > 0 ? delta / prev7 : 0;

  if (Math.abs(relativeDelta) < 0.2) {
    return {
      key: "average_steady",
      body: `Last 7 days averaged ${last7}h. Steady from the week before. Whether that number is right for you is yours to decide.`
    };
  }
  if (relativeDelta >= 0.2) {
    return {
      key: "average_up_significant",
      body: `Last 7 days averaged ${last7}h — up from ${prev7}h the week before. Not a verdict, just a pattern. If you want to notice why, it's often: a specific app, a stressful week, or sleep being off.`
    };
  }
  return {
    key: "average_down_significant",
    body: `Last 7 days averaged ${last7}h — down from ${prev7}h the week before. You changed something. Worth noticing what.`
  };
}

function isValidEntry(value: unknown): value is ScreenTimeEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<ScreenTimeEntry>;
  if (typeof entry.date !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) return false;
  if (typeof entry.hours !== "number") return false;
  if (entry.hours < 0 || entry.hours > 24) return false;
  if (entry.note !== undefined && typeof entry.note !== "string") return false;
  return true;
}
