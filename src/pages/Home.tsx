import { Activity, Brain, CheckCircle2, Flame, Moon, Trophy, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { KaiChat } from "../components/kai/KaiChat";
import { ProgressSummary } from "../components/tracker/ProgressSummary";
import { Button } from "../components/ui/Button";
import { useUserStore } from "../stores/userStore";

export function Home() {
  const { kaiName, primaryEngine } = useUserStore();
  return (
    <div className="space-y-4">
      <section className="rounded-kai border border-line bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">after school check-in</p>
            <h1 className="mt-3 max-w-3xl font-display text-5xl font-black leading-none tracking-normal sm:text-7xl">
              {kaiName} is ready for <span className="font-serif font-normal italic text-plum">one small rep.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              Start with <span className="font-bold capitalize text-ink">{primaryEngine}</span>, or switch if today is asking for something else.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-kai border border-line bg-paper p-2 text-center">
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
            <EngineLink to="/engine/physical" icon={<Activity />} title="Body" copy="food, movement, sleep" tone="bg-[#DCEEDF] text-[#2D7A3E]" />
            <EngineLink to="/engine/potential" icon={<Trophy />} title="Goals" copy="one next move" tone="bg-[#EEEAFF] text-[#5B47F0]" />
            <EngineLink to="/engine/mental" icon={<Brain />} title="Reset" copy="pressure and overthinking" tone="bg-[#FFE8DD] text-[#C94A2B]" />
          </section>
        </div>
        <div className="space-y-3">
          <Link to={`/engine/${primaryEngine}`}>
            <Button className="w-full">Open today’s lane</Button>
          </Link>
          <TodayPlan />
          <ProgressSummary />
          <section className="rounded-kai border border-line bg-ink p-4 text-paper shadow-sm">
            <Wind className="mb-3 text-lime" />
            <p className="eyebrow text-soft">60-second reset</p>
            <h2 className="mt-1 font-display text-2xl font-black tracking-normal">In 4. Hold 4. Out 4.</h2>
            <p className="mt-2 text-sm text-paper/70">Twice is enough to change the next minute.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-16 rounded-kai bg-white px-3 py-2 text-ink">
      <div className="mx-auto mb-1 grid size-5 place-items-center text-plum">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-wider text-muted">{label}</p>
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
        <h2 className="font-display text-2xl font-black tracking-normal">Today</h2>
        <span className="rounded-full bg-lime px-3 py-1 text-xs font-black text-sage">3 reps</span>
      </div>
      <div className="space-y-2">
        {rows.map(([label, copy]) => (
          <div key={label} className="flex items-center gap-3 rounded-kai border border-line bg-paper px-3 py-2">
            <CheckCircle2 size={17} className="text-sage" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-muted">{label}</p>
              <p className="text-sm font-semibold">{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EngineLink({ to, icon, title, copy, tone }: { to: string; icon: React.ReactNode; title: string; copy: string; tone: string }) {
  return (
    <Link to={to} className="block rounded-kai border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className={`mb-5 grid size-11 place-items-center rounded-full ${tone}`}>{icon}</div>
      <h2 className="font-display text-2xl font-black tracking-normal">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted">{copy}</p>
    </Link>
  );
}
