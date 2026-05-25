import { ArrowRight, Check, Circle, Flame, HeartPulse, RotateCcw, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppHero, AppPage, AppSurface, FlowList, MetricPill } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { KAI_LOOP_STEPS, loopCompletion, resetLoopIfNewDay, toggleLoopStep, type DailyLoopState, type LoopStep } from "../lib/loop";
import { loadJSON, saveJSON } from "../lib/local-storage";
import { recommendNextLoop } from "../lib/tracker";
import { useProgressStore } from "../stores/progressStore";

const LOOP_STORAGE_KEY = "kai.daily.loop.v1";

export function Loop() {
  const events = useProgressStore((state) => state.events);
  const addEvent = useProgressStore((state) => state.addEvent);
  const [state, setState] = useState<DailyLoopState>(() => resetLoopIfNewDay(null));
  const recommendation = useMemo(() => recommendNextLoop(events), [events]);
  const completion = loopCompletion(state);
  const completedCount = state.completed.length;
  const nextStep = KAI_LOOP_STEPS.find((step) => !state.completed.includes(step.id)) ?? KAI_LOOP_STEPS[KAI_LOOP_STEPS.length - 1];

  useEffect(() => {
    const stored = loadJSON<DailyLoopState | null>(LOOP_STORAGE_KEY, null, null);
    const reset = resetLoopIfNewDay(stored);
    setState(reset);
    saveJSON(LOOP_STORAGE_KEY, null, reset);
  }, []);

  function completeStep(step: LoopStep) {
    setState((current) => {
      const next = toggleLoopStep(current, step.id);
      saveJSON(LOOP_STORAGE_KEY, null, next);
      if (!current.completed.includes(step.id)) {
        addEvent({
          engine: step.engine,
          eventType: step.eventType,
          eventValue: step.eventValue,
          payload: { stepId: step.id, source: "loop_route" }
        });
      }
      return next;
    });
  }

  function resetLoop() {
    const next = resetLoopIfNewDay(null);
    setState(next);
    saveJSON(LOOP_STORAGE_KEY, null, next);
  }

  return (
    <AppPage className="max-w-6xl">
      <AppHero
        eyebrow="app section · loop"
        title={
          <>
            Run the smallest complete Kai <span className="font-serif font-normal italic text-plum">loop.</span>
          </>
        }
        action={
          <Link to={nextStep.route} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-paper">
            Open next rep
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        }
      >
        Mind, body, goal, closeout. One complete pass.
      </AppHero>

      <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <AppSurface className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">today</p>
              <h2 className="mt-2 font-display text-5xl font-black leading-none tracking-normal">{completion}%</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">{completedCount} of {KAI_LOOP_STEPS.length} reps complete.</p>
            </div>
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-careWash text-care">
              <HeartPulse size={24} aria-hidden="true" />
            </span>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-paper">
            <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${Math.max(8, completion)}%` }} />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <MetricPill label="Mind" value={state.completed.includes("mental_check") ? "Done" : "Open"} tone="reset" />
            <MetricPill label="Body" value={state.completed.includes("body_signal") ? "Done" : "Open"} tone="body" />
            <MetricPill label="Goal" value={state.completed.includes("goal_rep") ? "Done" : "Open"} tone="goals" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={resetLoop}>
              <RotateCcw size={16} aria-hidden="true" />
              Reset today
            </Button>
            <Link to="/goal" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-black text-ink hover:border-ink/35">
              <Target size={16} aria-hidden="true" />
              Goal
            </Link>
          </div>
        </AppSurface>

        <div className="grid gap-3">
          {KAI_LOOP_STEPS.map((step, index) => {
            const done = state.completed.includes(step.id);
            return (
              <AppSurface key={step.id} className={`p-4 sm:p-5 ${done ? "border-sage/20 bg-bodyWash/80" : ""}`}>
                <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <button
                    type="button"
                    onClick={() => completeStep(step)}
                    className={`focus-ring grid size-12 place-items-center rounded-full ${done ? "bg-sage text-white" : "bg-paper text-muted"}`}
                    aria-label={`${done ? "Reopen" : "Complete"} ${step.title}`}
                  >
                    {done ? <Check size={20} aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-muted">Step {index + 1} · {step.label}</p>
                    <h2 className="mt-1 font-display text-2xl font-black tracking-normal">{step.title}</h2>
                    <p className="mt-1 text-sm font-semibold leading-6 text-muted">{step.copy}</p>
                  </div>
                  <Link to={step.route} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-black text-paper">
                    Open
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </AppSurface>
            );
          })}
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.78fr]">
        <AppSurface className="p-5 sm:p-6">
          <p className="eyebrow">kai recommends</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <h2 className="font-display text-3xl font-black tracking-normal">{recommendation.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">{recommendation.copy}</p>
            </div>
            <Link to={recommendation.to} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-paper">
              {recommendation.label}
              <Flame size={17} aria-hidden="true" />
            </Link>
          </div>
        </AppSurface>

        <AppSurface className="p-5 sm:p-6">
          <p className="eyebrow">demo script</p>
          <div className="mt-4">
            <FlowList
              items={[
                { label: "Set the goal", copy: "Pick one goal and one reason it matters." },
                { label: "Run the loop", copy: "Touch mind, body, goal, and closeout." },
                { label: "Show progress", copy: "Open the private timeline and next recommendation." }
              ]}
            />
          </div>
        </AppSurface>
      </section>
    </AppPage>
  );
}
