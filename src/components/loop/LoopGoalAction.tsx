import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import { Link } from "react-router-dom";
import type { Goal } from "../../lib/types";
import { Button } from "../ui/Button";

export function LoopGoalAction({
  goal,
  saving,
  onComplete
}: {
  goal: Goal | null;
  saving: boolean;
  onComplete: (payload: Record<string, unknown>) => void;
}) {
  if (!goal) {
    return (
      <div className="rounded-[22px] border border-line bg-paper p-4">
        <p className="text-xs font-black uppercase tracking-wider text-muted">Kai needs one target</p>
        <p className="mt-1 font-black text-ink">Pick one thing. Not your whole life.</p>
        <Link to="/goal" className="focus-ring mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-paper">
          <Target size={16} aria-hidden="true" />
          Start a goal
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      <div className="rounded-[22px] border border-goals/20 bg-goalsWash/70 p-4">
        <p className="text-xs font-black uppercase tracking-wider text-muted">Kai’s next move</p>
        <h3 className="mt-1 break-words font-display text-2xl font-black leading-none tracking-normal text-ink">{goal.title}</h3>
        <div className="mt-3 rounded-[18px] bg-white p-3">
          <p className="text-sm font-black leading-5 text-ink">{goal.nextAction || "Do one tiny version of this for 10 minutes."}</p>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs font-bold text-muted">
          <ArrowRight size={14} aria-hidden="true" />
          Do the smallest honest version. Kai will count it.
        </p>
      </div>
      <Button onClick={() => onComplete({ goalId: goal.id, actionCompleted: true, source: "loop" })} disabled={saving}>
        <CheckCircle2 size={16} aria-hidden="true" />
        Did the tiny rep
      </Button>
    </div>
  );
}
