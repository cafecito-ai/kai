import { ArrowLeft, ShieldAlert, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoalComposer } from "../components/goals/GoalComposer";
import { AppPage, KaiMark } from "../components/ui/AppPrimitives";
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
    <AppPage className="goal-page-shell pb-28 pr-4 sm:pb-12 sm:pr-0">
      <Link to="/home" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full px-1 text-sm font-black text-muted">
        <ArrowLeft size={17} aria-hidden="true" />
        Home
      </Link>

      <section className="w-full max-w-full overflow-hidden rounded-[30px] border border-white/10 bg-ink text-paper shadow-calm">
        <div className="relative p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full bg-[#8F5CFF]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-8 size-44 rounded-full bg-[#44D7B6]/20 blur-3xl" />
          <div className="relative min-w-0">
            <div className="flex items-center gap-3">
              <KaiMark size="md" />
              <p className="text-xs font-black uppercase tracking-[0.18em] text-paper/55">Kai · goal move</p>
            </div>
            <div className="min-w-0">
              <h1 className="mt-3 font-display text-[2.42rem] font-black leading-[0.93] tracking-normal sm:text-6xl">Pick one thing.</h1>
              <p className="mt-3 max-w-[16.5rem] text-base font-semibold leading-7 text-paper/72 sm:max-w-2xl">
                Say the thing you keep circling. Kai will shrink it into one move you can actually do today.
              </p>
            </div>
            <span className="hidden size-12 shrink-0 place-items-center rounded-full bg-white/10 text-paper sm:grid">
              <Target aria-hidden="true" />
            </span>
          </div>
          <div className="relative mt-5 flex items-center gap-2 rounded-[22px] border border-white/10 bg-white/8 p-3 text-sm font-bold text-paper/76">
            <Sparkles size={17} className="shrink-0 text-[#CDBBFF]" aria-hidden="true" />
            No fake restart. One honest next rep.
          </div>
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
