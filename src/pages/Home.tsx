import { ArrowRight, LifeBuoy, Send, Sparkles } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppPage, KaiAvatar } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { inferKaiAction, topKaiActions } from "../lib/kai-actions";
import { getKaiMemoryItems } from "../lib/kai-memory";
import { getNextAvailableStep } from "../lib/loop";
import type { DailyLoopStep, Goal } from "../lib/types";
import { useGoalStore } from "../stores/goalStore";
import { useKaiStore } from "../stores/kaiStore";
import { useLoopStore } from "../stores/loopStore";
import { useProgressStore } from "../stores/progressStore";

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
  const nextKaiAction = useKaiStore((state) => state.chats.kai.nextAction);
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
    "Say it messy. We’ll make it simple.";
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const memoryItems = useMemo(() => getKaiMemoryItems(messages), [messages]);
  const liveAction = useMemo(() => (draft.trim() ? inferKaiAction(draft) : nextKaiAction ?? inferKaiAction(lastUserMessage)), [draft, lastUserMessage, nextKaiAction]);

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    void send(text, "kai");
  }

  return (
    <AppPage className="max-w-5xl">
      <section className="relative w-full max-w-full overflow-hidden rounded-[36px] border border-white/10 bg-[#070912] px-4 py-4 text-paper shadow-[0_28px_80px_rgba(7,9,18,0.24)] backdrop-blur-xl sm:min-h-[calc(100svh-8.5rem)] sm:px-7 sm:py-7 lg:min-h-[42rem]">
        <div className="pointer-events-none absolute inset-x-6 top-6 h-40 rounded-full bg-[linear-gradient(90deg,rgba(70,216,255,0.18),rgba(157,255,203,0.08),rgba(255,138,107,0.12))] blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,rgba(7,9,18,0),rgba(70,216,255,0.08))]" />
        <div className="relative flex flex-wrap items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-paper/50 sm:justify-between">
          <span>{dayLabel()}</span>
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-paper">{streak > 0 ? `${streak} days in` : "Kai's here"}</span>
        </div>

        <div className="relative mx-auto flex w-full max-w-2xl min-w-0 flex-col items-center pt-4 text-center sm:pt-14">
          <span className="sm:hidden">
            <KaiAvatar size={84} pulse className="drop-shadow-[0_24px_50px_rgba(79,195,247,0.25)]" />
          </span>
          <span className="hidden sm:inline-grid">
            <KaiAvatar size={112} pulse className="drop-shadow-[0_24px_50px_rgba(79,195,247,0.25)]" />
          </span>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-paper/60 sm:mt-5">
            <Sparkles size={14} aria-hidden="true" />
            No shame. Next move.
          </p>
          <h1 className="mt-3 max-w-[9.5ch] break-words font-sans text-[2.45rem] font-black leading-[0.9] tracking-normal text-paper sm:mt-4 sm:max-w-[12ch] sm:text-7xl">
            What's up?
          </h1>
          <p className="mt-3 max-w-[20rem] text-sm font-semibold leading-6 text-paper/60 sm:mt-4 sm:max-w-md sm:text-base sm:leading-7">
            Drop the real version. Kai will help you get unstuck and choose the next move.
          </p>

          <form onSubmit={submitMessage} className="mt-4 w-full max-w-[21.5rem] rounded-[30px] border border-white/14 bg-white/10 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_18px_48px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:mt-7 sm:max-w-none">
            <label htmlFor="kai-home-message" className="sr-only">
              Tell Kai what is going on
            </label>
            <div className="flex min-h-14 items-end gap-2 sm:min-h-16">
              <textarea
                id="kai-home-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type it like you'd text it..."
                rows={1}
                className="max-h-32 min-h-10 min-w-0 flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-base font-semibold leading-6 text-paper outline-none placeholder:text-paper/40 sm:min-h-12 sm:py-3"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="focus-ring grid size-11 shrink-0 place-items-center rounded-full bg-paper text-ink transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:size-12"
                aria-label="Send message to Kai"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </div>
          </form>

          {(draft.trim() || lastUserMessage || nextKaiAction) && (
            <Link
              to={liveAction.route}
              className="focus-ring mt-3 flex w-full max-w-[21.5rem] items-center gap-3 rounded-[22px] border border-white/10 bg-white/10 p-3 text-left backdrop-blur-xl transition hover:-translate-y-0.5 sm:max-w-none"
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${liveAction.tone}`}>
                <liveAction.icon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-black uppercase tracking-wider text-paper/45">Kai would open</span>
                <span className="mt-0.5 block text-sm font-black text-paper">{liveAction.label}</span>
              </span>
            </Link>
          )}

          <div className="mt-3 w-full max-w-[21.5rem] rounded-[24px] border border-white/10 bg-white/10 p-3 text-left backdrop-blur-xl sm:mt-4 sm:max-w-none sm:p-4">
            <p className="text-xs font-black uppercase tracking-wider text-paper/50">Kai</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-paper/80">{lastKaiMessage}</p>
          </div>
          {memoryItems.length > 0 && (
            <div className="mt-3 w-full max-w-[21.5rem] rounded-[24px] border border-white/10 bg-white/[0.07] p-3 text-left backdrop-blur-xl sm:max-w-none">
              <p className="text-[10px] font-black uppercase tracking-wider text-paper/40">Kai remembers</p>
              <div className="mt-3 space-y-2">
                {memoryItems.map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${item.kind === "saved" ? "bg-[#B892FF]" : "bg-paper/35"}`} />
                    <span className="min-w-0">
                      <span className="block text-xs font-black text-paper/80">{item.label}</span>
                      <span className="mt-0.5 block text-sm font-semibold leading-5 text-paper/62">{item.body}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              <p className="text-xs font-black uppercase tracking-wider text-paper/55">Try this next</p>
              <h2 className="mt-2 break-words font-display text-3xl font-black leading-none tracking-normal sm:text-4xl">{nextMove.title}</h2>
              <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-paper/70">{nextMove.copy}</p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-ink transition group-hover:translate-x-0.5">
              <ArrowRight size={18} aria-hidden="true" />
            </span>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-paper/55">
            <span>{completedSteps}/{loop?.steps.length ?? 5} done</span>
            <span aria-hidden="true">.</span>
            <span>{loop?.score ?? 20}% steady</span>
          </div>
        </Link>

        <section className="rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-muted">Home screen</p>
              <h2 className="mt-1 font-display text-3xl font-black leading-none tracking-normal text-ink">Kai on deck</h2>
            </div>
            <KaiAvatar size={58} pulse />
          </div>
          <div className="mt-5 rounded-[24px] border border-line bg-paper p-4">
            <p className="text-sm font-black text-ink">For right now</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">{nextMove.title}</p>
          </div>
        </section>
      </section>

      <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {topKaiActions().slice(0, 3).map((action) => (
          <Link
            key={action.id}
            to={action.route}
            className="focus-ring flex min-h-24 items-center gap-3 rounded-[24px] border border-white/70 bg-white/82 p-4 shadow-sm transition hover:-translate-y-0.5"
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-full ${action.tone}`}>
              <action.icon size={19} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-black leading-tight text-ink">{action.label}</span>
              <span className="mt-1 block text-sm font-semibold leading-5 text-muted">{action.reason}</span>
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

function getNextMove(nextStep: DailyLoopStep | null, activeGoals: Goal[]) {
  if (!nextStep) {
    return {
      title: "Bank what you finished.",
      copy: "You did enough to count. Close it out or pick what carries into tomorrow.",
      to: "/loop"
    };
  }

  if (nextStep.id === "body_action") {
    return {
      title: "Give your body a win.",
      copy: "Food, sleep, stretch, scan. Pick the one that would actually help.",
      to: "/health?module=food"
    };
  }

  if (nextStep.id === "mind_action") {
    return {
      title: "Say what's been sitting there.",
      copy: "No perfect words. Name it, breathe, then take one clean step.",
      to: "/mental?module=checkin"
    };
  }

  if (nextStep.id === "goal_action") {
    const activeGoal = activeGoals[0];
    return {
      title: activeGoal?.nextAction || "Move one thing forward.",
      copy: activeGoal ? activeGoal.title : "Pick one thing. Not your whole life.",
      to: activeGoal ? `/goals/${encodeURIComponent(activeGoal.id)}` : "/engine/potential"
    };
  }

  if (nextStep.id === "reflection") {
    return {
      title: "Close it clean.",
      copy: "What changed, even a little? That is the part worth keeping.",
      to: "/loop"
    };
  }

  return {
    title: "Start where you are.",
    copy: "No performance. No pretending. Just the real check-in.",
    to: "/loop"
  };
}

function dayLabel(date = new Date()) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
