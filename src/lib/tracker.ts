import type { ProgressEvent } from "./types";

const ENGINE_LABELS: Record<ProgressEvent["engine"], string> = {
  physical: "Body",
  potential: "Goals",
  mental: "Reset",
  kai: "Kai"
};

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

export function engineTotals(events: ProgressEvent[]) {
  return {
    physical: sumByEngine(events, "physical"),
    potential: sumByEngine(events, "potential"),
    mental: sumByEngine(events, "mental"),
    kai: sumByEngine(events, "kai")
  };
}

export function lastNDays(events: ProgressEvent[], days = 14, now = new Date()) {
  const totals = new Map<string, number>();
  for (const event of events) {
    const day = event.occurredAt.slice(0, 10);
    totals.set(day, (totals.get(day) ?? 0) + Math.max(0, event.eventValue));
  }

  return Array.from({ length: days }, (_, index) => {
    const cursor = new Date(now);
    cursor.setDate(cursor.getDate() - (days - index - 1));
    const day = cursor.toISOString().slice(0, 10);
    return { day, value: totals.get(day) ?? 0 };
  });
}

export function eventDisplayName(event: ProgressEvent): string {
  const action = event.eventType.replace(/_/g, " ");
  return `${ENGINE_LABELS[event.engine]}: ${action}`;
}

function sumByEngine(events: ProgressEvent[], engine: ProgressEvent["engine"]) {
  return events
    .filter((event) => event.engine === engine)
    .reduce((sum, event) => sum + Math.max(0, event.eventValue), 0);
}
