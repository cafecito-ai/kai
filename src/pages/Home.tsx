import { Link } from "react-router-dom";
import { KaiChat } from "../components/kai/KaiChat";
import { ProgressSummary } from "../components/tracker/ProgressSummary";
import { Button } from "../components/ui/Button";
import { useUserStore } from "../stores/userStore";
import { Activity, Brain, CheckCircle2, Flame, Moon, Trophy, Wind } from "lucide-react";

export function Home() {
  const { kaiName, primaryEngine } = useUserStore();
  return (
    <div className="space-y-4">
      <section className="rounded-kai bg-night p-4 text-paper shadow-soft sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-lime">after school check-in</p>
            <h1 className="mt-2 text-3xl font-black sm:text-5xl">{kaiName} is ready</h1>
            <p className="mt-2 max-w-2xl text-paper/68">Start with <span className="font-bold capitalize text-paper">{primaryEngine}</span>, or switch if today is different.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-kai bg-paper/8 p-2 text-center">
            <MiniMetric icon={<Flame size={15} />} label="streak" value="3" />
            <MiniMetric icon={<Moon size={15} />} label="sleep" value="7/10" />
            <MiniMetric icon={<CheckCircle2 size={15} />} label="next" value="8m" />
          </div>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
        <div className="space-y-4">
          <KaiChat />
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Kai modes">
            <EngineLink to="/engine/physical" icon={<Activity />} title="Body" copy="log one real thing" color="bg-sage" />
            <EngineLink to="/engine/potential" icon={<Trophy />} title="Goals" copy="make the next move" color="bg-amber" />
            <EngineLink to="/engine/mental" icon={<Brain />} title="Reset" copy="lower the volume" color="bg-sky" />
          </section>
        </div>
        <div className="space-y-3">
          <Link to={`/engine/${primaryEngine}`}>
            <Button className="w-full">Open today’s lane</Button>
          </Link>
          <TodayPlan />
          <ProgressSummary />
          <section className="rounded-kai bg-ink p-4 text-paper">
            <Wind className="mb-3 text-lime" />
            <h2 className="text-lg font-black">60-second reset</h2>
            <p className="mt-2 text-sm text-paper/70">In 4. Hold 4. Out 4. Twice.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-16 rounded-kai bg-paper text-ink px-3 py-2">
      <div className="mx-auto mb-1 grid size-5 place-items-center text-sage">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-wider text-ink/45">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}

function TodayPlan() {
  const rows = [
    ["Body", "Log dinner without judging it"],
    ["Goals", "Write the next 10-minute task"],
    ["Reset", "Mute one app until tomorrow"]
  ];
  return (
    <section className="app-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-black">Today</h2>
        <span className="rounded-kai bg-lime/45 px-2 py-1 text-xs font-black">3 reps</span>
      </div>
      <div className="space-y-2">
        {rows.map(([label, copy]) => (
          <div key={label} className="flex items-center gap-3 rounded-kai bg-paper px-3 py-2">
            <CheckCircle2 size={17} className="text-sage" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-ink/45">{label}</p>
              <p className="text-sm font-semibold">{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EngineLink({ to, icon, title, copy, color }: { to: string; icon: React.ReactNode; title: string; copy: string; color: string }) {
  return (
    <Link to={to} className={`${color} block rounded-kai p-4 text-paper shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft`}>
      <div className="mb-4 grid size-10 place-items-center rounded-kai bg-white/20">{icon}</div>
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-1 text-sm text-paper/80">{copy}</p>
    </Link>
  );
}
