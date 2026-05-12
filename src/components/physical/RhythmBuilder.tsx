import { useUser } from "@clerk/clerk-react";
import { Clock, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { loadJSON, saveJSON } from "../../lib/local-storage";
import { scrubProgressEvent } from "../../lib/sensitive-events";
import { useProgressStore } from "../../stores/progressStore";
import { Button } from "../ui/Button";
import {
  buildSchedule,
  DEFAULT_SCHOOL_DAY,
  DEFAULT_WEEKEND,
  hhmmFromMinutes,
  minutesFromHHMM,
  sleepHoursFromWake,
  totalScheduledMinutes,
  type RhythmBlock
} from "../../lib/rhythm";

// Teen sleep recommendation. Inlined here to keep this PR independent
// of the sleep guides PR (#32, still open). Both define the same range.
const TEEN_SLEEP_HOURS = { min: 8, max: 10 } as const;

const STORAGE_KEY = "kai.rhythm.template.v1";

type SavedTemplate = {
  mode: "school" | "weekend";
  wakeTime: string; // HH:MM
  blocks: RhythmBlock[];
};

type Props = {
  /** Soft progress event on first save per session. */
  onTemplateSaved?: (input: { mode: "school" | "weekend" }) => void;
};

/**
 * Daily rhythm builder. Pick a wake time, see the day laid out, tweak
 * any block's duration. Saves locally, namespaced per user so shared
 * browsers don't bleed across accounts.
 *
 * Two starting templates: school day (~7-block default) and weekend
 * (lighter, more flex). Teens can edit any duration; the timeline
 * recomputes.
 *
 * Sleep math: total awake-block minutes from wake → end = working day.
 * 24h - working day = sleep window. Soft cue if it drops below teen
 * recommended range (8-10 hrs).
 */
export function RhythmBuilder({ onTemplateSaved }: Props) {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const addEvent = useProgressStore((state) => state.addEvent);
  const [mode, setMode] = useState<"school" | "weekend">("school");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [blocks, setBlocks] = useState<RhythmBlock[]>([...DEFAULT_SCHOOL_DAY]);
  const [savedOnce, setSavedOnce] = useState(false);

  // Hydrate from storage once userId is known
  useEffect(() => {
    const saved = loadJSON<SavedTemplate | null>(STORAGE_KEY, userId, null);
    if (!saved) return;
    setMode(saved.mode);
    setWakeTime(saved.wakeTime);
    setBlocks(saved.blocks);
  }, [userId]);

  function applyTemplate(next: "school" | "weekend") {
    setMode(next);
    setBlocks([...(next === "school" ? DEFAULT_SCHOOL_DAY : DEFAULT_WEEKEND)]);
  }

  function setBlockDuration(id: string, minutes: number) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, durationMinutes: Math.max(0, Math.min(720, minutes)) } : b))
    );
  }

  function save() {
    const payload: SavedTemplate = { mode, wakeTime, blocks };
    saveJSON(STORAGE_KEY, userId, payload);
    if (!savedOnce) {
      setSavedOnce(true);
      if (onTemplateSaved) {
        onTemplateSaved({ mode });
      } else {
        addEvent(
          scrubProgressEvent({
            engine: "physical" as const,
            eventType: "rhythm_template_saved",
            eventValue: 8,
            payload: { mode }
          })
        );
      }
    }
  }

  function resetToDefault() {
    applyTemplate(mode);
  }

  const wakeMinutes = useMemo(() => minutesFromHHMM(wakeTime), [wakeTime]);
  const schedule = useMemo(() => buildSchedule(blocks, wakeMinutes), [blocks, wakeMinutes]);
  const endMinutes = schedule.length > 0 ? schedule[schedule.length - 1].endMinutes : wakeMinutes;
  const sleepHours = sleepHoursFromWake(wakeMinutes, totalScheduledMinutes(blocks));

  const sleepCue =
    sleepHours >= TEEN_SLEEP_HOURS.min
      ? sleepHours > TEEN_SLEEP_HOURS.max
        ? "Plenty of sleep budgeted — that's fine."
        : "Sleep window looks solid for teens (8-10 hours)."
      : "Sleep window is below the teen-recommended range (8-10 hours). Consider trimming downtime or shifting wake later.";

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-lime text-sage">
        <Clock />
      </div>
      <p className="eyebrow">daily rhythm</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Build your weekday template.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Pick a wake time. Adjust block durations. The day fills in automatically. Lives on this device only.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <fieldset role="radiogroup" aria-label="Template" className="flex gap-2">
          {(["school", "weekend"] as const).map((option) => {
            const active = mode === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => applyTemplate(option)}
                className={`focus-ring rounded-full px-4 py-1.5 text-sm font-bold transition ${
                  active ? "bg-sage text-white" : "border border-line bg-paper text-muted hover:bg-white hover:text-ink"
                }`}
              >
                {option === "school" ? "School day" : "Weekend"}
              </button>
            );
          })}
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Wake</span>
          <input
            type="time"
            value={wakeTime}
            onChange={(event) => setWakeTime(event.target.value)}
            className="field"
            aria-label="Wake time"
          />
        </label>
      </div>

      <ol className="mt-5 space-y-2">
        {schedule.map((block) => (
          <li key={block.id} className="rounded-kai border border-line bg-paper p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base font-black">{block.label}</p>
                <p className="text-xs text-muted">
                  {hhmmFromMinutes(block.startMinutes)} – {hhmmFromMinutes(block.endMinutes)}
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-muted">Mins</span>
                <input
                  type="number"
                  min={0}
                  max={720}
                  step={5}
                  value={block.durationMinutes}
                  onChange={(event) => setBlockDuration(block.id, Number(event.target.value))}
                  className="field w-20"
                  aria-label={`${block.label} duration in minutes`}
                />
              </label>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-kai border border-sage/30 bg-lime p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-sage">Day ends at</p>
        <p className="mt-1 font-display text-2xl font-black tracking-normal">{hhmmFromMinutes(endMinutes)}</p>
        <p className="mt-2 text-sm leading-6 text-ink">
          Sleep window: ~{sleepHours} hours. {sleepCue}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={save}>Save template</Button>
        <Button variant="secondary" onClick={resetToDefault}>
          <RotateCcw size={14} aria-hidden="true" /> Reset to default
        </Button>
      </div>
    </section>
  );
}
