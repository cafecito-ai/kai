// T-025 — Hydration tile.
//
// A small +/- counter that lives on the Home page (or wherever else
// useful). Resets implicitly at local midnight because local-hydration
// keys per day.
//
// Tap +/- to bump glasses. Tap the "X / target" readout to edit the
// target (1-20). Goal persists across days until changed.
//
// ─────────────────────────────────────────────────────────────────────
// TODO[hydration-celebration]: Evan asked to "remember he'll call upon
// this later." When he does, the options he wants to choose between are:
//
//   SMALL (~15 min) — current tiny animation + a one-time dismissable
//     KaiMessage bubble below the tile the FIRST time hitting goal each
//     day: "That's N — your body's gonna thank you tomorrow. Anything
//     past this is a bonus." Use existing KaiMessage component.
//
//   MEDIUM (~30 min) — all of the above PLUS:
//     - Count as a small win on /progress's "This week" tile
//       (add `hydration_goal_hit` source to local-score or just track
//        separately in local-hydration)
//     - Tiny bump to mood subscore (hydration → energy → mood is real)
//     - Mind agent prompt context: include "hit hydration N days in a
//       row" so KAI references it naturally in chat
//
// What's currently implemented is the TINY option: brief celebrate
// animation on the strip + scale pop on the ✓ chip when crossing the
// goal threshold. Fires once per local day (dedupe via localStorage).
// ─────────────────────────────────────────────────────────────────────

import { Check, GlassWater, Minus, Pencil, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  bumpHydration,
  getTodayHydration,
  setHydrationTarget,
  type HydrationEntry,
} from "../lib/local-hydration";
import { appendLocalInput } from "../lib/local-score";

const PRESETS = [4, 6, 8, 10, 12];

/** localStorage key for "have we already celebrated hitting the goal
 *  today?" — prevents the animation re-firing every time the user bumps
 *  +/- after crossing the line. Stores YYYY-MM-DD of the last celebration. */
const CELEBRATED_KEY = "kai_hydration_celebrated_v1";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function alreadyCelebratedToday(): boolean {
  try {
    return localStorage.getItem(CELEBRATED_KEY) === todayKey();
  } catch {
    return false;
  }
}

function markCelebrated(): void {
  try {
    localStorage.setItem(CELEBRATED_KEY, todayKey());
  } catch {
    /* no-op */
  }
}

export function HydrationTile({ className = "" }: { className?: string }) {
  const [entry, setEntry] = useState<HydrationEntry | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftTarget, setDraftTarget] = useState<number>(8);
  // `celebrating` is true for ~1.6s after the user crosses the goal
  // for the first time today. Triggers the animation classes below.
  const [celebrating, setCelebrating] = useState(false);
  const prevGlassesRef = useRef<number | null>(null);

  useEffect(() => {
    setEntry(getTodayHydration());
  }, []);

  // Detect the cross-the-goal transition. Fires when glasses goes from
  // < target to >= target AND we haven't celebrated today yet.
  useEffect(() => {
    if (!entry) return;
    const prev = prevGlassesRef.current;
    const justCrossed =
      prev != null && prev < entry.target && entry.glasses >= entry.target;
    if (justCrossed && !alreadyCelebratedToday()) {
      setCelebrating(true);
      markCelebrated();
      // Hitting the hydration goal contributes to the day's mood
      // subscore — small but real bump. Logged as an energy_check_in
      // input with value 4/5 ("steady") since that's the closest
      // existing source kind that maps to "small positive nudge."
      // Recorded once per day (dedupe via the celebrate flag above).
      appendLocalInput({
        date: new Date().toISOString().slice(0, 10),
        source: "energy_check_in",
        value: { energy: 4, note: "hydration goal hit" },
      });
      const id = window.setTimeout(() => setCelebrating(false), 1600);
      prevGlassesRef.current = entry.glasses;
      return () => window.clearTimeout(id);
    }
    prevGlassesRef.current = entry.glasses;
  }, [entry]);

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
                  <span
                    className={`
                      ml-1 inline-flex items-center rounded-full bg-success-soft
                      px-2 py-0.5 text-[10px] font-medium text-success
                      transition-transform duration-300
                      ${celebrating ? "animate-celebrate-chip" : ""}
                    `}
                  >
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
                  ${celebrating ? "animate-celebrate-ripple" : ""}
                `}
                // Stagger the ripple left-to-right via inline animation-delay
                // so each glass pops in sequence. ~60ms per cell.
                style={
                  celebrating
                    ? { animationDelay: `${i * 60}ms` }
                    : undefined
                }
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
