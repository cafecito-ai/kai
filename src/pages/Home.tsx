import { Activity, Brain, CheckCircle2, Target, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { KaiChat } from "../components/kai/KaiChat";
import { ProgressSummary } from "../components/tracker/ProgressSummary";
import { ActionTile, AppHero, AppPage, AppSurface, MetricPill } from "../components/ui/AppPrimitives";
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
    <AppPage>
      <AppHero
        eyebrow="today"
        title={
          <>
            {kaiName} is ready for <span className="font-serif font-normal italic text-plum">one small rep.</span>
          </>
        }
        action={
          <div className="grid grid-cols-3 gap-2 rounded-kai border border-line bg-paper p-2">
            <MetricPill label="streak" value={String(streak)} tone="care" />
            <MetricPill label="belt" value={belt} tone="goals" />
            <MetricPill label="today" value={String(todayCount)} tone="body" />
          </div>
        }
      >
        Start with {labelForEngine(primaryEngine)}, or switch lanes if today is asking for something else.
      </AppHero>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)]">
        <div className="space-y-3">
          <KaiChat />
          <section className="grid gap-2 sm:grid-cols-3" aria-label="Kai modes">
            <ActionTile as={Link} to="/engine/physical" icon={Activity} title="Body" copy="Food, movement, sleep." tone="body" active={primaryEngine === "physical"} />
            <ActionTile as={Link} to="/engine/potential" icon={Target} title="Goals" copy="One next move." tone="goals" active={primaryEngine === "potential"} />
            <ActionTile as={Link} to="/engine/mental" icon={Brain} title="Reset" copy="Pressure and self-talk." tone="reset" active={primaryEngine === "mental"} />
          </section>
        </div>
        <div className="space-y-3">
          <Link to={`/engine/${primaryEngine}`}>
            <Button className="w-full">Open {labelForEngine(primaryEngine)}</Button>
          </Link>
          <TodayPlan belt={belt} todayCount={todayCount} />
          <AppSurface variant="dark" className="p-4">
            <Wind className="mb-3 text-careWash" />
            <p className="eyebrow text-soft">60-second reset</p>
            <h2 className="mt-1 font-display text-2xl font-black tracking-normal">In 4. Hold 4. Out 4.</h2>
            <p className="mt-2 text-sm text-paper/70">Twice is enough to change the next minute.</p>
            <Link to="/engine/mental" className="mt-3 inline-flex text-sm font-black text-careWash">
              Start reset
            </Link>
          </AppSurface>
        </div>
      </div>

      <ProgressSummary />
      <p className="sr-only">Top engine this week: {topEngine}</p>
    </AppPage>
  );
}

function TodayPlan({ belt, todayCount }: { belt: string; todayCount: number }) {
  const rows = [
    ["Body", "Log dinner without judging it"],
    ["Goals", "Write the next 10-minute task"],
    ["Reset", "Mute one app until tomorrow"]
  ];
  return (
    <AppSurface className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-2xl font-black tracking-normal">Today</h2>
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
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted">Current belt: {belt}</p>
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
