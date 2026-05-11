import type { ProgressEvent } from "./types";

export function calculateLevel(events: ProgressEvent[]): number {
  const total = events.reduce((sum, event) => sum + Math.max(0, event.eventValue), 0);
  return Math.min(10, Math.max(1, Math.floor(total / 120) + 1));
}

export function calculateStreak(events: ProgressEvent[], now = new Date()): number {
  const days = new Set(events.map((event) => event.occurredAt.slice(0, 10)));
  let streak = 0;
  const cursor = new Date(now);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function beltForLevel(level: number): string {
  if (level >= 9) return "black";
  if (level >= 7) return "brown";
  if (level >= 5) return "blue";
  if (level >= 3) return "green";
  return "white";
}
