import { Activity, ArrowRight, Brain, CheckCircle2, ClipboardList, Dumbbell, MessageCircle, Moon, ShieldCheck, Sparkles, Target, Utensils, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

const engines = [
  {
    title: "Physical health",
    label: "Body",
    path: "/engine/physical",
    icon: Activity,
    accent: "bg-[#DCEEDF] text-[#2D7A3E]",
    summary: "Food, movement, sleep, recovery, breathing.",
    operational: ["Meal and photo logs", "Movement and practice check-ins", "Sleep and recovery notes"],
    lev: "Customize the food vocabulary, sport examples, recovery prompts, and the exact no-calorie guardrails."
  },
  {
    title: "Potential",
    label: "Goals",
    path: "/engine/potential",
    icon: Target,
    accent: "bg-[#EEEAFF] text-[#5B47F0]",
    summary: "School, sport, music, money, projects, identity.",
    operational: ["Goal creation", "Tiny next step planner", "Progress proof and wins"],
    lev: "Customize the goal categories, achievement language, examples, and mentor-style prompt sets."
  },
  {
    title: "Mental wellness",
    label: "Reset",
    path: "/engine/mental",
    icon: Brain,
    accent: "bg-[#FFE8DD] text-[#C94A2B]",
    summary: "Pressure, self-talk, friends, emotions, social reset.",
    operational: ["Feelings check-ins", "Breathing and grounding", "Safety-aware AI responses"],
    lev: "Customize tone, escalation copy, teen-safe reset flows, and the boundaries between coaching and care."
  }
];

const blueprint = [
  { step: "1", title: "Define the teen moment", copy: "Name the exact after-school situation the engine helps with, then write the first prompt in teen language." },
  { step: "2", title: "Pick the inputs", copy: "Choose what the engine collects: text, taps, photo, rating, duration, goal, or completion proof." },
  { step: "3", title: "Set the response rules", copy: "Write what Kai can say, what it must avoid, and when it must route to safety support." },
  { step: "4", title: "Choose the proof", copy: "Decide what gets stored as progress: a meal logged, a reset finished, a goal moved forward." }
];

const physicalStarter = [
  { icon: Utensils, title: "Food tracking", copy: "Log what was eaten, how it felt, and energy after. No weight-loss framing." },
  { icon: Dumbbell, title: "Movement", copy: "Practice, walks, lifts, games, stretching, and recovery minutes." },
  { icon: Moon, title: "Sleep", copy: "Bedtime, wake time, quality, and what made rest easier or harder." },
  { icon: Wind, title: "Reset", copy: "Breathing, soreness check, hydration, and short recovery prompts." }
];

export function Landing() {
  return (
    <div className="space-y-4 bg-[#FAFAF7] text-[#0A0A0A]">
      <section className="overflow-hidden rounded-kai border border-[#E5E2D9] bg-[#FAFAF7] shadow-soft">
        <div className="grid min-h-[78vh] gap-8 px-4 py-6 sm:px-7 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:py-10">
          <div className="flex flex-col justify-between gap-10">
            <div>
              <div className="mb-12 flex items-center justify-between border-b border-[#E5E2D9] pb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B65]">Kai framework</p>
                  <p className="mt-1 font-display text-3xl font-black tracking-normal">Calm teen</p>
                </div>
                <p className="hidden font-serif text-lg italic text-[#6B6B65] sm:block">direction 3</p>
              </div>
              <p className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B65] before:h-px before:w-8 before:bg-[#0A0A0A]">
                private beta shell
              </p>
              <h1 className="max-w-3xl font-display text-6xl font-black leading-[0.9] tracking-normal text-[#0A0A0A] sm:text-7xl lg:text-8xl">
                Build the teen wellness app around <span className="font-serif font-normal italic text-[#5B47F0]">one useful moment.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#6B6B65] sm:text-lg">
                Kai gives teens a quiet place to check in, choose the right engine, and turn the day into one small action across body, goals, and reset.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[auto_auto_1fr] sm:items-center">
              <Link to="/onboarding">
                <Button className="h-14 rounded-full bg-[#0A0A0A] px-6 text-[#FAFAF7] hover:bg-[#5B47F0]">
                  Start onboarding <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/home">
                <Button variant="secondary" className="h-14 rounded-full border-[#D8D4CA] bg-white px-6 text-[#0A0A0A]">
                  Open app shell
                </Button>
              </Link>
              <p className="text-sm leading-5 text-[#6B6B65]">Operational today: onboarding, engine pages, goals, progress, safety copy, and design direction.</p>
            </div>
          </div>
          <HeroPhones />
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {engines.map((engine) => (
          <Link key={engine.title} to={engine.path} className="group rounded-kai border border-[#E5E2D9] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div className={`grid size-12 place-items-center rounded-full ${engine.accent}`}>
                <engine.icon size={22} />
              </div>
              <ArrowRight className="mt-2 text-[#A8A8A0] transition group-hover:translate-x-1 group-hover:text-[#5B47F0]" size={19} />
            </div>
            <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B65]">{engine.label}</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal">{engine.title}</h2>
            <p className="mt-3 min-h-12 text-sm leading-6 text-[#6B6B65]">{engine.summary}</p>
            <div className="mt-5 space-y-2">
              {engine.operational.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold text-[#2A2A28]">
                  <CheckCircle2 size={16} className="text-[#2D7A3E]" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-kai bg-[#FAFAF7] p-3 text-sm leading-6 text-[#6B6B65]">
              <span className="font-bold text-[#0A0A0A]">Lev starts here:</span> {engine.lev}
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 rounded-kai border border-[#E5E2D9] bg-white p-5 shadow-sm lg:grid-cols-[0.86fr_1.14fr] lg:p-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B65]">engine blueprint</p>
          <h2 className="mt-3 max-w-lg font-display text-4xl font-black leading-none tracking-normal sm:text-5xl">
            A repeatable framework for every custom engine.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-[#6B6B65]">
            Each engine should be customized through the same product loop: teen moment, inputs, response rules, stored proof. This keeps Kai coherent while letting each lane feel specific.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {blueprint.map((item) => (
            <div key={item.step} className="rounded-kai border border-[#E5E2D9] bg-[#FAFAF7] p-4">
              <div className="mb-5 grid size-9 place-items-center rounded-full bg-[#0A0A0A] font-display text-sm font-black text-[#FAFAF7]">{item.step}</div>
              <h3 className="font-display text-xl font-black tracking-normal">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6B6B65]">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-kai border border-[#E5E2D9] bg-[#0A0A0A] p-5 text-[#FAFAF7] shadow-soft lg:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A8A8A0]">physical engine example</p>
          <h2 className="mt-3 max-w-xl font-display text-4xl font-black leading-none tracking-normal sm:text-5xl">
            Food tracking should read as fuel and patterns, not dieting.
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {physicalStarter.map((item) => (
              <div key={item.title} className="rounded-kai border border-white/10 bg-white/7 p-4">
                <item.icon className="mb-4 text-[#DCEEDF]" size={24} />
                <h3 className="font-display text-xl font-black tracking-normal">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#D8D4CA]">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-kai border border-[#E5E2D9] bg-white p-5 shadow-sm lg:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B65]">implementation note for Lev</p>
          <h2 className="mt-3 font-display text-3xl font-black leading-none tracking-normal">Customize content before changing structure.</h2>
          <div className="mt-5 space-y-3 text-sm leading-6 text-[#6B6B65]">
            <Guidance icon={<ClipboardList size={18} />} title="Start with copy" copy="Write 8 to 12 prompts per engine in the voice teens should actually see." />
            <Guidance icon={<ShieldCheck size={18} />} title="Set safety boundaries" copy="For food, avoid calories, body scoring, weight-loss plans, guilt language, and comparison loops." />
            <Guidance icon={<MessageCircle size={18} />} title="Define Kai responses" copy="Use one helpful question, one reflection, and one next action. Keep responses short enough for a phone." />
            <Guidance icon={<Sparkles size={18} />} title="Tune rewards" copy="Reward consistency, honesty, and completion. Do not reward restriction or intensity." />
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroPhones() {
  return (
    <div className="grid content-center">
      <div className="mx-auto grid w-full max-w-2xl gap-4 sm:grid-cols-[0.9fr_1.05fr] sm:items-center">
        <div className="hidden rounded-[32px] border border-[#E5E2D9] bg-white p-3 shadow-soft sm:block">
          <div className="rounded-[24px] bg-[#FAFAF7] p-5">
            <div className="mb-10 flex items-center justify-between text-xs font-bold">
              <span>4:18</span>
              <span>Kai</span>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B65]">check-in</p>
            <h2 className="mt-3 font-display text-4xl font-black leading-none tracking-normal">
              What needs care <span className="font-serif font-normal italic text-[#5B47F0]">today?</span>
            </h2>
            <div className="mt-8 space-y-3">
              <PhoneRow title="Body" copy="food, movement, sleep" tone="bg-[#DCEEDF] text-[#2D7A3E]" />
              <PhoneRow title="Goals" copy="one next move" tone="bg-[#EEEAFF] text-[#5B47F0]" />
              <PhoneRow title="Reset" copy="pressure and overthinking" tone="bg-[#FFE8DD] text-[#C94A2B]" />
            </div>
          </div>
        </div>
        <div className="rounded-[34px] border border-[#E5E2D9] bg-white p-3 shadow-soft">
          <div className="rounded-[26px] bg-[#FAFAF7] p-5">
            <div className="mb-8 flex items-center justify-between text-xs font-bold">
              <span>8:42</span>
              <span className="rounded-full bg-[#0A0A0A] px-3 py-1 text-[#FAFAF7]">kai</span>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B65]">today</p>
            <h2 className="mt-3 font-display text-4xl font-black leading-none tracking-normal">One small rep is enough.</h2>
            <div className="mt-6 rounded-kai bg-white p-4 shadow-sm">
              <p className="text-sm font-bold">Kai</p>
              <p className="mt-2 text-sm leading-6 text-[#6B6B65]">Log dinner without judging it. Then tell me if your energy changed.</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <PhoneStat label="streak" value="3" />
              <PhoneStat label="belt" value="green" />
              <PhoneStat label="next" value="8m" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneRow({ title, copy, tone }: { title: string; copy: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-kai bg-white p-3 shadow-sm">
      <span className={`grid size-9 place-items-center rounded-full text-xs font-black ${tone}`}>{title.slice(0, 1)}</span>
      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="text-xs text-[#6B6B65]">{copy}</p>
      </div>
    </div>
  );
}

function PhoneStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-kai border border-[#E5E2D9] bg-white p-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-[#A8A8A0]">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}

function Guidance({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="flex gap-3 rounded-kai bg-[#FAFAF7] p-3">
      <div className="mt-0.5 text-[#5B47F0]">{icon}</div>
      <div>
        <p className="font-bold text-[#0A0A0A]">{title}</p>
        <p>{copy}</p>
      </div>
    </div>
  );
}
