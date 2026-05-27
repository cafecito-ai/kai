// Full level/XP card for /profile (Rawz/3).
//
// Shows current level + label, total XP, progress bar to next level,
// the "what you get for showing up" breakdown.
//
// Per D-021 — no comparative framing. No "you're ahead of 80% of
// users." Just YOUR progress.

import { Sparkles } from "lucide-react";

import { getCurrentLevel } from "../lib/local-xp";
import { useEffect, useState } from "react";
import type { LevelInfo } from "../lib/local-xp";

export function LevelCard({ className = "" }: { className?: string }) {
  const [info, setInfo] = useState<LevelInfo | null>(null);
  useEffect(() => {
    setInfo(getCurrentLevel());
  }, []);

  if (!info) {
    return <div className={`h-[180px] ${className}`} aria-hidden="true" />;
  }

  return (
    <section
      className={`rounded-glass border border-glass-border bg-surface p-5 shadow-card ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            level
          </p>
          <p className="mt-1 flex items-baseline gap-2 leading-none">
            <span className="font-mono text-4xl font-bold tabular-nums text-text-primary">
              {info.level}
            </span>
            <span className="font-display text-lg font-medium text-text-secondary">
              {info.label}
            </span>
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft">
          <Sparkles size={16} className="text-accent" aria-hidden="true" />
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-5">
        <div className="flex items-end justify-between gap-3 pb-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            to level {info.level + 1}
          </span>
          <span className="font-mono text-xs tabular-nums text-text-secondary">
            {info.xpInLevel} / {info.nextLevelXp - info.levelStartXp} XP
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-700"
            style={{ width: `${info.progress * 100}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Lifetime XP */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-glass-border pt-3 text-xs">
        <span className="text-text-secondary">Lifetime XP</span>
        <span className="font-mono font-medium tabular-nums text-text-primary">
          {info.totalXp.toLocaleString()}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-text-secondary">
        XP only ever goes up. Missing a day doesn't take any away. Show up when you can.
      </p>
    </section>
  );
}
