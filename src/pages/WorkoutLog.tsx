// /workout/log — log a workout (T-023).
//
// Per AGENT_PLAN T-023 + CLAUDE.md v2 §5:
//   - Type chips: run / lift / bodyweight / yoga / sport / other
//   - Duration (5-120 min step 5, with +/- chips + slider)
//   - Intensity 1-5 (RPE — really easy → max effort)
//   - Notes (optional, short)
//
// Submit → local-first (so /home reflects immediately) then POST
// /api/workouts/log. Backend returns a 2-3 sentence Body-agent comment.
// Local fallback: a smart canned response keyed to type + intensity.

import { ArrowLeft, Dumbbell, Minus, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { api } from "../lib/api";
import { appendLocalInput } from "../lib/local-score";

type Phase = "form" | "sending" | "done";

type WorkoutType = "run" | "lift" | "bodyweight" | "yoga" | "sport" | "other";

const TYPES: Array<{ id: WorkoutType; label: string; emoji: string }> = [
  { id: "run", label: "Run", emoji: "🏃" },
  { id: "lift", label: "Lift", emoji: "🏋️" },
  { id: "bodyweight", label: "Bodyweight", emoji: "💪" },
  { id: "yoga", label: "Yoga", emoji: "🧘" },
  { id: "sport", label: "Sport", emoji: "⚽" },
  { id: "other", label: "Other", emoji: "✨" },
];

const INTENSITY_LABELS = ["Easy", "Comfortable", "Moderate", "Hard", "Max"];

export function WorkoutLog() {
  const navigate = useNavigate();
  const [type, setType] = useState<WorkoutType | null>(null);
  const [durationMin, setDurationMin] = useState<number>(30);
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [comment, setComment] = useState("");

  function bumpDuration(delta: number) {
    setDurationMin((d) => clamp(d + delta));
  }

  async function submit() {
    if (!type || phase === "sending") return;
    setPhase("sending");

    // Local first — write to local store so /home picks it up immediately.
    appendLocalInput({
      date: new Date().toISOString().slice(0, 10),
      source: "workout",
      value: { type, durationMin, intensity, notes: notes || undefined },
    });

    try {
      const res = await api.logWorkout({
        type,
        durationMin,
        intensity,
        notes: notes || undefined,
      });
      setComment(res.bodyComment || offlineWorkoutComment(type, intensity));
      setPhase("done");
    } catch {
      setComment(offlineWorkoutComment(type, intensity));
      setPhase("done");
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-md flex-col px-5 pt-2 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/home"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          workout log
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {phase === "done" ? (
        <DoneState comment={comment} onClose={() => navigate("/home")} />
      ) : (
        <Form
          type={type}
          setType={setType}
          durationMin={durationMin}
          setDurationMin={setDurationMin}
          bumpDuration={bumpDuration}
          intensity={intensity}
          setIntensity={setIntensity}
          notes={notes}
          setNotes={setNotes}
          submitting={phase === "sending"}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────────────

function Form({
  type,
  setType,
  durationMin,
  setDurationMin,
  bumpDuration,
  intensity,
  setIntensity,
  notes,
  setNotes,
  submitting,
  onSubmit,
}: {
  type: WorkoutType | null;
  setType: (t: WorkoutType) => void;
  durationMin: number;
  setDurationMin: (n: number) => void;
  bumpDuration: (delta: number) => void;
  intensity: 1 | 2 | 3 | 4 | 5;
  setIntensity: (i: 1 | 2 | 3 | 4 | 5) => void;
  notes: string;
  setNotes: (s: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-7 pb-6">
      <div>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          Log a workout
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          KAI will note how it lands. Energy + recovery — never about how you
          look.
        </p>
      </div>

      {/* Type picker */}
      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          What kind?
        </p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => {
            const selected = type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                aria-pressed={selected}
                className={`
                  flex flex-1 min-w-[100px] flex-col items-center gap-1
                  rounded-lg border py-3 text-xs font-medium
                  transition active:scale-[0.98]
                  ${
                    selected
                      ? "border-text-primary bg-text-primary text-background shadow-card-lg"
                      : "border-glass-border bg-surface text-text-primary shadow-card hover:bg-surface-muted"
                  }
                `}
              >
                <span className="text-2xl leading-none">{t.emoji}</span>
                <span className="leading-tight">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          How long?
        </p>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 shadow-card">
          <button
            type="button"
            onClick={() => bumpDuration(-5)}
            aria-label="Decrease 5 minutes"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-text-primary transition hover:bg-glass-border focus-ring"
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <div className="text-center">
            <div className="font-mono text-2xl font-semibold tracking-tight">
              {durationMin}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              minutes
            </div>
          </div>
          <button
            type="button"
            onClick={() => bumpDuration(5)}
            aria-label="Increase 5 minutes"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-text-primary transition hover:bg-glass-border focus-ring"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
        <input
          type="range"
          min={5}
          max={120}
          step={5}
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
          aria-label="Duration in minutes"
          className="w-full accent-text-primary"
        />
      </div>

      {/* Intensity */}
      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          How hard?  <span className="ml-1 normal-case text-text-soft">— effort, not weight</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3, 4, 5] as const).map((n) => {
            const selected = intensity === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setIntensity(n)}
                aria-pressed={selected}
                className={`
                  flex flex-1 min-w-[60px] flex-col items-center gap-0.5
                  rounded-lg border py-2.5 text-xs font-medium
                  transition active:scale-[0.98]
                  ${
                    selected
                      ? "border-text-primary bg-text-primary text-background shadow-card-lg"
                      : "border-glass-border bg-surface text-text-primary shadow-card hover:bg-surface-muted"
                  }
                `}
              >
                <span className="font-mono text-lg leading-none">{n}</span>
                <span className="leading-tight">{INTENSITY_LABELS[n - 1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          Anything KAI should know?  <span className="ml-1 normal-case text-text-soft">— optional</span>
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="A line is enough."
          rows={2}
          maxLength={500}
          className="
            w-full resize-none rounded-lg border border-glass-border bg-surface
            px-4 py-3 text-base text-text-primary
            placeholder:text-text-muted shadow-card focus-ring
          "
        />
      </div>

      <div className="mt-auto pb-2">
        <button
          type="button"
          disabled={!type || submitting}
          onClick={onSubmit}
          className="
            flex h-12 w-full items-center justify-center gap-2 rounded-full
            bg-text-primary text-background font-medium
            shadow-card transition active:scale-[0.99]
            disabled:cursor-not-allowed disabled:bg-text-soft
            focus-ring
          "
        >
          <Dumbbell size={16} aria-hidden="true" />
          {submitting ? "Sending to KAI…" : "Log it"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Done state
// ─────────────────────────────────────────────────────────────────────

function DoneState({
  comment,
  onClose,
}: {
  comment: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col pb-6">
      <div className="flex flex-col items-center gap-2 pt-6 pb-4">
        <KaiOrb size={88} />
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
          <Sparkles size={12} aria-hidden="true" /> Logged
        </p>
      </div>

      <div className="mt-4">
        <KaiMessage orbSize={32}>{comment}</KaiMessage>
      </div>

      <div className="mt-auto space-y-2 pb-2">
        <button
          type="button"
          onClick={onClose}
          className="
            flex h-12 w-full items-center justify-center rounded-full
            bg-text-primary text-background font-medium
            shadow-card transition active:scale-[0.99] focus-ring
          "
        >
          Back to home
        </button>
        <Link
          to="/chat"
          className="
            flex h-12 w-full items-center justify-center rounded-full
            border border-glass-border bg-surface text-text-primary font-medium
            shadow-card transition hover:bg-surface-muted active:scale-[0.99]
            focus-ring
          "
        >
          Talk to KAI
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function clamp(n: number, lo = 5, hi = 120): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Smart canned comment when the Worker is unreachable. Keyed to type +
 *  intensity. Stays well clear of forbidden body-language and avoids any
 *  weight/barbell recommendation regardless of age. */
function offlineWorkoutComment(type: WorkoutType, intensity: number): string {
  const easy = intensity <= 2;
  const max = intensity >= 5;

  if (easy) {
    return "Logged. Easy days are not lazy — they're how you keep showing up. Eat regularly and sleep well tonight.";
  }
  if (max) {
    return "Logged — that was a real one. Hydrate, eat something with protein in the next hour, and give yourself permission for an easy day tomorrow.";
  }

  switch (type) {
    case "run":
      return "Logged. Solid steady-state day. Stretch the calves and hips for five minutes before bed and you'll thank yourself in the morning.";
    case "lift":
    case "bodyweight":
      return "Logged. Now the work is in recovery — protein within an hour, water, and at least 8 hours of sleep tonight.";
    case "yoga":
      return "Logged. Slow work is real work — recovery sessions like this are where the nervous system resets. Notice if you sleep deeper tonight.";
    case "sport":
      return "Logged. Good time on your feet. Refuel with carbs + protein, and notice tomorrow whether anything feels tight — that's what to address first.";
    default:
      return "Logged. Eat something balanced in the next hour and notice how your energy holds for the rest of the day.";
  }
}
