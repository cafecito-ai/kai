import { Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { loadJSON, saveJSON } from "../../lib/local-storage";
import { Button } from "../ui/Button";

const SLEEP_SESSION_KEY = "kai.physical.sleep.session.v1";
const SLEEP_LAST_KEY = "kai.physical.sleep.last.v1";

// Cap a logged session at 14h. Anything longer is almost certainly a
// teen who tapped Sleep, never tapped Woke Up, and re-opened the app the
// next afternoon. Clamping keeps the dashboard signal honest.
const MAX_SLEEP_HOURS = 14;

export interface SleepSession {
  startedAt: string;
}

export interface SleepResult {
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
}

type Props = {
  onSleepStart: (session: SleepSession) => void;
  onWokeUp: (result: SleepResult) => void;
};

export function SleepWidget({ onSleepStart, onWokeUp }: Props) {
  const [session, setSession] = useState<SleepSession | null>(() => loadJSON<SleepSession | null>(SLEEP_SESSION_KEY, null, null));
  const [last, setLast] = useState<SleepResult | null>(() => loadJSON<SleepResult | null>(SLEEP_LAST_KEY, null, null));
  const [now, setNow] = useState(() => Date.now());

  // Tick once a minute while a session is in progress so the live
  // "Sleeping for Xh Ym" counter updates. No interval otherwise.
  useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [session]);

  const liveDuration = useMemo(() => {
    if (!session) return null;
    return Math.max(0, Math.round((now - new Date(session.startedAt).getTime()) / 60_000));
  }, [now, session]);

  function tapSleep() {
    const next: SleepSession = { startedAt: new Date().toISOString() };
    setSession(next);
    saveJSON(SLEEP_SESSION_KEY, null, next);
    onSleepStart(next);
  }

  function tapWokeUp() {
    if (!session) return;
    const endedAt = new Date().toISOString();
    const rawMinutes = (new Date(endedAt).getTime() - new Date(session.startedAt).getTime()) / 60_000;
    const durationMinutes = Math.min(MAX_SLEEP_HOURS * 60, Math.max(0, Math.round(rawMinutes)));
    const result: SleepResult = { startedAt: session.startedAt, endedAt, durationMinutes };
    setSession(null);
    setLast(result);
    saveJSON(SLEEP_SESSION_KEY, null, null);
    saveJSON(SLEEP_LAST_KEY, null, result);
    onWokeUp(result);
  }

  return (
    <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className={`grid size-12 place-items-center rounded-full ${session ? "bg-warmPaper text-inkDark" : "bg-bodyWash text-body"}`}>
          {session ? <Moon /> : <Sun />}
        </span>
        <div>
          <p className="eyebrow">sleep</p>
          <h2 className="mt-1 font-display text-3xl font-black leading-none tracking-normal">
            {session ? "Sleeping. Tap when you're up." : "Tap before bed. Tap when you wake."}
          </h2>
        </div>
      </div>

      {session ? (
        <>
          <p className="text-sm font-semibold leading-6 text-muted">
            Sleeping for <span className="font-black text-ink">{formatDuration(liveDuration ?? 0)}</span>. Started at {formatClock(session.startedAt)}.
          </p>
          <Button className="mt-4 w-full sm:w-auto" onClick={tapWokeUp}>
            <Sun size={18} aria-hidden="true" />
            Tap Woke Up
          </Button>
        </>
      ) : (
        <>
          {last ? (
            <p className="text-sm font-semibold leading-6 text-muted">
              Last night: <span className="font-black text-ink">{formatDuration(last.durationMinutes)}</span>. Tap when you head to bed tonight.
            </p>
          ) : (
            <p className="text-sm font-semibold leading-6 text-muted">No nights logged yet. Tap when you head to bed and we'll do the math.</p>
          )}
          <Button className="mt-4 w-full sm:w-auto" onClick={tapSleep}>
            <Moon size={18} aria-hidden="true" />
            Tap Sleep
          </Button>
        </>
      )}
    </section>
  );
}

/** Pure helper exported for tests. Converts minutes into a "Xh Ym" string. */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

/**
 * Computes the wellness-event point value for a slept session.
 * Skews toward "7–8 hours is healthy" without shaming short nights.
 * Pure for testability.
 */
export function sleepEventValue(durationMinutes: number): number {
  const hours = durationMinutes / 60;
  if (hours < 3) return 4;     // tap mismatch / nap; small signal
  if (hours < 6) return 12;    // short night, still logged
  if (hours < 7) return 20;
  if (hours < 9) return 26;    // sweet spot
  return 18;                    // 9+ hours — credit but smaller
}

function formatClock(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
