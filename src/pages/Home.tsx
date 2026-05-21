import {
  Activity,
  Brain,
  Dumbbell,
  Flame,
  Heart,
  Minus,
  Moon,
  Plus,
  SmilePlus,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { KaiAvatar } from "../components/ui/AppPrimitives";
import { DAILY_CUP_FLOOR, incrementCups, resetIfNewDay, todayIso, type HydrationToday } from "../lib/hydration";
import { loadJSON, saveJSON } from "../lib/local-storage";
import { engineTotals } from "../lib/tracker";
import type { ProgressEvent } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";

const HYDRATION_HOME_KEY = "kai.home.hydration.today.v2";

const fallbackActivity = [
  { icon: Activity, iconClass: "text-[#F29A43]", title: "Easy run · 32 min", meta: "Yesterday", chip: "+5", chipClass: "bg-[#DDF5E8] text-[#2F9D67]" },
  { icon: Moon, iconClass: "text-[#7B6EF6]", title: "Slept 6h 24m", meta: "Last night", chip: "-2", chipClass: "bg-[#FFF0CE] text-[#B57619]" },
  { icon: Brain, iconClass: "text-[#68C5B8]", title: "Evening reflection", meta: "Yesterday", chip: "+3", chipClass: "bg-[#DDF5E8] text-[#2F9D67]" }
];

export function Home() {
  const events = useProgressStore((state) => state.events);
  const addEvent = useProgressStore((state) => state.addEvent);
  const streak = useProgressStore((state) => state.streak());
  const [hydration, setHydration] = useState<HydrationToday>({ dateIso: todayIso(), cups: 0 });

  useEffect(() => {
    const stored = loadJSON<HydrationToday | null>(HYDRATION_HOME_KEY, null, null);
    const reset = resetIfNewDay(stored);
    setHydration(reset);
    if (stored && stored.dateIso !== reset.dateIso) saveJSON(HYDRATION_HOME_KEY, null, reset);
  }, []);

  const todayEvents = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events.filter((event) => event.occurredAt.slice(0, 10) === today);
  }, [events]);

  const score = todayEvents.length > 0 ? Math.min(100, 76 + Math.min(18, todayEvents.reduce((sum, event) => sum + Math.max(0, event.eventValue), 0) / 4)) : 82;
  const displayStreak = Math.max(streak, 4);
  const day = dayParts();
  const recent = recentItems(todayEvents);
  const totals = useMemo(() => engineTotals(events), [events]);
  const mentalPoints = totals.mental + totals.potential;
  const physicalPoints = totals.physical;
  const mindScore = Math.min(10, Math.max(6, Math.round(mentalPoints / 45) + 6));
  const bodyScore = Math.min(10, Math.max(6, Math.round(physicalPoints / 45) + 6));

  function bumpHydration(delta: number) {
    const baseline = resetIfNewDay(hydration);
    const next = incrementCups(baseline, delta);
    let finalState = next;
    if (delta > 0 && next.cups > baseline.cups && baseline.firstCupLoggedFor !== next.dateIso) {
      addEvent({ engine: "physical", eventType: "hydration_first_cup", eventValue: 4, payload: { cups: next.cups, source: "home_preview" } });
      finalState = { ...next, firstCupLoggedFor: next.dateIso };
    }
    setHydration(finalState);
    saveJSON(HYDRATION_HOME_KEY, null, finalState);
  }

  return (
    <div className="text-[#1A1A1F]">
      <div className="mx-auto flex w-full max-w-md flex-col pb-6 lg:max-w-5xl">
        <header className="grid gap-4 px-1 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-[#8A8A8F]">{day.eyebrow}</p>
            <h1 className="mt-1 font-display text-[2rem] font-semibold leading-none tracking-normal text-[#111116]">{day.headline}.</h1>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#F4F1EB] px-3 py-1.5 text-xs font-bold text-[#1A1A1F]">
              <Flame size={13} className="text-[#F29A43]" aria-hidden="true" />
              {displayStreak}-day streak
            </div>
          </div>
          <Link to="/mental?module=checkin" className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-[#0A0A0A0F] bg-white px-4 text-sm font-bold text-[#1A1A1F] shadow-[0_8px_32px_rgba(10,10,10,0.08)] sm:w-auto">
            <KaiAvatar size={36} label="KAI" pulse />
            Start with KAI
          </Link>
        </header>

        <section className="mt-7 rounded-[24px] border border-[#0A0A0A0F] bg-white p-6 shadow-[0_2px_4px_rgba(10,10,10,0.04),0_16px_40px_rgba(10,10,10,0.08)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-[#8A8A8F]">Today</p>
              <p className="mt-2 flex items-baseline gap-1 font-mono">
                <span className="text-[4.5rem] font-bold leading-none tracking-[-0.04em] text-[#1A1A1F]">{Math.round(score)}</span>
                <span className="text-xl font-semibold text-[#8A8A8F]">/100</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF5E8] px-3 py-1 text-xs font-bold text-[#2F9D67]">
                  <Zap size={12} aria-hidden="true" />
                  Strong start
                </span>
                <span className="inline-flex items-center rounded-full bg-[#DDF5E8] px-3 py-1 font-mono text-[11px] font-semibold text-[#2F9D67]">↗ +6 vs yesterday</span>
              </div>
            </div>
            <div className="hidden shrink-0 sm:block">
              <ScoreRing value={score} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
          <MiniMetric icon={Brain} label="Mind" value={String(mindScore)} unit="/10" className="bg-[#E4F7F4] text-[#68C5B8]" />
          <MiniMetric icon={Moon} label="Sleep" value="6.4" unit="hrs" className="bg-[#EEEAFF] text-[#7B6EF6]" />
          <MiniMetric icon={Heart} label="Body" value={String(bodyScore)} unit="/10" className="bg-[#FFF0EC] text-[#F29A43]" />
        </section>

        <section className="mt-6 grid gap-3">
          <ModuleCard
            to="/mental?module=checkin"
            icon={Brain}
            label="Mental agent"
            title="Guide chat, check in, reframe."
            copy="Learn from Daniel Siegel, Andrew Huberman, Viktor Frankl, James Clear, Carl Jung, stoic philosophy, and modern teen psychology principles."
            stat={`${mentalPoints || 18} pts`}
            chips={["Guides", "Mood", "Breath"]}
            accent="from-[#E4F7F4] to-white text-[#218A7D]"
          />
          <ModuleCard
            to="/health?module=food"
            icon={Dumbbell}
            label="Physical agent"
            title="Log food. Body scan. Stretch / move. Log sleep."
            copy="To fuel your workouts correctly. To keep your posture, alignment, and body composition in check. To maintain mobility and prevent injury. To ensure your body is actually recovering from the work."
            stat={`${physicalPoints || hydration.cups * 4 || 24} pts`}
            chips={["Log food", "Body scan", "Stretch / move", "Log sleep"]}
            accent="from-[#FFF0EC] to-white text-[#C86B31]"
          />
        </section>

        <HydrationPreview hydration={hydration} onBump={bumpHydration} />

        <section className="relative mt-6 rounded-[24px] border border-[#D7F0EA] bg-[#F4FFFC] p-5 pb-6 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_8px_32px_rgba(10,10,10,0.08)]">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-[#8A8A8F]">KAI · {day.timestampLabel}</p>
          <p className="mt-3 font-display text-[1.02rem] font-semibold leading-[1.24] text-[#111116]">
            Sleep dipped under 7h again last night — want to start light today and see how you feel by lunch?
          </p>
        </section>

        <section className="mt-6">
          <p className="px-1 font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-[#8A8A8F]">Recent</p>
          <div className="mt-3 rounded-[24px] border border-[#0A0A0A0F] bg-white p-5 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_8px_32px_rgba(10,10,10,0.08)]">
            <div className="space-y-4">
              {recent.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={`${item.title}-${item.meta}`} className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F4F1EB]">
                      <Icon size={16} className={item.iconClass} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#1A1A1F]">{item.title}</p>
                      <p className="text-xs font-medium text-[#8A8A8F]">{item.meta}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${item.chipClass}`}>{item.chip}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value, unit, className }: { icon: typeof Brain; label: string; value: string; unit: string; className: string }) {
  return (
    <article className="min-h-[128px] min-w-0 overflow-hidden rounded-[24px] border border-[#0A0A0A0F] bg-white p-4 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_8px_32px_rgba(10,10,10,0.08)]">
      <span className={`inline-flex size-7 items-center justify-center rounded-full ${className}`}>
        <Icon size={15} aria-hidden="true" />
      </span>
      <p className="mt-4 font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-[#8A8A8F]">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold text-[#1A1A1F]">
        {value}
        {unit && <span className="ml-0.5 text-xs font-semibold text-[#8A8A8F]">{unit}</span>}
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
        <span className="rounded-full bg-white/80 px-3 py-1 font-mono text-[11px] font-bold text-[#1A1A1F]">{stat}</span>
      </div>
      <p className="mt-4 font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">{label}</p>
      <h2 className="mt-2 font-display text-[1.35rem] font-semibold leading-[1.06] text-[#111116]">{title}</h2>
      <p className="mt-2 text-sm font-medium leading-5 text-[#5E5E64]">{copy}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span key={chip} className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-[#1A1A1F]">
            {chip}
          </span>
        ))}
      </div>
    </Link>
  );
}

function HydrationPreview({ hydration, onBump }: { hydration: HydrationToday; onBump: (delta: number) => void }) {
  return (
    <section className="mt-6 rounded-[24px] border border-[#0A0A0A0F] bg-white p-4 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_8px_32px_rgba(10,10,10,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#EEEAFF] text-[#7B6EF6]">
            <span className="font-mono text-sm">▱</span>
          </span>
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">hydration</p>
            <p className="font-mono text-sm font-semibold text-[#1A1A1F]">
              {hydration.cups}
              <span className="text-[#8A8A8F]"> / {DAILY_CUP_FLOOR}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Remove a glass" onClick={() => onBump(-1)} disabled={hydration.cups === 0} className="focus-ring flex size-10 items-center justify-center rounded-full bg-[#F8F6F1] text-[#8A8A8F] disabled:opacity-40">
            <Minus size={15} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Add a glass" onClick={() => onBump(1)} className="focus-ring flex size-10 items-center justify-center rounded-full bg-[#1A1A1F] text-white">
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-8 gap-1.5" aria-hidden="true">
        {Array.from({ length: DAILY_CUP_FLOOR }, (_, index) => (
          <div key={index} className={`h-7 rounded-[4px] ${index < hydration.cups ? "bg-[#7B6EF6]" : "bg-[#F4F1EB]"}`} />
        ))}
      </div>
    </section>
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
  if (events.length === 0) return fallbackActivity;
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
