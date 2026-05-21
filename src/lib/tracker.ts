import type { ProgressEvent } from "./types";

const ENGINE_LABELS: Record<ProgressEvent["engine"], string> = {
  physical: "Body",
  potential: "Mental",
  mental: "Mental",
  kai: "Kai"
};

// Section 9 cumulative-score ladder. Must match workers/src/lib/levels.ts —
// frontend uses this for optimistic UI while the backend is the source of truth.
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 6000, 9000];

const STREAK_DAY_MIN_VALUE = 5;

export function calculateLevel(events: ProgressEvent[]): number {
  const total = events.reduce((sum, event) => sum + Math.max(0, event.eventValue), 0);
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (total >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(10, Math.max(1, level));
}

export function calculateStreak(events: ProgressEvent[], now = new Date()): number {
  const days = new Set(
    events.filter((event) => Math.max(0, event.eventValue) >= STREAK_DAY_MIN_VALUE).map((event) => event.occurredAt.slice(0, 10))
  );
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

export interface NextLoopRecommendation {
  lane: "mental" | "physical";
  label: string;
  title: string;
  copy: string;
  to: string;
}

export function recommendNextLoop(events: ProgressEvent[]): NextLoopRecommendation {
  if (events.length === 0) {
    return {
      lane: "mental",
      label: "Start here",
      title: "Do one mental check-in.",
      copy: "Name what is happening, pick a reset, and give Kai one signal to build from.",
      to: "/mental?module=checkin"
    };
  }

  const totals = engineTotals(events);
  const mental = totals.mental + totals.potential;
  const physical = totals.physical;

  if (physical < mental) {
    return {
      lane: "physical",
      label: "Balance the loop",
      title: "Add one body signal.",
      copy: "Log food, hydration, or a scan so Kai can read recovery alongside mood.",
      to: "/health?module=food"
    };
  }

  if (mental < physical) {
    return {
      lane: "mental",
      label: "Balance the loop",
      title: "Check in before the next move.",
      copy: "A quick feeling check keeps the health loop from turning into pressure.",
      to: "/mental?module=checkin"
    };
  }

  return {
    lane: "mental",
    label: "Keep momentum",
    title: "Do a short breath reset.",
    copy: "You have a balanced loop. Bank one calm rep before choosing the next task.",
    to: "/mental?module=reset"
  };
}

function sumByEngine(events: ProgressEvent[], engine: ProgressEvent["engine"]) {
  return events
    .filter((event) => event.engine === engine)
    .reduce((sum, event) => sum + Math.max(0, event.eventValue), 0);
}
