import { useEffect, useMemo, useState } from "react";
import { loadJSON, saveJSON } from "../../lib/local-storage";

const SLEEP_SESSION_KEY = "kai.physical.sleep.session.v1";
const SLEEP_LAST_KEY = "kai.physical.sleep.last.v1";

// Cap a logged session at 14h. Anything longer is almost certainly a
// teen who tapped Sleep, never tapped Woke Up, and re-opened the app
// the next afternoon. Clamping keeps the dashboard signal honest.
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
  // counter updates. No interval otherwise.
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

  return session ? (
    <SleepAsleep session={session} liveDuration={liveDuration ?? 0} onTapWake={tapWokeUp} />
  ) : (
    <SleepAwake last={last} onTapSleep={tapSleep} />
  );
}

function SleepAwake({ last, onTapSleep }: { last: SleepResult | null; onTapSleep: () => void }) {
  return (
    <section className="flex min-h-[520px] flex-col items-center justify-between rounded-calm border border-line bg-white p-8 shadow-sm">
      <p className="self-start text-[11px] font-black uppercase tracking-[0.14em] text-muted">
        Tap when you close your eyes.
      </p>

      <button
        type="button"
        onClick={onTapSleep}
        className="tap-button tap-sleep focus-ring"
        aria-label="Tap to start sleep timer"
      >
        <div className="text-center">
          <div className="label-mono">Going to bed</div>
          <div>Tap Sleep</div>
        </div>
      </button>

      {last ? (
        <div className="text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted">Last night</p>
          <p className="mt-1 font-display text-2xl font-black tabular-nums text-ink">{formatDuration(last.durationMinutes)}</p>
        </div>
      ) : (
        <p className="text-sm font-semibold text-inkMute">No targets. Just a tap to remember.</p>
      )}
    </section>
  );
}

function SleepAsleep({
  session,
  liveDuration,
  onTapWake
}: {
  session: SleepSession;
  liveDuration: number;
  onTapWake: () => void;
}) {
  return (
    <section className="sleep-bg relative flex min-h-[520px] flex-col items-center justify-between overflow-hidden rounded-calm p-8">
      <Stars />
      <div className="relative z-10 self-start rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-paper/70">
        Started {formatClock(session.startedAt)}
      </div>

      <div className="relative z-10 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-paper/55">Asleep for</p>
        <p
          className="mt-2 font-display tabular-nums text-paper"
          style={{ fontSize: 64, fontWeight: 300, lineHeight: 1, letterSpacing: "-0.02em" }}
        >
          {formatDuration(liveDuration)}
        </p>
      </div>

      <button
        type="button"
        onClick={onTapWake}
        className="tap-button tap-wake focus-ring relative z-10"
        aria-label="Tap to end sleep timer"
      >
        <div className="text-center">
          <div className="label-mono">Just woke up</div>
          <div>Tap Wake</div>
        </div>
      </button>

      <p className="relative z-10 text-sm font-semibold text-paper/50">One tap when you open your eyes.</p>
    </section>
  );
}

// 24 deterministic star positions. Same set every render so the field
// doesn't shimmer/reshuffle when the live counter ticks. Values are
// percentages so they scale with the card.
const STAR_POSITIONS: Array<{ top: string; left: string; opacity: number; size: number }> = [
  { top: "8%", left: "12%", opacity: 0.7, size: 2 },
  { top: "14%", left: "82%", opacity: 0.5, size: 2 },
  { top: "22%", left: "38%", opacity: 0.6, size: 1.5 },
  { top: "16%", left: "62%", opacity: 0.4, size: 1.5 },
  { top: "11%", left: "92%", opacity: 0.5, size: 2 },
  { top: "27%", left: "8%", opacity: 0.55, size: 1.5 },
  { top: "32%", left: "72%", opacity: 0.5, size: 1.5 },
  { top: "9%", left: "44%", opacity: 0.6, size: 1.5 },
  { top: "26%", left: "56%", opacity: 0.4, size: 1.5 },
  { top: "82%", left: "14%", opacity: 0.55, size: 1.5 },
  { top: "88%", left: "76%", opacity: 0.5, size: 1.5 },
  { top: "70%", left: "92%", opacity: 0.6, size: 1.5 },
  { top: "78%", left: "32%", opacity: 0.5, size: 1.5 },
  { top: "86%", left: "62%", opacity: 0.4, size: 1.5 },
  { top: "94%", left: "44%", opacity: 0.55, size: 1.5 },
  { top: "5%", left: "28%", opacity: 0.4, size: 1.5 },
  { top: "19%", left: "20%", opacity: 0.5, size: 1.5 },
  { top: "13%", left: "72%", opacity: 0.45, size: 1.5 },
  { top: "31%", left: "24%", opacity: 0.5, size: 1.5 },
  { top: "67%", left: "8%", opacity: 0.55, size: 1.5 },
  { top: "73%", left: "82%", opacity: 0.5, size: 1.5 },
  { top: "61%", left: "50%", opacity: 0.4, size: 1.5 },
  { top: "57%", left: "20%", opacity: 0.5, size: 1.5 },
  { top: "49%", left: "88%", opacity: 0.45, size: 1.5 }
];

function Stars() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {STAR_POSITIONS.map((star, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-paper"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: star.opacity
          }}
        />
      ))}
    </div>
  );
}

/** Pure helper exported for tests. Converts minutes into a "Xh Ym" string. */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return "0m";
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
