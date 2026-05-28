// /progress — the user's actual progress over time.
//
// Pulls from local-score (which mirrors the Worker's daily_scores +
// score_inputs) so the page works offline / before any backend is up.
// Shows:
//   - 7-day Daily Score chart (bars + the trend)
//   - Sub-score 7-day mini-bars (Mind / Sleep / Mood)
//   - "This week" tallies — proof of showing up, not a scoreboard
//   - Recent activity feed (last 10 inputs across all sources)
//
// Replaces the old v0 "character levels + belts + engine balance" view,
// which referenced the three-engine architecture that v2 superseded.

import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  ChevronRight,
  Droplets,
  Dumbbell,
  Flame,
  Gem,
  Heart,
  Layers,
  Lock,
  Moon,
  NotebookPen,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  computeLocalScoreFor,
  readLocalInputs,
  type LocalInput,
} from "../lib/local-score";
import { getRecentHydration } from "../lib/local-hydration";
import { readDayZeroMeta } from "../lib/day-zero";
import {
  loadLocalOnboardingProfile,
  type OnboardingProfile,
} from "../lib/onboarding-profile";

type DayBucket = {
  date: string;          // YYYY-MM-DD
  label: string;         // M/D
  weekday: string;       // M T W T F S S
  final: number | null;
  mental: number | null;
  sleep: number | null;
  mood: number | null;
  hasActivity: boolean;
};

type WeekTallies = {
  checkIns: number;
  sleepLogs: number;
  workouts: number;
  journals: number;
  goalProgress: number;
};

type ProgressSystems = {
  heat: number;
  rank: "Focused" | "Relentless" | "Elite";
  combo: string;
  environmentLevel: number;
  evolutionPhase: string;
  rareDrop: string;
  lockedIn: boolean;
  vaultUnlocks: string[];
  totalHardActions: number;
};

export function Progress() {
  const [inputs, setInputs] = useState<LocalInput[]>([]);
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);

  useEffect(() => {
    setInputs(readLocalInputs());
    setProfile(loadLocalOnboardingProfile());
  }, []);

  const days = useMemo(() => buildSevenDayBuckets(inputs), [inputs]);
  const tallies = useMemo(() => weekTallies(inputs), [inputs]);
  const streak = useMemo(() => computeStreakFromInputs(inputs), [inputs]);
  const hydration = useMemo(() => getRecentHydration(7), []);
  const systems = useMemo(
    () => buildProgressSystems(inputs, tallies, streak),
    [inputs, tallies, streak],
  );
  const recent = useMemo(
    () =>
      [...inputs]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 8),
    [inputs],
  );

  // Show the empty state only when there's literally nothing to display.
  // Once they have any input, the chart appears — empty historical days
  // render as tiny grey nubs (the hydration-bleed bug is fixed via the
  // isToday guard in computeLocalScoreFor), so a fresh user with one
  // check-in honestly sees one tall bar today and 6 thin nubs behind it.
  const hasAnyActivity = inputs.length > 0;

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-6 sm:max-w-lg">
      {/* Header */}
      <header className="pb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          progress
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight">
          Your growth system
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Data, trends, evolution, unlocks, and the deeper read over time.
        </p>
      </header>

      <EvolvingGoalPanel profile={profile} systems={systems} />

      {!hasAnyActivity && <EmptyState />}

      {/* This week tallies */}
      <ThisWeekCard tallies={tallies} streak={streak} />

      <RewardSystemsCard systems={systems} />

      {/* 7-day Daily Score chart */}
      <DailyScoreChart days={days} />

      {/* Sub-score mini-bars */}
      <SubScoreTrends days={days} />

      <DeepTrackingCard
        days={days}
        hydration={hydration}
        streak={streak}
        systems={systems}
      />

      <VaultUnlockCard systems={systems} />

      {/* Recent activity feed */}
      {recent.length > 0 && <RecentActivityCard recent={recent} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────

function EvolvingGoalPanel({
  profile,
  systems,
}: {
  profile: OnboardingProfile | null;
  systems: ProgressSystems;
}) {
  const goal = evolvingGoalForProfile(profile);
  const stage = Math.max(1, systems.environmentLevel);
  const completion = Math.min(100, 18 + systems.totalHardActions * 8 + systems.heat * 10);
  const petals = stage + 3;
  const Icon = goal.kind === "fire" ? Flame : goal.kind === "aura" ? Sparkles : Target;

  return (
    <section
      className={`
        relative mb-5 overflow-hidden rounded-glass border p-5 shadow-card-lg
        ${systems.lockedIn ? "border-accent-warm/45 bg-[#1F1A2E] text-white kai-bass-hit" : "border-glass-border bg-surface"}
      `}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${systems.lockedIn ? "via-accent-warm" : "via-accent-cool/70"} to-transparent`}
      />
      <div className="flex items-start gap-3">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <div className={`absolute inset-3 rounded-full ${goal.glow} opacity-50 blur-xl`} />
          {goal.kind === "flower" ? (
            <div className="relative h-16 w-16">
              {Array.from({ length: petals }).map((_, index) => (
                <span
                  key={index}
                  className="absolute left-1/2 top-1/2 h-9 w-5 origin-bottom rounded-full bg-accent-cool/80 shadow-card"
                  style={{
                    transform: `translate(-50%, -100%) rotate(${(360 / petals) * index}deg) scale(${0.8 + stage * 0.08})`,
                  }}
                />
              ))}
              <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-warm shadow-card" />
              <span className="absolute bottom-0 left-1/2 h-10 w-1.5 -translate-x-1/2 rounded-full bg-success" />
            </div>
          ) : (
            <div className={`relative flex h-16 w-16 items-center justify-center rounded-full ${goal.surface} shadow-card motion-safe:animate-pulse`}>
              <Icon size={30 + stage * 2} className={goal.icon} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className={`font-mono text-[10px] uppercase tracking-[0.16em] ${systems.lockedIn ? "text-white/55" : "text-text-muted"}`}>
              evolving goal
            </p>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 font-mono text-[10px] ${systems.lockedIn ? "bg-white/10 text-white/75" : "bg-surface-muted text-text-secondary"}`}>
              <Layers size={11} aria-hidden="true" />
              phase {stage}
            </span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-tight">
            {goal.title}
          </h2>
          <p className={`mt-2 text-sm leading-relaxed ${systems.lockedIn ? "text-white/68" : "text-text-secondary"}`}>
            {goal.subtitle}
          </p>
          <div className={`mt-4 h-2 overflow-hidden rounded-full ${systems.lockedIn ? "bg-white/10" : "bg-surface-muted"}`}>
            <div
              className={`h-full rounded-full ${goal.bar} transition-all duration-700`}
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ThisWeekCard({
  tallies,
  streak,
}: {
  tallies: WeekTallies;
  streak: number;
}) {
  const tiles: Array<{ icon: LucideIcon; label: string; value: number; tint: string }> = [
    { icon: Heart, label: "Check-ins", value: tallies.checkIns, tint: "text-accent-cool" },
    { icon: Moon, label: "Sleep logs", value: tallies.sleepLogs, tint: "text-accent" },
    { icon: Dumbbell, label: "Workouts", value: tallies.workouts, tint: "text-accent-warm" },
    { icon: NotebookPen, label: "Journals", value: tallies.journals, tint: "text-accent-cool" },
  ];
  return (
    <section className="mb-5 rounded-glass border border-glass-border bg-surface p-5 shadow-card-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            this week
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight">
            Proof you're showing up
          </h2>
        </div>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
            <Flame size={12} aria-hidden="true" />
            {streak}-day streak
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-lg border border-glass-border bg-surface-muted/40 p-2.5 text-center"
          >
            <t.icon size={14} className={`mx-auto ${t.tint}`} aria-hidden="true" />
            <p className="mt-1.5 font-mono text-xl font-bold leading-none text-text-primary">
              {t.value}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted">
              {t.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RewardSystemsCard({ systems }: { systems: ProgressSystems }) {
  const tiles: Array<{
    icon: LucideIcon;
    label: string;
    value: string;
    detail: string;
    accent: string;
  }> = [
    {
      icon: Flame,
      label: "Heat",
      value: `${systems.heat}x`,
      detail: systems.lockedIn ? "Locked in mode active" : "Hard actions raise the temperature",
      accent: "text-accent-warm bg-accent-warm-soft",
    },
    {
      icon: Sparkles,
      label: "Combo",
      value: systems.combo,
      detail: "Workout, hydration, journaling, check-ins stack together",
      accent: "text-accent-cool bg-accent-cool-soft",
    },
    {
      icon: Gem,
      label: "Rare drop",
      value: systems.rareDrop,
      detail: "Secret moments appear after difficult logs",
      accent: "text-accent bg-accent-soft",
    },
    {
      icon: Target,
      label: "Tonight",
      value: systems.rank,
      detail: "Daily ending rank for the cinematic recap",
      accent: "text-success bg-success-soft",
    },
  ];

  return (
    <section className="mb-5 rounded-glass border border-glass-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            progress systems
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight">
            Discipline changes the interface
          </h2>
        </div>
        {systems.lockedIn && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-warm-soft px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-accent-warm">
            <Flame size={11} aria-hidden="true" />
            locked in
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={`rounded-lg border border-glass-border p-3 ${systems.lockedIn ? "kai-bass-hit" : ""}`}
          >
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${tile.accent}`}>
              <tile.icon size={15} aria-hidden="true" />
            </span>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              {tile.label}
            </p>
            <p className="mt-1 text-sm font-semibold leading-tight text-text-primary">
              {tile.value}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              {tile.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DailyScoreChart({ days }: { days: DayBucket[] }) {
  // Max for scaling. If everything is null, just leave bars at min height.
  const maxScore = Math.max(
    ...days.map((d) => d.final ?? 0),
    100, // anchor at 100 so bars feel "honest"
  );

  // Pick a band-aware color for each bar.
  function barClassFor(score: number | null): string {
    if (score == null) return "bg-surface-muted";
    if (score <= 40) return "bg-accent-warm/80";       // amber, never red
    if (score <= 70) return "bg-accent-cool/80";       // violet
    return "bg-success/80";                            // green
  }

  // Today is the rightmost bar (index 6 in a left-to-right 7-day series).
  const todayScore = days[days.length - 1]?.final;

  return (
    <section className="mb-5 rounded-glass border border-glass-border bg-surface p-5 shadow-card">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            daily score
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight">
            Last 7 days
          </h2>
        </div>
        {todayScore != null && (
          <p className="flex items-baseline gap-1">
            <span className="font-mono text-3xl font-bold leading-none text-text-primary">
              {todayScore}
            </span>
            <span className="font-mono text-xs text-text-muted">/100 today</span>
          </p>
        )}
      </div>

      <div className="mt-5 flex items-end gap-2" style={{ height: 120 }}>
        {days.map((d) => {
          const pct = d.final != null ? (d.final / maxScore) * 100 : 4;
          return (
            <div key={d.date} className="flex h-full flex-1 flex-col justify-end">
              <div
                className={`w-full rounded-t-md transition-all ${barClassFor(d.final)}`}
                style={{ height: `${Math.max(4, pct)}%` }}
                title={d.final != null ? `${d.label}: ${d.final}` : `${d.label}: no data`}
                aria-label={d.final != null ? `${d.label}: ${d.final}` : `${d.label}: no data`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-2">
        {days.map((d) => (
          <p
            key={d.date}
            className="flex-1 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted"
          >
            {d.weekday}
          </p>
        ))}
      </div>
    </section>
  );
}

function SubScoreTrends({ days }: { days: DayBucket[] }) {
  const tracks: Array<{
    key: "mental" | "sleep" | "mood";
    label: string;
    icon: LucideIcon;
    tint: string;
    bar: string;
  }> = [
    {
      key: "mental",
      label: "Mind",
      icon: Brain,
      tint: "text-accent-cool",
      bar: "bg-accent-cool/70",
    },
    {
      key: "sleep",
      label: "Sleep",
      icon: Moon,
      tint: "text-accent",
      bar: "bg-accent/70",
    },
    {
      key: "mood",
      label: "Mood",
      icon: Heart,
      tint: "text-accent-warm",
      bar: "bg-accent-warm/70",
    },
  ];

  return (
    <section className="mb-5 rounded-glass border border-glass-border bg-surface p-5 shadow-card">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        sub-scores
      </p>
      <h2 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight">
        Where it's coming from
      </h2>

      <div className="mt-4 space-y-4">
        {tracks.map((track) => {
          const series = days.map((d) => d[track.key]);
          const latest = series[series.length - 1];
          return (
            <div key={track.key}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${track.tint}`}>
                  <track.icon size={12} aria-hidden="true" />
                  {track.label}
                </span>
                <span className="font-mono text-xs text-text-muted">
                  {latest != null ? `${latest}/100` : "—"}
                </span>
              </div>
              <div className="flex items-end gap-1" style={{ height: 36 }}>
                {series.map((v, idx) => {
                  const pct = v != null ? (v / 100) * 100 : 4;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 rounded-t ${v != null ? track.bar : "bg-surface-muted"}`}
                      style={{ height: `${Math.max(4, pct)}%` }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DeepTrackingCard({
  days,
  hydration,
  streak,
  systems,
}: {
  days: DayBucket[];
  hydration: ReturnType<typeof getRecentHydration>;
  streak: number;
  systems: ProgressSystems;
}) {
  const latest = days[days.length - 1];
  const hydrationToday = hydration[hydration.length - 1];
  const hydrationPct = Math.min(100, Math.round((hydrationToday.glasses / hydrationToday.target) * 100));
  const modules: Array<{
    icon: LucideIcon;
    label: string;
    value: string;
    detail: string;
    href: string;
    tint: string;
  }> = [
    {
      icon: Heart,
      label: "Mood analytics",
      value: latest?.mood != null ? `${latest.mood}/100` : "No read",
      detail: "Check-ins and journal sentiment over time",
      href: "/check-in",
      tint: "text-accent-warm bg-accent-warm-soft",
    },
    {
      icon: Droplets,
      label: "Hydration",
      value: `${hydrationToday.glasses}/${hydrationToday.target}`,
      detail: `${hydrationPct}% of today's water target`,
      href: "/home",
      tint: "text-accent-cool bg-accent-cool-soft",
    },
    {
      icon: Moon,
      label: "Sleep",
      value: latest?.sleep != null ? `${latest.sleep}/100` : "No log",
      detail: "Recovery trend and sleep quality inputs",
      href: "/sleep/log",
      tint: "text-accent bg-accent-soft",
    },
    {
      icon: Flame,
      label: "Streak history",
      value: `${streak} days`,
      detail: "Consistency, breaks, rebuilds, and heat",
      href: "/challenges",
      tint: "text-success bg-success-soft",
    },
    {
      icon: Layers,
      label: "Buildable space",
      value: `Room ${systems.environmentLevel}`,
      detail: "Your digital environment grows through discipline",
      href: "/progress",
      tint: "text-accent-cool bg-accent-cool-soft",
    },
    {
      icon: Sparkles,
      label: "Evolution phase",
      value: systems.evolutionPhase,
      detail: "Identity stages change as proof accumulates",
      href: "/profile",
      tint: "text-accent-warm bg-accent-warm-soft",
    },
  ];

  return (
    <section className="mb-5 rounded-glass border border-glass-border bg-surface p-5 shadow-card">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        deeper tracking
      </p>
      <h2 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight">
        Everything that should not crowd Home
      </h2>

      <div className="mt-4 grid gap-2">
        {modules.map((module) => (
          <Link
            key={module.label}
            to={module.href}
            className="flex items-center gap-3 rounded-lg border border-glass-border bg-surface-muted/35 p-3 transition hover:bg-surface-muted focus-ring"
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${module.tint}`}>
              <module.icon size={16} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-text-primary">
                {module.label}
              </span>
              <span className="mt-0.5 block truncate text-xs text-text-secondary">
                {module.detail}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-mono text-xs font-semibold text-text-primary">
                {module.value}
              </span>
              <ChevronRight size={14} className="ml-auto mt-1 text-text-muted" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function VaultUnlockCard({ systems }: { systems: ProgressSystems }) {
  const hasVideo = readDayZeroMeta() != null;
  return (
    <section className="mb-5 overflow-hidden rounded-glass border border-glass-border bg-[#1F1A2E] p-5 text-white shadow-card-lg">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Lock size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
            vault unlocks
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight">
            Private motivation stays private
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/68">
            Difficult actions unlock deeper KAI modes, UI styles, ambient moments, and the Day 0 reason without parking it on Home.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {systems.vaultUnlocks.map((unlock) => (
          <div
            key={unlock}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          >
            <span className="text-sm font-medium">{unlock}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
              unlocked
            </span>
          </div>
        ))}
      </div>

      <Link
        to="/vault"
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#1F1A2E] transition active:scale-[0.99] focus-ring"
      >
        {hasVideo ? "Open private vault" : "Set up private vault"}
      </Link>
    </section>
  );
}

function RecentActivityCard({ recent }: { recent: LocalInput[] }) {
  return (
    <section className="rounded-glass border border-glass-border bg-surface p-5 shadow-card">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        recent
      </p>
      <h2 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight">
        Last few moves
      </h2>

      <div className="mt-3 divide-y divide-glass-border">
        {recent.map((r) => (
          <RecentRow key={r.id} row={r} />
        ))}
      </div>
    </section>
  );
}

// Same XP table the toast uses — kept inline so we don't pull the whole
// XP module in just for a label. Tuned to match XP_BY_SOURCE in local-xp.ts.
const XP_BY_SOURCE: Record<string, number> = {
  check_in: 10,
  journal: 10,
  food_log: 5,
  workout: 15,
  sleep_log: 10,
  goal_progress: 15,
  energy_check_in: 5,
  hydration_goal_hit: 10,
};

function RecentRow({ row }: { row: LocalInput }) {
  const meta = sourceMeta(row);
  const time = friendlyTime(row.createdAt);
  const xp = XP_BY_SOURCE[row.source] ?? 0;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${meta.bg}`}
      >
        <meta.icon size={14} className={meta.tint} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {meta.title}
        </p>
        <p className="truncate text-xs text-text-secondary">{meta.detail}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        {xp > 0 && (
          <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[10px] font-medium text-accent">
            +{xp} XP
          </span>
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted">
          {time}
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-glass border border-glass-border bg-surface p-8 text-center shadow-card">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-cool-soft">
        <Sparkles size={22} className="text-accent-cool" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
        Nothing here yet
      </h2>
      <p className="mt-2 max-w-xs text-sm text-text-secondary">
        Once you check in, log a sleep, or finish a workout, this page fills in
        on its own. No pressure to fill it fast.
      </p>
      <Link
        to="/check-in"
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-text-primary px-5 text-sm font-medium text-background shadow-card transition active:scale-[0.99] focus-ring"
      >
        Start with a check-in
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Data helpers
// ─────────────────────────────────────────────────────────────────────

function buildSevenDayBuckets(inputs: LocalInput[]): DayBucket[] {
  const today = new Date();
  const buckets: DayBucket[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const score = computeLocalScoreFor(inputs, date);
    buckets.push({
      date,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      weekday: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()],
      final: score.final,
      mental: score.mental,
      sleep: score.sleep,
      mood: score.mood,
      hasActivity: inputs.some((x) => x.date === date),
    });
  }
  return buckets;
}

function weekTallies(inputs: LocalInput[]): WeekTallies {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recent = inputs.filter((i) => i.date >= cutoffStr);
  return {
    checkIns: recent.filter((r) => r.source === "check_in").length,
    sleepLogs: recent.filter((r) => r.source === "sleep_log").length,
    workouts: recent.filter((r) => r.source === "workout").length,
    journals: recent.filter((r) => r.source === "journal").length,
    goalProgress: recent.filter((r) => r.source === "goal_progress").length,
  };
}

function computeStreakFromInputs(inputs: LocalInput[]): number {
  const dates = new Set(inputs.map((i) => i.date));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 60; i++) {
    if (dates.has(d.toISOString().slice(0, 10))) streak += 1;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function sourceMeta(row: LocalInput): {
  icon: LucideIcon;
  tint: string;
  bg: string;
  title: string;
  detail: string;
} {
  switch (row.source) {
    case "check_in": {
      const v = row.value as { mood?: number };
      const mood = v?.mood ?? 3;
      const moodLabels = ["Really rough", "Off", "Okay", "Pretty good", "Really good"];
      return {
        icon: Heart,
        tint: "text-accent-cool",
        bg: "bg-accent-cool-soft",
        title: "Check-in",
        detail: moodLabels[Math.max(0, Math.min(4, mood - 1))],
      };
    }
    case "sleep_log": {
      const v = row.value as { hours?: number; quality?: number };
      const h = typeof v?.hours === "number" ? v.hours : null;
      return {
        icon: Moon,
        tint: "text-accent",
        bg: "bg-accent-soft",
        title: "Sleep",
        detail: h != null ? `${h} hours` : "logged",
      };
    }
    case "workout": {
      const v = row.value as { type?: string; durationMin?: number };
      const label = v?.type ? cap(v.type) : "Workout";
      const dur = typeof v?.durationMin === "number" ? `${v.durationMin} min` : "";
      return {
        icon: Dumbbell,
        tint: "text-accent-warm",
        bg: "bg-accent-warm-soft",
        title: label,
        detail: dur || "logged",
      };
    }
    case "journal": {
      return {
        icon: NotebookPen,
        tint: "text-accent-cool",
        bg: "bg-accent-cool-soft",
        title: "Journal",
        detail: "entry written",
      };
    }
    case "goal_progress": {
      return {
        icon: Target,
        tint: "text-success",
        bg: "bg-success-soft",
        title: "Goal progress",
        detail: "step completed",
      };
    }
    case "food_log": {
      return {
        icon: Sparkles,
        tint: "text-accent-warm",
        bg: "bg-accent-warm-soft",
        title: "Food",
        detail: "meal logged",
      };
    }
    default:
      return {
        icon: Sparkles,
        tint: "text-text-secondary",
        bg: "bg-surface-muted",
        title: cap(row.source),
        detail: "logged",
      };
  }
}

function friendlyTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  if (days < 7) return `${days}d`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

function buildProgressSystems(
  inputs: LocalInput[],
  tallies: WeekTallies,
  streak: number,
): ProgressSystems {
  const today = new Date().toISOString().slice(0, 10);
  const todayInputs = inputs.filter((input) => input.date === today);
  const hardActions = todayInputs.filter((input) =>
    ["workout", "goal_progress", "journal", "check_in", "sleep_log", "hydration_goal_hit"].includes(input.source),
  );
  const sources = new Set(todayInputs.map((input) => input.source));
  const comboParts = [
    sources.has("workout") ? "Workout" : null,
    sources.has("hydration_goal_hit") ? "Hydration" : null,
    sources.has("journal") ? "Journal" : null,
    sources.has("check_in") ? "Check-in" : null,
  ].filter(Boolean);
  const totalHardActions =
    tallies.checkIns +
    tallies.sleepLogs +
    tallies.workouts +
    tallies.journals +
    tallies.goalProgress;
  const heat = Math.min(9, streak + Math.max(0, hardActions.length - 1));
  const rank =
    totalHardActions >= 10 || heat >= 7
      ? "Elite"
      : totalHardActions >= 5 || heat >= 4
        ? "Relentless"
        : "Focused";
  const environmentLevel = Math.max(1, Math.min(5, Math.floor(totalHardActions / 4) + 1));
  const evolutionPhase =
    environmentLevel >= 5
      ? "Self-led"
      : environmentLevel >= 4
        ? "Locked in"
        : environmentLevel >= 3
          ? "Builder"
          : environmentLevel >= 2
            ? "Awakening"
            : "Day one";
  const rareDrops = [
    "Secret quote",
    "Hidden theme",
    "Legendary badge",
    "Slow-motion recap",
    "Ambient sound",
  ];
  const rareDrop = rareDrops[(totalHardActions + streak) % rareDrops.length];
  const vaultUnlocks = [
    "Why I Started",
    "Locked-in glow",
    ...(environmentLevel >= 2 ? ["Ambient focus room"] : []),
    ...(environmentLevel >= 3 ? ["Deeper KAI mode"] : []),
    ...(environmentLevel >= 4 ? ["Cinematic night recap"] : []),
  ];

  return {
    heat,
    rank,
    combo: comboParts.length >= 2 ? `${comboParts.length}-chain` : "No chain yet",
    environmentLevel,
    evolutionPhase,
    rareDrop,
    lockedIn: heat >= 4 || hardActions.length >= 3,
    vaultUnlocks,
    totalHardActions,
  };
}

function evolvingGoalForProfile(profile: OnboardingProfile | null): {
  title: string;
  subtitle: string;
  kind: "flower" | "fire" | "aura";
  glow: string;
  surface: string;
  icon: string;
  bar: string;
} {
  const text = profileText(profile);

  if (hasAny(text, ["confidence", "social", "lonely", "relationships", "invisible"])) {
    return {
      title: "Build visible confidence",
      subtitle: "Small proof today: posture, eye contact, one honest rep.",
      kind: "aura",
      glow: "bg-accent",
      surface: "bg-accent-soft",
      icon: "text-accent",
      bar: "bg-accent",
    };
  }
  if (hasAny(text, ["gym", "training", "sport", "basketball", "stronger", "better shape", "muscle", "energy"])) {
    return {
      title: "Build the body that shows up",
      subtitle: "Fuel, train, recover. The space grows when the basics repeat.",
      kind: "fire",
      glow: "bg-accent-warm",
      surface: "bg-accent-warm-soft",
      icon: "text-accent-warm",
      bar: "bg-accent-warm",
    };
  }
  if (hasAny(text, ["focus", "procrastination", "phone", "distracted", "productive", "school"])) {
    return {
      title: "Grow clean focus",
      subtitle: "One quiet block beats another hour of thinking about starting.",
      kind: "flower",
      glow: "bg-accent-cool",
      surface: "bg-accent-cool-soft",
      icon: "text-accent-cool",
      bar: "bg-accent-cool",
    };
  }
  return {
    title: "Grow your system",
    subtitle: "Every check-in, log, and honest answer adds another layer.",
    kind: "flower",
    glow: "bg-success",
    surface: "bg-success-soft",
    icon: "text-success",
    bar: "bg-success",
  };
}

function profileText(profile: OnboardingProfile | null): string {
  return [
    ...(profile?.focusAreas ?? []),
    profile?.hardestLately ?? "",
    ...Object.values(profile?.followUps ?? {}),
    profile?.summary ?? "",
  ].join(" ").toLowerCase();
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}
