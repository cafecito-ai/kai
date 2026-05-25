import { ArrowRight, Brain, Camera, LifeBuoy, Send, Sparkles, Target } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppPage, KaiAvatar } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { getNextAvailableStep } from "../lib/loop";
import type { DailyLoopStep, Goal } from "../lib/types";
import { useGoalStore } from "../stores/goalStore";
import { useKaiStore } from "../stores/kaiStore";
import { useLoopStore } from "../stores/loopStore";
import { useProgressStore } from "../stores/progressStore";

type RouteAction = {
  title: string;
  copy: string;
  to: string;
  icon: typeof Brain;
  tone: string;
};

export function Home() {
  const [draft, setDraft] = useState("");
  const goals = useGoalStore((state) => state.goals);
  const goalStatus = useGoalStore((state) => state.status);
  const hydrateGoals = useGoalStore((state) => state.hydrateGoals);
  const loop = useLoopStore((state) => state.loop);
  const loopStatus = useLoopStore((state) => state.status);
  const loopError = useLoopStore((state) => state.errorMessage);
  const hydrateLoop = useLoopStore((state) => state.hydrateLoop);
  const streak = useProgressStore((state) => state.streak());
  const messages = useKaiStore((state) => state.chats.kai.messages);
  const sending = useKaiStore((state) => state.chats.kai.sending);
  const send = useKaiStore((state) => state.send);

  useEffect(() => {
    if (goalStatus === "idle") void hydrateGoals();
  }, [goalStatus, hydrateGoals]);

  useEffect(() => {
    if (loopStatus === "idle") void hydrateLoop(goals);
  }, [goals, hydrateLoop, loopStatus]);

  const activeGoals = goals.filter((goal) => goal.status === "active");
  const completedSteps = loop?.steps.filter((step) => step.status === "completed").length ?? 0;
  const nextStep = loop ? getNextAvailableStep(loop.steps) : null;
  const nextMove = useMemo(() => getNextMove(nextStep, activeGoals), [activeGoals, nextStep]);
  const lastKaiMessage =
    [...messages].reverse().find((message) => message.role === "assistant")?.content ??
    "Tell me the loud part. I'll help you turn it into one small move.";

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    void send(text, "kai");
  }

  return (
    <AppPage className="max-w-5xl">
      <section className="relative min-h-[calc(100svh-8.5rem)] overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(250,250,247,0.76))] px-5 py-5 shadow-calm backdrop-blur-xl sm:px-7 sm:py-7 lg:min-h-[42rem]">
        <div className="pointer-events-none absolute inset-x-7 top-7 h-36 rounded-full bg-[#4FC3F7]/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wider text-muted">
          <span>{dayLabel()}</span>
          <span className="rounded-full border border-line bg-white/75 px-3 py-2 text-ink">{streak > 0 ? `${streak} day streak` : "Kai is here"}</span>
        </div>

        <div className="relative mx-auto flex max-w-2xl flex-col items-center pt-10 text-center sm:pt-14">
          <KaiAvatar size={118} pulse className="drop-shadow-[0_24px_50px_rgba(79,195,247,0.25)]" />
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3 py-2 text-xs font-black uppercase tracking-wider text-muted">
            <Sparkles size={14} aria-hidden="true" />
            Your coach is awake
          </p>
          <h1 className="mt-4 max-w-[12ch] font-display text-5xl font-black leading-[0.92] tracking-normal text-ink sm:text-7xl">
            What needs Kai today?
          </h1>
          <p className="mt-4 max-w-md text-base font-semibold leading-7 text-muted">
            Say the loud thing. Kai will turn it into one calm next move for your mind, body, or goal.
          </p>

          <form onSubmit={submitMessage} className="mt-7 w-full rounded-[30px] border border-white/70 bg-white/90 p-2 shadow-soft">
            <label htmlFor="kai-home-message" className="sr-only">
              Tell Kai what is going on
            </label>
            <div className="flex min-h-16 items-end gap-2">
              <textarea
                id="kai-home-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Tell Kai what is going on..."
                rows={1}
                className="max-h-32 min-h-12 flex-1 resize-none border-0 bg-transparent px-3 py-3 text-base font-semibold leading-6 text-ink outline-none placeholder:text-muted/70"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="focus-ring grid size-12 shrink-0 place-items-center rounded-full bg-ink text-paper transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                aria-label="Send message to Kai"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </div>
          </form>

          <div className="mt-4 w-full rounded-[24px] border border-line/80 bg-paper/75 p-4 text-left">
            <p className="text-xs font-black uppercase tracking-wider text-muted">Kai</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink">{lastKaiMessage}</p>
          </div>
        </div>
      </section>

      {loopError && (
        <section className="rounded-kai border border-care/30 bg-careWash p-4">
          <p className="text-sm font-bold text-ink">{loopError}</p>
          <Button variant="secondary" className="mt-3" onClick={() => void hydrateLoop(goals)}>
            Retry
          </Button>
        </section>
      )}

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
        <Link
          to={nextMove.to}
          className="focus-ring group min-w-0 overflow-hidden rounded-[30px] border border-white/70 bg-ink p-5 text-paper shadow-calm transition hover:-translate-y-0.5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wider text-paper/55">Next move</p>
              <h2 className="mt-2 break-words font-display text-3xl font-black leading-none tracking-normal sm:text-4xl">{nextMove.title}</h2>
              <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-paper/70">{nextMove.copy}</p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-ink transition group-hover:translate-x-0.5">
              <ArrowRight size={18} aria-hidden="true" />
            </span>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-paper/55">
            <span>{completedSteps}/{loop?.steps.length ?? 5} daily reps</span>
            <span aria-hidden="true">.</span>
            <span>{loop?.score ?? 20} rhythm</span>
          </div>
        </Link>

        <section className="rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-muted">Home screen</p>
              <h2 className="mt-1 font-display text-3xl font-black leading-none tracking-normal text-ink">Kai widget</h2>
            </div>
            <KaiAvatar size={58} pulse />
          </div>
          <div className="mt-5 rounded-[24px] border border-line bg-paper p-4">
            <p className="text-sm font-black text-ink">One thing today</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">{nextMove.title}</p>
          </div>
        </section>
      </section>

      <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {routeActions.map((action) => (
          <Link
            key={action.title}
            to={action.to}
            className="focus-ring flex min-h-24 items-center gap-3 rounded-[24px] border border-white/70 bg-white/82 p-4 shadow-sm transition hover:-translate-y-0.5"
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-full ${action.tone}`}>
              <action.icon size={19} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-black leading-tight text-ink">{action.title}</span>
              <span className="mt-1 block text-sm font-semibold leading-5 text-muted">{action.copy}</span>
            </span>
          </Link>
        ))}
      </section>

      <Link to="/crisis" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-danger/30 bg-white px-4 text-sm font-black text-danger">
        <LifeBuoy size={16} aria-hidden="true" />
        Crisis resources
      </Link>
    </AppPage>
  );
}

const routeActions: RouteAction[] = [
  {
    title: "Mind",
    copy: "Name it. Steady it.",
    to: "/mental?module=checkin",
    icon: Brain,
    tone: "bg-[#E4F7F4] text-[#218A7D]"
  },
  {
    title: "Body",
    copy: "Fuel, scan, recover.",
    to: "/health?module=food",
    icon: Camera,
    tone: "bg-[#FFF0EC] text-[#C86B31]"
  },
  {
    title: "Goals",
    copy: "One real rep.",
    to: "/engine/potential",
    icon: Target,
    tone: "bg-goalsWash text-goals"
  }
];

function getNextMove(nextStep: DailyLoopStep | null, activeGoals: Goal[]) {
  if (!nextStep) {
    return {
      title: "Bank what you finished.",
      copy: "You already moved today. Check the loop or choose what should stay tomorrow.",
      to: "/loop"
    };
  }

  if (nextStep.id === "body_action") {
    return {
      title: "Take care of your body.",
      copy: "Log food, scan posture, stretch, or protect sleep. Keep it simple and useful.",
      to: "/health?module=food"
    };
  }

  if (nextStep.id === "mind_action") {
    return {
      title: "Tell Kai what is heavy.",
      copy: "Name the feeling, get perspective, then choose the next honest action.",
      to: "/mental?module=checkin"
    };
  }

  if (nextStep.id === "goal_action") {
    const activeGoal = activeGoals[0];
    return {
      title: activeGoal?.nextAction || "Move one goal forward.",
      copy: activeGoal ? activeGoal.title : "Pick one direction. Not your whole life. One next rep.",
      to: activeGoal ? `/goals/${encodeURIComponent(activeGoal.id)}` : "/engine/potential"
    };
  }

  if (nextStep.id === "reflection") {
    return {
      title: "Close the day clean.",
      copy: "Notice what changed, even a little. That is how Kai learns your rhythm.",
      to: "/loop"
    };
  }

  return {
    title: "Check in with Kai.",
    copy: "Start with where you are. No performance, no pretending.",
    to: "/loop"
  };
}

function dayLabel(date = new Date()) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
