import { Link } from "react-router-dom";

export function LoopCompletionCard() {
  return (
    <section className="rounded-[28px] border border-sage/30 bg-bodyWash p-6 shadow-sm">
      <p className="eyebrow">Complete</p>
      <h2 className="mt-2 font-display text-4xl font-black tracking-normal">That counts.</h2>
      <p className="mt-2 text-base font-semibold leading-7 text-muted">You gave the day a shape.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/home" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-paper">Back home</Link>
        <Link to="/goals" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-black text-ink">View goals</Link>
      </div>
    </section>
  );
}
