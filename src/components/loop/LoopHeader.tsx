import { Sparkles } from "lucide-react";
import type { Goal } from "../../lib/types";
import { KaiMark } from "../ui/AppPrimitives";

export function LoopHeader({
  score,
  completed,
  total,
  justCreatedGoal,
  goal
}: {
  score: number;
  completed: number;
  total: number;
  justCreatedGoal?: boolean;
  goal?: Goal | null;
}) {
  if (justCreatedGoal) {
    return (
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-ink text-paper shadow-calm">
        <div className="relative p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-24 size-52 rounded-full bg-[#8F5CFF]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-6 size-44 rounded-full bg-[#44D7B6]/20 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <KaiMark size="md" />
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-paper/55">Kai saved it</p>
              <h1 className="mt-2 max-w-[17rem] font-display text-[2.08rem] font-black leading-[0.95] tracking-normal sm:max-w-none sm:text-6xl">Now do the first rep.</h1>
              <p className="mt-3 max-w-[18rem] text-base font-semibold leading-7 text-paper/72 sm:max-w-2xl">
                {goal?.title ? `“${goal.title}” is real now. We only need one small proof today.` : "The goal is real now. We only need one small proof today."}
              </p>
            </div>
          </div>
          <div className="relative mt-5 flex items-center gap-2 rounded-[22px] border border-white/10 bg-white/8 p-3 text-sm font-bold text-paper/76">
            <Sparkles size={17} className="shrink-0 text-[#CDBBFF]" aria-hidden="true" />
            Kai will keep this light: body, mind, goal, done.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-calm sm:p-7">
      <p className="eyebrow">Kai · today</p>
      <h1 className="mt-2 font-display text-5xl font-black leading-none tracking-normal text-ink">One clean loop.</h1>
      <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-muted">A few small reps so the day has direction without getting dramatic.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[22px] bg-ink p-4 text-paper">
          <p className="text-xs font-black uppercase tracking-wider text-paper/70">Momentum</p>
          <p className="mt-1 font-mono text-5xl font-black">{score}</p>
        </div>
        <div className="rounded-[22px] border border-line bg-paper p-4">
          <p className="text-xs font-black uppercase tracking-wider text-muted">Loop reps</p>
          <p className="mt-2 text-2xl font-black text-ink">{completed} of {total} complete</p>
        </div>
      </div>
    </section>
  );
}
