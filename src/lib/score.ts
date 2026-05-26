import type { ProgressEvent } from "./types";

export type Submetric = "mind" | "sleep" | "mood" | "hydration";

const WEIGHTS = {
  mind: 30,
  sleep: 25,
  mood: 25,
  hydration: 20
} as const;

export function mindScore(events: ProgressEvent[], date = new Date()): number {
  const latest = latestEvent(events, date, ["feelings_check_in", "thought_reframe", "meditation", "mental_breathing"]);
  if (!latest) return 5;
  if (latest.eventType === "feelings_check_in") return clamp(Math.round((latest.eventValue / 30) * 10), 1, 10);
  return clamp(Math.round(5 + latest.eventValue / 10), 1, 10);
}

export function moodScore(events: ProgressEvent[], date = new Date()): number {
  const latest = latestEvent(events, date, ["feelings_check_in"]);
  if (!latest) return 60;
  return clamp(Math.round(50 + latest.eventValue), 0, 100);
}

export function sleepHours(events: ProgressEvent[], date = new Date()): number {
  const latest = latestEvent(events, date, ["sleep_log"]);
  if (!latest) return 0;
  const payload = latest.payload as { durationMinutes?: unknown } | undefined;
  const minutes = typeof payload?.durationMinutes === "number" ? payload.durationMinutes : 0;
  return Math.round((minutes / 60) * 10) / 10;
}

export function hydrationGlasses(events: ProgressEvent[], date = new Date()): number {
  return clamp(
    eventsForDay(events, date)
      .filter((event) => event.eventType === "hydration")
      .reduce((sum, event) => {
        const payload = event.payload as { glassCount?: unknown } | undefined;
        if (typeof payload?.glassCount === "number") return payload.glassCount;
        return sum + Math.sign(event.eventValue);
      }, 0),
    0,
    8
  );
}

export function dailyScore(events: ProgressEvent[], date = new Date()): number {
  const mind = (mindScore(events, date) / 10) * WEIGHTS.mind;
  const mood = (moodScore(events, date) / 100) * WEIGHTS.mood;
  const hydration = (hydrationGlasses(events, date) / 8) * WEIGHTS.hydration;
  const sleep = sleepCredit(sleepHours(events, date)) * WEIGHTS.sleep;
  return clamp(Math.round(mind + mood + hydration + sleep), 0, 100);
}

export function deltaVsYesterday(events: ProgressEvent[], today = new Date()): number {
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return dailyScore(events, today) - dailyScore(events, yesterday);
}

export function tierLabel(score: number): "Cold" | "Steady" | "Strong start" | "On fire" {
  if (score >= 75) return "On fire";
  if (score >= 50) return "Strong start";
  if (score >= 25) return "Steady";
  return "Cold";
}

export function overallScore(events: ProgressEvent[], days = 7, now = new Date()): number {
  let total = 0;
  for (let i = 0; i < days; i++) {
    const cursor = new Date(now);
    cursor.setDate(now.getDate() - i);
    total += dailyScore(events, cursor);
  }
  return Math.round(total / days);
}

export function recentRows(events: ProgressEvent[], limit = 8) {
  return [...events]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit)
    .map((event) => ({
      id: event.id,
      title: event.eventType.replace(/_/g, " "),
      when: relativeDay(event.occurredAt),
      delta: Math.max(-5, Math.min(8, Math.round(event.eventValue / 5))),
      engine: event.engine
    }));
}

function latestEvent(events: ProgressEvent[], date: Date, types: string[]) {
  return eventsForDay(events, date)
    .filter((event) => types.includes(event.eventType))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
}

function eventsForDay(events: ProgressEvent[], date: Date) {
  const key = date.toISOString().slice(0, 10);
  return events.filter((event) => event.occurredAt.slice(0, 10) === key);
}

function sleepCredit(hours: number): number {
  if (hours <= 0) return 0.45;
  if (hours >= 7 && hours <= 9) return 1;
  if (hours < 6 || hours > 10) return 0.45;
  return 0.75;
}

function relativeDay(iso: string) {
  const today = new Date().toISOString().slice(0, 10);
  const day = iso.slice(0, 10);
  if (day === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (day === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
