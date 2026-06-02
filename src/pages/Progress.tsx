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
  Dumbbell,
  Flame,
  Heart,
  Moon,
  NotebookPen,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { HydrationTile } from "../components/HydrationTile";
import {
  computeLocalScoreFor,
  readLocalInputs,
  type LocalInput,
} from "../lib/local-score";
import { getRecentHydration } from "../lib/local-hydration";

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

export function Progress() {
  const [inputs, setInputs] = useState<LocalInput[]>([]);

  useEffect(() => {
    setInputs(readLocalInputs());
  }, []);

  const days = useMemo(() => buildSevenDayBuckets(inputs), [inputs]);
  const tallies = useMemo(() => weekTallies(inputs), [inputs]);
  const streak = useMemo(() => computeStreakFromInputs(inputs), [inputs]);
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
          Your last 7 days
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Just the read — what you've done, how it lands. Not a scoreboard.
        </p>
      </header>

      {!hasAnyActivity ? (
        <EmptyState />
      ) : (
        <>
          {/* This week tallies */}
          <ThisWeekCard tallies={tallies} streak={streak} />

          {/* Streak record — current + longest. Moved here from the
              old Home page so /home stays focused on action and
              /progress becomes the data deep-dive. */}
          <StreakRecordCard inputs={inputs} currentStreak={streak} />

          {/* 7-day Daily Score chart */}
          <DailyScoreChart days={days} />

          {/* Sub-score mini-bars */}
          <SubScoreTrends days={days} />

          {/* Hydration — the live tile (add water) PLUS a 7-day strip
              showing which days hit goal. Lives here, not on Home. */}
          <HydrationSection />

          {/* Recent activity feed */}
          <RecentActivityCard recent={recent} />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────

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
// New sections (moved from Home — Progress is the data deep-dive surface)
// ─────────────────────────────────────────────────────────────────────

function StreakRecordCard({
  inputs,
  currentStreak,
}: {
  inputs: LocalInput[];
  currentStreak: number;
}) {
  // Longest streak ever: walk every distinct date, find the longest
  // run of consecutive days the user logged anything. Cheap because
  // we already have all the inputs in memory.
  const longest = useMemo(() => longestStreak(inputs), [inputs]);
  return (
    <section className="mb-5 rounded-glass border border-glass-border bg-surface p-5 shadow-card">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        streak
      </p>
      <h2 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight">
        Showing up
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-glass-border bg-surface-muted/40 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            current
          </p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold leading-none tabular-nums text-text-primary">
              {currentStreak}
            </span>
            <span className="font-mono text-[10px] text-text-muted">
              {currentStreak === 1 ? "day" : "days"}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-glass-border bg-surface-muted/40 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            longest
          </p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold leading-none tabular-nums text-text-primary">
              {longest}
            </span>
            <span className="font-mono text-[10px] text-text-muted">
              {longest === 1 ? "day" : "days"}
            </span>
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-text-secondary">
        Every day you check in counts. Skip a day, it's a fresh start —
        no penalty, no shame.
      </p>
    </section>
  );
}

function HydrationSection() {
  // 7-day strip — which days hit goal vs. which days fell short.
  const week = getRecentHydration(7);
  return (
    <section className="mb-5">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        hydration
      </p>
      {/* Live tile: add or remove a glass for today */}
      <HydrationTile />
      {/* 7-day strip below the tile — small dots, filled when goal hit */}
      <div className="mt-3 rounded-glass border border-glass-border bg-surface p-4 shadow-card">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          last 7 days
        </p>
        <div className="mt-3 flex items-end justify-between gap-2">
          {week.map((e) => {
            const pct = Math.max(0, Math.min(1, e.glasses / Math.max(1, e.target)));
            const hit = pct >= 1;
            return (
              <div key={e.date} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="relative flex h-12 w-full items-end overflow-hidden rounded-md bg-surface-muted/50"
                  title={`${e.glasses}/${e.target} glasses`}
                >
                  <div
                    className={`w-full transition-all ${hit ? "bg-accent" : "bg-accent/40"}`}
                    style={{ height: `${Math.max(8, pct * 100)}%` }}
                  />
                </div>
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-muted">
                  {dayLabelShort(e.date)}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-text-secondary">
          Filled bar = hit goal that day. Half = halfway there. Skip days
          don't count against you.
        </p>
      </div>
    </section>
  );
}

function dayLabelShort(date: string): string {
  const d = new Date(date);
  return ["S", "M", "T", "W", "T", "F", "S"][d.getDay()] ?? "?";
}

function longestStreak(inputs: LocalInput[]): number {
  const dates = Array.from(new Set(inputs.map((i) => i.date))).sort();
  if (dates.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i += 1) {
    const prev = new Date(dates[i - 1]);
    const next = new Date(dates[i]);
    const diff = Math.round(
      (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff === 1) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
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
