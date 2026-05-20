// T-025 — Hydration tile.
//
// A small +/- counter that lives on the Home page (or wherever else
// useful). Resets implicitly at local midnight because local-hydration
// keys per day.
//
// Tap +/- to bump glasses. Tap the "X / target" readout to edit the
// target (1-20). Goal persists across days until changed.

import { Check, GlassWater, Minus, Pencil, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  bumpHydration,
  getTodayHydration,
  setHydrationTarget,
  type HydrationEntry,
} from "../lib/local-hydration";

const PRESETS = [4, 6, 8, 10, 12];

export function HydrationTile({ className = "" }: { className?: string }) {
  const [entry, setEntry] = useState<HydrationEntry | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftTarget, setDraftTarget] = useState<number>(8);

  useEffect(() => {
    setEntry(getTodayHydration());
  }, []);

  if (!entry) {
    return <div className={`h-[112px] ${className}`} aria-hidden="true" />;
  }

  function startEdit() {
    setDraftTarget(entry!.target);
    setEditing(true);
  }

  function saveEdit() {
    const next = setHydrationTarget(draftTarget);
    setEntry(next);
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  const filled = Math.min(entry.glasses, entry.target);
  const overflow = Math.max(0, entry.glasses - entry.target);
  const reachedTarget = entry.glasses >= entry.target;

  return (
    <section
      className={`rounded-glass border border-glass-border bg-surface p-4 shadow-card ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft">
            <GlassWater size={14} className="text-accent" aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              hydration
            </p>
            {!editing && (
              <button
                type="button"
                onClick={startEdit}
                aria-label={`Goal: ${entry.target} glasses. Tap to change.`}
                className="
                  group inline-flex items-center gap-1 -ml-0.5 rounded px-0.5
                  text-sm font-medium text-text-primary
                  transition hover:bg-surface-muted focus-ring
                "
              >
                <span className="font-mono">{entry.glasses}</span>
                <span className="text-text-muted">/ {entry.target}</span>
                <Pencil
                  size={10}
                  className="ml-0.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
                {reachedTarget && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-medium text-success">
                    ✓
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right cluster — +/- when not editing, save/cancel when editing */}
        {editing ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Cancel"
              onClick={cancelEdit}
              className="
                flex h-9 w-9 items-center justify-center rounded-full
                bg-surface-muted text-text-secondary transition
                hover:bg-glass-border focus-ring
              "
            >
              <X size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Save goal"
              onClick={saveEdit}
              className="
                flex h-9 w-9 items-center justify-center rounded-full
                bg-text-primary text-background transition
                active:scale-95 focus-ring
              "
            >
              <Check size={14} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Remove a glass"
              onClick={() => setEntry(bumpHydration(-1))}
              disabled={entry.glasses === 0}
              className="
                flex h-9 w-9 items-center justify-center rounded-full
                bg-surface-muted text-text-primary transition
                hover:bg-glass-border focus-ring
                disabled:cursor-not-allowed disabled:opacity-40
              "
            >
              <Minus size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Add a glass"
              onClick={() => setEntry(bumpHydration(1))}
              className="
                flex h-9 w-9 items-center justify-center rounded-full
                bg-text-primary text-background transition
                active:scale-95 focus-ring
              "
            >
              <Plus size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Edit mode: stepper + presets row */}
      {editing && (
        <div className="mt-4 rounded-lg border border-glass-border bg-surface-muted/50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            daily goal
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Decrease goal"
              onClick={() => setDraftTarget((n) => Math.max(1, n - 1))}
              disabled={draftTarget <= 1}
              className="
                flex h-10 w-10 items-center justify-center rounded-full
                bg-surface text-text-primary shadow-card transition
                hover:bg-glass-border focus-ring
                disabled:cursor-not-allowed disabled:opacity-40
              "
            >
              <Minus size={14} aria-hidden="true" />
            </button>
            <div className="text-center">
              <div className="font-mono text-3xl font-bold leading-none text-text-primary tabular-nums">
                {draftTarget}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                {draftTarget === 1 ? "glass" : "glasses"}
              </div>
            </div>
            <button
              type="button"
              aria-label="Increase goal"
              onClick={() => setDraftTarget((n) => Math.min(20, n + 1))}
              disabled={draftTarget >= 20}
              className="
                flex h-10 w-10 items-center justify-center rounded-full
                bg-surface text-text-primary shadow-card transition
                hover:bg-glass-border focus-ring
                disabled:cursor-not-allowed disabled:opacity-40
              "
            >
              <Plus size={14} aria-hidden="true" />
            </button>
          </div>
          {/* Common-value presets */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESETS.map((n) => {
              const selected = draftTarget === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDraftTarget(n)}
                  aria-pressed={selected}
                  className={`
                    rounded-full border px-3 py-1 text-xs font-medium transition
                    ${
                      selected
                        ? "border-text-primary bg-text-primary text-background"
                        : "border-glass-border bg-surface text-text-secondary hover:bg-surface-muted"
                    }
                  `}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Glass strip — only shown when not editing, to keep the edit
          state focused. */}
      {!editing && (
        <div className="mt-3 flex items-center gap-1">
          {Array.from({ length: entry.target }).map((_, i) => {
            const isFilled = i < filled;
            return (
              <span
                key={i}
                aria-hidden="true"
                className={`
                  h-7 flex-1 rounded transition-colors
                  ${isFilled ? "bg-accent/70" : "bg-surface-muted/60"}
                `}
              />
            );
          })}
          {overflow > 0 && (
            <span className="ml-1 font-mono text-[10px] font-medium text-accent">
              +{overflow}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
