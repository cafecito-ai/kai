import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";

type Props = {
  /** Called once when a meditation session completes (timer expiry OR explicit save). */
  onSessionComplete?: (input: { durationSeconds: number; elapsedSeconds: number; completed: boolean }) => void;
};

const DURATION_CHOICES = [
  { id: 3, label: "3 min", description: "Quick reset between classes" },
  { id: 5, label: "5 min", description: "Bedtime wind-down" },
  { id: 10, label: "10 min", description: "Real settle, not background noise" }
] as const;

/**
 * Meditation player per spec Phase 4 Task 7. Three duration choices, simple
 * timer, slow breath ring at 6s cycles (3s in / 3s out — a calming default
 * that doesn't impose a specific pattern; pattern-specific work belongs in
 * BreathingPlayer). No audio in v1.
 *
 * Honors prefers-reduced-motion via window.matchMedia. The ring animation
 * is the only motion; static label takes over when reduce is set.
 */
export function MeditationPlayer({ onSessionComplete }: Props) {
  const [duration, setDuration] = useState<number>(5);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const firedRef = useRef(false);
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!running) return;
    const startedAt = Date.now() - elapsed * 1000;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [running, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = duration * 60;
  useEffect(() => {
    if (!running) return;
    if (elapsed >= total && !firedRef.current) {
      firedRef.current = true;
      setRunning(false);
      onSessionComplete?.({ durationSeconds: total, elapsedSeconds: total, completed: true });
    }
  }, [elapsed, running, total, onSessionComplete]);

  function start() {
    firedRef.current = false;
    if (elapsed <= 0 || elapsed >= total) {
      setElapsed(0);
    }
    setRunning(true);
  }

  function stop(opts: { save?: boolean } = {}) {
    setRunning(false);
    if (opts.save && !firedRef.current) {
      firedRef.current = true;
      onSessionComplete?.({ durationSeconds: total, elapsedSeconds: elapsed, completed: false });
      setElapsed(0);
    }
  }

  const remaining = Math.max(0, total - elapsed);
  // 6s breath cycle. Scale oscillates between 0.7 and 1.0 with a smooth ease.
  const cyclePos = (elapsed % 6) / 6;
  const scale = 0.7 + 0.3 * Math.abs(Math.cos(cyclePos * Math.PI));

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#FFE8DD] text-coral">
        <Sparkles />
      </div>
      <p className="eyebrow">meditation</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Sit with it. Three to ten minutes.</h2>

      <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Meditation length">
        {DURATION_CHOICES.map((choice) => {
          const active = choice.id === duration;
          return (
            <button
              key={choice.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                if (running) stop();
                setElapsed(0);
                setDuration(choice.id);
              }}
              className={`focus-ring rounded-kai border p-3 text-left transition ${
                active ? "border-coral bg-[#FFF1EB]" : "border-line bg-paper hover:bg-white"
              }`}
            >
              <p className="text-sm font-black">{choice.label}</p>
              <p className="text-xs leading-snug text-muted">{choice.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        <div className="grid h-40 w-40 place-items-center">
          <div
            aria-live="polite"
            aria-atomic="true"
            className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-coral/40 bg-[#FFF1EB] text-center font-display text-2xl font-black text-coral"
            style={{
              transform: reducedMotion ? "none" : `scale(${scale.toFixed(3)})`,
              transition: reducedMotion ? "none" : "transform 250ms linear"
            }}
          >
            {running ? formatMmSs(remaining) : `${duration}:00`}
          </div>
        </div>
        <div className="flex gap-2">
          {!running && (
            <Button onClick={start}>
              {elapsed > 0 && elapsed < total ? "Resume" : "Start meditation"}
            </Button>
          )}
          {running && (
            <>
              <Button variant="secondary" onClick={() => stop()}>
                Pause
              </Button>
              <Button variant="secondary" onClick={() => stop({ save: true })}>
                Stop and save
              </Button>
            </>
          )}
        </div>
        <p className="text-xs text-muted">No audio in v1. Just the timer and your breath.</p>
      </div>
    </section>
  );
}

function formatMmSs(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
