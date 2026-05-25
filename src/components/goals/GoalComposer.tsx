import { useMemo, useState } from "react";
import { createGoalDraftFromText, isUnsafeGoalText } from "../../lib/goals";
import type { GoalCategory } from "../../lib/types";
import { Button } from "../ui/Button";
import { GoalCategoryPicker } from "./GoalCategoryPicker";

const SUGGESTIONS = [
  "Get stronger for basketball",
  "Stop procrastinating homework",
  "Feel less anxious before tests",
  "Write music",
  "Spend less time scrolling",
  "Eat better without obsessing",
  "Sleep before midnight"
];

type GoalComposerStep = "seed" | "category" | "why" | "action" | "review";

export function GoalComposer({
  saving,
  errorMessage,
  onUnsafe,
  onSave
}: {
  saving: boolean;
  errorMessage: string | null;
  onUnsafe: () => void;
  onSave: (input: {
    title: string;
    description: string;
    category: GoalCategory;
    whyItMatters: string;
    nextAction: string;
    targetDate: string;
  }) => Promise<void>;
}) {
  const [step, setStep] = useState<GoalComposerStep>("seed");
  const [seed, setSeed] = useState("");
  const draft = useMemo(() => createGoalDraftFromText(seed), [seed]);
  const [category, setCategory] = useState<GoalCategory>(draft.category);
  const [whyItMatters, setWhyItMatters] = useState(draft.whyItMatters);
  const [nextAction, setNextAction] = useState(draft.nextAction);
  const [targetDate, setTargetDate] = useState(draft.targetDate);

  function continueFlow() {
    if (isUnsafeGoalText(seed)) {
      onUnsafe();
      return;
    }
    if (step === "seed") {
      setCategory(draft.category);
      setWhyItMatters(draft.whyItMatters);
      setNextAction(draft.nextAction);
      setTargetDate(draft.targetDate);
      setStep("category");
    } else if (step === "category") {
      setNextAction(draft.category === category ? draft.nextAction : nextAction);
      setStep("why");
    } else if (step === "why") {
      setStep("action");
    } else if (step === "action") {
      setStep("review");
    }
  }

  async function save() {
    try {
      await onSave({
        title: draft.title,
        description: draft.description,
        category,
        whyItMatters,
        nextAction,
        targetDate
      });
    } catch {
      // The store owns the user-facing error. Keep the draft in place.
    }
  }

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-calm sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        {(["seed", "category", "why", "action", "review"] as GoalComposerStep[]).map((id, index) => (
          <span key={id} className={`h-2 flex-1 rounded-full ${step === id ? "bg-ink" : index < stepIndex(step) ? "bg-sage" : "bg-line"}`} />
        ))}
      </div>

      {step === "seed" && (
        <div className="grid gap-4">
          <label className="block text-sm font-black">
            What do you want to get better at?
            <textarea
              className="field mt-2 min-h-36 text-lg"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              placeholder="Get stronger for basketball"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setSeed(suggestion)} className="focus-ring rounded-full border border-line bg-paper px-3 py-2 text-xs font-black text-ink">
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "category" && (
        <div className="grid gap-4">
          <h2 className="font-display text-3xl font-black tracking-normal">What lane is this in?</h2>
          <GoalCategoryPicker selected={category} onChange={setCategory} />
        </div>
      )}

      {step === "why" && (
        <label className="block text-sm font-black">
          Why does this matter to you?
          <textarea className="field mt-2 min-h-32" value={whyItMatters} onChange={(event) => setWhyItMatters(event.target.value)} />
        </label>
      )}

      {step === "action" && (
        <div className="grid gap-4">
          <label className="block text-sm font-black">
            Next tiny action
            <textarea className="field mt-2 min-h-32" value={nextAction} onChange={(event) => setNextAction(event.target.value)} />
          </label>
          <label className="block text-sm font-black">
            Target date
            <input className="field mt-2" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
          </label>
        </div>
      )}

      {step === "review" && (
        <div className="rounded-[22px] border border-line bg-paper p-4">
          <p className="text-xs font-black uppercase tracking-wider text-muted">{category}</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal">{draft.title}</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted">{whyItMatters || "This matters enough to start small."}</p>
          <p className="mt-3 rounded-kai bg-white p-3 text-sm font-black text-muted">Target: {targetDate || "No date yet"}</p>
          <p className="mt-3 rounded-kai bg-white p-3 text-sm font-black text-ink">{nextAction}</p>
        </div>
      )}

      {errorMessage && <p className="mt-4 rounded-kai border border-danger/25 bg-dangerWash p-3 text-sm font-bold text-danger">{errorMessage}</p>}

      <div className="sticky bottom-24 mt-5 flex gap-2 rounded-full bg-white/90 p-2 backdrop-blur sm:static sm:bg-transparent sm:p-0">
        {step !== "seed" && (
          <Button type="button" variant="secondary" onClick={() => setStep(previousStep(step))} disabled={saving}>
            Back
          </Button>
        )}
        {step === "review" ? (
          <Button type="button" onClick={() => void save()} disabled={saving || !draft.title.trim()}>
            {saving ? "Saving" : "Save this goal"}
          </Button>
        ) : (
          <Button type="button" onClick={continueFlow} disabled={!seed.trim()}>
            Keep going
          </Button>
        )}
      </div>
    </section>
  );
}

function stepIndex(step: GoalComposerStep) {
  return ["seed", "category", "why", "action", "review"].indexOf(step);
}

function previousStep(step: GoalComposerStep): GoalComposerStep {
  const steps: GoalComposerStep[] = ["seed", "category", "why", "action", "review"];
  return steps[Math.max(0, stepIndex(step) - 1)];
}
