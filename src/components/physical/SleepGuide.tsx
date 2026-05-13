import { CheckCircle2, Moon, Pause, Play, SkipForward } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { scrubProgressEvent } from "../../lib/sensitive-events";
import { useProgressStore } from "../../stores/progressStore";
import { Button } from "../ui/Button";
import {
  SLEEP_CATEGORY_LABEL,
  SLEEP_TIPS,
  WIND_DOWN_ROUTINES,
  windDownRoutineDurationSeconds,
  type SleepCategory,
  type WindDownRoutine
} from "../../lib/sleep";

type Props = {
  onSessionComplete?: (input: {
    routineId: string;
    routineName: string;
    completedSteps: number;
    totalSteps: number;
    elapsedSeconds: number;
  }) => void;
};

const CATEGORY_ORDER: SleepCategory[] = ["last_resort", "quick", "standard", "extended"];

/**
 * Sleep guide surface: wind-down routine picker + player, plus a tips
 * section below. Routines mix "timed" steps (auto-advancing countdown)
 * with "do" steps (user taps Done — no enforced length).
 *
 * Honors prefers-reduced-motion (no animations).
 */
export function SleepGuide({ onSessionComplete }: Props) {
  const [selectedId, setSelectedId] = useState<string>(WIND_DOWN_ROUTINES[1].id); // default: Quick 15
  const routine = useMemo(() => WIND_DOWN_ROUTINES.find((r) => r.id === selectedId) ?? WIND_DOWN_ROUTINES[1], [selectedId]);
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [segElapsed, setSegElapsed] = useState(0);
  const totalElapsedRef = useRef(0);
  const firedRef = useRef(false);
  const [showTips, setShowTips] = useState(false);
  const addEvent = useProgressStore((state) => state.addEvent);

  useEffect(() => {
    if (!running) return;
    const current = routine.steps[step];
    if (!current || current.kind !== "timed") return;
    const startedAt = Date.now() - segElapsed * 1000;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSegElapsed(elapsed);
      if (elapsed >= (current.durationSeconds ?? 0)) advance();
    };
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, step, routine.id]);

  const total = routine.steps.length;
  const current = step >= 0 ? routine.steps[step] : null;

  function start() {
    firedRef.current = false;
    totalElapsedRef.current = 0;
    setStep(0);
    setSegElapsed(0);
    setRunning(true);
  }

  function advance() {
    // Credit actual time only. Codex P2: skipping a timed step
    // immediately should NOT book the full duration. "Do" steps don't
    // have a measurable elapsed, so they retain the flat 30s estimate.
    if (current?.kind === "timed") {
      const planned = current.durationSeconds ?? 0;
      totalElapsedRef.current += Math.min(segElapsed, planned);
    } else if (current?.kind === "do") {
      totalElapsedRef.current += 30;
    }
    if (step >= total - 1) {
      // Current step already accounted for above.
      finishInternal(total);
      return;
    }
    setStep(step + 1);
    setSegElapsed(0);
  }

  function stopEarly() {
    // "Stop and save" mid-step. For timed steps include the in-progress
    // segElapsed. "Do" steps stopped early don't credit time (the teen
    // didn't tap Done). Codex P2: prevents 0 elapsed when stopping
    // minutes into the first timed wind-down step.
    if (current?.kind === "timed") {
      const planned = current.durationSeconds ?? 0;
      totalElapsedRef.current += Math.min(segElapsed, planned);
    }
    finishInternal(step + 1);
  }

  function finishInternal(completedSteps: number) {
    if (firedRef.current) return;
    firedRef.current = true;
    setRunning(false);
    setStep(-1);
    const elapsedSeconds = totalElapsedRef.current;
    if (onSessionComplete) {
      onSessionComplete({
        routineId: routine.id,
        routineName: routine.name,
        completedSteps,
        totalSteps: total,
        elapsedSeconds
      });
    } else {
      addEvent(
        scrubProgressEvent({
          engine: "physical" as const,
          eventType: "sleep_log",
          eventValue: Math.min(35, 10 + Math.round(elapsedSeconds / 60)),
          payload: { routineId: routine.id, completedSteps, totalSteps: total, elapsedSeconds }
        })
      );
    }
  }

  const grouped = useMemo(() => {
    const byCat: Record<SleepCategory, WindDownRoutine[]> = {
      last_resort: [],
      quick: [],
      standard: [],
      extended: []
    };
    for (const r of WIND_DOWN_ROUTINES) byCat[r.category].push(r);
    return byCat;
  }, []);

  const remaining = current?.kind === "timed" ? Math.max(0, (current.durationSeconds ?? 0) - segElapsed) : 0;

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-lime text-sage">
        <Moon />
      </div>
      <p className="eyebrow">sleep wind-down</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Hand the body a path to sleep.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Teens actually need {`${routine ? "" : ""}`}8–10 hours. This is one of the few flat truths the product tells you.
      </p>

      {step === -1 && (
        <>
          <div className="mt-4 space-y-3">
            {CATEGORY_ORDER.map((cat) => (
              <fieldset key={cat}>
                <legend className="text-xs font-bold uppercase tracking-wider text-muted">
                  {SLEEP_CATEGORY_LABEL[cat]}
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {grouped[cat].map((r) => {
                    const active = r.id === selectedId;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedId(r.id)}
                        aria-pressed={active}
                        className={`focus-ring rounded-kai border p-3 text-left transition ${
                          active ? "border-sage bg-lime" : "border-line bg-paper hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-black">{r.name}</p>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-muted">
                            {r.totalMinutes} min
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-snug text-muted">{r.description}</p>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="mt-5 rounded-kai border border-line bg-paper p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Selected: {routine.name}</p>
            <p className="mt-1 text-sm font-semibold">{routine.setup}</p>
            <p className="mt-1 text-xs text-muted">
              {routine.steps.length} steps · ~{Math.round(windDownRoutineDurationSeconds(routine) / 60)} min total
            </p>
          </div>
          <Button className="mt-4" onClick={start}>
            Start wind-down
          </Button>

          <button
            type="button"
            onClick={() => setShowTips((value) => !value)}
            className="focus-ring mt-5 text-sm font-bold text-sage underline"
            aria-expanded={showTips}
          >
            {showTips ? "Hide" : "Show"} sleep tips ({SLEEP_TIPS.length})
          </button>
          {showTips && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {SLEEP_TIPS.map((tip) => (
                <article key={tip.id} className="rounded-kai border border-line bg-paper p-4">
                  <h3 className="font-display text-sm font-black tracking-normal">{tip.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted">{tip.body}</p>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {step >= 0 && current && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Step {step + 1} of {total} · {routine.name}
            </p>
            <p className="text-xs text-muted">{Math.round((step / total) * 100)}% done</p>
          </div>
          <div className="h-2 w-full rounded-full bg-paper">
            <div className="h-2 rounded-full bg-sage transition-all" style={{ width: `${(step / total) * 100}%` }} />
          </div>

          <section className="rounded-kai border border-line bg-paper p-5">
            <h3 className="font-display text-2xl font-black tracking-normal">{current.name}</h3>
            <p className="mt-2 text-sm leading-6 text-ink">{current.cue}</p>
            {current.kind === "timed" ? (
              <p
                className="mt-4 font-display text-5xl font-black text-sage tabular-nums"
                aria-live="polite"
                aria-atomic="true"
              >
                {formatMmSs(remaining)}
              </p>
            ) : (
              <p className="mt-4 font-display text-2xl font-black text-sage">Take your time</p>
            )}
          </section>

          <div className="flex flex-wrap gap-2">
            {current.kind === "timed" &&
              (running ? (
                <Button variant="secondary" onClick={() => setRunning(false)}>
                  <Pause size={16} aria-hidden="true" /> Pause
                </Button>
              ) : (
                <Button onClick={() => setRunning(true)}>
                  <Play size={16} aria-hidden="true" /> Resume
                </Button>
              ))}
            <Button onClick={advance}>
              {current.kind === "timed" ? (
                <>
                  <SkipForward size={16} aria-hidden="true" /> Skip
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} aria-hidden="true" /> Done
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={stopEarly}>
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
