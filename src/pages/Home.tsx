import { Activity, Brain, CheckCircle2, Target, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { KaiChat } from "../components/kai/KaiChat";
import { ProgressSummary } from "../components/tracker/ProgressSummary";
import { ActionTile, AppPage, AppSurface, MetricPill } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { engineTotals } from "../lib/tracker";
import { useProgressStore } from "../stores/progressStore";
import { useUserStore } from "../stores/userStore";

export function Home() {
  const { kaiName, primaryEngine } = useUserStore();
  const events = useProgressStore((state) => state.events);
  const streak = useProgressStore((state) => state.streak());
  const belt = useProgressStore((state) => state.belt());
  const todayCount = events.filter((event) => event.occurredAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const topEngine = topEngineLabel(events);

  return (
    <AppPage className="max-w-5xl">
      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <AppSurface className="p-5 sm:p-7">
          <p className="eyebrow">today</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black leading-[0.95] tracking-normal sm:text-6xl">
            {kaiName}: start with {labelForEngine(primaryEngine)}.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted">One primary lane, one chat, one small rep. Switch only if today asks for it.</p>
          <div className="mt-6">
            <Link to={`/engine/${primaryEngine}`}>
              <Button>
                Open {labelForEngine(primaryEngine)}
              </Button>
            </Link>
          </div>
        </AppSurface>
        <AppSurface variant="soft" className="grid content-center gap-2 p-3">
          <div className="grid grid-cols-3 gap-2">
            <MetricPill label="streak" value={String(streak)} tone="care" />
            <MetricPill label="belt" value={belt} tone="goals" />
            <MetricPill label="today" value={String(todayCount)} tone="body" />
          </div>
          <p className="px-1 text-xs font-bold uppercase tracking-wider text-muted">top lane: {topEngine}</p>
        </AppSurface>
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-3">
          <KaiChat />
          <section className="grid gap-2 sm:grid-cols-3" aria-label="Switch lanes">
            <ActionTile as={Link} to="/engine/physical" icon={Activity} title="Body" copy="Food, sleep, movement." tone="body" active={primaryEngine === "physical"} />
            <ActionTile as={Link} to="/engine/potential" icon={Target} title="Goals" copy="One next move." tone="goals" active={primaryEngine === "potential"} />
            <ActionTile as={Link} to="/engine/mental" icon={Brain} title="Reset" copy="Pressure and self-talk." tone="reset" active={primaryEngine === "mental"} />
          </section>
        </div>
        <div className="space-y-3">
          <TodayPlan todayCount={todayCount} />
          <AppSurface variant="dark" className="p-4">
            <Wind className="mb-3 text-careWash" />
            <p className="eyebrow text-soft">quick reset</p>
            <h2 className="mt-1 font-display text-2xl font-black tracking-normal">In 4. Hold 4. Out 4.</h2>
            <Link to="/engine/mental" className="mt-3 inline-flex text-sm font-black text-careWash">
              Start reset
            </Link>
          </AppSurface>
        </div>
      </section>

      <ProgressSummary />
    </AppPage>
  );
}

function TodayPlan({ todayCount }: { todayCount: number }) {
  const rows = [
    ["Body", "Log one real thing"],
    ["Goals", "Pick the next ten minutes"],
    ["Reset", "Lower the volume once"]
  ];
  return (
    <AppSurface className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-2xl font-black tracking-normal">Today's flow</h2>
        <span className="rounded-full bg-bodyWash px-3 py-1 text-xs font-black text-body">{todayCount} reps</span>
      </div>
      <div className="space-y-2">
        {rows.map(([label, copy]) => (
          <div key={label} className="flex items-center gap-3 rounded-kai border border-line bg-paper px-3 py-2">
            <CheckCircle2 size={17} className="text-body" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-muted">{label}</p>
              <p className="text-sm font-semibold">{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </AppSurface>
  );
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
