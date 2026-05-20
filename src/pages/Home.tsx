import {
  Activity,
  Brain,
  Camera,
  Dumbbell,
  Flame,
  Heart,
  Home as HomeIcon,
  Minus,
  Moon,
  Plus,
  SmilePlus,
  Sparkles,
  UsersRound,
  UserRound,
  X,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { KaiChat } from "../components/kai/KaiChat";
import { KaiAvatar } from "../components/ui/AppPrimitives";
import { api } from "../lib/api";
import { describeFoodPhotoResult, getFoodPhotoConfidenceLabel, MEAL_CONTEXTS, type MealContextId } from "../lib/food-photo";
import { DAILY_CUP_FLOOR, incrementCups, resetIfNewDay, todayIso, type HydrationToday } from "../lib/hydration";
import { loadJSON, saveJSON } from "../lib/local-storage";
import { localSafetyCheck } from "../lib/safety";
import { engineTotals } from "../lib/tracker";
import type { FoodPhotoResult, ProgressEvent } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";

const HYDRATION_HOME_KEY = "kai.home.hydration.today.v2";
type HomeModule = "mental" | "food" | "scan" | "breath" | null;

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
  const [quickOpen, setQuickOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<HomeModule>(null);

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

  function openModule(module: HomeModule) {
    setQuickOpen(false);
    setChatOpen(false);
    setActiveModule(module);
  }

  return (
    <div className="min-h-[100svh] bg-[#FAFAF7] text-[#1A1A1F]">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-md flex-col px-4 pb-32 pt-8">
        <header className="flex items-start justify-between gap-4 px-1">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-[#8A8A8F]">{day.eyebrow}</p>
            <h1 className="mt-1 font-display text-[2rem] font-semibold leading-none tracking-normal text-[#111116]">{day.headline}.</h1>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#F4F1EB] px-3 py-1.5 text-xs font-bold text-[#1A1A1F]">
              <Flame size={13} className="text-[#F29A43]" aria-hidden="true" />
              {displayStreak}-day streak
            </div>
          </div>
          <button type="button" onClick={() => setChatOpen(true)} className="focus-ring inline-flex min-h-12 items-center gap-3 rounded-full border border-[#0A0A0A0F] bg-white px-4 text-sm font-bold text-[#1A1A1F] shadow-[0_8px_32px_rgba(10,10,10,0.08)]">
            <KaiAvatar size={36} label="KAI" pulse />
            Talk to KAI
          </button>
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
            <ScoreRing value={score} />
          </div>
        </section>

        <section className="mt-6 grid grid-cols-3 gap-3">
          <MiniMetric icon={Brain} label="Mind" value={String(mindScore)} unit="/10" className="bg-[#E4F7F4] text-[#68C5B8]" />
          <MiniMetric icon={Moon} label="Sleep" value="6.4" unit="hrs" className="bg-[#EEEAFF] text-[#7B6EF6]" />
          <MiniMetric icon={Heart} label="Body" value={String(bodyScore)} unit="/10" className="bg-[#FFF0EC] text-[#F29A43]" />
        </section>

        <section className="mt-6 grid gap-3">
          <ModuleCard
            onOpen={() => openModule("mental")}
            icon={Brain}
            label="Mental agent"
            title="Check in, reframe, reset."
            copy="Kai keeps the emotional work simple: name what is happening, understand the pattern, choose one next move."
            stat={`${mentalPoints || 18} pts`}
            chips={["Mood", "Breath", "Journal"]}
            accent="from-[#E4F7F4] to-white text-[#218A7D]"
          />
          <ModuleCard
            onOpen={() => openModule("food")}
            icon={Dumbbell}
            label="Physical agent"
            title="Food photo, hydration, body scan."
            copy="Log fuel, track recovery, and build a private progress loop without turning health into pressure."
            stat={`${physicalPoints || hydration.cups * 4 || 24} pts`}
            chips={["Food", "Hydrate", "Scan"]}
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

      {chatOpen && (
        <ChatSheet
          onClose={() => setChatOpen(false)}
          onOpenModule={(module) => {
            openModule(module);
          }}
        />
      )}
      {activeModule && <HomeModuleSheet module={activeModule} onClose={() => setActiveModule(null)} addEvent={addEvent} />}
      {quickOpen && (
        <QuickActionSheet
          onClose={() => setQuickOpen(false)}
          onHydrate={() => bumpHydration(1)}
          onOpenModule={(module) => {
            openModule(module);
          }}
        />
      )}
      <PreviewDock onOpenChat={() => setChatOpen(true)} quickOpen={quickOpen} onToggleQuick={() => setQuickOpen((open) => !open)} />
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value, unit, className }: { icon: typeof Brain; label: string; value: string; unit: string; className: string }) {
  return (
    <article className="min-h-[128px] rounded-[24px] border border-[#0A0A0A0F] bg-white p-4 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_8px_32px_rgba(10,10,10,0.08)]">
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
  onOpen,
  icon: Icon,
  label,
  title,
  copy,
  stat,
  chips,
  accent
}: {
  onOpen: () => void;
  icon: typeof Brain;
  label: string;
  title: string;
  copy: string;
  stat: string;
  chips: string[];
  accent: string;
}) {
  return (
    <button type="button" onClick={onOpen} className={`focus-ring block w-full rounded-[24px] border border-[#0A0A0A0F] bg-gradient-to-br ${accent} p-5 text-left shadow-[0_1px_2px_rgba(10,10,10,0.04),0_8px_32px_rgba(10,10,10,0.08)]`}>
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
    </button>
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

function ChatSheet({ onClose, onOpenModule }: { onClose: () => void; onOpenModule: (module: HomeModule) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#111116]/24 px-3 pb-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Chat with KAI">
      <div className="mx-auto w-full max-w-md rounded-[28px] bg-white p-2 shadow-[0_28px_80px_rgba(10,10,10,0.28)]">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <KaiAvatar size={34} label="KAI" pulse />
            <div>
              <p className="text-sm font-black text-[#111116]">KAI</p>
              <p className="text-xs font-semibold text-[#8A8A8F]">Mental + physical companion</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="focus-ring grid size-10 place-items-center rounded-full bg-[#F4F1EB] text-[#1A1A1F]" aria-label="Close chat">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <KaiChat embedded />
        <div className="grid grid-cols-2 gap-2 p-2 pt-3">
          <button type="button" onClick={() => onOpenModule("mental")} className="focus-ring rounded-full bg-[#E4F7F4] px-4 py-3 text-center text-sm font-black text-[#218A7D]">
            Mental tools
          </button>
          <button type="button" onClick={() => onOpenModule("food")} className="focus-ring rounded-full bg-[#FFF0EC] px-4 py-3 text-center text-sm font-black text-[#C86B31]">
            Health tools
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickActionSheet({ onClose, onHydrate, onOpenModule }: { onClose: () => void; onHydrate: () => void; onOpenModule: (module: HomeModule) => void }) {
  const actions = [
    { module: "food" as const, label: "Food photo", icon: Camera, tone: "bg-[#FFF0EC] text-[#C86B31]" },
    { module: "mental" as const, label: "Mental check-in", icon: Brain, tone: "bg-[#E4F7F4] text-[#218A7D]" },
    { module: "breath" as const, label: "Breath reset", icon: Sparkles, tone: "bg-[#EEEAFF] text-[#7B6EF6]" },
    { module: "scan" as const, label: "Body scan", icon: Activity, tone: "bg-[#F4F1EB] text-[#1A1A1F]" }
  ];

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-5" role="dialog" aria-label="Quick actions">
      <div className="mx-auto w-full max-w-md rounded-[28px] border border-[#0A0A0A0F] bg-white/95 p-3 shadow-[0_18px_60px_rgba(10,10,10,0.18)] backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">Quick rep</p>
          <button type="button" onClick={onClose} className="focus-ring grid size-8 place-items-center rounded-full bg-[#F4F1EB] text-[#1A1A1F]" aria-label="Close quick actions">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.label} type="button" onClick={() => onOpenModule(action.module)} className="focus-ring flex min-h-14 items-center gap-3 rounded-[18px] bg-[#FAFAF7] px-3 text-left text-sm font-black text-[#1A1A1F]">
                <span className={`grid size-9 place-items-center rounded-full ${action.tone}`}>
                  <Icon size={17} aria-hidden="true" />
                </span>
                {action.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              onHydrate();
              onClose();
            }}
            className="focus-ring flex min-h-14 items-center gap-3 rounded-[18px] bg-[#FAFAF7] px-3 text-left text-sm font-black text-[#1A1A1F]"
          >
            <span className="grid size-9 place-items-center rounded-full bg-[#EAF8FF] font-mono text-[#2563EB]">▱</span>
            Add water
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeModuleSheet({ module, onClose, addEvent }: { module: HomeModule; onClose: () => void; addEvent: ReturnType<typeof useProgressStore.getState>["addEvent"] }) {
  if (!module) return null;
  const title = module === "food" ? "Food photo" : module === "scan" ? "Body scan" : module === "breath" ? "Breath reset" : "Mental check-in";
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#111116]/24 px-3 pb-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <div className="mx-auto max-h-[88svh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-4 shadow-[0_28px_80px_rgba(10,10,10,0.28)]">
        <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-3 flex items-center justify-between gap-3 border-b border-[#0A0A0A0F] bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <KaiAvatar size={34} label="KAI" pulse />
            <div>
              <p className="text-sm font-black text-[#111116]">{title}</p>
              <p className="text-xs font-semibold text-[#8A8A8F]">Works without leaving home</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="focus-ring grid size-10 place-items-center rounded-full bg-[#F4F1EB] text-[#1A1A1F]" aria-label={`Close ${title}`}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {module === "food" && <HomeFoodFlow addEvent={addEvent} />}
        {module === "scan" && <HomeBodyScanFlow addEvent={addEvent} />}
        {module === "mental" && <HomeMentalFlow addEvent={addEvent} />}
        {module === "breath" && <HomeBreathFlow addEvent={addEvent} />}
      </div>
    </div>
  );
}

function HomeFoodFlow({ addEvent }: { addEvent: ReturnType<typeof useProgressStore.getState>["addEvent"] }) {
  const [meal, setMeal] = useState("Turkey sandwich, apple, water");
  const [mealContext, setMealContext] = useState<MealContextId>("school_lunch");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<FoodPhotoResult | null>(null);

  async function save(mode: "note" | "photo" | "example") {
    setMessage("");
    setResult(null);
    const safety = localSafetyCheck(meal);
    if (!safety.safe) {
      setMessage("Kai will not score restriction or body pressure. Use this as a neutral food note, and bring in a trusted adult if eating thoughts feel hard to control.");
      return;
    }
    if (mode === "photo" && !photo) {
      setMessage("Choose or take a food photo first.");
      return;
    }
    setSaving(mode);
    try {
      const photoResult = mode === "photo" && photo ? await api.uploadFoodPhoto(photo, meal) : mode === "example" ? await api.analyzeFoodPhoto({ note: meal }) : null;
      if (photoResult) setResult(photoResult);
      addEvent({
        engine: "physical",
        eventType: mode === "note" ? "meal_logged" : mode === "photo" ? "food_photo" : "food_photo_stub",
        eventValue: mode === "note" ? 24 : mode === "photo" ? 28 : 12,
        payload: { meal, mealContext, source: "home_inline", items: photoResult?.items ?? [] }
      });
      void api
        .createEngineEntry("physical", {
          entryType: mode === "note" ? "meal_log" : mode === "photo" ? "food_photo" : "food_photo_stub",
          title: mode === "note" ? "Fuel note" : "Food photo",
          payload: { meal, mealContext, mealId: photoResult?.mealId, items: photoResult?.items ?? [], totals: photoResult?.totals ?? null },
          completed: true
        })
        .catch(() => undefined);
      setMessage(mode === "photo" ? "Photo saved as a private Body rep." : "Fuel note saved as a Body rep.");
      setPhoto(null);
    } catch {
      setMessage("Kai could not analyze that yet. The fuel note still saved locally.");
      addEvent({ engine: "physical", eventType: "meal_logged", eventValue: 18, payload: { meal, mealContext, source: "home_inline_fallback" } });
    } finally {
      setSaving("");
    }
  }

  return (
    <section className="rounded-[24px] bg-[#111116] p-5 text-white">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-white/50">fuel note</p>
      <h2 className="mt-2 font-display text-3xl font-semibold leading-none">Photo context, not calorie math.</h2>
      <textarea className="mt-4 min-h-24 w-full rounded-[18px] border border-white/10 bg-white/10 px-4 py-3 text-base font-semibold text-white placeholder:text-white/50" value={meal} onChange={(event) => setMeal(event.target.value)} />
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Meal context">
        {MEAL_CONTEXTS.map((context) => (
          <button
            key={context.id}
            type="button"
            onClick={() => setMealContext(context.id)}
            className={`focus-ring shrink-0 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wider ${mealContext === context.id ? "border-white bg-white text-[#111116]" : "border-white/15 bg-white/10 text-white/70"}`}
          >
            {context.label}
          </button>
        ))}
      </div>
      <label className="focus-ring mt-4 flex cursor-pointer items-center gap-3 rounded-[18px] border border-white/15 bg-white/10 p-3 text-sm font-black text-white">
        <Camera size={18} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{photo ? photo.name : "Take or choose a food photo"}</span>
        <input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />
      </label>
      <div className="mt-4 grid gap-2">
        <button type="button" disabled={saving === "photo" || !photo} onClick={() => void save("photo")} className="focus-ring min-h-12 rounded-full bg-white px-4 text-sm font-black text-[#111116] disabled:opacity-45">
          {saving === "photo" ? "Analyzing" : "Analyze selected photo"}
        </button>
        <button type="button" disabled={saving === "note"} onClick={() => void save("note")} className="focus-ring min-h-12 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-black text-white">
          {saving === "note" ? "Saving" : "Log fuel note"}
        </button>
        <button type="button" disabled={saving === "example"} onClick={() => void save("example")} className="focus-ring min-h-12 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-black text-white">
          Use example analysis
        </button>
      </div>
      {message && <p className="mt-3 rounded-[18px] border border-white/15 bg-white/10 p-3 text-sm font-semibold leading-6">{message}</p>}
      {result && (
        <div className="mt-4 rounded-[18px] border border-white/15 bg-white/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black">Kai saw</p>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white/70">{getFoodPhotoConfidenceLabel(result.confidence)}</span>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/72">{describeFoodPhotoResult(result)}</p>
        </div>
      )}
    </section>
  );
}

function HomeBodyScanFlow({ addEvent }: { addEvent: ReturnType<typeof useProgressStore.getState>["addEvent"] }) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);
  function save() {
    setSaved(true);
    addEvent({ engine: "physical", eventType: "body_scan_preview", eventValue: 18, payload: { hasPhoto: Boolean(photo), source: "home_inline", focus: ["posture", "mobility", "readiness"] } });
    void api.createEngineEntry("physical", { entryType: "body_scan_preview", title: "Private body scan preview", payload: { hasPhoto: Boolean(photo), source: "home_inline" }, completed: true }).catch(() => undefined);
    setPhoto(null);
  }
  return (
    <section className="rounded-[24px] border border-[#0A0A0A0F] bg-[#FAFAF7] p-5">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">private beta</p>
      <h2 className="mt-2 font-display text-3xl font-semibold leading-none text-[#111116]">Posture and readiness, not appearance.</h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#5E5E64]">Kai frames scans around alignment, tightness, recovery, and useful mobility suggestions. No body score. No comparison.</p>
      <label className="focus-ring mt-4 flex cursor-pointer items-center gap-3 rounded-[18px] border border-[#0A0A0A0F] bg-white p-3 text-sm font-black text-[#1A1A1F]">
        <Camera size={18} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{photo ? photo.name : "Take or choose a private scan photo"}</span>
        <input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />
      </label>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {["Private by default", "No body score", "Pattern view", "Next move"].map((item) => (
          <div key={item} className="rounded-[18px] border border-[#0A0A0A0F] bg-white p-3 text-sm font-black text-[#1A1A1F]">
            {item}
          </div>
        ))}
      </div>
      {saved && <p className="mt-3 rounded-[18px] bg-[#DDF5E8] p-3 text-sm font-black text-[#2F9D67]">Private scan preview saved.</p>}
      <button type="button" onClick={save} className="focus-ring mt-4 min-h-12 w-full rounded-full bg-[#1A1A1F] px-4 text-sm font-black text-white">
        Save private scan preview
      </button>
    </section>
  );
}

function HomeMentalFlow({ addEvent }: { addEvent: ReturnType<typeof useProgressStore.getState>["addEvent"] }) {
  const [mood, setMood] = useState("steady");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  function save() {
    setSaved(true);
    addEvent({ engine: "mental", eventType: "feelings_check_in", eventValue: 22, payload: { mood, note, source: "home_inline" } });
    void api.createEngineEntry("mental", { entryType: "feelings_check_in", title: "Feelings check-in", payload: { mood, note, source: "home_inline" }, completed: true }).catch(() => undefined);
  }
  return (
    <section className="rounded-[24px] border border-[#CBEFE8] bg-[#F4FFFC] p-5">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">mental rep</p>
      <h2 className="mt-2 font-display text-3xl font-semibold leading-none text-[#111116]">Name it without making it a diagnosis.</h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {["anxious", "heavy", "frustrated", "steady"].map((item) => (
          <button key={item} type="button" onClick={() => setMood(item)} className={`focus-ring min-h-12 rounded-[18px] px-3 text-sm font-black capitalize ${mood === item ? "bg-[#1A1A1F] text-white" : "bg-white text-[#1A1A1F]"}`}>
            {item}
          </button>
        ))}
      </div>
      <textarea className="mt-3 min-h-24 w-full rounded-[18px] border border-[#0A0A0A0F] bg-white px-4 py-3 text-base font-semibold text-[#1A1A1F]" value={note} onChange={(event) => setNote(event.target.value)} placeholder="What is taking up space?" />
      {saved && <p className="mt-3 rounded-[18px] bg-[#DDF5E8] p-3 text-sm font-black text-[#2F9D67]">Check-in saved. Kai has this context.</p>}
      <button type="button" onClick={save} className="focus-ring mt-4 min-h-12 w-full rounded-full bg-[#1A1A1F] px-4 text-sm font-black text-white">
        Save check-in
      </button>
    </section>
  );
}

function HomeBreathFlow({ addEvent }: { addEvent: ReturnType<typeof useProgressStore.getState>["addEvent"] }) {
  const [saved, setSaved] = useState("");
  function complete(pattern: string, seconds: number) {
    setSaved(pattern);
    addEvent({ engine: "mental", eventType: "mental_breathing", eventValue: Math.min(40, 8 + Math.round(seconds / 10)), payload: { patternId: pattern, seconds, source: "home_inline" } });
    void api.createEngineEntry("mental", { entryType: "mental_breathing", title: `Breathing - ${pattern}`, payload: { patternId: pattern, seconds, source: "home_inline" }, completed: true }).catch(() => undefined);
  }
  return (
    <section className="rounded-[24px] border border-[#DCD6FF] bg-[#F8F6FF] p-5">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">reset</p>
      <h2 className="mt-2 font-display text-3xl font-semibold leading-none text-[#111116]">Pick the breath that fits the moment.</h2>
      <div className="mt-4 grid gap-2">
        {[
          ["Box breath", "4 minutes", 240],
          ["Calming", "90 seconds", 90],
          ["4-7-8", "2 minutes", 120]
        ].map(([pattern, label, seconds]) => (
          <button key={pattern} type="button" onClick={() => complete(String(pattern), Number(seconds))} className="focus-ring flex min-h-14 items-center justify-between rounded-[18px] bg-white px-4 text-left text-sm font-black text-[#1A1A1F]">
            <span>{pattern}</span>
            <span className="text-[#8A8A8F]">{label}</span>
          </button>
        ))}
      </div>
      {saved && <p className="mt-3 rounded-[18px] bg-[#DDF5E8] p-3 text-sm font-black text-[#2F9D67]">{saved} saved as a reset rep.</p>}
    </section>
  );
}

function PreviewDock({ onOpenChat, quickOpen, onToggleQuick }: { onOpenChat: () => void; quickOpen: boolean; onToggleQuick: () => void }) {
  const nav = [
    { to: "/home", label: "Home", icon: HomeIcon },
    { to: "/progress", label: "Progress", icon: Activity },
    { to: "/groups", label: "Groups", icon: UsersRound },
    { to: "/profile", label: "Profile", icon: UserRound }
  ];
  return (
    <div className="fixed inset-x-0 -bottom-3 z-40 flex items-end justify-center px-5" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <button type="button" onClick={onOpenChat} aria-label="KAI companion" className="focus-ring absolute left-5 bottom-5 grid size-8 place-items-center rounded-full bg-white shadow-[0_8px_28px_rgba(10,10,10,0.12)]">
        <KaiAvatar size={30} label="KAI companion" pulse />
      </button>
      <nav className="grid h-12 w-[13rem] grid-cols-4 items-center rounded-full border border-[#0A0A0A0F] bg-white/92 px-3 shadow-[0_12px_40px_rgba(10,10,10,0.14)] backdrop-blur-xl" aria-label="Primary navigation">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} aria-label={item.label} className="focus-ring grid place-items-center rounded-full p-2 text-[#1A1A1F] hover:bg-[#F4F1EB]">
              <Icon size={21} strokeWidth={item.to === "/home" ? 2.5 : 2} aria-hidden="true" />
            </Link>
          );
        })}
      </nav>
      <button type="button" onClick={onToggleQuick} aria-label="Quick actions" aria-expanded={quickOpen} className="focus-ring ml-3 grid size-12 place-items-center rounded-full bg-[#1A1A1F] text-white shadow-[0_12px_40px_rgba(10,10,10,0.18)]">
        <Plus size={25} className={quickOpen ? "rotate-45 transition" : "transition"} aria-hidden="true" />
      </button>
    </div>
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
