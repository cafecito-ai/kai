import { ArrowLeft, PlayCircle, Square } from "lucide-react";
import { useEffect, useState } from "react";
import {
  currentCue,
  formatClock,
  trackerEventValue,
  TRACKER_SESSIONS,
  type TrackerSession
} from "../../lib/tracker-sessions";
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
  return (
    <section className="rounded-[24px] border border-line bg-ink p-6 text-paper shadow-calm sm:p-8">
      <p className="eyebrow text-soft">{session.title}</p>
      <p className="mt-6 font-mono text-[5rem] font-black leading-none tracking-tight text-paper sm:text-[7rem]" aria-live="polite">
        {formatClock(remaining)}
      </p>
      <p className="mt-2 text-xs font-black uppercase tracking-wider text-paper/60">remaining</p>
      <div className="mt-8 min-h-24 rounded-kai border border-white/15 bg-white/5 p-4">
        <p className="eyebrow text-paper/50">kai</p>
        <p className="mt-2 font-display text-xl font-semibold leading-snug text-paper sm:text-2xl" aria-live="polite">
          {cue?.text ?? "Take a breath. We're starting."}
        </p>
      </div>
      <Button variant="secondary" className="mt-6 border-white/20 bg-white/10 text-paper hover:border-white/50" onClick={onEndEarly}>
        <Square size={16} aria-hidden="true" />
        End early
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
