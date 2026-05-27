// /challenges — opt-in time-bound challenges (Rawz/6).
//
// Two sections:
//   1. Active — what you're currently in, with progress + days remaining
//   2. Browse — catalog of available challenges, tap "Start" to join
//
// Completed challenges show in a small "done" strip at the bottom.
//
// Per D-021: no shame on missed days. Progress copy is "days you've
// logged" never "days missed". Leaving is silent.

import {
  ArrowLeft,
  Check,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  NotebookPen,
  Sparkles,
  Sun,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { FlowerProgressBar } from "../components/FlowerProgressBar";
import {
  getActiveChallenges,
  getChallengeListings,
  joinChallenge,
  leaveChallenge,
  type Challenge,
  type ChallengeCategory,
  type ChallengeListing,
  type ChallengeProgress,
} from "../lib/local-challenges";

const CATEGORY_ICONS: Record<ChallengeCategory, LucideIcon> = {
  morning: Sun,
  evening: Moon,
  body: Dumbbell,
  mind: NotebookPen,
  anchor: Flame,
};

const CATEGORY_TINTS: Record<ChallengeCategory, string> = {
  morning: "bg-accent-warm-soft text-accent-warm",
  evening: "bg-accent-soft text-accent",
  body: "bg-accent-warm-soft text-accent-warm",
  mind: "bg-accent-cool-soft text-accent-cool",
  anchor: "bg-success-soft text-success",
};

export function Challenges() {
  const [active, setActive] = useState<ChallengeProgress[] | null>(null);
  const [listings, setListings] = useState<ChallengeListing[] | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    setActive(getActiveChallenges());
    setListings(getChallengeListings());
  }

  function join(id: string) {
    joinChallenge(id);
    refresh();
  }

  function leave(id: string) {
    leaveChallenge(id);
    refresh();
  }

  const available = useMemo(
    () => listings?.filter((l) => l.state === "available") ?? [],
    [listings],
  );
  const completed = useMemo(
    () => listings?.filter((l) => l.state === "completed") ?? [],
    [listings],
  );

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
          challenges
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <div className="pb-5 text-center">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          Challenges
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Short opt-in stretches. No penalties — miss a day, the count stays. Show up when you can.
        </p>
      </div>

      {/* ACTIVE */}
      {active && active.length > 0 && (
        <section className="mb-6">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            in progress
          </p>
          <div className="space-y-2">
            {active.map((p) => (
              <ActiveCard key={p.challenge.id} progress={p} onLeave={() => leave(p.challenge.id)} />
            ))}
          </div>
        </section>
      )}

      {/* BROWSE */}
      <section className="mb-6">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          {active && active.length > 0 ? "more to try" : "pick one to start"}
        </p>
        <div className="space-y-2">
          {available.map((l) => (
            <AvailableCard
              key={l.challenge.id}
              challenge={l.challenge}
              onJoin={() => join(l.challenge.id)}
            />
          ))}
          {available.length === 0 && (
            <p className="rounded-glass border border-glass-border bg-surface p-5 text-center text-sm text-text-secondary shadow-card">
              You're in everything. Finish one and more will appear.
            </p>
          )}
        </div>
      </section>

      {/* COMPLETED */}
      {completed.length > 0 && (
        <section>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            finished
          </p>
          <div className="space-y-2">
            {completed.map((l) => (
              <CompletedRow key={l.challenge.id} challenge={l.challenge} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Card variants
// ─────────────────────────────────────────────────────────────────────

function ActiveCard({
  progress,
  onLeave,
}: {
  progress: ChallengeProgress;
  onLeave: () => void;
}) {
  const Icon = CATEGORY_ICONS[progress.challenge.category];
  const tint = CATEGORY_TINTS[progress.challenge.category];
  return (
    <article
      className={`
        rounded-lg border bg-surface p-4 shadow-card
        ${progress.completed ? "border-success-soft" : "border-glass-border"}
      `}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">
            {progress.challenge.title}
          </p>
          <p className="mt-0.5 text-xs text-text-secondary leading-snug">
            {progress.challenge.blurb}
          </p>
        </div>
        {progress.completed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-medium text-success">
            <Check size={10} aria-hidden="true" /> Done
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="flex items-end justify-between gap-3 pb-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {progress.daysHit} / {progress.challenge.targetDays} days logged
          </span>
          {!progress.completed && (
            <span className="font-mono text-[10px] text-text-secondary">
              {progress.daysRemaining}d left
            </span>
          )}
        </div>
        {/* The bar IS the flower — stem grows left-to-right, blooms into
            a full open flower at the right end on completion. */}
        <FlowerProgressBar
          value={progress.daysHit}
          target={progress.challenge.targetDays}
          completed={progress.completed}
          ariaLabel={`${progress.daysHit} of ${progress.challenge.targetDays} days logged`}
          className="text-text-secondary"
        />
        <p className="sr-only">
          {progress.daysHit} of {progress.challenge.targetDays} days logged
        </p>
      </div>

      {/* Leave (silent, no notification, no shame) */}
      {!progress.completed && (
        <button
          type="button"
          onClick={onLeave}
          className="
            mt-3 inline-flex items-center gap-1 rounded-full
            text-[10px] font-medium uppercase tracking-[0.14em]
            text-text-muted transition hover:text-text-secondary focus-ring
          "
        >
          Leave
        </button>
      )}
    </article>
  );
}

function AvailableCard({
  challenge,
  onJoin,
}: {
  challenge: Challenge;
  onJoin: () => void;
}) {
  const Icon = CATEGORY_ICONS[challenge.category];
  const tint = CATEGORY_TINTS[challenge.category];
  return (
    <article className="rounded-lg border border-glass-border bg-surface p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">{challenge.title}</p>
          <p className="mt-0.5 text-xs text-text-secondary leading-snug">{challenge.blurb}</p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {challenge.targetDays} of {challenge.durationDays} days
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onJoin}
        className="
          mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full
          bg-text-primary text-background text-sm font-medium
          shadow-card transition active:scale-[0.99] focus-ring
        "
      >
        <Sparkles size={12} aria-hidden="true" />
        Start
      </button>
    </article>
  );
}

function CompletedRow({ challenge }: { challenge: Challenge }) {
  const Icon = CATEGORY_ICONS[challenge.category];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-glass-border bg-surface-muted/40 px-4 py-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-soft text-success">
        <Check size={12} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-primary">{challenge.title}</p>
      </div>
      <Icon size={14} className="text-text-muted" aria-hidden="true" />
    </div>
  );
}
