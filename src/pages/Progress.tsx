import { ProgressSummary } from "../components/tracker/ProgressSummary";

export function Progress() {
  return (
    <div className="space-y-6">
      <section className="rounded-kai border border-line bg-white p-5 shadow-sm sm:p-7">
        <p className="eyebrow">Tracker</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-black leading-none tracking-normal sm:text-6xl">
          Progress that does not make you weird about <span className="font-serif font-normal italic text-plum">progress.</span>
        </h1>
      </section>
      <ProgressSummary />
      <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
        <p className="eyebrow">social layer</p>
        <h2 className="mt-2 font-display text-2xl font-black tracking-normal">Friend compare</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Opt-in only. Shows streaks, totals, and belts. Never private writing or chat content.</p>
      </section>
    </div>
  );
}
