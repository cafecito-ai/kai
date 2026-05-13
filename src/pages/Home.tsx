import { Activity, Brain, CheckCircle2, Target, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { KaiChat } from "../components/kai/KaiChat";
import { EvolvingCharacter } from "../components/tracker/EvolvingCharacter";
import { ActionTile, AppPage, AppSurface, FlowList, MetricPill, SessionHero } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { engineTotals } from "../lib/tracker";
import { useProgressStore } from "../stores/progressStore";
import { useUserStore } from "../stores/userStore";

export function Home() {
  const { kaiName, primaryEngine } = useUserStore();
  const events = useProgressStore((state) => state.events);
  const level = useProgressStore((state) => state.level());
  const streak = useProgressStore((state) => state.streak());
  const belt = useProgressStore((state) => state.belt());
  const todayCount = events.filter((event) => event.occurredAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const topEngine = topEngineLabel(events);

  return (
    <AppPage className="max-w-5xl">
      <SessionHero
        eyebrow="today"
        title={
          <>
            {kaiName}, start with <span className="font-serif font-normal italic text-plum">{labelForEngine(primaryEngine)}.</span>
          </>
        }
        action={
          <Link to={`/engine/${primaryEngine}`}>
            <Button>
              Open {labelForEngine(primaryEngine)}
            </Button>
          </Link>
        }
        aside={
          <div className="grid h-full content-between gap-5">
            <div className="grid grid-cols-3 gap-2">
              <MetricPill label="streak" value={String(streak)} tone="care" />
              <MetricPill label="belt" value={belt} tone="goals" />
              <MetricPill label="today" value={String(todayCount)} tone="body" />
            </div>
            <FlowList
              items={[
                { label: "Check in", copy: "Say what is taking up space." },
                { label: "Stay in one lane", copy: `Top lane: ${topEngine}.` },
                { label: "Close the loop", copy: "Finish one rep before browsing." }
              ]}
            />
          </div>
        }
      >
        <p>One primary lane, one chat, one small rep. Switch only if today asks for it.</p>
      </SessionHero>

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

      <RewardStrip level={level} streak={streak} belt={belt} todayCount={todayCount} />
    </AppPage>
  );
}

function RewardStrip({ level, streak, belt, todayCount }: { level: number; streak: number; belt: string; todayCount: number }) {
  return (
    <AppSurface className="p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <EvolvingCharacter level={level} />
        <div>
          <p className="eyebrow">after one rep</p>
          <h2 className="mt-1 font-display text-2xl font-black leading-none tracking-normal">Progress stays quiet until it helps.</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted">Today has {todayCount} saved reps. Streak {streak}. Belt {belt}.</p>
        </div>
        <Link to="/progress" className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-4 text-sm font-black hover:border-ink/35">
          See progress
        </Link>
      </div>
    </AppSurface>
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
