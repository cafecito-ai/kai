import { Activity, ArrowRight, Camera, CheckCircle2, LockKeyhole, MessageCircle, Sparkles, Target, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

const walkthrough = [
  {
    id: "start",
    label: "Start",
    title: "Kai opens with one question.",
    copy: "The app no longer starts as a landing page. It asks what is loud today and routes the kid into Body, Goals, or Reset.",
    screen: "What feels loud today?",
    detail: "Practice ran late, I still have homework, and I do not know what to eat.",
    action: "Kai turns that into one small next move."
  },
  {
    id: "camera",
    label: "Camera",
    title: "The food camera is a review, not a diet tool.",
    copy: "A photo can become a descriptive meal check with confidence, food items, and a context prompt. No calorie goals or grades.",
    screen: "Review what Kai saw",
    detail: "Chicken, rice, fruit. Estimated for context only.",
    action: "Was this enough to get through practice?"
  },
  {
    id: "progress",
    label: "Progress",
    title: "Streaks and character growth are now part of the loop.",
    copy: "Progress is framed as reps, streaks, belts, and a character that grows from real check-ins.",
    screen: "Today: 2 reps",
    detail: "Body rep saved. Reset rep saved. Current belt: white.",
    action: "Come back tomorrow to keep the streak."
  },
  {
    id: "feedback",
    label: "Pick",
    title: "The next build depends on three choices.",
    copy: "We need Lev and Offy to pick the feel of Kai before we harden the next round.",
    screen: "Choose the product direction",
    detail: "Coach, companion, or game-first? Private journal or shareable lifestyle? Parent visibility or kid-first privacy?",
    action: "Their answers decide the next sprint."
  }
] as const;

const doneItems = [
  "Mobile-first app shell with Body, Goals, and Reset lanes",
  "Clerk auth, onboarding, protected app routes, parent/safety boundaries",
  "Food-photo backend path: upload, Workers AI vision, USDA estimate, review result",
  "Progress basics: reps, streaks, belts, evolving character",
  "Mental reset tools and primer flows for stress, identity, and relationships"
];

const blockerItems = [
  "Pick Kai's personality: coach, older-sibling companion, or game guide",
  "Pick sharing posture: private by default, parent summary, or teen-controlled sharing",
  "Pick the first wow demo: food camera, home-screen character, streak/belts, or emotional check-in"
];

export function Demo() {
  const [activeId, setActiveId] = useState<(typeof walkthrough)[number]["id"]>("start");
  const active = walkthrough.find((item) => item.id === activeId) ?? walkthrough[0];

  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    const prevTitle = document.title;
    document.title = "Kai Demo";
    return () => {
      tag.remove();
      document.title = prevTitle;
    };
  }, []);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto grid w-full max-w-[calc(100vw-1.5rem)] gap-5 py-3 sm:max-w-6xl sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:py-10">
        <div className="min-w-0 overflow-hidden">
          <div className="min-w-0 overflow-hidden rounded-calm border border-line bg-white p-5 shadow-calm sm:p-7 lg:p-9">
            <p className="eyebrow">demo for Lev + Offy</p>
            <h1 className="mt-3 max-w-full break-words font-display text-[2rem] font-black leading-[0.98] tracking-normal sm:max-w-3xl sm:text-6xl lg:text-7xl">
              Kai is becoming a daily companion, not a document.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-muted">
              This page is the walkthrough for tonight: what is live, what is close, and what we need them to choose before the next sprint.
            </p>
            <div className="mt-6 flex min-w-0 flex-col gap-2 sm:flex-row">
              <Link to="/onboarding" className="min-w-0 sm:inline-flex">
                <Button className="w-full sm:w-auto">
                  Try the app flow
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <a className="focus-ring inline-flex min-h-12 min-w-0 items-center justify-center rounded-full border border-line bg-white px-4 text-sm font-black hover:border-ink/35" href="#choices">
                See decisions
              </a>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4" aria-label="Demo walkthrough">
            {walkthrough.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`focus-ring min-h-16 rounded-kai border px-3 py-3 text-left transition ${
                  active.id === item.id ? "border-ink bg-ink text-paper shadow-soft" : "border-line bg-white text-ink hover:border-ink/35"
                }`}
              >
                <span className={`block text-[10px] font-black uppercase tracking-wider ${active.id === item.id ? "text-paper/65" : "text-muted"}`}>step {index + 1}</span>
                <span className="mt-1 block text-sm font-black">{item.label}</span>
              </button>
            ))}
          </div>

          <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <article className="rounded-calm border border-line bg-white p-5 shadow-sm sm:p-6">
              <p className="eyebrow">walkthrough</p>
              <h2 className="mt-2 font-display text-3xl font-black leading-none tracking-normal sm:text-4xl">{active.title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-muted sm:text-base sm:leading-7">{active.copy}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <DemoProof icon={Activity} label="Body" copy="Food, sleep, movement" />
                <DemoProof icon={Target} label="Goals" copy="School, sport, projects" />
                <DemoProof icon={Sparkles} label="Reset" copy="Pressure and feelings" />
              </div>
            </article>

            <aside className="rounded-calm border border-line bg-warmPaper p-5 shadow-sm">
              <p className="eyebrow">tonight ask</p>
              <p className="mt-2 font-display text-2xl font-black leading-none">React to the product, then pick the blockers.</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-muted">
                The fastest useful feedback is not another doc review. It is Lev tapping through this and saying what feels exciting, weird, or missing.
              </p>
            </aside>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <StatusList title="What is done" tone="done" items={doneItems} />
            <StatusList title="What blocks the next sprint" tone="blocked" items={blockerItems} />
          </section>

          <section id="choices" className="mt-4 rounded-calm border border-line bg-white p-5 shadow-sm sm:p-6">
            <p className="eyebrow">three decisions</p>
            <h2 className="mt-2 font-display text-3xl font-black leading-none tracking-normal">What they need to pick tonight</h2>
            <div className="mt-5 grid gap-3">
              <DecisionRow number="1" title="Kai's vibe" copy="Should Kai feel like a coach, a supportive friend, or a game guide?" />
              <DecisionRow number="2" title="The first daily habit" copy="Should the first habit be food photo, emotional check-in, streak/belt quest, or home-screen character?" />
              <DecisionRow number="3" title="Parent visibility" copy="What should parents see by default: safety-only alerts, weekly summaries, or shared wins?" />
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6">
          <div className="mx-auto max-w-sm rounded-[2rem] border border-ink bg-ink p-3 shadow-calm">
            <div className="rounded-[1.55rem] bg-paper p-4">
              <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-ink/20" />
              <div className="rounded-[1.35rem] border border-line bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted">Kai</p>
                    <p className="mt-1 text-sm font-black">Today</p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-full bg-ink font-serif text-2xl italic text-paper">k</span>
                </div>
                <div className="mt-5 rounded-[1.2rem] bg-warmPaper p-4">
                  <p className="text-[11px] font-black uppercase tracking-wider text-muted">{active.label}</p>
                  <p className="mt-2 font-display text-2xl font-black leading-none">{active.screen}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-muted">{active.detail}</p>
                </div>
                <div className="mt-3 rounded-[1.2rem] border border-line bg-white p-4">
                  <p className="text-sm font-black">{active.action}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <PhoneStat label="streak" value="3" />
                  <PhoneStat label="belt" value="white" />
                  <PhoneStat label="reps" value="7" />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <MiniAction icon={Camera} label="Photo" />
                <MiniAction icon={MessageCircle} label="Chat" />
                <MiniAction icon={UserRoundCheck} label="Win" />
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function DemoProof({ icon: Icon, label, copy }: { icon: typeof Activity; label: string; copy: string }) {
  return (
    <div className="rounded-kai border border-line bg-paper p-4">
      <span className="grid size-10 place-items-center rounded-full bg-white text-ink shadow-sm">
        <Icon size={18} aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-black">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-muted">{copy}</p>
    </div>
  );
}

function StatusList({ title, tone, items }: { title: string; tone: "done" | "blocked"; items: string[] }) {
  return (
    <section className="rounded-calm border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`grid size-10 place-items-center rounded-full ${tone === "done" ? "bg-bodyWash text-body" : "bg-resetWash text-reset"}`}>
          {tone === "done" ? <CheckCircle2 size={19} /> : <LockKeyhole size={18} />}
        </span>
        <h2 className="font-display text-2xl font-black tracking-normal">{title}</h2>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-muted">
            <span className={`mt-2 size-2 shrink-0 rounded-full ${tone === "done" ? "bg-body" : "bg-reset"}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DecisionRow({ number, title, copy }: { number: string; title: string; copy: string }) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-3 rounded-kai border border-line bg-paper p-4">
      <span className="grid size-10 place-items-center rounded-full bg-ink text-sm font-black text-paper">{number}</span>
      <span>
        <span className="block text-base font-black">{title}</span>
        <span className="mt-1 block text-sm font-semibold leading-6 text-muted">{copy}</span>
      </span>
    </div>
  );
}

function PhoneStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-kai border border-line bg-paper px-2 py-2 text-center">
      <p className="text-[9px] font-black uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 truncate text-xs font-black capitalize">{value}</p>
    </div>
  );
}

function MiniAction({ icon: Icon, label }: { icon: typeof Camera; label: string }) {
  return (
    <div className="grid min-h-16 place-items-center rounded-[1.1rem] border border-line bg-white p-2 text-center">
      <Icon size={17} aria-hidden="true" />
      <p className="mt-1 text-[10px] font-black">{label}</p>
    </div>
  );
}
