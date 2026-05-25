import { useUser } from "@clerk/clerk-react";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { KaiAvatar } from "../components/ui/AppPrimitives";
import { useProgressStore } from "../stores/progressStore";

/**
 * Home — two-choice picker.
 *
 * Per Claude Design's v2 handoff, Home strips down to the simplest
 * possible navigation: pick Physical or Mental. Everything else
 * (score card, metric grid, recent activity, hydration ticker) moved
 * out. The dock and floating Kai composer in AppShell still carry
 * the rest of the navigation; the page itself stays calm.
 */
export function Home() {
  const { user } = useUser();
  const events = useProgressStore((state) => state.events);
  const firstName = user?.firstName?.trim() || "";
  const today = formatToday();
  const lastUsed = formatLastUsed(events);
  const isNew = events.length === 0;

  return (
    <div className="mx-auto flex min-h-[calc(100svh-12rem)] w-full max-w-md flex-col pb-4 lg:max-w-2xl">
      <header className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-line bg-paper/60 px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-muted">
          {today}
        </span>
        <KaiAvatar size={32} pulse />
      </header>

      <section className="mt-6 mb-6">
        <p className="eyebrow">{isNew ? "Welcome" : "Today"}</p>
        {isNew ? (
          <>
            <h1 className="mt-2 max-w-[12ch] font-display text-[40px] font-black leading-[0.96] tracking-tight text-ink">
              Pick a <span className="font-display font-normal italic text-plum">lane.</span>
            </h1>
            <p className="mt-3 max-w-[26ch] text-sm font-semibold leading-snug text-muted">
              You can switch any time. Nothing's locked.
            </p>
          </>
        ) : (
          <h1 className="mt-2 max-w-[11ch] font-display text-[40px] font-black leading-[0.96] tracking-tight text-ink">
            {firstName ? `Hey ${firstName}.` : "Today."}
            <br />
            <span className="font-display font-normal italic text-plum">What's up?</span>
          </h1>
        )}
      </section>

      <div className="flex flex-col gap-3">
        <ChoiceCard
          to="/health"
          eyebrow="Body"
          title="Physical"
          copy="Food. Scan. Sleep. Move."
          tone="body"
        />
        <ChoiceCard
          to="/mental?module=checkin"
          eyebrow="Mind"
          title="Mental"
          copy="Talk to Kai about what's loud."
          tone="reset"
        />
      </div>

      <div className="flex-1" />

      <footer className="mt-6 flex flex-col gap-3">
        {lastUsed && (
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-muted">Last with Kai</span>
            <span className="text-sm font-black text-ink">{lastUsed}</span>
          </div>
        )}
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

function ChoiceCard({
  to,
  eyebrow,
  title,
  copy,
  tone
}: {
  to: string;
  eyebrow: string;
  title: string;
  copy: string;
  tone: "body" | "reset";
}) {
  // tone === "body" → sage/Physical lane; tone === "reset" → coral/Mental lane.
  // Tailwind needs both class names to appear literally for the compiler to
  // include them in the build, so we list them out instead of templating.
  const tones = {
    body: {
      shell: "border-body/20 bg-bodyWash",
      title: "text-body",
      arrow: "bg-body text-paper"
    },
    reset: {
      shell: "border-reset/25 bg-resetWash",
      title: "text-reset",
      arrow: "bg-reset text-paper"
    }
  }[tone];

  return (
    <Link
      to={to}
      className={`focus-ring relative flex min-h-[200px] flex-col gap-3.5 overflow-hidden rounded-calm border p-5 text-left ${tones.shell}`}
    >
      <span className="eyebrow">{eyebrow}</span>
      <div>
        <p className={`font-display text-[36px] font-black leading-[0.92] tracking-tight ${tones.title}`}>{title}</p>
        <p className="mt-2 max-w-[22ch] text-sm font-semibold leading-snug text-inkSoft">{copy}</p>
      </div>
      <span
        className={`absolute bottom-4 right-4 grid size-10 place-items-center rounded-full ${tones.arrow}`}
        aria-hidden="true"
      >
        <ArrowRight size={18} />
      </span>
    </Link>
  );
}

function formatToday(date = new Date()) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `${weekday} · ${month} ${day}`;
}

function formatLastUsed(events: { occurredAt: string; engine: string }[]) {
  if (events.length === 0) return null;
  const last = events[0];
  const when = new Date(last.occurredAt);
  const today = new Date();
  const sameDay = when.toDateString() === today.toDateString();
  const label = sameDay
    ? when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : when.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return label;
}
