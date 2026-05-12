import { Brain } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";

const EMOTIONS = [
  { id: "anxious", label: "Anxious / tight" },
  { id: "sad", label: "Heavy / sad" },
  { id: "angry", label: "Frustrated / angry" },
  { id: "numb", label: "Flat / numb" },
  { id: "energized", label: "Energized / steady" }
] as const;

const BODY_AREAS = [
  { id: "head", label: "Head" },
  { id: "chest", label: "Chest" },
  { id: "stomach", label: "Stomach" },
  { id: "shoulders", label: "Shoulders / neck" },
  { id: "whole", label: "Whole body" },
  { id: "none", label: "Don't feel it" }
] as const;

type EmotionId = (typeof EMOTIONS)[number]["id"];
type BodyAreaId = (typeof BODY_AREAS)[number]["id"];

type Props = {
  onComplete: (payload: {
    emotions: Record<EmotionId, number>;
    bodyArea: BodyAreaId | null;
    note: string;
  }) => void;
};

/**
 * Structured feelings check-in per spec Section 6 (Mental engine "feelings
 * check-in"). Replaces the single-textarea card with a body+mind scan:
 *   - 5 emotion sliders (0–10)
 *   - one body-area pick
 *   - optional free text
 *
 * Naming what you feel without diagnosing it. Sliders are 0–10 not "happy
 * vs sad" because spec rule: "no good/bad feelings."
 */
export function FeelingsCheckIn({ onComplete }: Props) {
  const initial: Record<EmotionId, number> = { anxious: 0, sad: 0, angry: 0, numb: 0, energized: 5 };
  const [emotions, setEmotions] = useState<Record<EmotionId, number>>(initial);
  const [bodyArea, setBodyArea] = useState<BodyAreaId | null>(null);
  const [note, setNote] = useState("");

  function save() {
    onComplete({ emotions, bodyArea, note });
    setEmotions(initial);
    setBodyArea(null);
    setNote("");
  }

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#FFE8DD] text-coral">
        <Brain />
      </div>
      <p className="eyebrow">feelings check-in</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Name it without diagnosing it.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">Slide each one from 0 (not really) to 10 (a lot). All are fine. Nothing here is good or bad.</p>

      <div className="mt-5 space-y-3">
        {EMOTIONS.map((emotion) => (
          <div key={emotion.id}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <label htmlFor={`feeling-${emotion.id}`} className="font-semibold">
                {emotion.label}
              </label>
              <span className="font-display text-sm font-black tabular-nums" aria-live="polite">
                {emotions[emotion.id]}
              </span>
            </div>
            <input
              id={`feeling-${emotion.id}`}
              type="range"
              min={0}
              max={10}
              step={1}
              value={emotions[emotion.id]}
              onChange={(event) => setEmotions((prev) => ({ ...prev, [emotion.id]: Number(event.target.value) }))}
              className="mt-1 w-full accent-coral"
            />
          </div>
        ))}
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">Where do you feel it most?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {BODY_AREAS.map((area) => {
            const active = bodyArea === area.id;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setBodyArea(active ? null : area.id)}
                aria-pressed={active}
                className={`focus-ring rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  active ? "bg-coral text-white" : "border border-line bg-paper text-muted hover:bg-white hover:text-ink"
                }`}
              >
                {area.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-5 block">
        <span className="text-sm font-semibold">Anything else worth noting?</span>
        <textarea
          className="field mt-2 min-h-20 w-full"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional. Even half a sentence counts."
        />
      </label>

      <Button className="mt-5" variant="secondary" onClick={save}>
        Save check-in
      </Button>
    </section>
  );
}
