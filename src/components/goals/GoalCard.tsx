import { ArrowRight, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { formatGoalTargetDate } from "../../lib/goals";
import type { Goal } from "../../lib/types";
import { GoalStatusPill } from "./GoalStatusPill";

export function GoalCard({ goal, compact = false }: { goal: Goal; compact?: boolean }) {
  const title = goal.title?.trim() || "Untitled goal";
  const nextAction = goal.nextAction?.trim() || "Pick one tiny next rep.";
  return (
    <Link to={`/goals/${encodeURIComponent(goal.id)}`} className="focus-ring block rounded-[24px] border border-line bg-white p-4 shadow-sm transition hover:border-ink/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-muted">
            <CalendarDays size={13} aria-hidden="true" />
            {goal.category || "custom"} · {formatGoalTargetDate(goal.targetDate)}
          </p>
          <h3 className={`mt-1 break-words font-display font-black leading-none tracking-normal text-ink ${compact ? "text-xl" : "text-2xl"}`}>{title}</h3>
        </div>
        <GoalStatusPill status={goal.status} />
      </div>
      <p className="mt-3 text-sm font-semibold leading-5 text-muted">{nextAction}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-ink">
        Keep moving
        <ArrowRight size={15} aria-hidden="true" />
      </span>
    </Link>
  );
}
