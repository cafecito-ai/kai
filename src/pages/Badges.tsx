// /badges — full badge gallery (Rawz/4).
//
// Earned ones in full color, locked ones grayed out with the criterion
// + progress shown. Per D-021: locked badges NEVER say "you haven't"
// — they say "X of Y" or just show the criterion as a future thing.
//
// Reachable from Profile.

import {
  ArrowLeft,
  Brain,
  Dumbbell,
  Flame,
  GlassWater,
  Heart,
  Lock,
  Map as MapIcon,
  Moon,
  NotebookPen,
  ScanLine,
  Sparkles,
  Sun,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  getBadgeProgress,
  type Badge,
  type BadgeCategory,
  type BadgeProgress,
} from "../lib/local-badges";

const ICON_MAP: Record<Badge["icon"], LucideIcon> = {
  Heart,
  Moon,
  Dumbbell,
  Sparkles,
  NotebookPen,
  GlassWater,
  ScanLine,
  Brain,
  Flame,
  Target,
  Sun,
  Map: MapIcon,
};

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  consistency: "Consistency",
  wellness: "Wellness",
  strength: "Strength",
  reflection: "Reflection",
  mindful: "Mindful",
  exploration: "Exploration",
};

export function Badges() {
  const [badges, setBadges] = useState<BadgeProgress[] | null>(null);

  useEffect(() => {
    setBadges(getBadgeProgress());
  }, []);

  const grouped = useMemo(() => {
    if (!badges) return null;
    const map = new Map<BadgeCategory, BadgeProgress[]>();
    for (const b of badges) {
      const list = map.get(b.badge.category) ?? [];
      list.push(b);
      map.set(b.badge.category, list);
    }
    return map;
  }, [badges]);

  const earnedCount = badges?.filter((b) => b.earnedAt).length ?? 0;
  const total = badges?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-6 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/profile"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          badges
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <div className="pb-5 text-center">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          Badges
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Milestones, not measurements. You vs your past, never vs anyone else.
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-secondary">
          <Sparkles size={10} aria-hidden="true" />
          {earnedCount} of {total} earned
        </span>
      </div>

      {!grouped && (
        <p className="text-center text-sm text-text-secondary">Loading…</p>
      )}

      {grouped &&
        (Object.keys(CATEGORY_LABELS) as BadgeCategory[]).map((cat) => {
          const list = grouped.get(cat);
          if (!list || list.length === 0) return null;
          return (
            <section key={cat} className="mb-6">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                {CATEGORY_LABELS[cat]}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {list.map((bp) => (
                  <BadgeTile key={bp.badge.id} progress={bp} />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Tile
// ─────────────────────────────────────────────────────────────────────

function BadgeTile({ progress }: { progress: BadgeProgress }) {
  const Icon = ICON_MAP[progress.badge.icon];
  const earned = progress.earnedAt != null;
  return (
    <div
      className={`
        flex flex-col rounded-lg border border-glass-border p-3 shadow-card
        transition
        ${earned ? "bg-surface" : "bg-surface-muted/40"}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`
            flex h-10 w-10 items-center justify-center rounded-full
            ${earned ? progress.badge.tint : "bg-surface-muted text-text-muted"}
          `}
        >
          {earned ? (
            <Icon size={16} aria-hidden="true" />
          ) : (
            <Lock size={12} aria-hidden="true" />
          )}
        </span>
        {!earned && (
          <span className="font-mono text-[10px] tabular-nums text-text-muted">
            {progress.current}/{progress.target}
          </span>
        )}
      </div>
      <p
        className={`
          mt-2 text-sm font-medium leading-tight
          ${earned ? "text-text-primary" : "text-text-secondary"}
        `}
      >
        {progress.badge.title}
      </p>
      <p
        className={`
          mt-0.5 text-[11px] leading-snug
          ${earned ? "text-text-secondary" : "text-text-muted"}
        `}
      >
        {earned ? progress.badge.description : progress.badge.criterion}
      </p>
      {!earned && progress.target > 1 && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-text-soft transition-[width] duration-500"
            style={{ width: `${progress.progress * 100}%` }}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
