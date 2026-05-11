import { ProgressSummary } from "../components/tracker/ProgressSummary";

export function Progress() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-wider text-sage">Tracker</p>
        <h1 className="mt-2 text-4xl font-black">Progress that does not make you weird about progress</h1>
      </section>
      <ProgressSummary />
      <section className="rounded-kai border border-ink/10 bg-white p-5">
        <h2 className="text-xl font-black">Friend compare</h2>
        <p className="mt-2 text-ink/70">Opt-in only. Shows streaks, totals, and belts. Never private writing or chat content.</p>
      </section>
    </div>
  );
}
