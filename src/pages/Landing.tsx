import { Activity, ArrowRight, Brain, CheckCircle2, HeartPulse, ShieldAlert, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { ActionTile, AppHero, AppPage, AppSurface, MetricPill } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { engineTotals } from "../lib/tracker";
import { useProgressStore } from "../stores/progressStore";
import { useUserStore } from "../stores/userStore";

const engineCards = [
  {
    title: "Body",
    path: "/engine/physical",
    icon: Activity,
    tone: "body" as const,
    copy: "Food, movement, sleep, recovery."
  },
  {
    title: "Goals",
    path: "/engine/potential",
    icon: Target,
    tone: "goals" as const,
    copy: "School, sport, projects, next moves."
  },
  {
    title: "Reset",
    path: "/engine/mental",
    icon: Brain,
    tone: "reset" as const,
    copy: "Pressure, feelings, breathing, self-talk."
  }
];

export function Landing() {
  const { kaiName, primaryEngine, onboardingCompletedAt } = useUserStore();
  const events = useProgressStore((state) => state.events);
  const streak = useProgressStore((state) => state.streak());
  const belt = useProgressStore((state) => state.belt());
  const todayCount = events.filter((event) => event.occurredAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const primaryPath = `/engine/${primaryEngine}`;
  const topEngine = topEngineLabel(events);

  return (
    <AppPage>
      <AppHero
        eyebrow={onboardingCompletedAt ? `today with ${kaiName}` : "start here"}
        title={
          <>
            What do you want help with <span className="font-serif font-normal italic text-plum">today?</span>
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
        Open Kai, pick the lane that matches the moment, and finish one small rep. No long tour before the product starts working.
      </AppHero>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,0.92fr)_minmax(20rem,0.68fr)]">
        <AppSurface variant="dark" className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-careWash">
              <Sparkles size={22} />
            </span>
            <div className="min-w-0">
              <p className="eyebrow text-soft">fast first win</p>
              <h2 className="mt-1 font-display text-3xl font-black leading-none tracking-normal sm:text-4xl">Say it messy.</h2>
              <p className="mt-2 text-sm leading-6 text-paper/75">"I am tired and annoyed" is enough. Kai turns the check-in into the next small action.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link to={onboardingCompletedAt ? primaryPath : "/onboarding"}>
              <Button className="w-full">
                {onboardingCompletedAt ? "Open my lane" : "Meet Kai"}
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/home">
              <Button variant="secondary" className="w-full border-white/20 bg-white/10 text-paper hover:border-white/50">
                Full dashboard
              </Button>
            </Link>
          </div>
        </AppSurface>

        <AppSurface variant="danger" className="p-4 sm:p-5">
          <div className="flex gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-danger">
              <ShieldAlert size={22} />
            </span>
            <div>
              <p className="eyebrow text-danger">always available</p>
              <h2 className="mt-1 font-display text-2xl font-black tracking-normal">Crisis support</h2>
              <p className="mt-2 text-sm leading-6 text-muted">No login, no coaching wrapper, no waiting when the moment is bigger than the app.</p>
              <Link to="/crisis" className="mt-3 inline-flex text-sm font-black text-danger">
                Open crisis resources
              </Link>
            </div>
          </div>
        </AppSurface>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {engineCards.map((engine) => (
          <ActionTile key={engine.path} as={Link} to={engine.path} icon={engine.icon} title={engine.title} copy={engine.copy} tone={engine.tone} active={engine.path.endsWith(primaryEngine)} />
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.72fr)]">
        <AppSurface className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">next three reps</p>
              <h2 className="mt-1 font-display text-3xl font-black tracking-normal">Keep it concrete.</h2>
            </div>
            <span className="rounded-full bg-bodyWash px-3 py-1 text-xs font-black text-body">top: {topEngine}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Rep title="Body" copy="Log one meal, sleep note, or movement rep." />
            <Rep title="Goals" copy="Choose the next task, not the whole plan." />
            <Rep title="Reset" copy="Use a breathing or feelings check-in." />
          </div>
        </AppSurface>

        <AppSurface variant="soft" className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-plum">
            <HeartPulse size={19} />
            <p className="eyebrow text-plum">parent and safety</p>
          </div>
          <h2 className="font-display text-2xl font-black tracking-normal">Wellness coaching, not therapy.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Kai is built with consent, crisis escalation, and no diagnosis or diet-culture loops.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/for-parents" className="focus-ring rounded-full border border-line bg-white px-4 py-2 text-sm font-black">
              For parents
            </Link>
            <Link to="/privacy" className="focus-ring rounded-full border border-line bg-white px-4 py-2 text-sm font-black">
              Privacy
            </Link>
          </div>
        </AppSurface>
      </section>
    </AppPage>
  );
}

function Rep({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-kai border border-line bg-paper p-3">
      <CheckCircle2 className="mb-2 text-body" size={18} />
      <p className="text-[11px] font-black uppercase tracking-wider text-muted">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6">{copy}</p>
    </div>
  );
}

function topEngineLabel(events: ReturnType<typeof useProgressStore.getState>["events"]) {
  const totals = engineTotals(events);
  const [engine] = Object.entries(totals)
    .filter(([key]) => key !== "kai")
    .sort((a, b) => b[1] - a[1])[0] ?? ["new", 0];
  if (engine === "physical") return "body";
  if (engine === "potential") return "goals";
  if (engine === "mental") return "reset";
  return "new";
}
