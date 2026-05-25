import { Check, Circle, Lock, SkipForward } from "lucide-react";
import type { ReactNode } from "react";
import type { DailyLoopStep } from "../../lib/types";

type LoopStepCardProps = {
  step: DailyLoopStep;
  index: number;
  active: boolean;
  saving: boolean;
  children?: ReactNode;
  onSkip?: () => void;
};

export function LoopStepCard({ step, index, active, saving, children, onSkip }: LoopStepCardProps) {
  const locked = step.status === "locked";
  const completed = step.status === "completed";
  return (
    <section className={`rounded-[24px] border p-4 shadow-sm ${locked ? "border-line bg-paper opacity-60" : active ? "border-ink bg-white" : "border-line bg-white"}`}>
      <div className="flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-full ${completed ? "bg-sage text-white" : locked ? "bg-line text-muted" : "bg-ink text-paper"}`}>
          {completed ? <Check size={18} aria-hidden="true" /> : locked ? <Lock size={16} aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-wider text-muted">Step {index + 1}</p>
          <h2 className="mt-1 font-display text-2xl font-black tracking-normal text-ink">{step.title}</h2>
          <p className="mt-1 text-sm font-semibold leading-5 text-muted">{step.subtitle}</p>
        </div>
        {onSkip && active && (
          <button type="button" onClick={onSkip} disabled={saving} className="focus-ring grid size-10 shrink-0 place-items-center rounded-full border border-line bg-paper text-muted" aria-label={`Skip ${step.title}`}>
            <SkipForward size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      {active && !locked && <div className="mt-4">{children}</div>}
    </section>
  );
}
