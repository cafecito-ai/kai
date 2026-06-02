// /mobility — list view of all mobility/stretch routines (T-026).
//
// Teen-appropriate routines, 3-10 minutes each. Tapping one opens
// /mobility/:id which is the step-by-step player (MobilityPlayer.tsx).

import { ArrowLeft, ChevronRight, Sparkles, Timer } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  MOBILITY_ROUTINES,
  type MobilityCategory,
  type MobilityRoutine,
} from "../data/mobility-routines";

const FILTERS: Array<{ id: MobilityCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "recovery", label: "Recovery" },
  { id: "morning", label: "Morning" },
  { id: "evening", label: "Evening" },
  { id: "warmup", label: "Warm-up" },
  { id: "back", label: "Back" },
  { id: "hips", label: "Hips" },
  { id: "legs", label: "Legs" },
  { id: "shoulders", label: "Shoulders" },
];

export function Mobility() {
  const [filter, setFilter] = useState<MobilityCategory | "all">("all");

  const list =
    filter === "all"
      ? MOBILITY_ROUTINES
      : MOBILITY_ROUTINES.filter((r) => r.categories.includes(filter));

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-6 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/home"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          mobility
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <div className="pb-5">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          Move better in 3–10 minutes
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Short routines for recovery, warm-ups, and the tight spots from sitting all day.
        </p>
      </div>

      {/* Filter chips */}
      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const selected = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={selected}
              className={`
                shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition
                ${
                  selected
                    ? "border-text-primary bg-text-primary text-background"
                    : "border-glass-border bg-surface text-text-primary hover:bg-surface-muted"
                }
              `}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Routine list */}
      <div className="space-y-2.5">
        {list.map((r) => (
          <RoutineRow key={r.id} routine={r} />
        ))}
        {list.length === 0 && (
          <p className="rounded-glass border border-glass-border bg-surface p-6 text-center text-sm text-text-secondary shadow-card">
            Nothing in this filter yet.
          </p>
        )}
      </div>
    </div>
  );
}

function RoutineRow({ routine }: { routine: MobilityRoutine }) {
  return (
    <Link
      to={`/mobility/${routine.id}`}
      className="
        flex items-center gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3
        shadow-card transition hover:bg-surface-muted focus-ring
      "
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-cool-soft">
        <Sparkles size={16} className="text-accent-cool" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {routine.title}
        </p>
        <p className="truncate text-xs text-text-secondary">{routine.blurb}</p>
        <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          <Timer size={10} aria-hidden="true" />
          {routine.durationMin} min · {routine.bestFor}
        </p>
      </div>
      <ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
    </Link>
  );
}
