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
  ArrowUpRight,
  Brain,
  Flame,
  Heart,
  Moon,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { KaiGreeting } from "../components/KaiGreeting";
import { MissionsCard } from "../components/MissionsCard";
import { NorthStarCard } from "../components/NorthStarCard";
import { XpPill } from "../components/XpPill";
import { ScoreRing } from "../components/ScoreRing";
import { shouldSurfaceVaultOnHome } from "../lib/local-vault";
import { api } from "../lib/api";
import {
  computeLocalScore,
  readLocalInputs,
  type LocalInput,
} from "../lib/local-score";

// ─────────────────────────────────────────────────────────────────────
// Static demo data (Phase B replaces)
// ─────────────────────────────────────────────────────────────────────

type DailyScoreView = {
  score: number;          // 0–100
  bandLabel: string;      // "Strong start" / "Steady" / "Easy day"
  trend: number;          // delta vs yesterday (e.g. +6)
  streak: number;         // current daily streak in days
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
  trend: 6,
  streak: 4,
  mind: { value: 7, outOf: 10 },
  sleep: { value: 6.4, outOf: 8, unit: "hrs" },
  mood: { value: 68, outOf: 100 },
};

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
  {
    icon: Brain,
    iconTint: "text-accent-cool",
    title: "Evening reflection",
    meta: "Yesterday",
    chip: { label: "+3", className: "bg-success-soft text-success" },
  },
];

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

// Empty-state score: shown for new users / fresh sessions before they've
// logged anything. Previously we used DEMO_SCORE as the initial state
// which made new users think they had a 4-day streak / 82 score on
// signup — confusing and dishonest. Now we start empty and let the
// data flow in as they log things.
const EMPTY_SCORE: DailyScoreView = {
  score: 0,
  bandLabel: "No data yet",
  trend: 0,
  streak: 0,
  mind: { value: 0, outOf: 10 },
  sleep: { value: 0, outOf: 8, unit: "hrs" },
  mood: { value: 0, outOf: 100 },
};

export function Home() {
  const greeting = greetingForNow();
  const navigate = useNavigate();
  // Live data from /api/score/today, then local input log, then a clean
  // empty state for new users. The old DEMO_SCORE / DEMO_ACTIVITY are
  // kept around for the marketing /demo route only.
  const [data, setData] = useState<DailyScoreView>(EMPTY_SCORE);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  // Rawz/3 — level-up detection. Set once on mount if the user crossed
  // into a new level since they last opened /home. Soft KaiMessage,
  // dismissable, doesn't interrupt anything.
  const [levelUp, setLevelUp] = useState<{ newLevel: number; message: string } | null>(null);

  useEffect(() => {
    // Rawz/3 — level-up moment + Rawz/7 — fan out to groups.
    import("../lib/local-xp").then(({ checkAndConsumeLevelUp, levelUpMessage, labelForLevel }) => {
      const r = checkAndConsumeLevelUp();
      if (r.leveledUp) {
        setLevelUp({
          newLevel: r.newLevel,
          message: levelUpMessage(r.newLevel),
        });
        // Fire-and-forget — if the user isn't in any groups it's a no-op
        // server-side. Failures don't matter; the row dedupes on retry.
        api
          .postGroupActivity({
            kind: "level_up",
            refKey: String(r.newLevel),
            hint: labelForLevel(r.newLevel),
          })
          .catch(() => {});
      }
    });
    // Rawz/4 + Rawz/7 — also fan out any newly-earned badges. We call
    // checkAndConsumeNewBadges() here (not where badges are rendered) so
    // the fan-out fires exactly once per badge, on the first Home visit
    // after earning. The badges page reads progress, never consumes.
    import("../lib/local-badges").then(({ checkAndConsumeNewBadges }) => {
      const earned = checkAndConsumeNewBadges();
      for (const b of earned) {
        api
          .postGroupActivity({
            kind: "badge",
            refKey: b.badge.id,
            hint: b.badge.title,
          })
          .catch(() => {});
      }
    });
    // Rawz/7 — streak milestone fan-out. Detects 7 / 30 / 100-day
    // crossings using local input history; fires once per milestone per
    // streak run. Reset to 0 clears the announced set so the user gets
    // the moment again if they come back after a break (D-021).
    import("../lib/local-streak-milestones").then(
      ({ checkAndConsumeStreakMilestones }) => {
        const crossings = checkAndConsumeStreakMilestones();
        for (const days of crossings) {
          api
            .postGroupActivity({
              kind: "streak",
              refKey: String(days),
            })
            .catch(() => {});
        }
      },
    );
  }, []);

  // Bump this whenever a state-changed event fires (input logged or
  // hydration bumped). It re-triggers the score-loading effect below so
  // the user sees their score move in real time.
  const [refreshKey, setRefreshKey] = useState(0);
  // Vault auto-resurface: only true when fading signals fire (low
  // activity, broken streak, low mood, etc). When false, the Vault tile
  // stays hidden and the page stays minimal.
  const [vaultSurfaced, setVaultSurfaced] = useState(false);
  useEffect(() => {
    setVaultSurfaced(shouldSurfaceVaultOnHome());
  }, []);
  useEffect(() => {
    function onChange() {
      setRefreshKey((k) => k + 1);
    }
    window.addEventListener("kai:input-appended", onChange);
    window.addEventListener("kai:state-changed", onChange);
    return () => {
      window.removeEventListener("kai:input-appended", onChange);
      window.removeEventListener("kai:state-changed", onChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Tier 1 — try the live API.
      try {
        const res = await api.getDailyScoreToday();
        if (cancelled) return;
        if (res.score.final != null) {
          setData(toDailyScoreView(res));
        }
        if (res.inputs.length > 0) {
          setActivity(res.inputs.slice(0, 3).map(scoreInputToActivityItem));
          return; // API had data — done
        }
      } catch {
        /* fall through to local */
      }

      // Tier 2 — local-only inputs (check-ins logged before the Worker
      // is wired). Mirrors the same calculator the Worker uses so the
      // score the user sees is real, just computed in the browser.
      if (cancelled) return;
      const inputs = readLocalInputs();
      if (inputs.length === 0) return; // Tier 3 — keep the EMPTY_SCORE (new-user clean slate)
      const local = computeLocalScore(inputs);
      const todayInputs = inputs.filter(
        (i) => i.date === new Date().toISOString().slice(0, 10),
      );
      if (local.final != null) {
        setData({
          score: local.final,
          bandLabel:
            local.band === "high"
              ? "Strong start"
              : local.band === "mid"
                ? "Steady"
                : "Easy day",
          trend: 0,
          streak: local.streak,
          mind: { value: local.mental ?? 0, outOf: 100 },
          sleep: { value: local.sleep ?? 0, outOf: 100, unit: "" },
          mood: { value: local.mood ?? 0, outOf: 100 },
        });
      }
      const latestThree = [...todayInputs]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 3);
      if (latestThree.length > 0) {
        setActivity(latestThree.map(localInputToActivityItem));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="mx-auto w-full max-w-md space-y-6 pt-2 sm:max-w-lg">
      {/* KAI greets you the moment you open the app — character +
          contextual line + tap-to-talk. This is the surface that makes
          the user WANT to come back and talk to their best friend. */}
      <KaiGreeting />

      {/* Daily Score + North Star goal, side by side. The score is today;
          the North Star is the weeks/months goal whose ring fills as they
          keep showing up. Sits below the identity hero on purpose — we lead
          with who they're becoming, not the metrics. */}
      <div className="grid grid-cols-2 gap-3">
        <DailyScoreCard data={data} />
        <NorthStarCard />
      </div>

      {/* Small ambient context row — streak + level pill. Demoted below the
          cards so a raw streak number never leads the screen. */}
      <div className="flex items-center justify-center gap-2 px-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs">
          <Flame size={12} className="text-accent-warm" />
          <span className="font-medium text-text-primary">
            {data.streak}-day streak
          </span>
        </span>
        <XpPill />
      </div>

      {/* Level-up moment lands here when it fires — kept on Home
          because it's an event/celebration, not data. Dismissable. */}
      {levelUp && (
        <div className="rounded-glass border border-accent-soft bg-accent-soft px-4 py-3 shadow-card animate-fade-slide-up">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                level {levelUp.newLevel}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text-primary">
                {levelUp.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLevelUp(null)}
              aria-label="Dismiss"
              className="
                shrink-0 rounded-full px-2 py-1
                font-mono text-[10px] uppercase tracking-[0.14em]
                text-accent transition hover:bg-accent-soft/60 focus-ring
              "
            >
              got it
            </button>
          </div>
        </div>
      )}

      {/* Vault resurface — only visible when the user is showing
          signs of fading (low activity, broken streak, low mood).
          Gentle door, not a guilt trip. Stays hidden otherwise so the
          emotional weight isn't worn down by daily presence. */}
      {vaultSurfaced && (
        <button
          type="button"
          onClick={() => navigate("/vault")}
          className="
            flex w-full items-center justify-between gap-3 rounded-glass
            border border-accent-soft bg-accent-soft/40
            px-4 py-3 shadow-card
            transition active:scale-[0.99] hover:bg-accent-soft/60
            focus-ring text-left
          "
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-background">
              <Sparkles size={14} aria-hidden="true" />
            </span>
            <span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                vault
              </span>
              <span className="block text-sm font-medium text-text-primary">
                Remember why you started
              </span>
            </span>
          </span>
          <ArrowUpRight size={16} className="text-accent" aria-hidden="true" />
        </button>
      )}

      {/* Today's Goals (3 AI-selected actions for today, Rawz/2) */}
      <MissionsCard />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────

function DailyScoreCard({ data }: { data: DailyScoreView }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-glass border border-glass-border bg-surface p-5 text-center shadow-card-lg">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        Today
      </p>

      <div className="mt-3 flex justify-center">
        <div className="relative inline-flex items-center justify-center">
          <ScoreRing value={data.score} size={96} />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex items-baseline gap-0.5">
              <span className="font-mono text-2xl font-bold leading-none text-text-primary">
                {data.score}
              </span>
              <span className="font-mono text-xs text-text-muted">/100</span>
            </span>
          </span>
        </div>
      </div>

      <p className="mt-3 line-clamp-1 min-h-[1.75rem] font-display text-lg font-semibold leading-snug tracking-tight text-text-primary">
        {data.bandLabel}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        {data.trend > 0 ? `+${data.trend} vs yesterday` : data.streak > 0 ? `${data.streak}-day streak` : "Today's score"}
      </p>
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

// Adapt the /api/score/today response into the DailyScoreView the UI uses.
// Live data only fills in what the API has; missing sub-scores fall back to
// the demo values so the visual is never empty.
function toDailyScoreView(
  res: Awaited<ReturnType<typeof api.getDailyScoreToday>>,
): DailyScoreView {
  const { score } = res;
  return {
    score: score.final ?? DEMO_SCORE.score,
    bandLabel: bandToLabel(score.band),
    trend: 0,                              // Phase B follow-up: yesterday delta
    streak: countConsecutiveDays(res.inputs),
    mind: { value: score.mental ?? 0, outOf: 100 },
    sleep: { value: score.sleep ?? 0, outOf: 100, unit: "" },
    mood: { value: score.mood ?? 0, outOf: 100 },
  };
}

function bandToLabel(b: "low" | "mid" | "high" | null): string {
  if (b === "high") return "Strong start";
  if (b === "mid") return "Steady";
  if (b === "low") return "Easy day";
  return "Getting started";
}

function countConsecutiveDays(_inputs: ActivityItem[] | unknown[]): number {
  // Streak is a property of historical score_inputs, not today's set.
  // T-013 follow-up will compute this from a dedicated query. For now,
  // we surface a non-zero streak when there are inputs today so the UI
  // doesn't render an awkward "0-day streak" beside good data.
  return _inputs.length > 0 ? 1 : 0;
}

// Turn an API score-input row into something RecentActivity can render.
function scoreInputToActivityItem(
  row: { source: string; value: unknown; createdAt: string },
): ActivityItem {
  const map: Record<
    string,
    { icon: LucideIcon; iconTint: string; title: string }
  > = {
    check_in: {
      icon: Brain,
      iconTint: "text-accent-cool",
      title: "Check-in",
    },
    journal: {
      icon: Brain,
      iconTint: "text-accent-cool",
      title: "Journal entry",
    },
    sleep_log: {
      icon: Moon,
      iconTint: "text-accent",
      title: "Sleep logged",
    },
    workout: {
      icon: ActivityIcon,
      iconTint: "text-accent-warm",
      title: "Workout logged",
    },
    food_log: {
      icon: ActivityIcon,
      iconTint: "text-accent-warm",
      title: "Food logged",
    },
    goal_progress: {
      icon: Sparkles,
      iconTint: "text-success",
      title: "Goal progress",
    },
    energy_check_in: {
      icon: Heart,
      iconTint: "text-accent-warm",
      title: "Energy check-in",
    },
  };
  const m = map[row.source] ?? {
    icon: Brain,
    iconTint: "text-text-secondary",
    title: row.source,
  };
  return {
    icon: m.icon,
    iconTint: m.iconTint,
    title: m.title,
    meta: relativeTime(row.createdAt),
  };
}

function localInputToActivityItem(input: LocalInput): ActivityItem {
  // Map local source → row. For check_in we surface the mood emoji so the
  // user sees their own answer reflected back, not just "Check-in".
  if (input.source === "check_in") {
    const mood = (input.value as { mood?: number }).mood;
    const labels: Record<number, string> = {
      1: "Really rough",
      2: "Off",
      3: "Okay",
      4: "Pretty good",
      5: "Really good",
    };
    return {
      icon: Brain,
      iconTint: "text-accent-cool",
      title: `Check-in · ${labels[mood ?? 3] ?? "logged"}`,
      meta: relativeTime(input.createdAt),
    };
  }
  return scoreInputToActivityItem({
    source: input.source,
    value: input.value,
    createdAt: input.createdAt,
  });
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diffMin = Math.round((Date.now() - t) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 60 * 24) return `${Math.round(diffMin / 60)}h ago`;
  return "Yesterday";
}

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
