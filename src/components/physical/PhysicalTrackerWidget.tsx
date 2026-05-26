import { ArrowLeft, ArrowRight, PlayCircle, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  currentCue,
  formatClock,
  trackerEventValue,
  TRACKER_SESSIONS,
  type TrackerSession
} from "../../lib/tracker-sessions";
import { useProgressStore } from "../../stores/progressStore";
import { KaiAvatar } from "../ui/AppPrimitives";
import { Button } from "../ui/Button";

const MOVE_EVENT_TYPES = new Set(["workout", "workout_partial"]);

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
  // "Continue last" — finds the most recent Move event and matches
  // it back to a session in the static catalog by sessionId. If the
  // session was deleted from TRACKER_SESSIONS we silently skip the
  // hero card (no broken state). Per Claude Design v2 mock spec.
  const events = useProgressStore((state) => state.events);
  const lastSession = useMemo(() => findLastMoveSession(events), [events]);

  return (
    <div className="grid gap-4">
      {lastSession && (
        <button
          type="button"
          onClick={() => onStart(lastSession)}
          className="focus-ring rounded-calm border border-ink bg-ink p-5 text-left text-paper shadow-calm transition hover:bg-ink/90 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow text-paper/60">Last time</p>
              <h3 className="mt-1 font-display text-2xl font-black tracking-normal">{lastSession.title}</h3>
              <p className="mt-1 text-sm font-semibold leading-5 text-paper/70">
                {formatMinutes(lastSession.durationSeconds)} · pick up where you left off
              </p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper/15 text-paper">
              <ArrowRight />
            </span>
          </div>
        </button>
      )}

      <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-bodyWash text-body">
          <PlayCircle />
        </div>
        <p className="eyebrow">move</p>
        <h2 className="mt-2 font-display text-3xl font-black leading-none tracking-normal">Lean your phone where it sees you.</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-muted">
          Kai talks you through it. Big timer, italic cue line, one-tap end. Pick a session.
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

/**
 * Reads progressStore events in reverse-chronological order, looking
 * for the most recent Move event. Matches the event's sessionId (in
 * payload) back to the static TRACKER_SESSIONS catalog. Returns null
 * if no Move event exists yet, or if the last one references a
 * session that's been removed from the catalog.
 *
 * Exported for tests.
 */
export function findLastMoveSession(events: { engine: string; eventType: string; occurredAt: string; payload?: unknown }[]): TrackerSession | null {
  // Most recent first. Events are appended in chronological order, so
  // we scan backward.
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.engine !== "physical") continue;
    if (!MOVE_EVENT_TYPES.has(event.eventType)) continue;
    const payload = event.payload as { sessionId?: unknown } | undefined;
    const sessionId = typeof payload?.sessionId === "string" ? payload.sessionId : null;
    if (!sessionId) continue;
    const match = TRACKER_SESSIONS.find((session) => session.id === sessionId);
    if (match) return match;
  }
  return null;
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
          ? `You moved for ${formatMinutes(elapsedSeconds)}. Saved as a Move rep.`
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
