import { Link } from "react-router-dom";
import { KaiChat } from "../components/kai/KaiChat";
import { ProgressSummary } from "../components/tracker/ProgressSummary";
import { Button } from "../components/ui/Button";
import { useUserStore } from "../stores/userStore";

export function Home() {
  const { kaiName, primaryEngine } = useUserStore();
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-wider text-sage">Dashboard</p>
        <h1 className="mt-2 text-4xl font-black">{kaiName} is ready</h1>
        <p className="mt-2 text-ink/70">Your current starting point is {primaryEngine}. Switch engines whenever it fits.</p>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <KaiChat />
        <div className="space-y-3">
          <Link to={`/engine/${primaryEngine}`}>
            <Button className="w-full">Open recommended engine</Button>
          </Link>
          <ProgressSummary />
        </div>
      </div>
    </div>
  );
}
