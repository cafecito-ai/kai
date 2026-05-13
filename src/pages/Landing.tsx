import { Activity, ArrowRight, Brain, CheckCircle2, Flame, HeartPulse, ShieldAlert, Sparkles, Target, Trophy, Utensils, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { engineTotals } from "../lib/tracker";
import { useProgressStore } from "../stores/progressStore";
import { useUserStore } from "../stores/userStore";

const engineCards = [
  {
    title: "Body",
    path: "/engine/physical",
    icon: Activity,
    tone: "bg-[#DCEEDF] text-[#2D7A3E]",
    description: "Food, movement, sleep, recovery",
    prompt: "Log what happened without judging it."
  },
  {
    title: "Goals",
    path: "/engine/potential",
    icon: Target,
    tone: "bg-[#EEEAFF] text-[#5B47F0]",
    description: "School, sport, money, projects",
    prompt: "Pick the next ten-minute move."
  },
  {
    title: "Reset",
    path: "/engine/mental",
    icon: Brain,
    tone: "bg-[#FFE8DD] text-[#C94A2B]",
    description: "Pressure, self-talk, emotions",
    prompt: "Name the feeling. Take one steady step."
  }
];

const quickActions = [
  { to: "/engine/physical", label: "Food log", icon: Utensils },
  { to: "/engine/physical", label: "Breath", icon: Wind },
  { to: "/engine/mental", label: "Feelings", icon: HeartPulse },
  { to: "/engine/potential", label: "Next step", icon: Trophy }
];

export function Landing() {
  const { kaiName, primaryEngine, onboardingCompletedAt } = useUserStore();
  const events = useProgressStore((state) => state.events);
  const streak = useProgressStore((state) => state.streak());
  const belt = useProgressStore((state) => state.belt());
  const todayCount = events.filter((event) => event.occurredAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const topEngine = topEngineLabel(events);
  const primaryPath = `/engine/${primaryEngine}`;

  return (
    <div className="mx-auto w-[calc(100vw-1.5rem)] max-w-6xl overflow-hidden space-y-3 text-ink sm:w-full sm:space-y-4">
      <section className="min-w-0 overflow-hidden rounded-kai border border-line bg-white p-4 shadow-sm sm:p-6 lg:p-7">
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(18rem,0.58fr)] lg:items-end">
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">today with {kaiName}</p>
                <h1 className="mt-2 max-w-[18rem] font-display text-3xl font-black leading-[1] tracking-normal sm:max-w-xl sm:text-5xl lg:text-6xl">
                  What needs care today?
                </h1>
              </div>
            </div>
            <p className="max-w-[18.5rem] text-base leading-7 text-muted sm:max-w-2xl">
              Start with one honest check-in. Choose Body, Goals, or Reset, then finish one small rep before the day gets louder.
            </p>
          </div>

          <div className="grid min-w-0 max-w-full grid-cols-[repeat(3,minmax(0,1fr))] gap-2 overflow-hidden rounded-kai border border-line bg-paper p-2 text-center">
            <Metric icon={<Flame size={16} />} label="streak" value={String(streak)} />
            <Metric icon={<Trophy size={16} />} label="belt" value={belt} />
            <Metric icon={<CheckCircle2 size={16} />} label="today" value={String(todayCount)} />
          </div>
        </div>

        <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-[auto_auto] sm:items-center">
          <Link to={onboardingCompletedAt ? primaryPath : "/onboarding"} className="block">
            <Button className="h-13 w-full rounded-full px-5 sm:w-auto">
              {onboardingCompletedAt ? "Open today’s lane" : "Start onboarding"}
              <ArrowRight size={18} />
            </Button>
          </Link>
          <Link to="/home" className="block">
            <Button variant="secondary" className="h-13 w-full rounded-full px-5 sm:w-auto">
              Full dashboard
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="min-w-0 space-y-3">
          <section className="min-w-0 overflow-hidden rounded-kai border border-line bg-ink p-4 text-paper shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 text-lime" size={20} />
              <div>
                <p className="eyebrow text-soft">quick check-in</p>
                <h2 className="mt-1 font-display text-3xl font-black leading-none tracking-normal">Say it messy.</h2>
                <p className="mt-2 max-w-[18rem] text-sm leading-6 text-paper/72 sm:max-w-none">
                  “I’m tired and annoyed” is enough. Kai turns that into the next small action.
                </p>
              </div>
            </div>
            <div className="mt-4 grid min-w-0 grid-cols-2 gap-2">
              {quickActions.map(({ to, label, icon: Icon }) => (
                <Link key={label} to={to} className="focus-ring flex min-h-12 items-center gap-2 rounded-kai border border-white/10 bg-white/8 px-3 text-sm font-bold text-paper">
                  <Icon size={17} className="text-lime" />
                  {label}
                </Link>
              ))}
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-kai border border-danger/20 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FFE8DD] text-danger">
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="eyebrow text-danger">always available</p>
                <h2 className="mt-1 font-display text-2xl font-black tracking-normal">Crisis resources</h2>
                <p className="mt-1 text-sm leading-6 text-muted">No login. No waiting. Clear support links when the moment is bigger than coaching.</p>
                <Link to="/crisis" className="mt-3 inline-flex text-sm font-black text-danger">
                  Open crisis support
                </Link>
              </div>
            </div>
          </section>
        </div>

        <section className="grid min-w-0 gap-3 sm:grid-cols-3 lg:grid-cols-3">
          {engineCards.map((engine) => (
            <EngineCard key={engine.title} {...engine} active={engine.path.endsWith(primaryEngine)} />
          ))}
        </section>
      </section>

      <section className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.72fr)]">
        <div className="min-w-0 overflow-hidden rounded-kai border border-line bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">next three reps</p>
              <h2 className="mt-1 font-display text-3xl font-black tracking-normal">Keep it concrete.</h2>
            </div>
            <span className="rounded-full bg-lime px-3 py-1 text-xs font-black text-sage">top: {topEngine}</span>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-3">
            <PlanItem title="Body" copy="Log one meal, sleep note, or movement rep." />
            <PlanItem title="Goals" copy="Choose the next task, not the whole plan." />
            <PlanItem title="Reset" copy="Use a breathing or feelings check-in." />
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-kai border border-line bg-paper p-4 shadow-sm sm:p-5">
          <p className="eyebrow">parent and safety</p>
          <h2 className="mt-1 font-display text-2xl font-black tracking-normal">Wellness coaching, not therapy.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Kai keeps the product bounded: no diagnosis, no diet culture, and escalation when safety language appears.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/for-parents" className="focus-ring rounded-full border border-line bg-white px-4 py-2 text-sm font-black">
              For parents
            </Link>
            <Link to="/privacy" className="focus-ring rounded-full border border-line bg-white px-4 py-2 text-sm font-black">
              Privacy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-kai bg-white px-2 py-3">
      <div className="mx-auto mb-1 grid size-5 place-items-center text-plum">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-wider text-muted">{label}</p>
      <p className="truncate text-sm font-black capitalize">{value}</p>
    </div>
  );
}

function EngineCard({
  title,
  path,
  icon: Icon,
  tone,
  description,
  prompt,
  active
}: {
  title: string;
  path: string;
  icon: typeof Activity;
  tone: string;
  description: string;
  prompt: string;
  active: boolean;
}) {
  return (
    <Link
      to={path}
      className={`focus-ring flex min-h-[11.5rem] flex-col justify-between rounded-kai border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft ${
        active ? "border-ink bg-white" : "border-line bg-white"
      }`}
    >
      <div>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className={`grid size-12 place-items-center rounded-full ${tone}`}>
            <Icon size={22} />
          </div>
          <ArrowRight size={19} className="mt-2 text-muted" />
        </div>
        <p className="eyebrow">{active ? "start here" : description}</p>
        <h2 className="mt-2 font-display text-3xl font-black tracking-normal">{title}</h2>
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-muted">{prompt}</p>
    </Link>
  );
}

function PlanItem({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-kai border border-line bg-paper p-3">
      <p className="text-[11px] font-black uppercase tracking-wider text-muted">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6">{copy}</p>
    </div>
  );
}

function topEngineLabel(events: ReturnType<typeof useProgressStore.getState>["events"]) {
  const totals = engineTotals(events);
  const [engine] = Object.entries(totals)
    .filter(([key]) => key !== "kai")
    .sort((a, b) => b[1] - a[1])[0] ?? ["new", 0];
  if (engine === "physical") return "body";
  if (engine === "potential") return "goals";
  if (engine === "mental") return "reset";
  return "new";
}
