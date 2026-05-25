import { Link } from "react-router-dom";
import { KaiMark } from "../ui/AppPrimitives";

export function LoopCompletionCard() {
  return (
    <section className="rounded-[30px] border border-sage/30 bg-bodyWash p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <KaiMark size="sm" />
        <div>
          <p className="eyebrow">Kai banked it</p>
          <h2 className="mt-2 font-display text-4xl font-black leading-none tracking-normal">That counts.</h2>
          <p className="mt-2 text-base font-semibold leading-7 text-muted">No extra pressure. Keep the proof and go live your day.</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/home" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-paper">Back home</Link>
        <Link to="/goals" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-black text-ink">View goals</Link>
      </div>
    </section>
  );
}
