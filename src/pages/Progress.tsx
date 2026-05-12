import { FriendCompare } from "../components/tracker/FriendCompare";
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
      <FriendCompare />
    </div>
  );
}
