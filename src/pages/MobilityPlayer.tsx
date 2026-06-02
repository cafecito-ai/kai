// /mobility/:id — step-by-step routine player (T-026).
//
// Walks through one routine step at a time with a countdown per step.
// User can pause, skip forward/back, or finish early. No social pressure
// — finishing early is fine; we don't track adherence.

import { ArrowLeft, Check, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import {
  getRoutine,
  routineTotalSeconds,
  type MobilityRoutine,
} from "../data/mobility-routines";

export function MobilityPlayer() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routine = useMemo(() => getRoutine(params.id ?? ""), [params.id]);

  if (!routine) {
    return (
      <div className="mx-auto w-full max-w-md px-5 pt-8 sm:max-w-lg">
        <p className="rounded-glass border border-glass-border bg-surface p-6 text-center text-sm text-text-secondary shadow-card">
          Routine not found.
        </p>
        <Link
          to="/mobility"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-glass-border bg-surface px-4 text-sm font-medium text-text-primary shadow-card focus-ring"
        >
          Back to all routines
        </Link>
      </div>
    );
  }

  return <Player routine={routine} onFinish={() => navigate("/mobility")} />;
}

function Player({
  routine,
  onFinish,
}: {
  routine: MobilityRoutine;
  onFinish: () => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [remaining, setRemaining] = useState(routine.steps[0].durationSec);
  const [playing, setPlaying] = useState(true);
  const [done, setDone] = useState(false);

  const step = routine.steps[stepIdx];
  const totalSec = routineTotalSeconds(routine);
  const elapsedSec =
    routine.steps.slice(0, stepIdx).reduce((s, x) => s + x.durationSec, 0) +
    (step.durationSec - remaining);
  const overallPct = Math.min(100, (elapsedSec / totalSec) * 100);
  const stepPct = ((step.durationSec - remaining) / step.durationSec) * 100;

  // Countdown tick.
  useEffect(() => {
    if (!playing || done) return;
    if (remaining <= 0) {
      // Advance.
      if (stepIdx < routine.steps.length - 1) {
        const next = stepIdx + 1;
        setStepIdx(next);
        setRemaining(routine.steps[next].durationSec);
      } else {
        setDone(true);
      }
      return;
    }
    const t = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [playing, remaining, stepIdx, routine.steps, done]);

  function next() {
    if (stepIdx < routine.steps.length - 1) {
      const idx = stepIdx + 1;
      setStepIdx(idx);
      setRemaining(routine.steps[idx].durationSec);
    } else {
      setDone(true);
    }
  }

  function prev() {
    if (stepIdx > 0) {
      const idx = stepIdx - 1;
      setStepIdx(idx);
      setRemaining(routine.steps[idx].durationSec);
    }
  }

  if (done) {
    return <DoneCard routine={routine} onClose={onFinish} />;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-md flex-col px-5 pt-2 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/mobility"
          aria-label="Back to routines"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          {routine.title.toLowerCase()}
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {/* Overall progress */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full bg-text-primary transition-all duration-300"
          style={{ width: `${overallPct}%` }}
        />
      </div>
      <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        Step {stepIdx + 1} of {routine.steps.length}
      </p>

      {/* Step card */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="font-display text-3xl font-semibold leading-tight tracking-tight">
          {step.name}
        </p>
        <p className="mt-3 max-w-sm text-base text-text-secondary">
          {step.instruction}
        </p>

        {/* Countdown ring */}
        <div className="relative mt-8">
          <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={2 * Math.PI * 70 * (1 - stepPct / 100)}
              strokeLinecap="round"
              className="text-accent-cool transition-[stroke-dashoffset] duration-1000 ease-linear"
              transform="rotate(-90 80 80)"
            />
          </svg>
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-4xl font-bold text-text-primary">
            {remaining}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pb-4">
        <button
          type="button"
          onClick={prev}
          disabled={stepIdx === 0}
          aria-label="Previous step"
          className="
            flex h-12 w-12 items-center justify-center rounded-full
            border border-glass-border bg-surface text-text-primary shadow-card
            transition active:scale-95 focus-ring
            disabled:cursor-not-allowed disabled:opacity-40
          "
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
          className="
            flex h-16 w-16 items-center justify-center rounded-full
            bg-text-primary text-background shadow-card-lg
            transition active:scale-95 focus-ring
          "
        >
          {playing ? <Pause size={24} aria-hidden="true" /> : <Play size={24} aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next step"
          className="
            flex h-12 w-12 items-center justify-center rounded-full
            border border-glass-border bg-surface text-text-primary shadow-card
            transition active:scale-95 focus-ring
          "
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function DoneCard({
  routine,
  onClose,
}: {
  routine: MobilityRoutine;
  onClose: () => void;
}) {
  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-md flex-col items-center justify-center px-5 pt-2 text-center sm:max-w-lg">
      <KaiOrb size={88} />
      <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
        <Check size={12} aria-hidden="true" />
        {routine.title}
      </p>
      <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
        Nice work.
      </h2>
      <div className="mt-5 w-full">
        <KaiMessage orbSize={32}>
          {routinePostNote(routine)}
        </KaiMessage>
      </div>
      <div className="mt-8 flex w-full flex-col gap-2 pb-6">
        <button
          type="button"
          onClick={onClose}
          className="
            flex h-12 w-full items-center justify-center rounded-full
            bg-text-primary text-background font-medium
            shadow-card transition active:scale-[0.99] focus-ring
          "
        >
          Back to routines
        </button>
        <Link
          to="/home"
          className="
            flex h-12 w-full items-center justify-center rounded-full
            border border-glass-border bg-surface text-text-primary font-medium
            shadow-card transition hover:bg-surface-muted active:scale-[0.99] focus-ring
          "
        >
          Home
        </Link>
      </div>
    </div>
  );
}

function routinePostNote(routine: { categories: string[]; durationMin: number }): string {
  if (routine.categories.includes("evening")) {
    return "That'll help you settle. Drink some water and try to be off screens 30 minutes before bed if you can.";
  }
  if (routine.categories.includes("morning")) {
    return "Good start. Drink water — your body's been without it for hours.";
  }
  if (routine.categories.includes("recovery")) {
    return "That's the recovery work most teens skip. Notice if you feel looser tomorrow.";
  }
  if (routine.categories.includes("warmup")) {
    return "You're ready. Don't go full effort the first minute — let yourself ramp.";
  }
  return `${routine.durationMin} minutes you'll feel tomorrow. Small reps add up.`;
}
