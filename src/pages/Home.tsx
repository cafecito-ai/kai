import { Activity, Brain, CheckCircle2, Target, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { KaiChat } from "../components/kai/KaiChat";
import { EvolvingCharacter } from "../components/tracker/EvolvingCharacter";
import { AppPage, AppWorkspace, MetricPill, SecondaryShelf } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { engineTotals } from "../lib/tracker";
import { useProgressStore } from "../stores/progressStore";
import { useUserStore } from "../stores/userStore";

export function Home() {
  const { kaiName, primaryEngine, setPrimaryEngine } = useUserStore();
  const events = useProgressStore((state) => state.events);
  const level = useProgressStore((state) => state.level());
  const streak = useProgressStore((state) => state.streak());
  const belt = useProgressStore((state) => state.belt());
  const todayCount = events.filter((event) => event.occurredAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const topEngine = topEngineLabel(events);
  const activeLane = laneForEngine(primaryEngine);

  return (
    <AppPage className="max-w-5xl">
      <AppWorkspace>
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 border-b border-line p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <p className="eyebrow">today</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-black leading-[0.92] tracking-normal sm:text-6xl">
              {kaiName}, start with <span className="font-serif font-normal italic text-plum">{activeLane.label}.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base font-medium leading-7 text-muted">One check-in, one lane, one rep. Everything else can wait.</p>
            <div className="mt-6">
              <LaneTabs active={primaryEngine} onChange={setPrimaryEngine} />
            </div>
          </div>

          <ProgressRail level={level} streak={streak} belt={belt} todayCount={todayCount} topEngine={topEngine} />
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 border-b border-line p-3 sm:p-4 lg:border-b-0 lg:border-r">
            <KaiChat embedded />
          </div>
          <div className="grid content-start gap-3 bg-warmPaper/60 p-4">
            <TodayPlan engine={primaryEngine} todayCount={todayCount} />
            <Link to={`/engine/${primaryEngine}`}>
              <Button className="w-full">
                Open {activeLane.label} rep
              </Button>
            </Link>
            <Link to="/engine/mental" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-black text-ink hover:border-ink/35">
              <Wind size={16} aria-hidden="true" />
              Quick reset
            </Link>
          </div>
        </div>
      </AppWorkspace>

      <SecondaryShelf eyebrow="after the rep" title="Progress stays quiet until it helps." summary={`Today has ${todayCount} saved reps. Streak ${streak}. Belt ${belt}.`} count="progress">
        <RewardStrip level={level} />
      </SecondaryShelf>
    </AppPage>
  );
}

function LaneTabs({ active, onChange }: { active: "physical" | "potential" | "mental"; onChange: (engine: "physical" | "potential" | "mental") => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Choose today's lane">
      {lanes.map((lane) => {
        const Icon = lane.icon;
        const selected = active === lane.id;
        return (
          <button
            key={lane.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(lane.id)}
            className={`focus-ring flex min-h-14 items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition ${
              selected ? "border-ink bg-ink text-paper shadow-soft" : "border-line bg-white text-ink hover:border-ink/35"
            }`}
          >
            <span className={`grid size-9 shrink-0 place-items-center rounded-full ${selected ? "bg-white/15 text-paper" : lane.tone}`}>
              <Icon size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black">{lane.label}</span>
              <span className={`block truncate text-xs font-bold ${selected ? "text-paper/70" : "text-muted"}`}>{lane.short}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ProgressRail({ level, streak, belt, todayCount, topEngine }: { level: number; streak: number; belt: string; todayCount: number; topEngine: string }) {
  return (
    <aside className="grid gap-3 bg-warmPaper/60 p-4 sm:p-5">
      <div className="grid grid-cols-3 gap-2">
        <MetricPill label="streak" value={String(streak)} tone="care" />
        <MetricPill label="belt" value={belt} tone="goals" />
        <MetricPill label="today" value={String(todayCount)} tone="body" />
      </div>
      <div className="rounded-[22px] border border-line bg-white p-4">
        <div className="flex items-center gap-3">
          <EvolvingCharacter level={level} />
          <div>
            <p className="eyebrow">current path</p>
            <p className="mt-1 text-sm font-black text-ink">Top lane: {topEngine}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function RewardStrip({ level }: { level: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <EvolvingCharacter level={level} />
        <div>
        <p className="text-sm font-semibold leading-6 text-muted">Open the full progress room when you want streaks, belts, charts, and character growth. The daily workspace only shows enough feedback to keep going.</p>
        </div>
        <Link to="/progress" className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-4 text-sm font-black hover:border-ink/35">
          See progress
        </Link>
    </div>
  );
}

function TodayPlan({ engine, todayCount }: { engine: "physical" | "potential" | "mental"; todayCount: number }) {
  const lane = laneForEngine(engine);
  return (
    <section className="rounded-[22px] border border-line bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-2xl font-black tracking-normal">Today's rep</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${lane.tone}`}>{todayCount} reps</span>
      </div>
      <div className="space-y-2">
        {lane.steps.map((copy, index) => (
          <div key={copy} className="flex items-center gap-3 rounded-kai border border-line bg-paper px-3 py-2">
            <CheckCircle2 size={17} className={lane.iconTone} />
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-muted">step {index + 1}</p>
              <p className="text-sm font-semibold">{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const lanes = [
  { id: "physical" as const, label: "Body", short: "Food, sleep, movement.", icon: Activity, tone: "bg-bodyWash text-body" },
  { id: "potential" as const, label: "Goals", short: "One next move.", icon: Target, tone: "bg-goalsWash text-goals" },
  { id: "mental" as const, label: "Reset", short: "Pressure and self-talk.", icon: Brain, tone: "bg-resetWash text-reset" }
];

function laneForEngine(engine: "physical" | "potential" | "mental") {
  if (engine === "potential") {
    return {
      label: "Goals",
      tone: "bg-goalsWash text-goals",
      iconTone: "text-goals",
      steps: ["Name the thing.", "Shrink it to ten minutes.", "Save the next move."]
    };
  }
  if (engine === "mental") {
    return {
      label: "Reset",
      tone: "bg-resetWash text-reset",
      iconTone: "text-reset",
      steps: ["Name the feeling.", "Lower the volume.", "Choose the next kind move."]
    };
  }
  return {
    label: "Body",
    tone: "bg-bodyWash text-body",
    iconTone: "text-body",
    steps: ["Log one real thing.", "Notice energy or pressure.", "Keep it descriptive."]
  };
}

function topEngineLabel(events: ReturnType<typeof useProgressStore.getState>["events"]) {
  const totals = engineTotals(events);
  const [engine] = Object.entries(totals)
    .filter(([key]) => key !== "kai")
    .sort((a, b) => b[1] - a[1])[0] ?? ["none", 0];
  return labelForEngine(engine as "physical" | "potential" | "mental" | "none").toLowerCase();
}

function labelForEngine(engine: "physical" | "potential" | "mental" | "none") {
  if (engine === "physical") return "Body";
  if (engine === "potential") return "Goals";
  if (engine === "mental") return "Reset";
  return "new";
}
