import { ArrowLeft, CheckCircle2, Pause, Pencil, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GoalNextAction } from "../components/goals/GoalNextAction";
import { GoalStatusPill } from "../components/goals/GoalStatusPill";
import { AppPage } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { useGoalStore } from "../stores/goalStore";

export function GoalDetail() {
  const { goalId } = useParams();
  const goals = useGoalStore((state) => state.goals);
  const status = useGoalStore((state) => state.status);
  const errorMessage = useGoalStore((state) => state.errorMessage);
  const hydrateGoals = useGoalStore((state) => state.hydrateGoals);
  const updateGoal = useGoalStore((state) => state.updateGoal);
  const saving = status === "saving";
  const goal = useMemo(() => goals.find((item) => item.id === goalId), [goalId, goals]);
  const [nextAction, setNextAction] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (status === "idle") void hydrateGoals();
  }, [hydrateGoals, status]);

  useEffect(() => {
    setNextAction(goal?.nextAction ?? "");
  }, [goal?.nextAction]);

  if (!goalId || (!goal && status !== "loading")) {
    return (
      <AppPage className="max-w-3xl">
        <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-calm">
          <p className="eyebrow">Goal not found</p>
          <h1 className="mt-2 font-display text-4xl font-black tracking-normal">Kai couldn’t find that goal.</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted">It may have been released, or the link may be off.</p>
          <Link to="/goals" className="focus-ring mt-5 inline-flex min-h-12 items-center rounded-full bg-ink px-5 text-sm font-black text-paper">Back to goals</Link>
        </section>
      </AppPage>
    );
  }

  if (!goal) return <AppPage><div className="h-48 animate-pulse rounded-[24px] border border-line bg-white/70" /></AppPage>;

  return (
    <AppPage className="max-w-4xl">
      <Link to="/goals" className="focus-ring inline-flex items-center gap-2 text-sm font-black text-muted">
        <ArrowLeft size={16} aria-hidden="true" />
        Goals
      </Link>
      <section className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-calm sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">{goal.category}</p>
            <h1 className="mt-2 break-words font-display text-5xl font-black leading-none tracking-normal text-ink">{goal.title || "Untitled goal"}</h1>
          </div>
          <GoalStatusPill status={goal.status} />
        </div>
        <p className="mt-5 text-base font-semibold leading-7 text-muted">{goal.whyItMatters || goal.description || "This goal matters enough to start small."}</p>
      </section>

      {errorMessage && <p className="rounded-kai border border-danger/25 bg-dangerWash p-3 text-sm font-bold text-danger">{errorMessage}</p>}

      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-sm">
          <GoalNextAction action={goal.nextAction} />
          {editing && (
            <div className="mt-4 grid gap-3">
              <textarea className="field min-h-28" value={nextAction} onChange={(event) => setNextAction(event.target.value)} />
              <Button disabled={saving} onClick={() => void updateGoal(goal.id, { nextAction }).then(() => setEditing(false))}>
                Save next action
              </Button>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to={`/loop?goalId=${encodeURIComponent(goal.id)}`} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-paper">
              <Target size={16} aria-hidden="true" />
              Do this in today’s loop
            </Link>
            <Button variant="secondary" onClick={() => setEditing((open) => !open)} disabled={saving}>
              <Pencil size={16} aria-hidden="true" />
              Edit next action
            </Button>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-sm">
          <p className="eyebrow">Progress summary</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted">Kai is tracking goal reps through the daily loop. Detailed goal history can build on progress events later.</p>
          <div className="mt-5 grid gap-2">
            <Button onClick={() => void updateGoal(goal.id, { status: "achieved", achievedAt: new Date().toISOString() })} disabled={saving || goal.status === "achieved"}>
              <CheckCircle2 size={16} aria-hidden="true" />
              Mark achieved
            </Button>
            <Button variant="secondary" onClick={() => void updateGoal(goal.id, { status: "paused" })} disabled={saving || goal.status === "paused"}>
              <Pause size={16} aria-hidden="true" />
              Pause
            </Button>
          </div>
        </div>
      </section>
    </AppPage>
  );
}
