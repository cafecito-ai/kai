import { ShieldAlert, Target } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoalComposer } from "../components/goals/GoalComposer";
import { AppPage } from "../components/ui/AppPrimitives";
import { api } from "../lib/api";
import { useGoalStore } from "../stores/goalStore";

const CRISIS_COPY = "That sounds bigger than a normal goal. Kai can stay with you, but this is real-support territory.";

export function Goal() {
  const navigate = useNavigate();
  const createGoal = useGoalStore((state) => state.createGoal);
  const status = useGoalStore((state) => state.status);
  const errorMessage = useGoalStore((state) => state.errorMessage);
  const clearError = useGoalStore((state) => state.clearError);
  const [unsafe, setUnsafe] = useState(false);
  const saving = status === "saving";

  async function saveGoal(input: Parameters<typeof createGoal>[0]) {
    const goal = await createGoal(input);
    void api.logProgress({
      engine: "potential",
      eventType: "goal_created",
      eventValue: 8,
      payload: { category: goal.category, source: "goal_page" }
    }).catch(() => undefined);
    navigate("/loop?goalCreated=1");
  }

  return (
    <AppPage className="max-w-5xl">
      <section className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-calm sm:p-7">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="eyebrow">Kai · goal</p>
            <h1 className="mt-2 font-display text-5xl font-black leading-none tracking-normal text-ink">Pick one thing.</h1>
            <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-muted">Not your whole life. Just one thing worth moving forward.</p>
          </div>
          <span className="grid size-14 place-items-center rounded-full bg-goalsWash text-goals">
            <Target aria-hidden="true" />
          </span>
        </div>
      </section>

      {status === "error" && errorMessage && (
        <section className="rounded-kai border border-danger/25 bg-dangerWash p-4 text-sm font-bold text-danger">
          {errorMessage}
          <button type="button" onClick={clearError} className="focus-ring ml-3 underline">Dismiss</button>
        </section>
      )}

      <GoalComposer
        saving={saving}
        errorMessage={errorMessage}
        onUnsafe={() => {
          setUnsafe(true);
          window.setTimeout(() => document.getElementById("crisis-goal")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
        }}
        onSave={saveGoal}
      />

      {unsafe && <section id="crisis-goal" className="rounded-[24px] border border-danger/25 bg-dangerWash p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-danger">
            <ShieldAlert size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="font-black text-danger">{CRISIS_COPY}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink">If this is about self-harm, violence, not eating, getting hurt, or being unsafe, use real support now. Kai can stay open while you do.</p>
            <Link to="/crisis" className="focus-ring mt-3 inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-black text-danger">
              Crisis resources
            </Link>
          </div>
        </div>
      </section>}
    </AppPage>
  );
}
