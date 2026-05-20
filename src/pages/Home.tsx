import { Activity, ArrowRight, Brain, Camera, CheckCircle2, Droplets, MessageCircle, Minus, Plus, ShieldCheck, Sparkles, Wind } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { KaiChat } from "../components/kai/KaiChat";
import { EvolvingCharacter } from "../components/tracker/EvolvingCharacter";
import { AppPage, AppSurface, KaiAvatar, MetricPill } from "../components/ui/AppPrimitives";
import { DAILY_CUP_FLOOR, cueFor, incrementCups, resetIfNewDay, todayIso, type HydrationToday } from "../lib/hydration";
import { loadJSON, saveJSON } from "../lib/local-storage";
import { engineTotals } from "../lib/tracker";
import type { ProgressEvent } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";
import { useUserStore } from "../stores/userStore";

const HYDRATION_HOME_KEY = "kai.home.hydration.today.v1";

export function Home() {
  const { kaiName, primaryEngine, setPrimaryEngine } = useUserStore();
  const events = useProgressStore((state) => state.events);
  const addEvent = useProgressStore((state) => state.addEvent);
  const level = useProgressStore((state) => state.level());
  const streak = useProgressStore((state) => state.streak());
  const belt = useProgressStore((state) => state.belt());
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

  const visibleEngine = primaryEngine === "potential" ? "mental" : primaryEngine;
  const score = Math.min(100, 62 + Math.min(24, todayEvents.reduce((sum, event) => sum + Math.max(0, event.eventValue), 0)));
  const totals = engineTotals(events);
  const mindScore = Math.min(10, Math.max(1, Math.round((totals.mental + totals.potential) / 40) + 5));
  const bodyScore = Math.min(10, Math.max(1, Math.round(totals.physical / 40) + 5));

  function bumpHydration(delta: number) {
    const baseline = resetIfNewDay(hydration);
    const next = incrementCups(baseline, delta);
    let finalState = next;
    if (delta > 0 && next.cups > baseline.cups && baseline.firstCupLoggedFor !== next.dateIso) {
      addEvent({ engine: "physical", eventType: "hydration_first_cup", eventValue: 4, payload: { cups: next.cups, source: "home" } });
      finalState = { ...next, firstCupLoggedFor: next.dateIso };
    }
    setHydration(finalState);
    saveJSON(HYDRATION_HOME_KEY, null, finalState);
  }

  const activeUnit = unitFor(visibleEngine);

  return (
    <AppPage className="mx-auto max-w-[30rem] lg:max-w-6xl">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(23rem,0.62fr)] lg:items-start">
        <AppSurface className="overflow-hidden p-0">
          <div className="relative overflow-hidden bg-ink p-5 text-paper sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(79,195,247,0.34),transparent_18rem),radial-gradient(circle_at_90%_0%,rgba(163,255,18,0.18),transparent_16rem)]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-paper/70">{dayLabel()}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-paper/45">{streak}-day streak</p>
                </div>
                <KaiAvatar size={52} label="Kai companion" pulse />
              </div>
              <div className="mt-7 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-paper/60">Today</p>
                  <p className="mt-1 font-display text-6xl font-black leading-none tracking-normal tabular-nums">{score}</p>
                  <p className="mt-1 text-sm font-bold text-paper/60">Strong start</p>
                </div>
                <Link to={activeUnit.href} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-ink">
                  {activeUnit.cta}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-line bg-white/70 p-3 sm:grid-cols-4">
            <MetricPill label="Mind" value={`${mindScore}/10`} tone="reset" />
            <MetricPill label="Body" value={`${bodyScore}/10`} tone="body" />
            <MetricPill label="Belt" value={belt} tone="goals" />
            <MetricPill label="Reps" value={String(todayEvents.length)} tone="care" />
          </div>

          <div className="grid gap-3 p-3 sm:p-4">
            <KaiPrompt kaiName={kaiName} />
            <div className="grid gap-3 sm:grid-cols-2">
              <UnitCard
                active={visibleEngine === "mental"}
                icon={Brain}
                title="Mental unit"
                copy="Check in, reframe pressure, build confidence, and choose one next move."
                href="/mental"
                tone="reset"
                onSelect={() => setPrimaryEngine("mental")}
              />
              <UnitCard
                active={visibleEngine === "physical"}
                icon={Activity}
                title="Health unit"
                copy="Food photo, hydration, movement, sleep, recovery, and body scan guardrails."
                href="/health"
                tone="body"
                onSelect={() => setPrimaryEngine("physical")}
              />
            </div>
            <HydrationMini hydration={hydration} onBump={bumpHydration} />
          </div>
        </AppSurface>

        <div className="grid gap-4">
          <AppSurface className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">talk to kai</p>
                <h2 className="mt-1 font-display text-2xl font-black tracking-normal">Chat stays inside the app.</h2>
              </div>
              <span className="grid size-11 place-items-center rounded-full bg-resetWash text-reset">
                <MessageCircle size={20} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <KaiChat embedded />
            </div>
          </AppSurface>

          <AppSurface className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">recent</p>
                <h2 className="mt-1 font-display text-2xl font-black tracking-normal">What changed today.</h2>
              </div>
              <EvolvingCharacter level={level} />
            </div>
            <RecentActivity events={todayEvents} />
          </AppSurface>
        </div>
      </section>

      <AppSurface className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickAction icon={Camera} label="Food photo" href="/health" />
          <QuickAction icon={Wind} label="Reset breath" href="/mental" />
          <QuickAction icon={ShieldCheck} label="Private scan" href="/health" />
        </div>
      </AppSurface>
    </AppPage>
  );
}

function KaiPrompt({ kaiName }: { kaiName: string }) {
  return (
    <section className="rounded-[24px] border border-line bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <KaiAvatar size={42} label="Kai" />
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">{kaiName} this afternoon</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-ink">
            Start light: one honest check-in, one sip of water, then pick either Mental or Health. No fake hype, no shame loop.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/mental" className="focus-ring inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-sm font-black text-paper">
              Reply in Mental
            </Link>
            <Link to="/health" className="focus-ring inline-flex min-h-10 items-center rounded-full border border-line bg-paper px-4 text-sm font-black text-ink">
              Log body signal
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function UnitCard({
  active,
  icon: Icon,
  title,
  copy,
  href,
  tone,
  onSelect
}: {
  active: boolean;
  icon: typeof Brain;
  title: string;
  copy: string;
  href: string;
  tone: "body" | "reset";
  onSelect: () => void;
}) {
  const toneClass = tone === "body" ? "bg-bodyWash text-body" : "bg-resetWash text-reset";
  return (
    <Link
      to={href}
      onClick={onSelect}
      className={`focus-ring group rounded-[24px] border p-4 transition hover:-translate-y-0.5 hover:shadow-soft ${
        active ? "border-ink bg-ink text-paper shadow-soft" : "border-line bg-white text-ink"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-11 place-items-center rounded-full ${active ? "bg-white/12 text-paper" : toneClass}`}>
          <Icon size={21} aria-hidden="true" />
        </span>
        <ArrowRight size={17} className={active ? "text-paper/55" : "text-muted"} aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-black tracking-normal">{title}</h2>
      <p className={`mt-2 text-sm font-semibold leading-6 ${active ? "text-paper/70" : "text-muted"}`}>{copy}</p>
    </Link>
  );
}

function HydrationMini({ hydration, onBump }: { hydration: HydrationToday; onBump: (delta: number) => void }) {
  const cue = cueFor(hydration.cups);
  const pct = Math.min(100, Math.round((hydration.cups / DAILY_CUP_FLOOR) * 100));
  return (
    <section className="rounded-[24px] border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-lime text-sage">
            <Droplets size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="eyebrow">hydration</p>
            <p className="mt-1 truncate text-sm font-black text-ink">{hydration.cups} / {DAILY_CUP_FLOOR} cups</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onBump(-1)} disabled={hydration.cups <= 0} className="focus-ring grid size-10 place-items-center rounded-full border border-line bg-paper text-ink disabled:opacity-40" aria-label="Subtract one cup">
            <Minus size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onBump(1)} className="focus-ring grid size-10 place-items-center rounded-full bg-ink text-paper" aria-label="Add one cup">
            <Plus size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-paper" role="progressbar" aria-valuenow={hydration.cups} aria-valuemin={0} aria-valuemax={DAILY_CUP_FLOOR}>
        <div className="h-2 rounded-full bg-sage transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-muted">{cue.message}</p>
    </section>
  );
}

function RecentActivity({ events }: { events: ProgressEvent[] }) {
  const items = events.slice(0, 3);
  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-kai border border-line bg-paper p-4 text-sm font-semibold leading-6 text-muted">
        No reps saved yet today. Open Mental or Health and complete one tiny action.
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-2">
      {items.map((event) => (
        <div key={event.id} className="flex items-center justify-between gap-3 rounded-kai border border-line bg-paper p-3">
          <div className="flex min-w-0 items-center gap-3">
            <CheckCircle2 size={17} className={event.engine === "physical" ? "text-body" : "text-reset"} aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black capitalize text-ink">{event.eventType.replace(/_/g, " ")}</p>
              <p className="text-xs font-bold text-muted">{event.engine === "physical" ? "Health" : "Mental"}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-black text-ink">+{event.eventValue}</span>
        </div>
      ))}
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon: typeof Sparkles; label: string; href: string }) {
  return (
    <Link to={href} className="focus-ring flex min-h-12 items-center justify-between rounded-[18px] border border-line bg-white px-4 text-sm font-black text-ink hover:border-ink/35">
      <span className="flex min-w-0 items-center gap-2">
        <Icon size={17} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <ArrowRight size={15} className="text-muted" aria-hidden="true" />
    </Link>
  );
}

function unitFor(engine: "physical" | "mental") {
  if (engine === "mental") return { href: "/mental", cta: "Open Mental" };
  return { href: "/health", cta: "Open Health" };
}

function dayLabel() {
  const date = new Date();
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const hour = date.getHours();
  const period = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  return `${weekday} ${period}`;
}
