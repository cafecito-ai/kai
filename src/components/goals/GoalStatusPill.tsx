import { formatGoalStatus } from "../../lib/goals";
import type { GoalStatus } from "../../lib/types";

export function GoalStatusPill({ status }: { status: GoalStatus }) {
  const tone =
    status === "achieved"
      ? "bg-bodyWash text-body"
      : status === "paused"
        ? "bg-careWash text-care"
        : status === "released"
          ? "bg-soft text-muted"
          : "bg-goalsWash text-goals";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${tone}`}>{formatGoalStatus(status)}</span>;
}
