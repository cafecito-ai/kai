import { Target } from "lucide-react";
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
      <div className="rounded-[20px] border border-line bg-paper p-4">
        <p className="font-black text-ink">No goal yet. Want to pick one tiny thing to move forward?</p>
        <Link to="/goal" className="focus-ring mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-paper">
          <Target size={16} aria-hidden="true" />
          Start a goal
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      <div className="rounded-[20px] border border-line bg-paper p-4">
        <p className="text-xs font-black uppercase tracking-wider text-muted">Goal rep</p>
        <h3 className="mt-1 font-display text-2xl font-black tracking-normal">{goal.title}</h3>
        <p className="mt-2 text-sm font-semibold leading-5 text-muted">{goal.nextAction || "Do one tiny version of this for 10 minutes."}</p>
      </div>
      <Button onClick={() => onComplete({ goalId: goal.id, actionCompleted: true, source: "loop" })} disabled={saving}>
        Did the tiny rep
      </Button>
    </div>
  );
}
