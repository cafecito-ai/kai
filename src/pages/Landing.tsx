import { Activity, ArrowRight, Brain, Camera, Dumbbell, Moon, ShieldAlert, Target, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { ActionTile, AppPage, AppSurface, FlowList, KaiMark, SessionHero } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { useUserStore } from "../stores/userStore";

const lanes = [
  { title: "Health", engine: "physical", path: "/health", icon: Activity, tone: "body" as const, copy: "Log food. Body scan. Stretch / move. Log sleep." },
  { title: "Goals", engine: "potential", path: "/engine/potential", icon: Target, tone: "goals" as const, copy: "Turn the thing you care about into a real next move." },
  { title: "Mental", engine: "mental", path: "/mental", icon: Brain, tone: "reset" as const, copy: "Learn from Kai through Daniel Siegel, Andrew Huberman, Viktor Frankl, James Clear, Carl Jung, stoic philosophy, and modern teen psychology principles." }
];

const physicalActions = [
  { icon: Utensils, title: "Log food", copy: "To fuel your workouts correctly." },
  { icon: Camera, title: "Body scan", copy: "To keep your posture, alignment, and body composition in check — including body fat, muscle balance, recovery, and areas to improve. Kai analyzes your progress and helps guide you toward healthier, more effective ways to reach your goals safely." },
  { icon: Dumbbell, title: "Stretch / move", copy: "To maintain mobility and prevent injury. Prop your phone up and let Kai guide you through stretches in real time — tracking your movement, correcting your form, improving posture, and coaching your breathing as you go." },
  { icon: Moon, title: "Log sleep", copy: "To ensure your body is actually recovering from the work." }
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
              {onboardingCompletedAt ? "Open today's agent" : "Start with Kai"}
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
                { label: "Pick the agent", copy: "Mental, Goals, or Physical." },
                { label: "Do one rep", copy: "Small enough to finish today." }
              ]}
            />
          </div>
        }
      >
        <p>
            Tell Kai what is loud today. It helps you choose the right agent and turn it into one small move.
        </p>
      </SessionHero>

      <section aria-label="Choose an agent" className="grid gap-2 sm:grid-cols-3">
        {lanes.map((lane) => (
          <ActionTile key={lane.path} as={Link} to={lane.path} icon={lane.icon} title={lane.title} copy={lane.copy} tone={lane.tone} active={lane.engine === primaryEngine} />
        ))}
      </section>

      <section aria-label="Physical loop" className="grid gap-2 sm:grid-cols-2">
        {physicalActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} to={action.title === "Body scan" ? "/health?module=scan" : action.title === "Stretch / move" || action.title === "Log sleep" ? "/health?module=movement" : "/health?module=food"} className="focus-ring rounded-[24px] border border-line bg-white p-4 shadow-sm">
              <div className="grid size-10 place-items-center rounded-full bg-bodyWash text-body">
                <Icon size={18} aria-hidden="true" />
              </div>
              <h2 className="mt-3 font-display text-2xl font-black tracking-normal">{action.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">{action.copy}</p>
            </Link>
          );
        })}
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
