export type SleepQuality = "rough" | "okay" | "solid";

export function normalizeSleepHours(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(14, Math.round(parsed * 10) / 10));
}

export function sleepInsight(hours: number, quality: SleepQuality): string {
  if (hours < 7) return "Low sleep. Keep the next move smaller and protect tonight.";
  if (hours >= 8 && quality === "solid") return "Solid recovery. Good day to use the energy without forcing it.";
  if (quality === "rough") return "Enough hours, rough quality. Wind-down and stress are probably the lever.";
  return "Recovery is usable. Notice energy later and adjust the plan.";
}

export function normalizeMovementMinutes(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(180, Math.round(parsed)));
}

export function movementInsight(minutes: number, focus: string): string {
  const area = focus.trim() || "mobility";
  if (minutes < 5) return `Start with 5 minutes for ${area}. Small counts when it gets done.`;
  if (minutes >= 30) return `Strong movement block for ${area}. Recovery matters after this.`;
  return `Good reset for ${area}. Kai can build this into a repeatable pattern.`;
}
