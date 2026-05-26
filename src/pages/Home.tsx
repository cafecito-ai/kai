import { ChevronDown, HeartPulse, Moon, ShieldAlert, Sparkles, Zap } from "lucide-react";
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
  const todayEvents = events.filter((event) => event.occurredAt.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const lastSignal = (todayEvents.length > 0 ? todayEvents[todayEvents.length - 1] : events[events.length - 1])?.eventType ?? "first check-in";
  const promptChips = isNew
    ? ["I don't know where to start", "Help me reset", "Build my first mission"]
    : ["I need a reset", "What should I do next?", "Check my day"];

  return (
    <div className="mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-md flex-col pb-4 lg:max-w-2xl">
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
        <div className="flex flex-1 flex-col gap-3">
          <button
            type="button"
            onClick={() => setChatExpanded(true)}
            className="focus-ring group relative flex min-h-[25rem] flex-1 flex-col overflow-hidden rounded-[34px] bg-inkDark p-5 text-left text-white shadow-[0_28px_90px_rgba(10,10,10,0.24)] sm:min-h-[30rem] sm:p-6"
            aria-label={`Talk to ${kaiName}`}
          >
            <div className="absolute inset-0 opacity-90" aria-hidden="true">
              <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(115deg,rgba(255,240,236,0.20),rgba(91,71,240,0.26)_46%,rgba(220,238,223,0.22))]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:26px_26px]" />
              <div className="absolute bottom-0 left-0 right-0 h-44 bg-[linear-gradient(180deg,transparent,rgba(10,10,10,0.72))]" />
            </div>

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-white/58">{kaiName}</p>
                <p className="mt-2 max-w-[15rem] font-display text-[28px] font-black leading-[0.95] text-white sm:text-[34px]">
                  {greetingLine(isNew, firstName, kaiName)}
                </p>
              </div>
              <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-white/75">
                live
              </span>
            </div>

            <div className="relative my-7 grid flex-1 place-items-center">
              <div className="absolute h-56 w-56 rounded-full border border-white/10" aria-hidden="true" />
              <div className="absolute h-40 w-40 rounded-full border border-white/10" aria-hidden="true" />
              <div className="relative grid size-36 place-items-center rounded-full border border-white/15 bg-white/8 shadow-[0_22px_80px_rgba(91,71,240,0.42)] backdrop-blur-sm sm:size-44">
                <KaiMark size="lg" />
              </div>
            </div>

            <div className="relative space-y-3">
              <p className="max-w-[30ch] text-[15px] font-semibold leading-snug text-white/72">
                {isNew
                  ? "Drop in exactly as you are. Kai can turn the mess into the next move."
                  : "Kai has your thread. Start with the messy version and let the next move show up."}
              </p>

              <div className="grid grid-cols-3 gap-2">
                <SignalTile icon={Zap} label="Today" value={`${todayEvents.length} reps`} />
                <SignalTile icon={HeartPulse} label="Streak" value={`${streak} day`} />
                <SignalTile icon={Moon} label="Signal" value={formatSignal(lastSignal)} />
              </div>

              <div className="flex items-center justify-between rounded-full border border-white/12 bg-white px-4 py-3 text-ink">
                <span className="text-sm font-black">say it messy</span>
                <span
                  className="grid size-9 place-items-center rounded-full bg-ink text-paper transition group-hover:bg-plum"
                  aria-hidden="true"
                >
                  <Sparkles size={16} />
                </span>
              </div>
            </div>
          </button>

          <div className="grid gap-2">
            {promptChips.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setChatExpanded(true)}
                className="focus-ring flex min-h-12 items-center justify-between rounded-[20px] border border-line bg-white px-4 text-left text-sm font-black text-ink shadow-[0_10px_34px_rgba(10,10,10,0.05)]"
              >
                <span>{prompt}</span>
                <Sparkles size={15} className="text-plum" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}

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

function SignalTile({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value: string }) {
  return (
    <span className="min-w-0 rounded-[18px] border border-white/10 bg-white/10 p-3 text-white backdrop-blur-sm">
      <span className="flex items-center gap-1.5 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-white/48">
        <Icon size={12} aria-hidden="true" />
        {label}
      </span>
      <span className="mt-1 block truncate text-sm font-black text-white">{value}</span>
    </span>
  );
}

function greetingLine(isNew: boolean, firstName: string | null, kaiName: string) {
  if (isNew) return `I'm ${kaiName}. What's going on?`;
  if (firstName) return `What's on your mind?`;
  return `Pick this up with ${kaiName}.`;
}

function formatSignal(signal: string) {
  return signal
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .slice(0, 18);
}

function formatToday(date = new Date()) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `${weekday} · ${month} ${day}`;
}
