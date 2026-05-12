import { LifeBuoy, RotateCcw, Smile } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  clearMoodLogData,
  ENERGY_LABEL,
  getEntryForDate,
  getNudge,
  getRollingMood,
  loadMoodLogData,
  MOOD_LABEL,
  todayKey,
  upsertEntry,
  saveMoodLogData,
  type Energy,
  type Mood,
  type MoodLogData
} from "../../lib/mood-log";
import { Button } from "../ui/Button";

type Props = {
  onLog?: (input: { mood: Mood; energy?: Energy; date: string }) => void;
};

const MOOD_OPTIONS: Mood[] = ["very_low", "low", "neutral", "good", "great"];
const ENERGY_OPTIONS: Energy[] = ["low", "medium", "high"];

export function MoodLogTracker({ onLog }: Props) {
  const [data, setData] = useState<MoodLogData>({ entries: [] });
  const [moodInput, setMoodInput] = useState<Mood | null>(null);
  const [energyInput, setEnergyInput] = useState<Energy | null>(null);
  const [note, setNote] = useState("");
  const [showReset, setShowReset] = useState(false);

  const today = todayKey();
  const todayEntry = getEntryForDate(data, today);

  useEffect(() => {
    const loaded = loadMoodLogData();
    setData(loaded);
    const existing = getEntryForDate(loaded, todayKey());
    if (existing) {
      setMoodInput(existing.mood);
      setEnergyInput(existing.energy ?? null);
      setNote(existing.note ?? "");
    }
  }, []);

  function logToday() {
    if (moodInput === null) return;
    const entry = {
      date: today,
      mood: moodInput,
      energy: energyInput ?? undefined,
      note: note.trim() || undefined
    };
    const next = upsertEntry(data, entry);
    setData(next);
    saveMoodLogData(next);
    onLog?.({ mood: moodInput, energy: energyInput ?? undefined, date: today });
  }

  function reset() {
    clearMoodLogData();
    setData({ entries: [] });
    setMoodInput(null);
    setEnergyInput(null);
    setNote("");
    setShowReset(false);
  }

  const last7Avg = useMemo(() => getRollingMood(data, new Date(), 7), [data]);
  const nudge = useMemo(() => getNudge(data, new Date()), [data]);
  const entryCount = data.entries.length;

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-lime text-sage">
        <Smile />
      </div>
      <p className="eyebrow">mood log</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">One a day, no streaks.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        A daily mood check. Five steps, not 1–10 (fine-grained scales invite obsessive tracking). Energy is a separate axis. Everything stays on this device.
      </p>

      <div className="mt-5 rounded-kai border border-line bg-paper p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Today ({today}) — mood
        </p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {MOOD_OPTIONS.map((m) => {
            const isSelected = moodInput === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMoodInput(m)}
                aria-pressed={isSelected}
                aria-label={MOOD_LABEL[m]}
                className={`focus-ring rounded-md px-2 py-2 text-xs font-black ${
                  isSelected
                    ? "bg-sage text-paper"
                    : "border border-line bg-white text-ink hover:border-sage"
                }`}
              >
                {MOOD_LABEL[m]}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">
          Energy (optional)
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {ENERGY_OPTIONS.map((e) => {
            const isSelected = energyInput === e;
            return (
              <button
                key={e}
                type="button"
                onClick={() => setEnergyInput(isSelected ? null : e)}
                aria-pressed={isSelected}
                aria-label={ENERGY_LABEL[e]}
                className={`focus-ring rounded-md px-2 py-2 text-xs font-black ${
                  isSelected
                    ? "bg-sage text-paper"
                    : "border border-line bg-white text-ink hover:border-sage"
                }`}
              >
                {ENERGY_LABEL[e]}
              </button>
            );
          })}
        </div>

        <textarea
          className="field mt-4 min-h-16 text-sm"
          placeholder="Optional: what shaped the day?"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <div className="mt-3 flex items-center gap-2">
          <Button onClick={logToday} disabled={moodInput === null}>
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
          <p className="font-bold">Reset all mood-log data?</p>
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
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Last 7 days
          </p>
          <p className="mt-1 font-display text-2xl font-black tracking-normal">
            {last7Avg !== null ? `${last7Avg} / 5 avg` : "—"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {entryCount} {entryCount === 1 ? "day" : "days"} logged in total.
          </p>
        </div>
        {nudge && (
          <div
            className={
              nudge.escalate
                ? "rounded-kai border border-danger/40 bg-danger/10 p-3"
                : "rounded-kai border border-sage/30 bg-lime p-3"
            }
          >
            <p
              className={
                nudge.escalate
                  ? "text-[11px] font-bold uppercase tracking-wider text-danger"
                  : "text-[11px] font-bold uppercase tracking-wider text-sage"
              }
            >
              {nudge.escalate ? "Pattern worth attention" : "Pattern"}
            </p>
            <p className="mt-1 text-sm leading-5 text-ink">{nudge.body}</p>
            {nudge.escalate && (
              <Link
                to="/crisis"
                className="focus-ring mt-2 inline-flex items-center gap-1 rounded-kai border border-danger/40 bg-white px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/5"
              >
                <LifeBuoy size={14} aria-hidden="true" />
                Crisis resources
              </Link>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-muted">
        No streaks, no scoring, no comparison. Your data stays on this device.
      </p>
    </section>
  );
}
