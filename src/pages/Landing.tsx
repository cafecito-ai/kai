import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function Landing() {
  return (
    <div className="grid min-h-[72vh] items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <h1 className="max-w-3xl text-5xl font-black leading-tight sm:text-6xl">Kai</h1>
        <p className="mt-5 max-w-2xl text-xl text-ink/70">
          A real, warm AI mentor for teens working on body, goals, and the messy middle of growing up.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/onboarding">
            <Button>
              Start <ArrowRight size={18} />
            </Button>
          </Link>
          <Link to="/for-parents">
            <Button variant="secondary">Parent info</Button>
          </Link>
        </div>
      </section>
      <section className="rounded-kai border border-ink/10 bg-white p-6 shadow-sm">
        <ShieldCheck className="mb-4 text-sage" size={34} />
        <h2 className="text-2xl font-black">Built safety-first</h2>
        <p className="mt-3 text-ink/70">
          Every conversational path is screened before Kai responds. Crisis resources stay one tap away.
        </p>
      </section>
    </div>
  );
}
