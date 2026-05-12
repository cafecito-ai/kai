import { useUser } from "@clerk/clerk-react";
import { Monitor, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { scrubProgressEvent } from "../../lib/sensitive-events";
import { useProgressStore } from "../../stores/progressStore";
import {
  clearScreenTimeData,
  getEntryForDate,
  getNudge,
  getRollingAverage,
  loadScreenTimeData,
  saveScreenTimeData,
  todayKey,
  upsertEntry,
  type ScreenTimeData
} from "../../lib/screen-time";
import { Button } from "../ui/Button";

type Props = {
  /** Called once per local day when a teen logs (or updates) their hours.
   *  If omitted, the component logs a scrubbed `screen_time_logged` event
   *  via the progress store. Same-day repeated saves don't refire. */
  onLog?: (input: { hours: number; date: string }) => void;
};

const HOUR_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function ScreenTimeTracker({ onLog }: Props) {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const addEvent = useProgressStore((state) => state.addEvent);

  const [data, setData] = useState<ScreenTimeData>({ entries: [] });
  const [hoursInput, setHoursInput] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [showReset, setShowReset] = useState(false);
  // Track which local day we've already fired a log event for, so
  // tapping "Update today" repeatedly doesn't double-award (Codex P2).
  const [loggedForDate, setLoggedForDate] = useState<string | null>(null);

  const today = todayKey();
  const todayEntry = getEntryForDate(data, today);

  // Re-load whenever the signed-in user changes (Codex P1: shared
  // browsers shouldn't leak data between teens).
  useEffect(() => {
    const loaded = loadScreenTimeData(userId);
    setData(loaded);
    const existing = getEntryForDate(loaded, todayKey());
    if (existing) {
      setHoursInput(existing.hours);
      setNote(existing.note ?? "");
    } else {
      setHoursInput(null);
      setNote("");
    }
    setLoggedForDate(null);
  }, [userId]);

  function logToday() {
    if (hoursInput === null) return;
    const entry = { date: today, hours: hoursInput, note: note.trim() || undefined };
    const next = upsertEntry(data, entry);
    setData(next);
    saveScreenTimeData(next, userId);
    // Only fire the log event once per local day, regardless of how many
    // times the user updates the value.
    if (loggedForDate !== today) {
      setLoggedForDate(today);
      if (onLog) {
        onLog({ hours: hoursInput, date: today });
      } else {
        // Sensitive event — payload gets scrubbed by scrubProgressEvent
        // (`screen_time_logged` is in SENSITIVE_EVENT_TYPES).
        addEvent(
          scrubProgressEvent({
            engine: "physical" as const,
            eventType: "screen_time_logged",
            eventValue: 8,
            payload: { date: today }
          })
        );
      }
    }
  }

  function reset() {
    clearScreenTimeData(userId);
    setData({ entries: [] });
    setHoursInput(null);
    setNote("");
    setShowReset(false);
    setLoggedForDate(null);
  }

  const last7Avg = useMemo(() => getRollingAverage(data, new Date(), 7), [data]);
  const nudge = useMemo(() => getNudge(data, new Date()), [data]);
  const entryCount = data.entries.length;

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-lime text-sage">
        <Monitor />
      </div>
      <p className="eyebrow">screen time</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Your pattern, not a target.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Log your screen hours daily. The product never tells you what your right number is — it shows you your own pattern so you can decide. Everything stays on this device.
      </p>

      <div className="mt-5 rounded-kai border border-line bg-paper p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Today ({today})</p>
        <div className="mt-3 grid grid-cols-11 gap-1">
          {HOUR_OPTIONS.map((h) => {
            const isSelected = hoursInput === h;
            return (
              <button
                key={h}
                type="button"
                onClick={() => setHoursInput(h)}
                aria-pressed={isSelected}
                aria-label={`${h} hours`}
                className={`focus-ring rounded-md py-2 text-sm font-black ${
                  isSelected
                    ? "bg-sage text-paper"
                    : "border border-line bg-white text-ink hover:border-sage"
                }`}
              >
                {h}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted">
          Approximate hours of recreational screen time today (school screens don't count).
        </p>
        <textarea
          className="field mt-3 min-h-16 text-sm"
          placeholder="Optional: what made the number what it was today?"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <div className="mt-3 flex items-center gap-2">
          <Button onClick={logToday} disabled={hoursInput === null}>
            {todayEntry ? "Update today" : "Log today"}
          </Button>
          {entryCount > 0 && (
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="focus-ring inline-flex items-center gap-1 rounded-kai border border-line bg-white px-3 py-2 text-xs font-bold text-muted hover:border-sage"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset all data
            </button>
          )}
        </div>
      </div>

      {showReset && (
        <div className="mt-3 rounded-kai border border-warning/40 bg-warning/10 p-3 text-sm">
          <p className="font-bold">Reset all screen-time data?</p>
          <p className="mt-1 text-muted">
            This removes everything stored on this device. There's no copy on a server — once it's gone, it's gone.
          </p>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" onClick={() => setShowReset(false)}>
              Cancel
            </Button>
            <Button onClick={reset}>Yes, reset</Button>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-kai border border-line bg-paper p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Last 7 days</p>
          <p className="mt-1 font-display text-2xl font-black tracking-normal">
            {last7Avg !== null ? `${last7Avg}h/day avg` : "—"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {entryCount} {entryCount === 1 ? "day" : "days"} logged in total.
          </p>
        </div>
        {nudge && (
          <div className="rounded-kai border border-sage/30 bg-lime p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sage">Pattern</p>
            <p className="mt-1 text-sm leading-5 text-ink">{nudge.body}</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-muted">
        No targets, no streaks, no comparison to other people. Your data stays on this device.
      </p>
    </section>
  );
}
