import { Wind } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { scrubProgressEvent } from "../../lib/sensitive-events";
import { useProgressStore } from "../../stores/progressStore";
import { Button } from "../ui/Button";
import {
  FEELINGS_ORDERED,
  FEELING_LABEL,
  recommendBreath,
  type Feeling
} from "../../lib/breath-recommender";

type Props = {
  /**
   * Fires once the teen commits to a recommendation (i.e. clicks "Run
   * guided"). Browsing through feeling chips alone does NOT fire this —
   * Codex P2 review on PR #34 flagged the original wiring as polluting
   * Body history with exploratory chip taps.
   */
  onRecommendation?: (input: { feeling: Feeling; patternId: string }) => void;
};

/**
 * Feeling → pattern picker for breathwork. Tap a feeling chip, get the
 * recommended pattern + a one-line rationale + a link into the full
 * BreathingPlayer (lives in the Mental engine).
 *
 * The recommender doesn't run the breath itself — it points at the
 * existing BreathingPlayer instead. Keeps responsibilities clean and
 * avoids duplicating the timer / visual code. The link carries the
 * recommended pattern id via the `breath` query param so the player
 * opens on the right pattern (not the default 4-7-8).
 */
export function BreathRecommender({ onRecommendation }: Props) {
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const recommendation = feeling ? recommendBreath(feeling) : null;
  const addEvent = useProgressStore((state) => state.addEvent);
  // Track which (feeling, patternId) combos have already been logged so
  // re-clicking "Run guided" for the same recommendation doesn't double-log.
  const committedRef = useRef<Set<string>>(new Set());

  function pick(value: Feeling) {
    setFeeling(value);
  }

  function commit() {
    if (!feeling || !recommendation) return;
    const key = `${feeling}|${recommendation.pattern.id}`;
    if (committedRef.current.has(key)) return;
    committedRef.current.add(key);
    if (onRecommendation) {
      onRecommendation({ feeling, patternId: recommendation.pattern.id });
    } else {
      addEvent(
        scrubProgressEvent({
          engine: "physical" as const,
          eventType: "breath_recommendation",
          eventValue: 6,
          payload: { feeling, patternId: recommendation.pattern.id }
        })
      );
    }
  }

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-lime text-sage">
        <Wind />
      </div>
      <p className="eyebrow">breath recommender</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Different breath for different feelings.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Pick how you feel. We'll suggest the pattern that fits.
      </p>

      <fieldset className="mt-4">
        <legend className="text-xs font-bold uppercase tracking-wider text-muted">How are you feeling?</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Feeling">
          {FEELINGS_ORDERED.map((option) => {
            const active = feeling === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => pick(option)}
                className={`focus-ring rounded-full px-4 py-1.5 text-sm font-bold transition ${
                  active ? "bg-sage text-white" : "border border-line bg-paper text-muted hover:bg-white hover:text-ink"
                }`}
              >
                {FEELING_LABEL[option]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {recommendation && (
        <div className="mt-5 rounded-kai border border-line bg-paper p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Recommended</p>
          <h3 className="mt-1 font-display text-2xl font-black tracking-normal">{recommendation.pattern.name}</h3>
          <p className="text-sm font-semibold text-ink">{recommendation.pattern.description}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{recommendation.rationale}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to={`/mental?breath=${encodeURIComponent(recommendation.pattern.id)}#breathing-player`}
              onClick={commit}
              className="focus-ring inline-flex min-h-11 items-center rounded-full bg-sage px-5 py-2 text-sm font-bold text-white hover:bg-sage/90"
            >
              Run guided in Mental Wellness
            </Link>
            <Button variant="secondary" onClick={() => setFeeling(null)}>
              Pick a different feeling
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
