import { ArrowRight, CheckCircle2, Pause, RefreshCw, Sparkles, Target } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { GoalCard } from "../components/goals/GoalCard";
import { GoalEmptyState } from "../components/goals/GoalEmptyState";
import { AppPage, KaiMark } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { formatGoalTargetDate } from "../lib/goals";
import type { Goal, GoalStatus } from "../lib/types";
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
  const activeGoals = goals.filter((goal) => goal.status === "active");
  const pausedGoals = goals.filter((goal) => goal.status === "paused");
  const achievedGoals = goals.filter((goal) => goal.status === "achieved");
  const featuredGoal = activeGoals[0] ?? goals[0] ?? null;
  const activeQueue = featuredGoal?.status === "active" ? activeGoals.filter((goal) => goal.id !== featuredGoal.id) : activeGoals;

  return (
    <AppPage className="pb-28 sm:pb-12">
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-ink text-paper shadow-calm">
        <div className="relative p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-24 size-52 rounded-full bg-[#8F5CFF]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-6 size-44 rounded-full bg-[#44D7B6]/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <KaiMark size="md" />
                <p className="text-xs font-black uppercase tracking-[0.18em] text-paper/55">Kai · goals</p>
              </div>
              <h1 className="mt-3 max-w-[17rem] font-display text-[2.35rem] font-black leading-[0.94] tracking-normal sm:max-w-none sm:text-6xl">What are we moving?</h1>
              <p className="mt-3 max-w-[18rem] text-base font-semibold leading-7 text-paper/72 sm:max-w-2xl">Kai keeps the promise small, visible, and yours. One next rep beats a whole fake reset.</p>
            </div>
            <Link to="/goal" className="focus-ring hidden min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-ink sm:inline-flex">
              <Target size={16} aria-hidden="true" />
              Start a goal
            </Link>
          </div>
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
          {featuredGoal && <FeaturedGoal goal={featuredGoal} />}
          <GoalSection title="On deck" summary="Other promises Kai can help you move next." goals={activeQueue} status="active" empty="Nothing else needs attention right now." />
          <GoalSection title="Banked wins" summary="Proof you already created. Keep the lesson, not the pressure." goals={achievedGoals} status="achieved" empty="No banked wins yet." />
          <GoalSection title="Paused cleanly" summary="Paused does not mean failed. It means not today." goals={pausedGoals} status="paused" empty="Nothing is paused." />
        </div>
      )}
    </AppPage>
  );
}

function FeaturedGoal({ goal }: { goal: Goal }) {
  const nextAction = goal.nextAction?.trim() || "Pick one tiny next rep.";
  return (
    <section className="rounded-[30px] border border-white/70 bg-white/88 p-4 shadow-sm backdrop-blur-xl sm:p-6">
      <div className="flex items-center gap-3">
        <KaiMark size="sm" />
        <p className="text-sm font-black leading-5 text-ink">This is the next rep I’d keep in front of you.</p>
      </div>
      <div className="mt-4 rounded-[24px] border border-goals/20 bg-goalsWash/70 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wider text-muted">
          <Sparkles size={14} aria-hidden="true" />
          {goal.category || "custom"} · {formatGoalTargetDate(goal.targetDate)}
        </div>
        <h2 className="mt-2 break-words font-display text-3xl font-black leading-none tracking-normal text-ink">{goal.title || "Untitled goal"}</h2>
        <p className="mt-3 rounded-[18px] bg-white p-3 text-sm font-black leading-5 text-ink">{nextAction}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={`/goals/${encodeURIComponent(goal.id)}`} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-paper">
            Do this now
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to={`/loop?goalId=${encodeURIComponent(goal.id)}`} className="focus-ring hidden min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-black text-ink sm:inline-flex">
            Put it in today
          </Link>
        </div>
      </div>
    </section>
  );
}

function GoalSection({
  title,
  summary,
  goals,
  status,
  empty
}: {
  title: string;
  summary: string;
  goals: ReturnType<typeof useGoalStore.getState>["goals"];
  status: GoalStatus;
  empty: string;
}) {
  const Icon = status === "achieved" ? CheckCircle2 : status === "paused" ? Pause : Target;
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur-xl">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-goalsWash text-goals">
              <Icon size={17} aria-hidden="true" />
            </span>
            <h2 className="font-display text-2xl font-black leading-none tracking-normal text-ink">{title}</h2>
          </div>
          <p className="mt-2 text-sm font-semibold leading-5 text-muted">{summary}</p>
        </div>
        <span className="rounded-full bg-paper px-3 py-1 text-xs font-black text-muted">{goals.length}</span>
      </div>
      {goals.length === 0 ? (
        <p className="rounded-[18px] border border-line bg-paper p-3 text-sm font-semibold text-muted">{empty}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((goal) => <GoalCard key={goal.id} goal={goal} compact />)}
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
