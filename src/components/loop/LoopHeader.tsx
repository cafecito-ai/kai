export function LoopHeader({ score, completed, total }: { score: number; completed: number; total: number }) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-calm sm:p-7">
      <p className="eyebrow">Today’s rhythm</p>
      <h1 className="mt-2 font-display text-5xl font-black leading-none tracking-normal text-ink">Give the day a shape.</h1>
      <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-muted">Five tiny reps. Body, mind, goal. Done is better than dramatic.</p>
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
