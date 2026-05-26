import { ChevronDown, ShieldAlert, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { KaiChat } from "../components/kai/KaiChat";
import { KaiMark } from "../components/ui/AppPrimitives";
import { useProgressStore } from "../stores/progressStore";
import { useUserStore } from "../stores/userStore";

/**
 * Home — Cal AI-style single widget.
 *
 * v3 redesign (Lev feedback, 2026-05-26): Home strips down to one
 * personalized chat widget. Resting state shows a Kai-flavored card
 * with a faux composer; tapping it expands KaiChat inline on the
 * same page. Lane entries (Physical / Mental) moved to the dock and
 * the global Quick (+) menu in AppShell so Home can be chat-first
 * and feel like Cal AI's single-action home.
 *
 * Greeting personalization stays on our own userStore (kaiName +
 * firstName) so this page renders without depending on Clerk's
 * useUser hook (which crashes when ClerkProvider isn't mounted —
 * see v2 hotfix #103).
 */
export function Home() {
  const events = useProgressStore((state) => state.events);
  const streak = useProgressStore((state) => state.streak());
  const kaiName = useUserStore((state) => state.kaiName);
  const firstName = useUserStore((state) => state.firstName);
  const today = formatToday();
  const isNew = events.length === 0;
  const [chatExpanded, setChatExpanded] = useState(false);

  return (
    <div className="mx-auto flex min-h-[calc(100svh-12rem)] w-full max-w-md flex-col pb-4 lg:max-w-2xl">
      <header className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-line bg-paper/60 px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-muted">
          {today}
        </span>
        {streak > 0 && (
          <span className="rounded-full border border-line bg-white px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-ink">
            {streak}-day streak
          </span>
        )}
      </header>

      <section className={chatExpanded ? "mt-5 mb-4" : "mt-6 mb-6"}>
        <p className="eyebrow">{isNew ? "Welcome" : "Today"}</p>
        {isNew ? (
          <h1 className="mt-2 max-w-[14ch] font-display text-[40px] font-black leading-[0.96] tracking-tight text-ink">
            Say hi to <span className="font-display font-normal italic text-plum">{kaiName}.</span>
          </h1>
        ) : firstName ? (
          <h1 className="mt-2 max-w-[12ch] font-display text-[40px] font-black leading-[0.96] tracking-tight text-ink">
            Hey {firstName}.
            <br />
            <span className="font-display font-normal italic text-plum">What's up?</span>
          </h1>
        ) : (
          <h1 className="mt-2 max-w-[11ch] font-display text-[40px] font-black leading-[0.96] tracking-tight text-ink">
            Today.
            <br />
            <span className="font-display font-normal italic text-plum">{kaiName}'s here.</span>
          </h1>
        )}
      </section>

      {chatExpanded ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setChatExpanded(false)}
            className="focus-ring inline-flex w-fit items-center gap-1.5 self-end rounded-full border border-line bg-white px-3 py-1.5 text-xs font-black text-muted hover:text-ink"
            aria-label="Collapse chat"
          >
            <ChevronDown size={14} aria-hidden="true" />
            Collapse
          </button>
          <KaiChat embedded />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setChatExpanded(true)}
          className="focus-ring group relative flex flex-col gap-4 overflow-hidden rounded-calm border border-line bg-white p-5 text-left shadow-[0_18px_50px_rgba(10,10,10,0.06)]"
          aria-label={`Talk to ${kaiName}`}
        >
          <div className="flex items-center gap-3">
            <KaiMark size="md" />
            <div>
              <p className="eyebrow">{kaiName.toLowerCase()}</p>
              <p className="font-display text-[22px] font-black leading-tight text-ink">
                {greetingLine(isNew, firstName, kaiName)}
              </p>
            </div>
          </div>

          <p className="max-w-[28ch] text-[15px] font-semibold leading-snug text-muted">
            {isNew
              ? "Tell me what's loud right now. Doesn't have to be tidy."
              : "Pick up where we left off, or start something new. I'm here."}
          </p>

          <div className="mt-1 flex items-center justify-between rounded-full border border-line bg-paper px-4 py-3">
            <span className="text-sm font-semibold text-soft">say it messy</span>
            <span
              className="grid size-9 place-items-center rounded-full bg-ink text-paper transition group-hover:bg-plum"
              aria-hidden="true"
            >
              <Sparkles size={16} />
            </span>
          </div>
        </button>
      )}

      <div className="flex-1" />

      <footer className="mt-6 flex flex-col gap-3">
        <Link
          to="/crisis"
          className="focus-ring inline-flex w-fit items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2.5 text-[13px] font-black text-danger"
        >
          <ShieldAlert size={15} aria-hidden="true" />
          Crisis support
        </Link>
      </footer>
    </div>
  );
}

function greetingLine(isNew: boolean, firstName: string | null, kaiName: string) {
  if (isNew) return `I'm ${kaiName}. What's going on?`;
  if (firstName) return `What's on your mind?`;
  return `Pick this up with ${kaiName}.`;
}

function formatToday(date = new Date()) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `${weekday} · ${month} ${day}`;
}
