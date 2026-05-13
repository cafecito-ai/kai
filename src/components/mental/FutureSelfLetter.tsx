import { PenLine } from "lucide-react";
import { useState } from "react";
import { addDays, localDateKey } from "../../lib/dates";
import { Button } from "../ui/Button";

type Direction = "future" | "past";

type Props = {
  onComplete: (payload: {
    direction: Direction;
    revisitAt: string | null; // ISO date for "future"; null for "past"
    body: string;
  }) => void;
};

const FUTURE_PROMPTS = [
  "Tell them what you're handling right now.",
  "Name one thing you hope they remember.",
  "What's one small thing you'd want them to thank you for?"
];

const PAST_PROMPTS = [
  "Tell them what you wish you'd known then.",
  "Name one thing they actually got right.",
  "What's one thing you'd want them to stop carrying?"
];

// Local-time date math. Codex flagged the original toISOString().slice(0,10)
// pattern: in west-of-UTC zones in the evening it returns tomorrow's date,
// so the "1 month from now" chip would actually be 1 month + 1 day.
function todayPlusDays(days: number): string {
  return localDateKey(addDays(new Date(), days));
}

function todayMinusDays(days: number): string {
  return localDateKey(addDays(new Date(), -days));
}

/**
 * Future/past self letter writing tool per spec Section 6 (mental engine
 * action: "Write to themselves — a letter to their future or past self")
 * + Phase 4 Task 10.
 *
 * - Toggle direction (future vs past). Default future.
 * - Pick a revisit date — three quick chips (1 week, 1 month, 3 months)
 *   plus a manual date input. Defaults to one month out. For past-self
 *   the date is read-only and just shows when they're writing FROM.
 * - Body is a textarea with rotating placeholder copy from the
 *   direction-specific prompts.
 * - No reminders / scheduled delivery in v1; the date is for the teen's
 *   own reference + ops dashboards. A real notify-on-date scheduled
 *   worker is a follow-up.
 */
export function FutureSelfLetter({ onComplete }: Props) {
  const [direction, setDirection] = useState<Direction>("future");
  const [revisitAt, setRevisitAt] = useState<string>(todayPlusDays(30));
  const [body, setBody] = useState("");
  const [promptIdx, setPromptIdx] = useState(0);

  function reset() {
    setDirection("future");
    setRevisitAt(todayPlusDays(30));
    setBody("");
    setPromptIdx(0);
  }

  function save() {
    onComplete({
      direction,
      revisitAt: direction === "future" ? revisitAt : null,
      body
    });
    reset();
  }

  const prompts = direction === "future" ? FUTURE_PROMPTS : PAST_PROMPTS;

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#FFE8DD] text-coral">
        <PenLine />
      </div>
      <p className="eyebrow">future / past self letter</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Write to the version of you with a little more room.</h2>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">Who are you writing to?</legend>
        <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Letter direction">
          {(["future", "past"] as const).map((option) => {
            const active = direction === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setDirection(option);
                  if (option === "future") setRevisitAt(todayPlusDays(30));
                  else setRevisitAt(todayMinusDays(180));
                }}
                className={`focus-ring rounded-full px-4 py-1.5 text-sm font-bold transition ${
                  active ? "bg-coral text-white" : "border border-line bg-paper text-muted hover:bg-white hover:text-ink"
                }`}
              >
                {option === "future" ? "Future me" : "Past me"}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4">
        <label htmlFor="letter-revisit" className="block text-sm font-semibold">
          {direction === "future" ? "Open this letter on" : "Writing back to yourself from"}
        </label>
        {direction === "future" && (
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { label: "In 1 week", days: 7 },
              { label: "In 1 month", days: 30 },
              { label: "In 3 months", days: 90 }
            ].map((choice) => {
              const target = todayPlusDays(choice.days);
              const active = revisitAt === target;
              return (
                <button
                  key={choice.days}
                  type="button"
                  onClick={() => setRevisitAt(target)}
                  aria-pressed={active}
                  className={`focus-ring rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    active ? "bg-coral text-white" : "border border-line bg-paper text-muted hover:bg-white hover:text-ink"
                  }`}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>
        )}
        <input
          id="letter-revisit"
          type="date"
          className="field mt-2 w-full sm:w-auto"
          value={revisitAt}
          onChange={(event) => setRevisitAt(event.target.value)}
          readOnly={direction === "past"}
        />
        {direction === "future" && (
          <p className="mt-1 text-xs text-muted">
            We don't email or push you on that date in v1 — it's just here so you can find it later.
          </p>
        )}
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="letter-body" className="text-sm font-semibold">
            The letter
          </label>
          <button
            type="button"
            onClick={() => setPromptIdx((idx) => (idx + 1) % prompts.length)}
            className="focus-ring text-xs font-bold uppercase tracking-wider text-coral underline"
          >
            Try a different prompt
          </button>
        </div>
        <textarea
          id="letter-body"
          className="field mt-2 min-h-32 w-full"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={prompts[promptIdx]}
        />
      </div>

      <Button className="mt-4" variant="secondary" onClick={save} disabled={!body.trim()}>
        Save letter
      </Button>
    </section>
  );
}
