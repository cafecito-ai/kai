import { ArrowLeft, CalendarDays, CheckCircle2, PartyPopper, Pause, Pencil, RotateCcw, Target, Wind } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GoalNextAction } from "../components/goals/GoalNextAction";
import { GoalStatusPill } from "../components/goals/GoalStatusPill";
import { AppPage, KaiMark } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import { formatGoalTargetDate } from "../lib/goals";
import { useGoalStore } from "../stores/goalStore";
import { useProgressStore } from "../stores/progressStore";

export function GoalDetail() {
  const { goalId } = useParams();
  const goals = useGoalStore((state) => state.goals);
  const status = useGoalStore((state) => state.status);
  const errorMessage = useGoalStore((state) => state.errorMessage);
  const hydrateGoals = useGoalStore((state) => state.hydrateGoals);
  const updateGoal = useGoalStore((state) => state.updateGoal);
  const addEvent = useProgressStore((state) => state.addEvent);
  const saving = status === "saving";
  const goal = useMemo(() => goals.find((item) => item.id === goalId), [goalId, goals]);
  const [nextAction, setNextAction] = useState("");
  const [reframe, setReframe] = useState("");
  const [releaseReason, setReleaseReason] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (status === "idle") void hydrateGoals();
  }, [hydrateGoals, status]);

  useEffect(() => {
    setNextAction(goal?.nextAction ?? "");
    setReframe(goal?.nextAction ?? "");
  }, [goal?.nextAction]);

  async function updateWithProgress(input: {
    patch: Parameters<typeof updateGoal>[1];
    eventType: string;
    eventValue: number;
    payload?: Record<string, unknown>;
  }) {
    if (!goal) return;
    const updated = await updateGoal(goal.id, input.patch);
    const payload = {
      goalId: goal.id,
      title: goal.title,
      status: updated.status,
      ...input.payload
    };
    addEvent({ engine: "potential", eventType: input.eventType, eventValue: input.eventValue, payload });
    void api.logProgress({ engine: "potential", eventType: input.eventType, eventValue: input.eventValue, payload }).catch(() => undefined);
  }

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
    <AppPage className="max-w-4xl pb-28 sm:pb-12">
      <Link to="/goals" className="focus-ring inline-flex items-center gap-2 text-sm font-black text-muted">
        <ArrowLeft size={16} aria-hidden="true" />
        Goals
      </Link>
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-ink text-paper shadow-calm">
        <div className="relative p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-24 size-52 rounded-full bg-[#8F5CFF]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-6 size-44 rounded-full bg-[#44D7B6]/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <KaiMark size="md" />
                <p className="text-xs font-black uppercase tracking-[0.18em] text-paper/55">{goal.category}</p>
              </div>
              <h1 className="mt-3 break-words font-display text-[2.35rem] font-black leading-[0.94] tracking-normal sm:text-6xl">{goal.title || "Untitled goal"}</h1>
            </div>
            <div className="hidden shrink-0 sm:block">
              <GoalStatusPill status={goal.status} />
            </div>
          </div>
          <p className="relative mt-5 max-w-2xl text-base font-semibold leading-7 text-paper/72">{goal.whyItMatters || goal.description || "This goal matters enough to start small."}</p>
          <div className="relative mt-5 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-sm font-black text-paper/72">
              <CalendarDays size={16} aria-hidden="true" />
              Target {formatGoalTargetDate(goal.targetDate)}
            </div>
            <div className="sm:hidden">
              <GoalStatusPill status={goal.status} />
            </div>
          </div>
        </div>
      </section>

      {goal.status === "achieved" && (
        <section className="rounded-[28px] border border-body/20 bg-bodyWash p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-body">
              <PartyPopper aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow text-body">goal achieved</p>
              <h2 className="mt-1 font-display text-3xl font-black tracking-normal text-ink">Bank the win. Then choose what stays.</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                Kai logs this as progress, not proof that you have to do more. Keep the lesson, not the pressure.
              </p>
            </div>
          </div>
        </section>
      )}

      {errorMessage && <p className="rounded-kai border border-danger/25 bg-dangerWash p-3 text-sm font-bold text-danger">{errorMessage}</p>}

      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-sm backdrop-blur-xl">
          <div className="mb-4 flex items-start gap-3">
            <KaiMark size="sm" />
            <div className="rounded-[22px] rounded-tl-md bg-ink px-4 py-3 text-paper">
              <p className="text-sm font-black leading-5">This is the move. Keep it small enough that your normal day can hold it.</p>
            </div>
          </div>
          <GoalNextAction action={goal.nextAction} />
          {editing && (
            <div className="mt-4 grid gap-3">
              <textarea className="field min-h-28" value={nextAction} onChange={(event) => setNextAction(event.target.value)} />
              <Button
                disabled={saving}
                onClick={() =>
                  void updateWithProgress({
                    patch: { nextAction },
                    eventType: "goal_next_action_updated",
                    eventValue: 12,
                    payload: { nextAction }
                  }).then(() => setEditing(false))
                }
              >
                Save next action
              </Button>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to={`/loop?goalId=${encodeURIComponent(goal.id)}`} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-paper">
              <Target size={16} aria-hidden="true" />
              Do this now
            </Link>
            <Button variant="secondary" onClick={() => setEditing((open) => !open)} disabled={saving}>
              <Pencil size={16} aria-hidden="true" />
              Edit next action
            </Button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-sm backdrop-blur-xl">
          <p className="eyebrow">Kai tracking</p>
          <h2 className="mt-1 font-display text-2xl font-black leading-none tracking-normal text-ink">Progress without pressure.</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted">Kai logs reps and status changes so you can see proof over time without turning the goal into a scoreboard.</p>
          <div className="mt-5 grid gap-2">
            <Button
              onClick={() =>
                void updateWithProgress({
                  patch: { status: "achieved", achievedAt: new Date().toISOString() },
                  eventType: "goal_hit",
                  eventValue: 40
                })
              }
              disabled={saving || goal.status === "achieved"}
            >
              <CheckCircle2 size={16} aria-hidden="true" />
              Bank the win
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                void updateWithProgress({
                  patch: { status: "paused" },
                  eventType: "goal_paused",
                  eventValue: 10
                })
              }
              disabled={saving || goal.status === "paused"}
            >
              <Pause size={16} aria-hidden="true" />
              Pause
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-goalsWash text-goals">
            <RotateCcw size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Adjust the promise</p>
            <h2 className="mt-1 font-display text-3xl font-black leading-none tracking-normal">Change the rep, not your self-respect.</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">If the goal still matters, shrink the next move. If it is not yours anymore, release it cleanly.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <label className="block text-sm font-black">
            Reframed next rep
            <textarea className="field mt-2 min-h-28" value={reframe} onChange={(event) => setReframe(event.target.value)} />
          </label>
          <label className="block text-sm font-black">
            Release note
            <textarea className="field mt-2 min-h-28" value={releaseReason} onChange={(event) => setReleaseReason(event.target.value)} placeholder="What did this teach you?" />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={saving || !reframe.trim()}
            onClick={() =>
              void updateWithProgress({
                patch: { status: "active", nextAction: reframe },
                eventType: "goal_reframed",
                eventValue: 24,
                payload: { nextAction: reframe }
              })
            }
          >
            <Wind size={16} aria-hidden="true" />
            Save reframe
          </Button>
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() =>
              void updateWithProgress({
                patch: {
                  status: "released",
                  nextAction: null,
                  description: releaseReason.trim() || goal.description || "Released cleanly."
                },
                eventType: "goal_released",
                eventValue: 18,
                payload: { releaseReason: releaseReason.trim() || null }
              })
            }
          >
            Release cleanly
          </Button>
        </div>
      </section>
    </AppPage>
  );
}
