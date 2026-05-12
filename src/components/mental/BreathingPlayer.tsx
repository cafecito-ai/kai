import { Wind } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { BREATH_PATTERNS, currentPhase, DEFAULT_SESSION_SECONDS, type BreathPattern } from "../../lib/breathing";

type Props = {
  /** Called once when a breathing session reaches the end of its timer. */
  onSessionComplete?: (input: { patternId: BreathPattern["id"]; seconds: number }) => void;
};

/**
 * Contextual breathing player per spec Section 6 / Phase 4 Task 6. Lets the
 * teen pick one of the four built-in patterns, then runs an animated visual
 * + countdown until the session ends or they stop. No audio in v1.
 *
 * `prefers-reduced-motion` is honored: the animated scale is replaced with
 * a static label-only update.
 */
export function BreathingPlayer({ onSessionComplete }: Props) {
  const [pattern, setPattern] = useState<BreathPattern>(BREATH_PATTERNS[0]);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const completedRef = useRef(false);
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!running) return;
    const startedAt = Date.now() - elapsed * 1000;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [running, pattern.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!running) return;
    if (elapsed >= DEFAULT_SESSION_SECONDS && !completedRef.current) {
      completedRef.current = true;
      setRunning(false);
      onSessionComplete?.({ patternId: pattern.id, seconds: DEFAULT_SESSION_SECONDS });
    }
  }, [elapsed, running, pattern.id, onSessionComplete]);

  function start() {
    completedRef.current = false;
    setElapsed(0);
    setRunning(true);
  }

  function stop(opts: { complete?: boolean } = {}) {
    setRunning(false);
    if (opts.complete && !completedRef.current) {
      completedRef.current = true;
      onSessionComplete?.({ patternId: pattern.id, seconds: elapsed });
    }
  }

  const { phase, remaining } = currentPhase(pattern, elapsed);
  const totalRemaining = Math.max(0, DEFAULT_SESSION_SECONDS - elapsed);
  const scale = phase.label === "Inhale" ? 1 : phase.label === "Exhale" ? 0.6 : 0.85;

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#FFE8DD] text-coral">
        <Wind />
      </div>
      <p className="eyebrow">contextual breathing</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">A short reset matched to the moment.</h2>

      <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Breathing pattern">
        {BREATH_PATTERNS.map((option) => {
          const active = option.id === pattern.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                if (running) stop();
                setPattern(option);
              }}
              className={`focus-ring rounded-kai border p-3 text-left transition ${
                active ? "border-coral bg-[#FFF1EB]" : "border-line bg-paper hover:bg-white"
              }`}
            >
              <p className="text-sm font-black">{option.name}</p>
              <p className="text-xs text-muted">{option.description}</p>
              <p className="mt-1 text-xs leading-snug text-muted">{option.bestFor}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        <div className="grid h-40 w-40 place-items-center">
          <div
            aria-live="polite"
            className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-coral/40 bg-[#FFF1EB] text-center font-display text-2xl font-black text-coral"
            style={{
              transform: reducedMotion ? "none" : `scale(${scale})`,
              transition: reducedMotion ? "none" : `transform ${phase.seconds}s ease-in-out`
            }}
          >
            {running ? `${phase.label} ${remaining}` : "Ready"}
          </div>
        </div>
        <p className="text-xs text-muted">
          {running ? `Session: ${formatMmSs(totalRemaining)} left` : `Session: ${Math.round(DEFAULT_SESSION_SECONDS / 60)} minutes`}
        </p>
        <div className="flex gap-2">
          {!running && (
            <Button onClick={start}>
              {elapsed > 0 && elapsed < DEFAULT_SESSION_SECONDS ? "Resume" : "Start"}
            </Button>
          )}
          {running && (
            <>
              <Button variant="secondary" onClick={() => stop()}>
                Pause
              </Button>
              <Button variant="secondary" onClick={() => stop({ complete: true })}>
                Stop and save
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function formatMmSs(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
