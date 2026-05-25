import { Target } from "lucide-react";
import { Link } from "react-router-dom";
import { KaiMark } from "../ui/AppPrimitives";

export function GoalEmptyState() {
  return (
    <section className="rounded-[30px] border border-white/70 bg-white/88 p-5 shadow-sm backdrop-blur-xl sm:p-6">
      <div className="flex items-start gap-3">
        <KaiMark size="sm" />
        <div className="rounded-[22px] rounded-tl-md bg-ink px-4 py-3 text-paper">
          <p className="text-sm font-black leading-5">Nothing to manage yet. Pick one thing and I’ll help make it small enough to start.</p>
        </div>
      </div>
      <h2 className="mt-4 font-display text-3xl font-black tracking-normal">Nothing in motion yet.</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-muted">Pick one thing. Not your whole life. One thing.</p>
      <Link to="/goal" className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-paper">
        <Target size={16} aria-hidden="true" />
        Start a goal
      </Link>
    </section>
  );
}
