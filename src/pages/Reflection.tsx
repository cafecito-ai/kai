// Reflection — the "you're not the same person who downloaded Rawz" moment.
// Surfaces growth the user doesn't notice in themselves: sleep vs when they
// started, lifetime workouts, consistency, days building. Reachable from
// Progress once they've been at it a while.

import { useNavigate } from "react-router-dom";

import { KaiOrb } from "../components/KaiOrb";
import { progressDeltas } from "../lib/baseline";

export function Reflection() {
  const navigate = useNavigate();
  const d = progressDeltas();

  const rows: { label: string; value: string }[] = [];
  rows.push({ label: "Days becoming who you said you'd be", value: `${d.daysBuilding}` });
  if (d.sleepHoursDelta != null && Math.abs(d.sleepHoursDelta) >= 0.25) {
    const sign = d.sleepHoursDelta > 0 ? "+" : "−";
    rows.push({
      label: "Sleep, vs when you started",
      value: `${sign}${Math.abs(d.sleepHoursDelta).toFixed(1)}h a night`,
    });
  }
  if (d.workoutsLifetime > 0) {
    rows.push({ label: "Workouts logged", value: `${d.workoutsLifetime}` });
  }
  if (d.activeDaysRecentWeek > d.activeDaysFirstWeek) {
    rows.push({
      label: "Active days this week vs your first week",
      value: `${d.activeDaysRecentWeek} vs ${d.activeDaysFirstWeek}`,
    });
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <KaiOrb size={72} />
      <h1 className="mt-7 font-display text-3xl font-semibold leading-tight tracking-tight text-text-primary">
        You're not the same person who downloaded Rawz.
      </h1>
      <p className="mt-3 text-sm text-text-secondary">
        Here's what's changed while you weren't keeping score.
      </p>

      <div className="mt-8 w-full space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-4 rounded-lg border border-glass-border bg-surface px-4 py-3 text-left shadow-card"
          >
            <span className="text-sm text-text-secondary">{r.label}</span>
            <span className="font-mono text-lg font-bold text-text-primary">{r.value}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate("/home")}
        className="
          mt-9 flex h-14 w-full max-w-xs items-center justify-center rounded-full
          bg-text-primary text-lg font-semibold text-background shadow-card
          transition active:scale-[0.99] focus-ring
        "
      >
        Keep going
      </button>
    </div>
  );
}
