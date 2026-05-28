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
  Lock,
  Flame,
  Heart,
  Moon,
  Play,
  Sprout,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { HydrationTile } from "../components/HydrationTile";
import { KaiMessage } from "../components/KaiMessage";
import { MissionsCard } from "../components/MissionsCard";
import { XpPill } from "../components/XpPill";
import { KaiOrb } from "../components/KaiOrb";
import { ScoreRing } from "../components/ScoreRing";
import { api } from "../lib/api";
import { getDayZeroVideoUrl, readDayZeroMeta, type DayZeroMeta } from "../lib/day-zero";
import {
  computeLocalScore,
  readLocalInputs,
  type LocalInput,
} from "../lib/local-score";
import {
  loadLocalOnboardingProfile,
  profileFromApiPayload,
  type OnboardingProfile,
} from "../lib/onboarding-profile";

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
  const [profile, setProfile] = useState<OnboardingProfile | null>(() =>
    loadLocalOnboardingProfile(),
  );
  // Rawz/3 — level-up detection. Set once on mount if the user crossed
  // into a new level since they last opened /home. Soft KaiMessage,
  // dismissable, doesn't interrupt anything.
  const [levelUp, setLevelUp] = useState<{ newLevel: number; message: string } | null>(null);
  const [dayZero, setDayZero] = useState<DayZeroMeta | null>(() => readDayZeroMeta());
  const [dayZeroUrl, setDayZeroUrl] = useState<string | null>(null);

  useEffect(() => {
    api
      .getUser()
      .then((payload) => {
        const apiProfile = profileFromApiPayload(payload);
        if (apiProfile) setProfile(apiProfile);
      })
      .catch(() => {});
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

  useEffect(() => {
    let currentUrl: string | null = null;
    let cancelled = false;
    async function load() {
      if (!dayZero) {
        setDayZeroUrl(null);
        return;
      }
      const url = await getDayZeroVideoUrl(dayZero.id).catch(() => null);
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      currentUrl = url;
      setDayZeroUrl(url);
    }
    load();
    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [dayZero]);

  useEffect(() => {
    function refreshDayZero() {
      setDayZero(readDayZeroMeta());
    }
    window.addEventListener("kai:day-zero-changed", refreshDayZero);
    return () => window.removeEventListener("kai:day-zero-changed", refreshDayZero);
  }, []);

  // Bump this whenever a state-changed event fires (input logged or
  // hydration bumped). It re-triggers the score-loading effect below so
  // the user sees their score move in real time.
  const [refreshKey, setRefreshKey] = useState(0);
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
        const latestSleep = latestSleepHours(todayInputs);
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
          sleep: latestSleep != null
            ? { value: latestSleep, outOf: 8, unit: "hrs" }
            : { value: 0, outOf: 8, unit: "hrs" },
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

  const homeMessage = kaiHomeMessage(profile, data);

  return (
    <div className="mx-auto w-full max-w-md space-y-6 overflow-x-hidden pt-2 sm:max-w-lg">
      {/* Greeting + streak chip + orb */}
      <header className="flex items-start justify-between gap-3 px-1">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
            {greeting.eyebrow}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {greeting.headline}.
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs">
              <Flame size={12} className="text-accent-warm" />
              <span className="font-medium text-text-primary">
                {data.streak}-day streak
              </span>
            </span>
            {/* Rawz/3 — Level / XP pill, tap to view profile */}
            <XpPill />
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/chat")}
          aria-label="Talk to KAI"
          className="
            flex shrink-0 items-center gap-2 rounded-full
            border border-glass-border bg-surface
            p-1.5 min-[430px]:pr-3
            shadow-card
            transition active:scale-95 hover:bg-surface-muted
            focus-ring
          "
        >
          <KaiOrb size={36} />
        </button>
      </header>

      <EvolvingGoalCard profile={profile} score={data} />

      {/* Today's goals — personalized from onboarding where available */}
      <MissionsCard variant="hero" />

      {/* Daily Score hero */}
      <DailyScoreCard data={data} />

      {/* Sub-scores — horizontal scroll on mobile */}
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        <SubScoreCard
          icon={<Brain size={16} />}
          label="Mind"
          value={`${data.mind.value}`}
          unit={`/${data.mind.outOf}`}
          color="cool"
          onClick={() => navigate("/check-in")}
        />
        <SubScoreCard
          icon={<Moon size={16} />}
          label="Sleep"
          value={`${data.sleep.value}`}
          unit={data.sleep.unit}
          color="violet"
          onClick={() => navigate("/sleep/log")}
        />
        <SubScoreCard
          icon={<Heart size={16} />}
          label="Mood"
          value={`${data.mood.value}`}
          unit=""
          color="warm"
          onClick={() => navigate("/check-in")}
        />
      </div>

      {/* Rawz/3 — soft level-up moment when user crosses a threshold.
          Renders once per crossing, dismissable, doesn't take over screen. */}
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

      {/* Hydration tile — small, daily-reset counter (T-025) */}
      <HydrationTile />

      <MotivationQuote profile={profile} />

      {/* KAI message */}
      <KaiMessage
        timestamp={greeting.timestampLabel}
        orbSize={32}
        action={{
          label: "Reply",
          onClick: () => navigate("/chat"),
        }}
      >
        {homeMessage}
      </KaiMessage>

      <DayZeroCard meta={dayZero} videoUrl={dayZeroUrl} />

      {/* Recent — 3 rows */}
      <RecentActivity items={activity} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────

function DailyScoreCard({ data }: { data: DailyScoreView }) {
  const trendPositive = data.trend >= 0;
  const trendChip = trendPositive
    ? "bg-success-soft text-success"
    : "bg-warning-soft text-warning";
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
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
              <Sparkles size={12} aria-hidden="true" />
              {data.bandLabel}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[11px] ${trendChip}`}
            >
              <ArrowUpRight
                size={11}
                aria-hidden="true"
                className={trendPositive ? "" : "rotate-90"}
              />
              {trendPositive ? "+" : ""}
              {data.trend} vs yesterday
            </span>
          </div>
        </div>
        <ScoreRing value={data.score} size={104} />
      </div>
    </div>
  );
}

function MotivationQuote({ profile }: { profile: OnboardingProfile | null }) {
  const quote = quoteForProfile(profile);
  return (
    <section className="rounded-2xl border border-glass-border bg-surface px-4 py-3 text-text-primary shadow-card">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
        {quote.source}
      </p>
      <p className="mt-1.5 font-display text-base font-semibold leading-snug">
        "{quote.line}"
      </p>
      <p className="mt-1 text-xs leading-relaxed text-text-secondary">
        {quote.context}
      </p>
    </section>
  );
}

function EvolvingGoalCard({
  profile,
  score,
}: {
  profile: OnboardingProfile | null;
  score: DailyScoreView;
}) {
  const goal = evolvingGoalForProfile(profile);
  const stage = Math.max(1, Math.min(4, Math.floor((score.streak || 0) / 3) + 1));
  const completion = Math.min(100, Math.max(12, score.score || stage * 18));
  const petals = stage + 2;
  const Icon = goal.kind === "fire" ? Flame : goal.kind === "aura" ? Sparkles : Sprout;

  return (
    <section className="relative overflow-hidden rounded-glass border border-glass-border bg-surface p-4 shadow-card-lg min-[430px]:p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-cool/70 to-transparent" />
      <div className="flex items-start gap-3">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <div className={`absolute inset-3 rounded-full ${goal.glow} opacity-50 blur-xl`} />
          {goal.kind === "flower" ? (
            <div className="relative h-14 w-14">
              {Array.from({ length: petals }).map((_, index) => (
                <span
                  key={index}
                  className="absolute left-1/2 top-1/2 h-8 w-5 origin-bottom rounded-full bg-accent-cool/80 shadow-card"
                  style={{
                    transform: `translate(-50%, -100%) rotate(${(360 / petals) * index}deg) scale(${0.78 + stage * 0.08})`,
                  }}
                />
              ))}
              <span className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-warm shadow-card" />
              <span className="absolute bottom-0 left-1/2 h-9 w-1.5 -translate-x-1/2 rounded-full bg-success" />
            </div>
          ) : (
            <div className={`relative flex h-14 w-14 items-center justify-center rounded-full ${goal.surface} shadow-card animate-pulse`}>
              <Icon size={28 + stage * 2} className={goal.icon} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
              evolving goal
            </p>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-muted px-2 py-1 font-mono text-[10px] text-text-secondary">
              <Trophy size={11} />
              {stage}
            </span>
          </div>
          <h2 className="mt-2 font-display text-xl font-semibold leading-tight tracking-tight min-[430px]:text-2xl">
            {goal.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {goal.subtitle}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
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


function SubScoreCard({
  icon,
  label,
  value,
  unit,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: "cool" | "warm" | "violet";
  onClick: () => void;
}) {
  const tint = {
    cool: "bg-accent-cool-soft text-accent-cool",
    warm: "bg-accent-warm-soft text-accent-warm",
    violet: "bg-accent-soft text-accent",
  }[color];
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-w-[120px] flex-1 rounded-lg border border-glass-border bg-surface p-4 text-left shadow-card transition active:scale-[0.98] hover:bg-surface-muted focus-ring"
    >
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
    </button>
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

function DayZeroCard({
  meta,
  videoUrl,
}: {
  meta: DayZeroMeta | null;
  videoUrl: string | null;
}) {
  if (!meta) return null;
  return (
    <section className="rounded-2xl border border-glass-border bg-surface p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-text-primary">
          {videoUrl ? (
            <video src={videoUrl} className="h-full w-full object-cover opacity-80" muted playsInline />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-background">
              <Play size={18} />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 text-white">
            <Play size={16} fill="currentColor" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="text-text-muted" />
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
              Day 0 · private
            </p>
          </div>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            Recorded {relativeDay(meta.createdAt)}
          </p>
          {meta.quote && (
            <p className="mt-1 truncate text-xs text-text-secondary">
              "{meta.quote}"
            </p>
          )}
        </div>
      </div>
    </section>
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
  const latestSleep = latestSleepHours(res.inputs);
  return {
    score: score.final ?? DEMO_SCORE.score,
    bandLabel: bandToLabel(score.band),
    trend: 0,                              // Phase B follow-up: yesterday delta
    streak: countConsecutiveDays(res.inputs),
    mind: { value: score.mental ?? 0, outOf: 100 },
    sleep: latestSleep != null
      ? { value: latestSleep, outOf: 8, unit: "hrs" }
      : { value: 0, outOf: 8, unit: "hrs" },
    mood: { value: score.mood ?? 0, outOf: 100 },
  };
}

function latestSleepHours(
  inputs: Array<{ source: string; value: unknown; createdAt: string }>,
): number | null {
  const latest = [...inputs]
    .filter((input) => input.source === "sleep_log")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  const hours = (latest?.value as { hours?: unknown } | undefined)?.hours;
  return typeof hours === "number" && Number.isFinite(hours)
    ? Math.round(hours * 4) / 4
    : null;
}

function bandToLabel(b: "low" | "mid" | "high" | null): string {
  if (b === "high") return "Strong start";
  if (b === "mid") return "Steady";
  if (b === "low") return "Easy day";
  return "Getting started";
}

function quoteForProfile(profile: OnboardingProfile | null): {
  source: string;
  line: string;
  context: string;
} {
  const text = profileText(profile);

  if (hasAny(text, ["sad", "mood", "depressed", "lonely", "anxiety", "stress", "overthinking"])) {
    return {
      source: "Kobe mindset",
      line: "Pressure is a chance to rise.",
      context: "Today is not about fixing your whole life. It is about one clean rep.",
    };
  }
  if (hasAny(text, ["focus", "motivation", "procrastination", "phone", "distracted", "school"])) {
    return {
      source: "Goggins energy",
      line: "Do the first hard thing before your mood votes.",
      context: "Small start. No debate. Let action create the feeling.",
    };
  }
  if (hasAny(text, ["getting_stronger", "gym", "training", "sport", "energy", "eating"])) {
    return {
      source: "Mamba mentality",
      line: "Stack the reps nobody sees.",
      context: "Fuel, recovery, and one honest workout log. That is how momentum gets real.",
    };
  }
  if (hasAny(text, ["sleep", "tired", "recovery", "before bed"])) {
    return {
      source: "Discipline lens",
      line: "Recovery is part of the work.",
      context: "Protect tonight and tomorrow gets easier.",
    };
  }
  return {
    source: "KAI daily quote",
    line: "Win the next ten minutes.",
    context: "No huge speech. Just one move that proves you are still in it.",
  };
}

function kaiHomeMessage(
  profile: OnboardingProfile | null,
  data: DailyScoreView,
): string {
  const text = profileText(profile);
  if (data.score <= 0) {
    if (hasAny(text, ["sad", "mood", "lonely", "overthinking", "stress", "anxiety"])) {
      return "Start small today. Give me one honest check-in, then we will pick the next clean move from there.";
    }
    if (hasAny(text, ["gym", "training", "sport", "basketball", "stronger", "better shape", "muscle"])) {
      return "Let us build the day around fuel, movement, and recovery. Log the first real rep when you are ready.";
    }
    if (hasAny(text, ["focus", "phone", "distracted", "procrastination", "school", "productive"])) {
      return "No need to force a perfect day. Start with one focused block and let the system keep score.";
    }
    return "I am here. Start with one honest check-in and I will help turn today into a simple plan.";
  }
  if (data.sleep.value > 0 && data.sleep.value < 7) {
    return "Sleep was short, so today should be steady, not chaotic. Keep the goals light and protect your energy.";
  }
  if (data.score >= 75) {
    return "You have momentum. Do not overcomplicate it. Finish the next small goal and keep the streak alive.";
  }
  return "You are on the board. Pick the easiest useful goal next and we will build from there.";
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
      subtitle: "Fuel, train, recover. The stack grows when the basics repeat.",
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

function relativeDay(iso: string): string {
  const t = new Date(iso).getTime();
  const diffDays = Math.max(0, Math.floor((Date.now() - t) / 86400000));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
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
