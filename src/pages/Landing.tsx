import { Activity, ArrowRight, Brain, ShieldAlert, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { ActionTile, AppPage, AppSurface, FlowList, KaiMark, SessionHero } from "../components/ui/AppPrimitives";
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
      <SessionHero
        eyebrow={onboardingCompletedAt ? `today with ${kaiName}` : "start here"}
        title={
          <>
            Start with what is <span className="font-serif font-normal italic text-plum">loud.</span>
          </>
        }
        action={
          <>
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
          </>
        }
        aside={
          <div className="flex h-full flex-col justify-between gap-7">
            <div>
              <KaiMark size="lg" />
              <p className="mt-5 font-display text-3xl font-black leading-none">One next move, not a life overhaul.</p>
            </div>
            <FlowList
              items={[
                { label: "Say the loud part", copy: "A messy sentence is enough." },
                { label: "Pick the lane", copy: "Body, Goals, or Reset." },
                { label: "Do one rep", copy: "Small enough to finish today." }
              ]}
            />
          </div>
        }
      >
        <p>
            Tell Kai what is loud today. It helps you choose the right lane and turn it into one small move.
        </p>
      </SessionHero>

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
