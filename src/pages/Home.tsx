// Home — v3 home screen.
//
// Replaces the v0 "engine + rep" home (KAI, start with Mental.,
// right-rail belt/streak/today widgets) with the v3 layout: Daily Score
// hero + horizontal-scroll sub-scores + a KAI reflection message + a
// recent-activity feed + soft suggestions.
//
// Phase B (T-009 → T-014) replaces the static demo data here with live
// data sources:
//   - Daily Score → `daily_scores` D1 table (T-009 schema, T-010 calc)
//   - Reflection → Mind agent response keyed off latest check-in
//   - Activity feed → `score_inputs` rows ingested by T-013
//
// Today the page renders polished placeholder content shaped exactly like
// the Phase B contract — swap statics for live data, no UI changes needed.

import {
  Activity as ActivityIcon,
  Brain,
  Heart,
  Moon,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { ScoreRing } from "../components/ScoreRing";

// ─────────────────────────────────────────────────────────────────────
// Static demo data (Phase B replaces)
// ─────────────────────────────────────────────────────────────────────

type DailyScoreView = {
  score: number;          // 0–100
  bandLabel: string;      // "Strong start" / "Steady" / "Easy day"
  mind: { value: number; outOf: number };
  sleep: { value: number; outOf: number; unit: string };
  mood: { value: number; outOf: number };
};

type ActivityItem = {
  icon: LucideIcon;
  iconTint: string;
  title: string;
  meta: string;
  chip?: { label: string; className: string };
};

const DEMO_SCORE: DailyScoreView = {
  score: 82,
  bandLabel: "Strong start",
  mind: { value: 7, outOf: 10 },
  sleep: { value: 6.4, outOf: 8, unit: "hrs" },
  mood: { value: 68, outOf: 100 },
};

// Two rows max on home. Anything older lives on /progress.
const DEMO_ACTIVITY: ActivityItem[] = [
  {
    icon: ActivityIcon,
    iconTint: "text-accent-warm",
    title: "Easy run · 32 min",
    meta: "Yesterday",
    chip: { label: "+5", className: "bg-success-soft text-success" },
  },
  {
    icon: Moon,
    iconTint: "text-accent",
    title: "Slept 6h 24m",
    meta: "Last night",
    chip: { label: "−2", className: "bg-warning-soft text-warning" },
  },
];

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

export function Home() {
  const greeting = greetingForNow();

  return (
    <div className="mx-auto w-full max-w-md space-y-6 pt-2 sm:max-w-lg">
      {/* Greeting */}
      <header className="flex items-center justify-between px-1">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
            {greeting.eyebrow}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {greeting.headline}.
          </h1>
        </div>
        <KaiOrb size={44} />
      </header>

      {/* Daily Score hero */}
      <DailyScoreCard data={DEMO_SCORE} />

      {/* Sub-scores — horizontal scroll on mobile */}
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        <SubScoreCard
          icon={<Brain size={16} />}
          label="Mind"
          value={`${DEMO_SCORE.mind.value}`}
          unit={`/${DEMO_SCORE.mind.outOf}`}
          color="cool"
        />
        <SubScoreCard
          icon={<Moon size={16} />}
          label="Sleep"
          value={`${DEMO_SCORE.sleep.value}`}
          unit={DEMO_SCORE.sleep.unit}
          color="violet"
        />
        <SubScoreCard
          icon={<Heart size={16} />}
          label="Mood"
          value={`${DEMO_SCORE.mood.value}`}
          unit=""
          color="warm"
        />
      </div>

      {/* KAI message */}
      <KaiMessage
        timestamp={greeting.timestampLabel}
        orbSize={32}
        action={{ label: "Reply" }}
      >
        Sleep dipped under 7h again last night — want to start light today
        and see how you feel by lunch?
      </KaiMessage>

      {/* Recent — 2 rows. Anything older lives on /progress. */}
      <RecentActivity items={DEMO_ACTIVITY} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────

function DailyScoreCard({ data }: { data: DailyScoreView }) {
  return (
    <div className="relative overflow-hidden rounded-glass border border-glass-border bg-surface p-6 shadow-card-lg">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            Today
          </p>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-6xl font-bold leading-none text-text-primary">
              {data.score}
            </span>
            <span className="font-mono text-xl text-text-muted">/100</span>
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
            <Sparkles size={12} aria-hidden="true" />
            {data.bandLabel}
          </p>
        </div>
        <ScoreRing value={data.score} size={104} />
      </div>
    </div>
  );
}

function SubScoreCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: "cool" | "warm" | "violet";
}) {
  const tint = {
    cool: "bg-accent-cool-soft text-accent-cool",
    warm: "bg-accent-warm-soft text-accent-warm",
    violet: "bg-accent-soft text-accent",
  }[color];
  return (
    <div className="min-w-[120px] flex-1 rounded-lg border border-glass-border bg-surface p-4 shadow-card">
      <div
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${tint}`}
      >
        {icon}
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold text-text-primary">
        {value}
        {unit && (
          <span className="ml-0.5 text-xs font-medium text-text-muted">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-3">
      <p className="px-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
        Recent
      </p>
      <div className="rounded-glass border border-glass-border bg-surface p-5 shadow-card">
        <div className="space-y-4">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted">
                  <Icon size={16} className={it.iconTint} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {it.title}
                  </p>
                  <p className="text-xs text-text-muted">{it.meta}</p>
                </div>
                {it.chip && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${it.chip.className}`}
                  >
                    {it.chip.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function greetingForNow(now = new Date()): {
  eyebrow: string;
  headline: string;
  timestampLabel: string;
} {
  const h = now.getHours();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  if (h >= 5 && h < 12) {
    return {
      eyebrow: `${weekday} morning`,
      headline: "Morning",
      timestampLabel: "this morning",
    };
  }
  if (h >= 12 && h < 17) {
    return {
      eyebrow: weekday,
      headline: "Afternoon",
      timestampLabel: "this afternoon",
    };
  }
  if (h >= 17 && h < 22) {
    return {
      eyebrow: `${weekday} evening`,
      headline: "Evening",
      timestampLabel: "this evening",
    };
  }
  return {
    eyebrow: weekday,
    headline: "Late tonight",
    timestampLabel: "tonight",
  };
}
