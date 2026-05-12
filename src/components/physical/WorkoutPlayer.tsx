import { CheckCircle2, Dumbbell, Pause, Play, SkipForward } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { scrubProgressEvent } from "../../lib/sensitive-events";
import { useProgressStore } from "../../stores/progressStore";
import { Button } from "../ui/Button";
import {
  WORKOUTS,
  WORKOUT_CATEGORY_LABEL,
  workoutDurationSeconds,
  type Workout,
  type WorkoutCategory
} from "../../lib/workouts";

type Props = {
  onSessionComplete?: (input: {
    workoutId: string;
    workoutName: string;
    completedSegments: number;
    totalSegments: number;
    elapsedSeconds: number;
  }) => void;
};

const CATEGORY_ORDER: WorkoutCategory[] = ["warmup", "mobility", "strength", "conditioning", "reset"];

/** Credit applied to a rep-based segment when the teen taps "Done". Capped
 * because a routine should not record minutes of credit for a fast tap-through. */
const REP_SEGMENT_CREDIT_SECONDS = 30;

type Phase = "work" | "rest";

/**
 * Walks the teen through a routine one exercise at a time. Timed segments
 * auto-advance; rep-based segments wait for the user to tap "Done with this
 * one". Pause / Skip / Stop-and-save controls always visible.
 *
 * Honors prefers-reduced-motion (no looping animations are used; the only
 * visual change per tick is the progress numbers).
 *
 * Workouts are picked from the static catalog in src/lib/workouts.ts. Real
 * art / video for each exercise is a follow-up once Lev's design direction
 * lands (D1).
 */
export function WorkoutPlayer({ onSessionComplete }: Props) {
  const [selectedId, setSelectedId] = useState<string>(WORKOUTS[0].id);
  const workout = useMemo(() => WORKOUTS.find((w) => w.id === selectedId) ?? WORKOUTS[0], [selectedId]);
  const [step, setStep] = useState<number>(-1); // -1 = preview / not started
  const [phase, setPhase] = useState<Phase>("work");
  const [running, setRunning] = useState(false);
  const [segElapsed, setSegElapsed] = useState(0);
  const totalElapsedRef = useRef(0);
  const firedRef = useRef(false);
  const addEvent = useProgressStore((state) => state.addEvent);

  // The tick effect now drives both work and rest phases. Codex P2 #1:
  // configured rests were never honored — the auto-advance dumped users
  // straight into the next exercise. With a real rest phase, the
  // segment's restSeconds is shown as a countdown after the work
  // portion expires. Rep segments still have no limit (limit === 0) so
  // they wait on the teen tapping "Done".
  useEffect(() => {
    if (!running) return;
    const seg = workout.exercises[step];
    if (!seg) return;
    const limit = phase === "work" ? seg.durationSeconds ?? 0 : seg.restSeconds ?? 0;
    const startedAt = Date.now() - segElapsed * 1000;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSegElapsed(elapsed);
      if (limit > 0 && elapsed >= limit) advance();
    };
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, step, workout.id, phase]);

  const total = workout.exercises.length;
  const current = step >= 0 ? workout.exercises[step] : null;
  const phaseLimit =
    phase === "work" ? current?.durationSeconds ?? 0 : current?.restSeconds ?? 0;
  const segmentRemaining = Math.max(0, phaseLimit - segElapsed);

  /**
   * How much wallclock time to credit for the segment+phase currently in
   * progress. Capped so a skipped-immediately segment can't book minutes
   * of work, and a paused-and-walked-away session can't book hours.
   */
  function pendingCredit(): number {
    if (!current) return 0;
    if (phase === "work") {
      if (current.durationSeconds) {
        return Math.min(segElapsed, current.durationSeconds);
      }
      if (current.reps) {
        return Math.min(segElapsed, REP_SEGMENT_CREDIT_SECONDS);
      }
      return 0;
    }
    return Math.min(segElapsed, current.restSeconds ?? 0);
  }

  function start() {
    firedRef.current = false;
    totalElapsedRef.current = 0;
    setStep(0);
    setSegElapsed(0);
    setPhase("work");
    setRunning(true);
  }

  function advance() {
    // Credit only the time actually spent in this phase. Codex P2 #3:
    // a Skip on a 60s segment after 2s used to book the full 60s.
    totalElapsedRef.current += pendingCredit();

    if (phase === "work" && current?.restSeconds && current.restSeconds > 0 && step < total - 1) {
      // Move into the rest phase (Codex P2 #1: configured rest must run).
      setPhase("rest");
      setSegElapsed(0);
      return;
    }

    if (step >= total - 1) {
      finishInternal({ completedSegments: total });
      return;
    }
    setStep(step + 1);
    setSegElapsed(0);
    setPhase("work");
  }

  function skip() {
    advance();
  }

  function stopAndSave() {
    // Codex P2 #2: include in-progress phase time before finishing.
    totalElapsedRef.current += pendingCredit();
    finishInternal({ completedSegments: step + 1 });
  }

  function finishInternal(opts: { completedSegments: number }) {
    if (firedRef.current) return;
    firedRef.current = true;
    setRunning(false);
    setStep(-1);
    setPhase("work");
    const elapsedSeconds = totalElapsedRef.current;
    if (onSessionComplete) {
      onSessionComplete({
        workoutId: workout.id,
        workoutName: workout.name,
        completedSegments: opts.completedSegments,
        totalSegments: total,
        elapsedSeconds
      });
    } else {
      addEvent(
        scrubProgressEvent({
          engine: "physical" as const,
          eventType: "workout",
          eventValue: Math.min(50, 14 + Math.round(elapsedSeconds / 30)),
          payload: {
            workoutId: workout.id,
            completedSegments: opts.completedSegments,
            totalSegments: total,
            elapsedSeconds
          }
        })
      );
    }
  }

  const grouped = useMemo(() => {
    const byCat: Record<WorkoutCategory, Workout[]> = {
      warmup: [],
      mobility: [],
      strength: [],
      conditioning: [],
      reset: []
    };
    for (const w of WORKOUTS) byCat[w.category].push(w);
    return byCat;
  }, []);

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-lime text-sage">
        <Dumbbell />
      </div>
      <p className="eyebrow">guided movement</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Pick a routine. Hit start.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Bodyweight only. Anywhere. Ease off any move that doesn't feel right today.
      </p>

      {step === -1 && (
        <>
          <div className="mt-4 space-y-3">
            {CATEGORY_ORDER.map((cat) => (
              <fieldset key={cat}>
                <legend className="text-xs font-bold uppercase tracking-wider text-muted">
                  {WORKOUT_CATEGORY_LABEL[cat]}
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {grouped[cat].map((w) => {
                    const active = w.id === selectedId;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedId(w.id)}
                        aria-pressed={active}
                        className={`focus-ring rounded-kai border p-3 text-left transition ${
                          active ? "border-sage bg-lime" : "border-line bg-paper hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-black">{w.name}</p>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-muted">
                            {w.totalMinutes} min
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-snug text-muted">{w.description}</p>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="mt-5 rounded-kai border border-line bg-paper p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Selected: {workout.name}</p>
            <p className="mt-1 text-sm font-semibold">{workout.setup}</p>
            <p className="mt-1 text-xs text-muted">
              {workout.exercises.length} segments · ~{Math.round(workoutDurationSeconds(workout) / 60)} min total
            </p>
          </div>
          <Button className="mt-4" onClick={start}>
            Start workout
          </Button>
        </>
      )}

      {step >= 0 && current && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Step {step + 1} of {total} · {workout.name}
            </p>
            <p className="text-xs text-muted">{Math.round((step / total) * 100)}% done</p>
          </div>
          <div className="h-2 w-full rounded-full bg-paper">
            <div className="h-2 rounded-full bg-sage transition-all" style={{ width: `${(step / total) * 100}%` }} />
          </div>

          <section className="rounded-kai border border-line bg-paper p-5">
            {phase === "rest" ? (
              <>
                <p className="eyebrow text-muted">rest</p>
                <h3 className="mt-1 font-display text-2xl font-black tracking-normal">
                  Catch your breath
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink">
                  Next up: {current.name}
                </p>
                <p
                  className="mt-4 font-display text-5xl font-black text-sage tabular-nums"
                  aria-live="polite"
                >
                  {formatMmSs(segmentRemaining)}
                </p>
              </>
            ) : (
              <>
                <h3 className="font-display text-2xl font-black tracking-normal">{current.name}</h3>
                <p className="mt-2 text-sm leading-6 text-ink">{current.cue}</p>
                <div className="mt-4">
                  {current.durationSeconds ? (
                    <p
                      className="font-display text-5xl font-black text-sage tabular-nums"
                      aria-live="polite"
                    >
                      {formatMmSs(segmentRemaining)}
                    </p>
                  ) : current.reps ? (
                    <p className="font-display text-5xl font-black text-sage tabular-nums">
                      {current.reps} reps
                    </p>
                  ) : null}
                </div>
                {current.restSeconds ? (
                  <p className="mt-2 text-xs text-muted">Then rest {current.restSeconds}s</p>
                ) : null}
              </>
            )}
          </section>

          <div className="flex flex-wrap gap-2">
            {running ? (
              <Button variant="secondary" onClick={() => setRunning(false)}>
                <Pause size={16} aria-hidden="true" /> Pause
              </Button>
            ) : (
              <Button onClick={() => setRunning(true)}>
                <Play size={16} aria-hidden="true" /> Resume
              </Button>
            )}
            <Button variant="secondary" onClick={skip}>
              {phase === "rest" ? (
                <>
                  <SkipForward size={16} aria-hidden="true" /> Skip rest
                </>
              ) : current.reps ? (
                <>
                  <CheckCircle2 size={16} aria-hidden="true" /> Done with this one
                </>
              ) : (
                <>
                  <SkipForward size={16} aria-hidden="true" /> Skip
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={stopAndSave}>
              Stop and save
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function formatMmSs(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
