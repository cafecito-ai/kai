import { ArrowRight, ShieldAlert } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { AppPage, AppSurface, FlowList, KaiMark, SessionHero } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { useUserStore } from "../stores/userStore";

export function Landing() {
  const { kaiName, onboardingCompletedAt } = useUserStore();

  // Users who already onboarded go straight to /home. Landing is for
  // first-time visitors only — the v0 "pick an engine" path is dead.
  if (onboardingCompletedAt) {
    return <Navigate to="/home" replace />;
  }

  // Flow: Landing → Welcome → Onboarding → Home. The Welcome page
  // self-redirects to /onboarding for users who've seen it and to
  // /home for fully-onboarded users, so this single entry point works
  // for everyone.
  const startPath = "/welcome";

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
                Start with Kai
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
                { label: "Get a real read", copy: "KAI listens, you don't have to perform." },
                { label: "Do one small thing", copy: "Small enough to finish today." }
              ]}
            />
          </div>
        }
      >
        <p>
            Tell Kai what is loud today. It helps you choose the right agent and turn it into one small move.
        </p>
      </SessionHero>

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
