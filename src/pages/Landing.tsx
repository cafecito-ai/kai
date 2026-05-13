import { Activity, ArrowRight, Brain, ShieldAlert, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { ActionTile, AppPage, AppSurface } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { useUserStore } from "../stores/userStore";

const lanes = [
  { title: "Body", path: "/engine/physical", icon: Activity, tone: "body" as const, copy: "Food, sleep, movement." },
  { title: "Goals", path: "/engine/potential", icon: Target, tone: "goals" as const, copy: "School, sport, projects." },
  { title: "Reset", path: "/engine/mental", icon: Brain, tone: "reset" as const, copy: "Pressure, feelings, self-talk." }
];

export function Landing() {
  const { kaiName, primaryEngine, onboardingCompletedAt } = useUserStore();
  const startPath = onboardingCompletedAt ? `/engine/${primaryEngine}` : "/onboarding";

  return (
    <AppPage className="max-w-5xl">
      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-stretch">
        <AppSurface className="p-5 sm:p-7 lg:p-9">
          <p className="eyebrow">{onboardingCompletedAt ? `today with ${kaiName}` : "start here"}</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black leading-[0.95] tracking-normal text-ink sm:text-6xl lg:text-7xl">
            One check-in. One lane. One next move.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted">
            Tell Kai what is loud today. It helps you choose the right lane and turn it into one small move.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link to={startPath}>
              <Button className="w-full sm:w-auto">
                {onboardingCompletedAt ? "Open today's lane" : "Start with Kai"}
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/crisis" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-black text-danger hover:bg-dangerWash">
              <ShieldAlert size={17} />
              Crisis support
            </Link>
          </div>
        </AppSurface>

        <AppSurface variant="soft" className="flex flex-col justify-between p-4 sm:p-5">
          <div>
            <p className="eyebrow text-plum">how it flows</p>
            <ol className="mt-4 space-y-3">
              <FlowStep n="1" title="Say the loud part" />
              <FlowStep n="2" title="Pick the lane" />
              <FlowStep n="3" title="Do one small rep" />
            </ol>
          </div>
          <p className="mt-5 text-sm font-semibold leading-6 text-muted">You can switch lanes any time. The next move stays small.</p>
        </AppSurface>
      </section>

      <section aria-label="Choose a lane" className="grid gap-2 sm:grid-cols-3">
        {lanes.map((lane) => (
          <ActionTile key={lane.path} as={Link} to={lane.path} icon={lane.icon} title={lane.title} copy={lane.copy} tone={lane.tone} active={lane.path.endsWith(primaryEngine)} />
        ))}
      </section>

      <AppSurface className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="eyebrow">bounds</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-muted">Wellness coaching, not therapy. No diagnosis, no calorie targets, no crisis delay.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/for-parents" className="focus-ring rounded-full border border-line bg-white px-4 py-2 text-sm font-black">
              For parents
            </Link>
            <Link to="/privacy" className="focus-ring rounded-full border border-line bg-white px-4 py-2 text-sm font-black">
              Privacy
            </Link>
          </div>
        </div>
      </AppSurface>
    </AppPage>
  );
}

function FlowStep({ n, title }: { n: string; title: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-black text-paper">{n}</span>
      <span className="text-sm font-black text-ink">{title}</span>
    </li>
  );
}
