import {
  ArrowUpRight,
  Flame,
  Lock,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { MissionsCard } from "../components/MissionsCard";
import { ScoreRing } from "../components/ScoreRing";
import { api } from "../lib/api";
import { readDayZeroMeta, type DayZeroMeta } from "../lib/day-zero";
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

type DailyScoreView = {
  score: number;
  bandLabel: string;
  trend: number;
  streak: number;
  mind: { value: number; outOf: number };
  sleep: { value: number; outOf: number; unit: string };
  mood: { value: number; outOf: number };
};

const EMPTY_SCORE: DailyScoreView = {
  score: 0,
  bandLabel: "No data yet",
  trend: 0,
  streak: 0,
  mind: { value: 0, outOf: 100 },
  sleep: { value: 0, outOf: 8, unit: "hrs" },
  mood: { value: 0, outOf: 100 },
};

export function Home() {
  const greeting = greetingForNow();
  const navigate = useNavigate();
  const [data, setData] = useState<DailyScoreView>(EMPTY_SCORE);
  const [profile, setProfile] = useState<OnboardingProfile | null>(() =>
    loadLocalOnboardingProfile(),
  );
  const [levelUp, setLevelUp] = useState<{ newLevel: number; message: string } | null>(null);
  const [dayZero, setDayZero] = useState<DayZeroMeta | null>(() => readDayZeroMeta());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api
      .getUser()
      .then((payload) => {
        const apiProfile = profileFromApiPayload(payload);
        if (apiProfile) setProfile(apiProfile);
      })
      .catch(() => {});

    import("../lib/local-xp").then(({ checkAndConsumeLevelUp, levelUpMessage, labelForLevel }) => {
      const result = checkAndConsumeLevelUp();
      if (!result.leveledUp) return;
      setLevelUp({
        newLevel: result.newLevel,
        message: levelUpMessage(result.newLevel),
      });
      api
        .postGroupActivity({
          kind: "level_up",
          refKey: String(result.newLevel),
          hint: labelForLevel(result.newLevel),
        })
        .catch(() => {});
    });

    import("../lib/local-badges").then(({ checkAndConsumeNewBadges }) => {
      for (const badge of checkAndConsumeNewBadges()) {
        api
          .postGroupActivity({
            kind: "badge",
            refKey: badge.badge.id,
            hint: badge.badge.title,
          })
          .catch(() => {});
      }
    });

    import("../lib/local-streak-milestones").then(
      ({ checkAndConsumeStreakMilestones }) => {
        for (const days of checkAndConsumeStreakMilestones()) {
          api.postGroupActivity({ kind: "streak", refKey: String(days) }).catch(() => {});
        }
      },
    );
  }, []);

  useEffect(() => {
    function onChange() {
      setRefreshKey((key) => key + 1);
    }
    window.addEventListener("kai:input-appended", onChange);
    window.addEventListener("kai:state-changed", onChange);
    return () => {
      window.removeEventListener("kai:input-appended", onChange);
      window.removeEventListener("kai:state-changed", onChange);
    };
  }, []);

  useEffect(() => {
    function refreshDayZero() {
      setDayZero(readDayZeroMeta());
    }
    window.addEventListener("kai:day-zero-changed", refreshDayZero);
    return () => window.removeEventListener("kai:day-zero-changed", refreshDayZero);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await api.getDailyScoreToday();
        if (cancelled) return;
        if (response.score.final != null) {
          setData(toDailyScoreView(response));
          return;
        }
      } catch {
        /* use local fallback */
      }

      if (cancelled) return;
      const inputs = readLocalInputs();
      if (inputs.length === 0) {
        setData(EMPTY_SCORE);
        return;
      }
      const local = computeLocalScore(inputs);
      const todayInputs = inputs.filter(
        (input) => input.date === new Date().toISOString().slice(0, 10),
      );
      const latestSleep = latestSleepHours(todayInputs);
      setData({
        score: local.final ?? 0,
        bandLabel:
          local.band === "high"
            ? "Strong start"
            : local.band === "mid"
              ? "Steady"
              : local.band === "low"
                ? "Easy day"
                : "Getting started",
        trend: 0,
        streak: local.streak,
        mind: { value: local.mental ?? 0, outOf: 100 },
        sleep:
          latestSleep != null
            ? { value: latestSleep, outOf: 8, unit: "hrs" }
            : { value: 0, outOf: 8, unit: "hrs" },
        mood: { value: local.mood ?? 0, outOf: 100 },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const homeMessage = kaiHomeMessage(profile, data);
  const dayZeroElevated = dayZero
    ? shouldElevateDayZero(profile, data, readLocalInputs())
    : false;

  return (
    <div className="mx-auto w-full max-w-md max-w-full space-y-5 overflow-x-hidden pt-2 sm:max-w-lg">
      <header className="flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
            {greeting.eyebrow}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {greeting.headline}.
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {data.streak > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs">
              <Flame size={12} className="text-accent-warm" aria-hidden="true" />
              <span className="font-medium text-text-primary">{data.streak}</span>
            </span>
          )}
        </div>
      </header>

      <button
        type="button"
        onClick={() => navigate("/chat")}
        className="
          group flex w-full max-w-full items-center gap-3 rounded-glass
          border border-glass-border bg-text-primary px-4 py-3.5
          text-left text-background shadow-card-lg
          transition active:scale-[0.99] focus-ring
        "
      >
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background/10">
          <KaiOrb size={42} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl font-semibold leading-tight">
            Talk to KAI
          </span>
          <span className="mt-0.5 block text-sm leading-snug text-background/68">
            Check in, ask for the next move, or say what feels off.
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-text-primary transition group-active:scale-95">
          <MessageCircle size={17} aria-hidden="true" />
        </span>
      </button>

      <DailyScoreCard data={data} />

      <MissionsCard variant="hero" />

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
              className="shrink-0 rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent transition hover:bg-accent-soft/60 focus-ring"
            >
              got it
            </button>
          </div>
        </div>
      )}

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

      {dayZeroElevated && (
        <VaultReminder meta={dayZero} onOpen={() => navigate("/vault")} />
      )}
    </div>
  );
}

function DailyScoreCard({ data }: { data: DailyScoreView }) {
  const trendPositive = data.trend >= 0;
  return (
    <section className="relative overflow-hidden rounded-glass border border-glass-border bg-surface p-6 shadow-card-lg">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            Daily Score
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
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 font-mono text-[11px] text-text-secondary">
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
    </section>
  );
}

function VaultReminder({
  meta,
  onOpen,
}: {
  meta: DayZeroMeta | null;
  onOpen: () => void;
}) {
  if (!meta) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-accent-warm/35 bg-accent-warm-soft/45 p-4 text-left shadow-card transition active:scale-[0.99] focus-ring"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-accent-warm">
          <Lock size={15} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-accent-warm">
            Private vault
          </span>
          <span className="mt-1 block text-sm font-semibold text-text-primary">
            Watch this before quitting.
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
            Future you left a reason {relativeDay(meta.createdAt)}. Open it only if you need the reminder.
          </span>
        </span>
      </div>
    </button>
  );
}

function shouldElevateDayZero(
  profile: OnboardingProfile | null,
  score: DailyScoreView,
  inputs: LocalInput[],
): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const todayInputs = inputs.filter((input) => input.date === today);
  const hasPriorInputs = inputs.some((input) => input.date < today);
  const text = `${profileText(profile)} ${inputs.map(inputText).join(" ")}`;

  if (hasAny(text, ["unmotivated", "quit", "giving up", "doomscroll", "doom scrolling", "streak break"])) {
    return true;
  }
  if (hasAny(text, ["missed habits", "missed my habits", "late night", "up late"])) {
    return true;
  }
  if (score.score > 0 && score.score <= 45) {
    return true;
  }
  if (hasPriorInputs && todayInputs.length === 0) {
    return true;
  }
  return todayInputs.some((input) => {
    const value = input.value as { mood?: unknown; energy?: unknown; sentiment?: unknown };
    return value.mood === 1 || value.energy === 1 || value.sentiment === -1;
  });
}

function inputText(input: LocalInput): string {
  if (!input.value || typeof input.value !== "object") return "";
  return Object.values(input.value as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

function toDailyScoreView(
  response: Awaited<ReturnType<typeof api.getDailyScoreToday>>,
): DailyScoreView {
  const latestSleep = latestSleepHours(response.inputs);
  return {
    score: response.score.final ?? 0,
    bandLabel: bandToLabel(response.score.band),
    trend: 0,
    streak: countConsecutiveDays(response.inputs),
    mind: { value: response.score.mental ?? 0, outOf: 100 },
    sleep:
      latestSleep != null
        ? { value: latestSleep, outOf: 8, unit: "hrs" }
        : { value: 0, outOf: 8, unit: "hrs" },
    mood: { value: response.score.mood ?? 0, outOf: 100 },
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

function bandToLabel(band: "low" | "mid" | "high" | null): string {
  if (band === "high") return "Strong start";
  if (band === "mid") return "Steady";
  if (band === "low") return "Easy day";
  return "Getting started";
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

function countConsecutiveDays(inputs: unknown[]): number {
  return inputs.length > 0 ? 1 : 0;
}

function relativeDay(iso: string): string {
  const timestamp = new Date(iso).getTime();
  const diffDays = Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}

function greetingForNow(now = new Date()): {
  eyebrow: string;
  headline: string;
  timestampLabel: string;
} {
  const hour = now.getHours();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  if (hour >= 5 && hour < 12) {
    return {
      eyebrow: `${weekday} morning`,
      headline: "Morning",
      timestampLabel: "this morning",
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      eyebrow: weekday,
      headline: "Afternoon",
      timestampLabel: "this afternoon",
    };
  }
  if (hour >= 17 && hour < 22) {
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
