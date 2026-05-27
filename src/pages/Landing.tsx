import { ArrowRight, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { AppPage, KaiMark } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { useUserStore } from "../stores/userStore";

export function Landing() {
  const { kaiName, onboardingCompletedAt } = useUserStore();
  const startPath = onboardingCompletedAt ? "/home" : "/welcome";

  return (
    <AppPage className="flex min-h-[calc(100svh-4rem)] max-w-md flex-col justify-center px-5 pb-10 pt-6 text-center">
      <section className="mx-auto w-full">
        <div className="flex justify-center">
          <KaiMark size="lg" label="KAI" />
        </div>
        <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{onboardingCompletedAt ? `ready with ${kaiName}` : "start here"}</p>
        <h1 className="mt-3 font-display text-5xl font-black leading-[0.9] tracking-normal text-ink">Meet KAI.</h1>
        <p className="mx-auto mt-4 max-w-xs text-base font-semibold leading-7 text-muted">
          A calm coach that helps you turn your day into one clear next move.
        </p>
        <div className="mt-8">
          <Link to={startPath}>
            <Button className="min-h-14 w-full rounded-full text-base">
              {onboardingCompletedAt ? "Open KAI" : "Start with KAI"}
              <ArrowRight size={19} aria-hidden="true" />
            </Button>
          </Link>
        </div>
        <div className="mt-6 flex items-center justify-center gap-4 text-xs font-black text-muted">
          <Link to="/for-parents" className="hover:text-ink">
            Parents
          </Link>
          <Link to="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link to="/crisis" className="inline-flex items-center gap-1 text-danger hover:text-danger">
            <ShieldAlert size={13} aria-hidden="true" />
            Crisis
          </Link>
        </div>
      </section>
    </AppPage>
  );
}
