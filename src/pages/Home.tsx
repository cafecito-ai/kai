import { Link } from "react-router-dom";
import { KaiChat } from "../components/kai/KaiChat";
import { ProgressSummary } from "../components/tracker/ProgressSummary";
import { Button } from "../components/ui/Button";
import { useUserStore } from "../stores/userStore";
import { Activity, Brain, Trophy, Wind } from "lucide-react";

export function Home() {
  const { kaiName, primaryEngine } = useUserStore();
  return (
    <div className="space-y-5">
      <section className="rounded-kai bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-coral">After school check-in</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">{kaiName} is ready</h1>
            <p className="mt-2 max-w-2xl text-ink/70">Current starting point: <span className="font-bold capitalize text-ink">{primaryEngine}</span>. Switch engines whenever it fits.</p>
          </div>
          <div className="rounded-kai bg-lime/35 px-4 py-3">
            <p className="text-sm font-bold">Today’s move</p>
            <p className="text-sm text-ink/70">One small rep. No grand speech.</p>
          </div>
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-[1fr_0.86fr]">
        <div className="space-y-5">
          <KaiChat />
          <section className="grid gap-3 sm:grid-cols-3">
            <EngineLink to="/engine/physical" icon={<Activity />} title="Body" copy="Food, sleep, movement" color="bg-sage" />
            <EngineLink to="/engine/potential" icon={<Trophy />} title="Goals" copy="Plans that survive Tuesday" color="bg-amber" />
            <EngineLink to="/engine/mental" icon={<Brain />} title="Mind" copy="Pressure, resets, identity" color="bg-plum" />
          </section>
        </div>
        <div className="space-y-4">
          <Link to={`/engine/${primaryEngine}`}>
            <Button className="w-full">Open recommended engine</Button>
          </Link>
          <ProgressSummary />
          <section className="rounded-kai bg-night p-5 text-paper">
            <Wind className="mb-3 text-lime" />
            <h2 className="text-xl font-black">60-second reset</h2>
            <p className="mt-2 text-sm text-paper/70">Breathe in 4, hold 4, out 4. Do it twice. Then pick the next screen.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function EngineLink({ to, icon, title, copy, color }: { to: string; icon: React.ReactNode; title: string; copy: string; color: string }) {
  return (
    <Link to={to} className={`${color} block rounded-kai p-4 text-paper shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft`}>
      <div className="mb-5 grid size-10 place-items-center rounded-full bg-white/20">{icon}</div>
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-1 text-sm text-paper/80">{copy}</p>
    </Link>
  );
}
