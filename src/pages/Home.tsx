import { ArrowRight, LifeBuoy, RefreshCw, Target, Zap } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { AppPage } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { getNextAvailableStep } from "../lib/loop";
import { useGoalStore } from "../stores/goalStore";
import { useLoopStore } from "../stores/loopStore";
import { useProgressStore } from "../stores/progressStore";

export function Home() {
  const goals = useGoalStore((state) => state.goals);
  const goalStatus = useGoalStore((state) => state.status);
  const hydrateGoals = useGoalStore((state) => state.hydrateGoals);
  const loop = useLoopStore((state) => state.loop);
  const loopStatus = useLoopStore((state) => state.status);
  const loopError = useLoopStore((state) => state.errorMessage);
  const hydrateLoop = useLoopStore((state) => state.hydrateLoop);
  const streak = useProgressStore((state) => state.streak());

  useEffect(() => {
    if (goalStatus === "idle") void hydrateGoals();
  }, [goalStatus, hydrateGoals]);

  useEffect(() => {
    if (loopStatus === "idle") void hydrateLoop(goals);
  }, [goals, hydrateLoop, loopStatus]);

  const activeGoals = goals.filter((goal) => goal.status === "active");
  const completedSteps = loop?.steps.filter((step) => step.status === "completed").length ?? 0;
  const nextStep = loop ? getNextAvailableStep(loop.steps) : null;
  const nextAction = useMemo(() => {
    if (!loop) return "Start with a 60-second loop.";
    if (nextStep?.id === "goal_action" && activeGoals[0]) return activeGoals[0].nextAction || "Do one tiny goal rep.";
    if (nextStep) return nextStep.title;
    return "View what you finished today.";
  }, [activeGoals, loop, nextStep]);

  return (
    <AppPage>
      <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-calm sm:p-7 lg:p-8">
        <p className="eyebrow">{dayLabel()}</p>
        <h1 className="mt-2 font-display text-5xl font-black leading-none tracking-normal text-ink sm:text-7xl">Kai</h1>
        <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-muted">
          A daily loop for body, mind, and one goal. Coaching, not therapy.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link to="/loop" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-paper">
            Start today’s loop
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/goal" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-black text-ink">
            <Target size={16} aria-hidden="true" />
            Set a goal
          </Link>
        </div>
      </section>

      {loopError && (
        <section className="rounded-kai border border-care/30 bg-careWash p-4">
          <p className="text-sm font-bold text-ink">{loopError}</p>
          <Button variant="secondary" className="mt-3" onClick={() => void hydrateLoop(goals)}>
            <RefreshCw size={16} aria-hidden="true" />
            Retry
          </Button>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Momentum" value={String(loop?.score ?? 20)} sub="Today’s rhythm" />
        <Metric label="Active goals" value={String(activeGoals.length)} sub={activeGoals.length ? "In motion" : "Nothing in motion yet"} />
        <Metric label="Loop steps" value={`${completedSteps}/${loop?.steps.length ?? 5}`} sub={streak > 0 ? `${streak}-day streak` : "No check-ins yet today"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.86fr]">
        <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm">
          <p className="eyebrow">Next best action</p>
          <h2 className="mt-2 font-display text-4xl font-black tracking-normal">{nextAction}</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted">
            {completedSteps === 0 ? "No check-ins yet today. Start with a 60-second loop." : "Keep the day moving one small rep at a time."}
          </p>
          <Link to="/loop" className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-paper">
            Open loop
          </Link>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm">
          <p className="eyebrow">Goal</p>
          {activeGoals[0] ? (
            <>
              <h2 className="mt-2 font-display text-3xl font-black tracking-normal">{activeGoals[0].title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">{activeGoals[0].nextAction || "Do one tiny version of this for 10 minutes."}</p>
              <Link to={`/goals/${encodeURIComponent(activeGoals[0].id)}`} className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-black text-ink">Open goal</Link>
            </>
          ) : (
            <>
              <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Nothing in motion yet.</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">Pick one thing. Not your whole life. One thing.</p>
              <Link to="/goal" className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-black text-ink">Set a goal</Link>
            </>
          )}
        </div>
      </section>

      <Link to="/crisis" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-danger/30 bg-white px-4 text-sm font-black text-danger">
        <LifeBuoy size={16} aria-hidden="true" />
        Crisis resources
      </Link>
    </AppPage>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <article className="rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-sm">
      <div className="mb-3 grid size-10 place-items-center rounded-full bg-careWash text-care">
        <Zap size={17} aria-hidden="true" />
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-mono text-3xl font-black text-ink">{value}</p>
      <p className="mt-1 text-sm font-semibold text-muted">{sub}</p>
    </article>
  );
}

function dayLabel(date = new Date()) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
