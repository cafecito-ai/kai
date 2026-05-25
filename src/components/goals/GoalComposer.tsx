import { ArrowRight, CalendarDays, Check, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { createGoalDraftFromText, isUnsafeGoalText } from "../../lib/goals";
import type { GoalCategory } from "../../lib/types";
import { KaiMark } from "../ui/AppPrimitives";
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
    <section className="overflow-hidden rounded-[30px] border border-white/70 bg-white/88 p-4 shadow-calm backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex items-center gap-2" aria-label={`Goal step ${stepIndex(step) + 1} of 5`}>
        {(["seed", "category", "why", "action", "review"] as GoalComposerStep[]).map((id, index) => (
          <span key={id} className={`h-1.5 flex-1 rounded-full ${step === id ? "bg-ink" : index < stepIndex(step) ? "bg-sage" : "bg-line"}`} />
        ))}
      </div>

      {step === "seed" && (
        <div className="grid gap-4">
          <div className="flex items-start gap-3">
            <KaiMark size="sm" />
            <div className="min-w-0 max-w-[15.75rem] rounded-[24px] rounded-tl-md bg-ink px-4 py-3 text-paper sm:max-w-none">
              <p className="text-sm font-black leading-5">Drop the real version here. Messy is fine. I’ll make it small enough to start.</p>
            </div>
          </div>
          <label className="block text-sm font-black text-ink">
            What do you want to get better at?
            <textarea
              className="field mt-2 min-h-28 text-lg leading-7"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              placeholder="Get stronger for basketball"
            />
          </label>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 sm:flex-wrap">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setSeed(suggestion)} className="focus-ring shrink-0 rounded-full border border-line bg-paper px-3 py-2 text-xs font-black text-ink">
                {suggestion}
              </button>
            ))}
          </div>
          <GoalDraftPreview title={draft.title} category={draft.category} nextAction={draft.nextAction} active={Boolean(seed.trim())} />
        </div>
      )}

      {step === "category" && (
        <div className="grid gap-4">
          <StepHeader eyebrow="Kai found the lane" title="Where does this live?" copy="This helps Kai coach the right kind of rep instead of giving generic advice." />
          <GoalCategoryPicker selected={category} onChange={setCategory} />
        </div>
      )}

      {step === "why" && (
        <div className="grid gap-4">
          <StepHeader eyebrow="Make it yours" title="Why do you actually care?" copy="Not the impressive answer. The real reason this would feel good to build." />
          <label className="block text-sm font-black text-ink">
            Why does this matter to you?
            <textarea className="field mt-2 min-h-28" value={whyItMatters} onChange={(event) => setWhyItMatters(event.target.value)} />
          </label>
        </div>
      )}

      {step === "action" && (
        <div className="grid gap-4">
          <StepHeader eyebrow="First rep" title="What is the next move?" copy="Make it so small you could do it even on a normal, tired day." />
          <label className="block text-sm font-black text-ink">
            Next tiny action
            <textarea className="field mt-2 min-h-32" value={nextAction} onChange={(event) => setNextAction(event.target.value)} />
          </label>
          <label className="block text-sm font-black text-ink">
            Target date
            <input className="field mt-2" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
          </label>
        </div>
      )}

      {step === "review" && (
        <div className="rounded-[26px] border border-line bg-paper p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-goalsWash text-goals">
              <Check size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-muted">{category}</p>
              <h2 className="mt-1 font-display text-3xl font-black leading-none tracking-normal">Kai’s version</h2>
            </div>
          </div>
          <h3 className="mt-4 break-words font-display text-3xl font-black leading-none tracking-normal text-ink">{draft.title}</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted">{whyItMatters || "This matters enough to start small."}</p>
          <div className="mt-4 grid gap-2">
            <p className="rounded-[18px] bg-white p-3 text-sm font-black text-ink">{nextAction}</p>
            <p className="flex items-center gap-2 rounded-[18px] bg-white p-3 text-sm font-black text-muted">
              <CalendarDays size={16} aria-hidden="true" />
              Target: {targetDate || "No date yet"}
            </p>
          </div>
        </div>
      )}

      {errorMessage && <p className="mt-4 rounded-kai border border-danger/25 bg-dangerWash p-3 text-sm font-bold text-danger">{errorMessage}</p>}

      <div className="sticky bottom-24 mt-5 flex gap-2 rounded-full border border-white/70 bg-white/92 p-2 shadow-soft backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        {step !== "seed" && (
          <Button type="button" variant="secondary" onClick={() => setStep(previousStep(step))} disabled={saving}>
            Back
          </Button>
        )}
        {step === "review" ? (
          <Button type="button" className="flex-1 sm:flex-none" onClick={() => void save()} disabled={saving || !draft.title.trim()}>
            {saving ? "Saving" : "Save this goal"}
          </Button>
        ) : (
          <Button type="button" className="flex-1 sm:flex-none" onClick={continueFlow} disabled={!seed.trim()}>
            Keep going
            <ArrowRight size={17} aria-hidden="true" />
          </Button>
        )}
      </div>
    </section>
  );
}

function GoalDraftPreview({ title, category, nextAction, active }: { title: string; category: GoalCategory; nextAction: string; active: boolean }) {
  return (
    <div className={`rounded-[24px] border p-4 transition ${active ? "border-goals/20 bg-goalsWash/70" : "border-line bg-paper"}`}>
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted">
        <Sparkles size={14} aria-hidden="true" />
        Kai will turn it into
      </div>
      <p className="mt-2 break-words text-lg font-black leading-6 text-ink">{active ? title : "One clear goal"}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-muted">
        {active ? nextAction : "A tiny first rep, a lane, and a target you can adjust later."}
      </p>
      {active && <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wider text-muted">{category}</p>}
    </div>
  );
}

function StepHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-muted">{eyebrow}</p>
      <h2 className="mt-1 font-display text-3xl font-black leading-none tracking-normal text-ink">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-muted">{copy}</p>
    </div>
  );
}

function stepIndex(step: GoalComposerStep) {
  return ["seed", "category", "why", "action", "review"].indexOf(step);
}

function previousStep(step: GoalComposerStep): GoalComposerStep {
  const steps: GoalComposerStep[] = ["seed", "category", "why", "action", "review"];
  return steps[Math.max(0, stepIndex(step) - 1)];
}
