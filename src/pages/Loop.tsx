import { LifeBuoy, WifiOff } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { LoopActionPicker } from "../components/loop/LoopActionPicker";
import { LoopCheckIn } from "../components/loop/LoopCheckIn";
import { LoopCompletionCard } from "../components/loop/LoopCompletionCard";
import { LoopErrorState } from "../components/loop/LoopErrorState";
import { LoopGoalAction } from "../components/loop/LoopGoalAction";
import { LoopHeader } from "../components/loop/LoopHeader";
import { LoopReflection } from "../components/loop/LoopReflection";
import { LoopSkeleton } from "../components/loop/LoopSkeleton";
import { LoopStepCard } from "../components/loop/LoopStepCard";
import { AppPage } from "../components/ui/AppPrimitives";
import { getNextAvailableStep } from "../lib/loop";
import { useGoalStore } from "../stores/goalStore";
import { useLoopStore } from "../stores/loopStore";

const BODY_ACTIONS = [
  "Drink water",
  "5-minute walk",
  "Stretch neck and shoulders",
  "Box breathing",
  "Eat something with protein",
  "Get outside for 3 minutes",
  "Put phone away for 10 minutes"
];

const MIND_ACTIONS = [
  "Name the feeling",
  "Reframe the thought",
  "60-second breathing reset",
  "Compare-and-despair reset",
  "Write one honest sentence",
  "Send one repair text",
  "Pick the next right thing"
];

export function Loop() {
  const goals = useGoalStore((state) => state.goals);
  const goalStatus = useGoalStore((state) => state.status);
  const hydrateGoals = useGoalStore((state) => state.hydrateGoals);
  const loop = useLoopStore((state) => state.loop);
  const loopStatus = useLoopStore((state) => state.status);
  const errorMessage = useLoopStore((state) => state.errorMessage);
  const hydrateLoop = useLoopStore((state) => state.hydrateLoop);
  const completeStep = useLoopStore((state) => state.completeStep);
  const skipStep = useLoopStore((state) => state.skipStep);
  const resetForToday = useLoopStore((state) => state.resetForToday);
  const activeGoal = useMemo(() => goals.find((goal) => goal.status === "active") ?? null, [goals]);

  useEffect(() => {
    if (goalStatus === "idle") void hydrateGoals();
  }, [goalStatus, hydrateGoals]);

  useEffect(() => {
    if (loopStatus === "idle") void hydrateLoop(goals);
  }, [goals, hydrateLoop, loopStatus]);

  const activeStep = loop ? getNextAvailableStep(loop.steps) : null;
  const completed = loop?.steps.filter((step) => step.status === "completed").length ?? 0;
  const complete = loop ? completed === loop.steps.length : false;
  const saving = loopStatus === "saving";

  return (
    <AppPage>
      <LoopHeader score={loop?.score ?? 20} completed={completed} total={loop?.steps.length ?? 5} />

      {loopStatus === "loading" && !loop && <LoopSkeleton />}
      {loopStatus === "offline" && (
        <section className="flex items-center gap-2 rounded-kai border border-care/30 bg-careWash p-3 text-sm font-black text-ink">
          <WifiOff size={16} aria-hidden="true" />
          Offline mode. You can keep going; Kai will sync later.
        </section>
      )}
      {errorMessage && (
        <LoopErrorState
          message={errorMessage}
          offline={loopStatus === "offline"}
          onRetry={() => void hydrateLoop(goals)}
          onContinue={() => resetForToday(goals)}
        />
      )}

      {loop && (
        <div className="grid gap-3">
          {loop.steps.map((step, index) => (
            <LoopStepCard
              key={step.id}
              step={step}
              index={index}
              active={activeStep?.id === step.id}
              saving={saving}
              onSkip={step.id === "reflection" ? undefined : () => void skipStep(step.id)}
            >
              {step.id === "check_in" && <LoopCheckIn saving={saving} onComplete={(payload) => void completeStep("check_in", payload)} />}
              {step.id === "body_action" && (
                <LoopActionPicker
                  options={BODY_ACTIONS}
                  cta="Did the body rep"
                  saving={saving}
                  onComplete={(action) => void completeStep("body_action", { action, source: "loop" })}
                />
              )}
              {step.id === "mind_action" && (
                <LoopActionPicker
                  options={MIND_ACTIONS}
                  cta="Did the mind rep"
                  saving={saving}
                  onComplete={(action) => void completeStep("mind_action", { action, source: "loop" })}
                />
              )}
              {step.id === "goal_action" && <LoopGoalAction goal={activeGoal} saving={saving} onComplete={(payload) => void completeStep("goal_action", payload)} />}
              {step.id === "reflection" && <LoopReflection saving={saving} onComplete={(payload) => void completeStep("reflection", payload)} />}
            </LoopStepCard>
          ))}
        </div>
      )}

      {complete && <LoopCompletionCard />}

      <Link to="/crisis" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-danger/30 bg-white px-4 text-sm font-black text-danger">
        <LifeBuoy size={16} aria-hidden="true" />
        Crisis resources
      </Link>
    </AppPage>
  );
}
