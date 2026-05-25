import { RefreshCw, Target } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { GoalCard } from "../components/goals/GoalCard";
import { GoalEmptyState } from "../components/goals/GoalEmptyState";
import { AppPage } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import type { GoalStatus } from "../lib/types";
import { useGoalStore } from "../stores/goalStore";

export function Goals() {
  const goals = useGoalStore((state) => state.goals);
  const status = useGoalStore((state) => state.status);
  const errorMessage = useGoalStore((state) => state.errorMessage);
  const hydrateGoals = useGoalStore((state) => state.hydrateGoals);

  useEffect(() => {
    if (status === "idle") void hydrateGoals();
  }, [hydrateGoals, status]);

  const loading = status === "loading" && goals.length === 0;

  return (
    <AppPage>
      <section className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-calm sm:p-7">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="eyebrow">Kai · goals</p>
            <h1 className="mt-2 font-display text-5xl font-black leading-none tracking-normal text-ink">Goals in motion.</h1>
            <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-muted">One direction, one next rep, no shame spiral.</p>
          </div>
          <Link to="/goal" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-paper">
            <Target size={16} aria-hidden="true" />
            Start a goal
          </Link>
        </div>
      </section>

      {errorMessage && (
        <section className="rounded-kai border border-care/30 bg-careWash p-4">
          <p className="text-sm font-bold text-ink">{errorMessage}</p>
          <Button variant="secondary" className="mt-3" onClick={() => void hydrateGoals()}>
            <RefreshCw size={16} aria-hidden="true" />
            Retry
          </Button>
        </section>
      )}

      {loading && <GoalSkeleton />}
      {!loading && goals.length === 0 && <GoalEmptyState />}
      {!loading && goals.length > 0 && (
        <div className="grid gap-4">
          <GoalSection title="Active goals" goals={goals.filter((goal) => goal.status === "active")} status="active" />
          <GoalSection title="Paused goals" goals={goals.filter((goal) => goal.status === "paused")} status="paused" />
          <GoalSection title="Achieved goals" goals={goals.filter((goal) => goal.status === "achieved")} status="achieved" />
        </div>
      )}
    </AppPage>
  );
}

function GoalSection({ title, goals, status }: { title: string; goals: ReturnType<typeof useGoalStore.getState>["goals"]; status: GoalStatus }) {
  return (
    <section className="rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-black tracking-normal">{title}</h2>
        <span className="rounded-full bg-paper px-3 py-1 text-xs font-black text-muted">{goals.length}</span>
      </div>
      {goals.length === 0 ? (
        <p className="rounded-kai border border-line bg-paper p-3 text-sm font-semibold text-muted">No {status} goals.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
        </div>
      )}
    </section>
  );
}

function GoalSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-[22px] border border-line bg-white/70" />)}
    </div>
  );
}
