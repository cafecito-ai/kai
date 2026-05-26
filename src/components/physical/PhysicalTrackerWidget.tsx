import { ArrowLeft, PlayCircle, Square } from "lucide-react";
import { useEffect, useState } from "react";
import {
  currentCue,
  formatClock,
  trackerEventValue,
  TRACKER_SESSIONS,
  type TrackerSession
} from "../../lib/tracker-sessions";
import { KaiAvatar } from "../ui/AppPrimitives";
import { Button } from "../ui/Button";

type Phase =
  | { kind: "idle" }
  | { kind: "running"; session: TrackerSession; elapsedSeconds: number }
  | { kind: "complete"; session: TrackerSession; elapsedSeconds: number };

export interface TrackerCompleteResult {
  sessionId: string;
  title: string;
  durationSeconds: number;
  elapsedSeconds: number;
  completed: boolean;
}

type Props = {
  onComplete: (result: TrackerCompleteResult) => void;
};

export function PhysicalTrackerWidget({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  // Tick once per second while a session is running. Stops the moment
  // the elapsed equals the session duration (we transition to complete
  // in the same tick).
  useEffect(() => {
    if (phase.kind !== "running") return;
    const id = window.setInterval(() => {
      setPhase((current) => {
        if (current.kind !== "running") return current;
        const next = current.elapsedSeconds + 1;
        if (next >= current.session.durationSeconds) {
          onComplete({
            sessionId: current.session.id,
            title: current.session.title,
            durationSeconds: current.session.durationSeconds,
            elapsedSeconds: current.session.durationSeconds,
            completed: true
          });
          return { kind: "complete", session: current.session, elapsedSeconds: current.session.durationSeconds };
        }
        return { kind: "running", session: current.session, elapsedSeconds: next };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase.kind, onComplete]);

  function startSession(session: TrackerSession) {
    setPhase({ kind: "running", session, elapsedSeconds: 0 });
  }

  function endEarly() {
    if (phase.kind !== "running") return;
    onComplete({
      sessionId: phase.session.id,
      title: phase.session.title,
      durationSeconds: phase.session.durationSeconds,
      elapsedSeconds: phase.elapsedSeconds,
      completed: false
    });
    setPhase({ kind: "complete", session: phase.session, elapsedSeconds: phase.elapsedSeconds });
  }

  function backToList() {
    setPhase({ kind: "idle" });
  }

  if (phase.kind === "running") return <RunningView phase={phase} onEndEarly={endEarly} />;
  if (phase.kind === "complete") return <CompleteView phase={phase} onBack={backToList} />;
  return <IdleView onStart={startSession} />;
}

function IdleView({ onStart }: { onStart: (session: TrackerSession) => void }) {
  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-bodyWash text-body">
          <PlayCircle />
        </div>
        <p className="eyebrow">physical tracker</p>
        <h2 className="mt-2 font-display text-3xl font-black leading-none tracking-normal">Phone down. Kai narrates the rep.</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-muted">
          Pick a session, place your phone where you can see the big timer, follow the cues. Each line of guidance shows for as long as it takes — no rush. Real video drops in later.
        </p>
      </section>

      <div className="grid gap-3">
        {TRACKER_SESSIONS.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => onStart(session)}
            className="focus-ring rounded-[20px] border border-line bg-white p-5 text-left shadow-sm transition hover:border-ink/35"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow text-inkSoft">{formatMinutes(session.durationSeconds)} · {session.cues.length} cues</p>
                <h3 className="mt-1 font-display text-2xl font-black tracking-normal">{session.title}</h3>
                <p className="mt-1 text-sm font-semibold leading-5 text-muted">{session.summary}</p>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-bodyWash text-body">
                <PlayCircle />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RunningView({ phase, onEndEarly }: { phase: Extract<Phase, { kind: "running" }>; onEndEarly: () => void }) {
  const { session, elapsedSeconds } = phase;
  const remaining = Math.max(0, session.durationSeconds - elapsedSeconds);
  const cue = currentCue(session, elapsedSeconds);
  // Progress as a 0-100 width percentage of the elapsed bar. Capped
  // and floored so a session that overruns by a tick still reads cleanly.
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedSeconds / session.durationSeconds) * 100)));
  return (
    <section className="relative flex min-h-[640px] flex-col gap-6 overflow-hidden rounded-calm border border-line bg-warmPaper p-6 shadow-sm sm:p-8">
      {/* Top row — session title pill on left, no controls on right yet (end button at bottom). */}
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-line bg-white/80 px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-muted">
          {session.title}
        </span>
      </div>

      <div className="flex-1" />

      {/* Centerpiece: eyebrow + Fraunces timer + thin progress bar */}
      <div className="flex flex-col items-center gap-5">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted">Remaining</p>
        <p className="timer-display tabular-nums" aria-live="polite">
          {formatClock(remaining)}
        </p>
        <div className="h-1.5 w-[220px] overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div
            className="h-full rounded-full bg-ink transition-[width] duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="sr-only">{progressPercent}% complete</span>
      </div>

      <div className="flex-1" />

      {/* Kai cue — pulsing avatar above the italic Fraunces caption */}
      <div className="flex flex-col items-center gap-3">
        <KaiAvatar size={44} pulse />
        <p className="cue-line" aria-live="polite">
          {cue?.text ?? "Take a breath. We're starting."}
        </p>
      </div>

      <Button variant="secondary" className="w-full" onClick={onEndEarly}>
        <Square size={14} aria-hidden="true" />
        End session
      </Button>
    </section>
  );
}

function CompleteView({ phase, onBack }: { phase: Extract<Phase, { kind: "complete" }>; onBack: () => void }) {
  const { session, elapsedSeconds } = phase;
  const fullyCompleted = elapsedSeconds >= session.durationSeconds;
  return (
    <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm sm:p-6">
      <p className="eyebrow">done</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">
        {fullyCompleted ? "Full session done." : "Partial session logged."}
      </h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-muted">
        {fullyCompleted
          ? `You moved for ${formatMinutes(elapsedSeconds)}. Saved as a tracker rep.`
          : `Logged ${formatMinutes(elapsedSeconds)} of ${session.title}. Partial reps still count.`}
      </p>
      <Button variant="secondary" className="mt-4" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to sessions
      </Button>
    </section>
  );
}

function formatMinutes(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  return minutes <= 1 ? "1 min" : `${minutes} min`;
}

// Re-export for callers that want the point value for a completed session.
export { trackerEventValue };
