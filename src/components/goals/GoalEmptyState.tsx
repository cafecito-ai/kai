import { Target } from "lucide-react";
import { Link } from "react-router-dom";

export function GoalEmptyState() {
  return (
    <section className="rounded-[24px] border border-line bg-white p-6 shadow-sm">
      <div className="grid size-12 place-items-center rounded-full bg-goalsWash text-goals">
        <Target aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-display text-3xl font-black tracking-normal">Nothing in motion yet.</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-muted">Pick one thing. Not your whole life. One thing.</p>
      <Link to="/goal" className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-paper">
        Start a goal
      </Link>
    </section>
  );
}
