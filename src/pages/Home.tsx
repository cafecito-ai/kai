import {
  Activity,
  Brain,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  SmilePlus,
  Zap
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { KaiAvatar } from "../components/ui/AppPrimitives";
import { engineTotals } from "../lib/tracker";
import type { ProgressEvent } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";
import { useUserStore } from "../stores/userStore";

export function Home() {
  const events = useProgressStore((state) => state.events);
  const streak = useProgressStore((state) => state.streak());
  const kaiName = useUserStore((state) => state.kaiName);

  const todayEvents = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events.filter((event) => event.occurredAt.slice(0, 10) === today);
  }, [events]);

  // Empty-state rule: brand new users see no fabricated metrics. Score
  // and per-engine pills are null until they actually log something.
  const hasTodayEvents = todayEvents.length > 0;
  const score = hasTodayEvents
    ? Math.min(100, 60 + Math.min(40, todayEvents.reduce((sum, event) => sum + Math.max(0, event.eventValue), 0) / 4))
    : null;
  const day = dayParts();
  const recent = recentItems(todayEvents);
  const totals = useMemo(() => engineTotals(events), [events]);
  const mentalPoints = totals.mental + totals.potential;
  const physicalPoints = totals.physical;
  const mindScore = mentalPoints > 0 ? Math.min(10, Math.max(1, Math.round(mentalPoints / 45))) : null;
  const bodyScore = physicalPoints > 0 ? Math.min(10, Math.max(1, Math.round(physicalPoints / 45))) : null;

  return (
    <div className="text-inkDark">
      <div className="mx-auto flex w-full max-w-md flex-col pb-6 lg:max-w-5xl">
        <header className="flex items-start justify-between gap-4 px-1">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-inkMute">{day.eyebrow}</p>
            <h1 className="mt-1 font-display text-[2rem] font-semibold leading-none tracking-normal text-inkDeep">{day.headline}.</h1>
            {streak > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-warmPaper px-3 py-1.5 text-xs font-bold text-inkDark">
                <Flame size={13} className="text-[#F29A43]" aria-hidden="true" />
                {streak}-day streak
              </div>
            )}
          </div>
          <Link to="/mental?module=checkin" className="focus-ring inline-flex min-h-12 items-center gap-3 rounded-full border border-[#0A0A0A0F] bg-white px-4 text-sm font-bold text-inkDark shadow-[0_8px_32px_rgba(10,10,10,0.08)]">
            <KaiAvatar size={36} label={kaiName} pulse />
            Start with {kaiName}
          </Link>
        </header>

        <section className="mt-7 rounded-[24px] border border-[#0A0A0A0F] bg-white p-6 shadow-[0_2px_4px_rgba(10,10,10,0.04),0_16px_40px_rgba(10,10,10,0.08)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-inkMute">Today</p>
              {score !== null ? (
                <>
                  <p className="mt-2 flex items-baseline gap-1 font-mono">
                    <span className="text-[4.5rem] font-bold leading-none tracking-[-0.04em] text-inkDark">{Math.round(score)}</span>
                    <span className="text-xl font-semibold text-inkMute">/100</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF5E8] px-3 py-1 text-xs font-bold text-[#2F9D67]">
                      <Zap size={12} aria-hidden="true" />
                      Logged today
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 flex items-baseline gap-1 font-mono">
                    <span className="text-[4.5rem] font-bold leading-none tracking-[-0.04em] text-inkDark">—</span>
                    <span className="text-xl font-semibold text-inkMute">/100</span>
                  </p>
                  <p className="mt-3 max-w-xs text-sm font-semibold leading-5 text-inkSoft">
                    Log one rep today and the dial fills in.
                  </p>
                </>
              )}
            </div>
            <ScoreRing value={score ?? 0} />
          </div>
        </section>

        <section className="mt-6 grid grid-cols-3 gap-3">
          <MiniMetric icon={Brain} label="Mind" value={mindScore} unit="/10" className="bg-[#E4F7F4] text-[#68C5B8]" />
          <MiniMetric icon={Moon} label="Sleep" value={null} unit="hrs" className="bg-[#EEEAFF] text-[#7B6EF6]" />
          <MiniMetric icon={Heart} label="Body" value={bodyScore} unit="/10" className="bg-[#FFF0EC] text-[#F29A43]" />
        </section>

        <section className="mt-6 grid gap-3">
          <ModuleCard
            to="/mental?module=checkin"
            icon={Brain}
            label="Mental"
            title="Check in, reframe, reset."
            copy="Name what's happening, understand the pattern, choose one next move. Supportive, never clinical."
            stat={mentalPoints > 0 ? `${mentalPoints} pts` : "Start"}
            chips={["Check-in", "Reset", "Purpose"]}
            accent="from-[#E4F7F4] to-white text-[#218A7D]"
          />
          <ModuleCard
            to="/health?module=food"
            icon={Dumbbell}
            label="Physical"
            title="Food, scan, sleep, tracker."
            copy="Four cards. Food camera, body scan, one-tap sleep, phone-down guided sessions. Useful, never obsessive."
            stat={physicalPoints > 0 ? `${physicalPoints} pts` : "Start"}
            chips={["Food", "Scan", "Sleep", "Tracker"]}
            accent="from-[#FFF0EC] to-white text-[#C86B31]"
          />
        </section>

        <section className="mt-6">
          <p className="px-1 font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-inkMute">Recent</p>
          <div className="mt-3 rounded-[24px] border border-[#0A0A0A0F] bg-white p-5 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_8px_32px_rgba(10,10,10,0.08)]">
            {recent.length === 0 ? (
              <p className="text-sm font-semibold leading-6 text-inkSoft">
                Nothing logged yet. Try a check-in or a fuel note — your reps show up here.
              </p>
            ) : (
              <div className="space-y-4">
                {recent.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={`${item.title}-${item.meta}`} className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warmPaper">
                        <Icon size={16} className={item.iconClass} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-inkDark">{item.title}</p>
                        <p className="text-xs font-medium text-inkMute">{item.meta}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${item.chipClass}`}>{item.chip}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
  unit,
  className
}: {
  icon: typeof Brain;
  label: string;
  value: number | string | null;
  unit: string;
  className: string;
}) {
  return (
    <article className="min-h-[128px] rounded-[24px] border border-[#0A0A0A0F] bg-white p-4 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_8px_32px_rgba(10,10,10,0.08)]">
      <span className={`inline-flex size-7 items-center justify-center rounded-full ${className}`}>
        <Icon size={15} aria-hidden="true" />
      </span>
      <p className="mt-4 font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-inkMute">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold text-inkDark">
        {value === null ? "—" : value}
        {value !== null && unit && <span className="ml-0.5 text-xs font-semibold text-inkMute">{unit}</span>}
      </p>
    </article>
  );
}

function ModuleCard({
  to,
  icon: Icon,
  label,
  title,
  copy,
  stat,
  chips,
  accent
}: {
  to: string;
  icon: typeof Brain;
  label: string;
  title: string;
  copy: string;
  stat: string;
  chips: string[];
  accent: string;
}) {
  return (
    <Link to={to} className={`focus-ring block w-full rounded-[24px] border border-[#0A0A0A0F] bg-gradient-to-br ${accent} p-5 text-left shadow-[0_1px_2px_rgba(10,10,10,0.04),0_8px_32px_rgba(10,10,10,0.08)]`}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/80 shadow-[0_8px_22px_rgba(10,10,10,0.08)]">
          <Icon size={19} aria-hidden="true" />
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1 font-mono text-[11px] font-bold text-inkDark">{stat}</span>
      </div>
      <p className="mt-4 font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-inkMute">{label}</p>
      <h2 className="mt-2 font-display text-[1.35rem] font-semibold leading-[1.06] text-inkDeep">{title}</h2>
      <p className="mt-2 text-sm font-medium leading-5 text-inkSoft">{copy}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span key={chip} className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-inkDark">
            {chip}
          </span>
        ))}
      </div>
    </Link>
  );
}

function ScoreRing({ value }: { value: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label={`${Math.round(value)} out of 100`}>
      <circle cx="56" cy="56" r={radius} fill="none" stroke="#F0EFEC" strokeWidth="6" />
      <circle
        cx="56"
        cy="56"
        r={radius}
        fill="none"
        stroke="url(#score-gradient)"
        strokeLinecap="round"
        strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 56 56)"
      />
      <defs>
        <linearGradient id="score-gradient" x1="18" x2="96" y1="18" y2="96">
          <stop stopColor="#6D77F2" />
          <stop offset="0.55" stopColor="#7B6EF6" />
          <stop offset="1" stopColor="#D09B6F" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function recentItems(events: ProgressEvent[]) {
  return events.slice(0, 3).map((event) => ({
    icon: event.engine === "physical" ? Activity : SmilePlus,
    iconClass: event.engine === "physical" ? "text-[#F29A43]" : "text-[#68C5B8]",
    title: event.eventType.replace(/_/g, " "),
    meta: "Today",
    chip: `+${event.eventValue}`,
    chipClass: "bg-[#DDF5E8] text-[#2F9D67]"
  }));
}

function dayParts(date = new Date()) {
  const hour = date.getHours();
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  if (hour >= 5 && hour < 12) return { eyebrow: weekday, headline: "Morning", timestampLabel: "this morning" };
  if (hour >= 12 && hour < 17) return { eyebrow: weekday, headline: "Afternoon", timestampLabel: "this afternoon" };
  if (hour >= 17 && hour < 22) return { eyebrow: `${weekday} evening`, headline: "Evening", timestampLabel: "this evening" };
  return { eyebrow: weekday, headline: "Late tonight", timestampLabel: "tonight" };
}
