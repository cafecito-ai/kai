import { Activity, Pause, Play, SkipForward } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { scrubProgressEvent } from "../../lib/sensitive-events";
import { useProgressStore } from "../../stores/progressStore";
import { Button } from "../ui/Button";
import {
  STRETCH_FLOWS,
  STRETCH_CATEGORY_LABEL,
  stretchFlowDurationSeconds,
  type StretchCategory,
  type StretchFlow
} from "../../lib/stretches";

type Props = {
  onSessionComplete?: (input: {
    flowId: string;
    flowName: string;
    completedSegments: number;
    totalSegments: number;
    elapsedSeconds: number;
  }) => void;
};

const CATEGORY_ORDER: StretchCategory[] = ["morning", "desk", "post_sport", "wind_down", "tightness"];

/**
 * Walks the teen through a stretching flow one hold at a time. All segments
 * are timed (holds, not reps), so the player is simpler than WorkoutPlayer.
 * Auto-advances on timer expiry. Always-visible Pause / Skip / Stop-and-save.
 *
 * Honors prefers-reduced-motion (no animations other than countdown text).
 */
export function StretchPlayer({ onSessionComplete }: Props) {
  const [selectedId, setSelectedId] = useState<string>(STRETCH_FLOWS[0].id);
  const flow = useMemo(() => STRETCH_FLOWS.find((f) => f.id === selectedId) ?? STRETCH_FLOWS[0], [selectedId]);
  const [step, setStep] = useState<number>(-1);
  const [running, setRunning] = useState(false);
  const [segElapsed, setSegElapsed] = useState(0);
  const totalElapsedRef = useRef(0);
  const firedRef = useRef(false);
  const addEvent = useProgressStore((state) => state.addEvent);

  useEffect(() => {
    if (!running) return;
    const seg = flow.segments[step];
    if (!seg) return;
    const startedAt = Date.now() - segElapsed * 1000;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSegElapsed(elapsed);
      if (elapsed >= seg.holdSeconds) advance();
    };
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, step, flow.id]);

  const total = flow.segments.length;
  const current = step >= 0 ? flow.segments[step] : null;
  const segRemaining = current ? Math.max(0, current.holdSeconds - segElapsed) : 0;

  function start() {
    firedRef.current = false;
    totalElapsedRef.current = 0;
    setStep(0);
    setSegElapsed(0);
    setRunning(true);
  }

  function advance() {
    // Track ACTUAL time spent on this segment, not the planned hold
    // length. When the timer auto-advances, segElapsed === holdSeconds
    // (so this is a no-op vs the old behavior); when the teen taps
    // Skip early, only the real elapsed time is credited. Codex P2:
    // prevents skipping a 15-min flow in seconds while still booking
    // the full progress score.
    const seg = current;
    if (seg) {
      totalElapsedRef.current += Math.min(segElapsed, seg.holdSeconds);
    }
    if (step >= total - 1) {
      // Last segment already accounted for above — finish without
      // re-adding it.
      finishInternal(total);
      return;
    }
    setStep(step + 1);
    setSegElapsed(0);
  }

  function stopEarly() {
    // "Stop and save" mid-hold. Include the time spent on the
    // in-progress hold before reporting. Codex P2: without this,
    // stopping 50s into the first hold would report 0 elapsed.
    if (current) {
      totalElapsedRef.current += Math.min(segElapsed, current.holdSeconds);
    }
    finishInternal(step + 1);
  }

  function finishInternal(completedSegments: number) {
    if (firedRef.current) return;
    firedRef.current = true;
    setRunning(false);
    setStep(-1);
    const elapsedSeconds = totalElapsedRef.current;
    if (onSessionComplete) {
      onSessionComplete({
        flowId: flow.id,
        flowName: flow.name,
        completedSegments,
        totalSegments: total,
        elapsedSeconds
      });
    } else {
      addEvent(
        scrubProgressEvent({
          engine: "physical" as const,
          eventType: "stretch_flow",
          eventValue: Math.min(40, 12 + Math.round(elapsedSeconds / 30)),
          payload: { flowId: flow.id, completedSegments, totalSegments: total, elapsedSeconds }
        })
      );
    }
  }

  const grouped = useMemo(() => {
    const byCat: Record<StretchCategory, StretchFlow[]> = {
      morning: [],
      desk: [],
      post_sport: [],
      wind_down: [],
      tightness: []
    };
    for (const f of STRETCH_FLOWS) byCat[f.category].push(f);
    return byCat;
  }, []);

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-lime text-sage">
        <Activity />
      </div>
      <p className="eyebrow">stretching flows</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Pick a flow. Breathe through it.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Slow holds, no force. Stop or ease off any stretch that feels sharp.
      </p>

      {step === -1 && (
        <>
          <div className="mt-4 space-y-3">
            {CATEGORY_ORDER.map((cat) => (
              <fieldset key={cat}>
                <legend className="text-xs font-bold uppercase tracking-wider text-muted">
                  {STRETCH_CATEGORY_LABEL[cat]}
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {grouped[cat].map((f) => {
                    const active = f.id === selectedId;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedId(f.id)}
                        aria-pressed={active}
                        className={`focus-ring rounded-kai border p-3 text-left transition ${
                          active ? "border-sage bg-lime" : "border-line bg-paper hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-black">{f.name}</p>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-muted">
                            {f.totalMinutes} min
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-snug text-muted">{f.description}</p>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="mt-5 rounded-kai border border-line bg-paper p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Selected: {flow.name}</p>
            <p className="mt-1 text-sm font-semibold">{flow.setup}</p>
            <p className="mt-1 text-xs text-muted">
              {flow.segments.length} holds · ~{Math.round(stretchFlowDurationSeconds(flow) / 60)} min total
            </p>
          </div>
          <Button className="mt-4" onClick={start}>
            Start flow
          </Button>
        </>
      )}

      {step >= 0 && current && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Hold {step + 1} of {total} · {flow.name}
            </p>
            <p className="text-xs text-muted">{Math.round((step / total) * 100)}% done</p>
          </div>
          <div className="h-2 w-full rounded-full bg-paper">
            <div className="h-2 rounded-full bg-sage transition-all" style={{ width: `${(step / total) * 100}%` }} />
          </div>

          <section className="rounded-kai border border-line bg-paper p-5">
            <h3 className="font-display text-2xl font-black tracking-normal">{current.name}</h3>
            <p className="mt-2 text-sm leading-6 text-ink">{current.cue}</p>
            <p
              className="mt-4 font-display text-5xl font-black text-sage tabular-nums"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatMmSs(segRemaining)}
            </p>
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
            <Button variant="secondary" onClick={advance}>
              <SkipForward size={16} aria-hidden="true" /> Skip
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
