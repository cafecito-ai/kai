// T-025 — Hydration tile.
//
// A small +/- counter that lives on the Home page (or wherever else
// useful). Resets implicitly at local midnight because local-hydration
// keys per day.
//
// Tap +/- to bump. Visual: a row of glass icons that fill as you log,
// plus a "x / target" readout. No Body agent comment — hydration is
// a counter, not a coaching surface.

import { GlassWater, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import {
  bumpHydration,
  getTodayHydration,
  type HydrationEntry,
} from "../lib/local-hydration";

export function HydrationTile({ className = "" }: { className?: string }) {
  const [entry, setEntry] = useState<HydrationEntry | null>(null);

  // Read once on mount. (Re-reads on +/- aren't needed — we use setEntry
  // directly with the return value of bumpHydration.)
  useEffect(() => {
    setEntry(getTodayHydration());
  }, []);

  if (!entry) {
    // First-paint flash guard. Render a skeleton with the same height so
    // the layout doesn't shift.
    return <div className={`h-[112px] ${className}`} aria-hidden="true" />;
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
            <p className="text-sm font-medium text-text-primary">
              <span className="font-mono">{entry.glasses}</span>
              <span className="text-text-muted"> / {entry.target}</span>
              {reachedTarget && (
                <span className="ml-2 inline-flex items-center rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-medium text-success">
                  ✓
                </span>
              )}
            </p>
          </div>
        </div>
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
      </div>

      {/* Glass strip. One icon per glass up to target, partially filled
          visually as the count goes up. Overflow shows as small "+N" so
          the strip doesn't grow unboundedly. */}
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
    </section>
  );
}
