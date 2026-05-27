// Small XP/Level pill (Rawz/3). Subtle — sits in the /home header
// without dominating the Daily Score hero.
//
// Shows: level number + label + a thin progress bar to the next level.
// Tap to navigate to a fuller view (we'll add /profile detail later).

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getCurrentLevel, type LevelInfo } from "../lib/local-xp";

export function XpPill({ className = "" }: { className?: string }) {
  const [info, setInfo] = useState<LevelInfo | null>(null);

  useEffect(() => {
    setInfo(getCurrentLevel());
  }, []);

  if (!info) return <span className={className} aria-hidden="true" />;

  return (
    <Link
      to="/profile"
      aria-label={`Level ${info.level} · ${info.label} · tap for details`}
      className={`
        inline-flex items-center gap-2 rounded-full
        border border-glass-border bg-surface px-3 py-1.5
        text-xs shadow-card transition hover:bg-surface-muted focus-ring
        ${className}
      `}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        Lv
      </span>
      <span className="font-mono font-bold text-text-primary tabular-nums">
        {info.level}
      </span>
      <span className="text-text-secondary">·</span>
      <span className="text-text-primary">{info.label}</span>
      {/* Thin progress bar to next level */}
      <span
        className="ml-1 inline-block h-1 w-8 overflow-hidden rounded-full bg-surface-muted"
        aria-hidden="true"
      >
        <span
          className="block h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${info.progress * 100}%` }}
        />
      </span>
    </Link>
  );
}
