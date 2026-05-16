import { Activity, ArrowRight, Camera, CheckCircle2, Flame, LockKeyhole, MessageCircle, Sparkles, Target, Trophy, UserRoundCheck, UsersRound } from "lucide-react";
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

const choiceGroups = [
  {
    id: "vibe",
    title: "Kai's vibe",
    options: ["Calm coach", "Supportive friend", "Game guide"]
  },
  {
    id: "habit",
    title: "First daily habit",
    options: ["Food camera", "Emotional check-in", "Streaks + belts", "Home-screen character"]
  },
  {
    id: "parent",
    title: "Parent visibility",
    options: ["Safety alerts only", "Weekly summary", "Shared wins"]
  }
] as const;

const uiDirections = [
  {
    id: "coach",
    label: "Calm Coach",
    tagline: "quiet, trusted, daily guidance",
    bestFor: "A wellness companion parents trust and kids do not find cringe.",
    background: "bg-paper",
    accent: "bg-ink text-paper",
    wash: "bg-warmPaper",
    screen: "What feels loud today?",
    detail: "Practice ran late. I still have homework. I need a food plan.",
    action: "Kai: start with one body rep."
  },
  {
    id: "quest",
    label: "Quest Mode",
    tagline: "streaks, belts, character growth",
    bestFor: "Making the habit loop feel more like progress and less like homework.",
    background: "bg-[#101828]",
    accent: "bg-goals text-white",
    wash: "bg-goalsWash",
    screen: "Level 3: pre-practice fuel",
    detail: "Snap food, save the rep, keep the 3-day streak alive.",
    action: "Reward: +40 XP toward green belt."
  },
  {
    id: "social",
    label: "Lifestyle Feed",
    tagline: "wins, photos, identity, optional sharing",
    bestFor: "A teen-led product where Kai remembers the lifestyle they are building.",
    background: "bg-[#12372A]",
    accent: "bg-body text-white",
    wash: "bg-bodyWash",
    screen: "Today's lifestyle card",
    detail: "Lunch photo, practice win, reset note. Private unless shared.",
    action: "Kai: this is becoming your pattern."
  }
] as const;

export function Demo() {
  const [activeId, setActiveId] = useState<(typeof walkthrough)[number]["id"]>("start");
  const [uiDirectionId, setUiDirectionId] = useState<(typeof uiDirections)[number]["id"]>("coach");
  const [copied, setCopied] = useState(false);
  const [choices, setChoices] = useState<Record<(typeof choiceGroups)[number]["id"], string>>({
    vibe: "Calm coach",
    habit: "Food camera",
    parent: "Safety alerts only"
  });
  const active = walkthrough.find((item) => item.id === activeId) ?? walkthrough[0];
  const uiDirection = uiDirections.find((item) => item.id === uiDirectionId) ?? uiDirections[0];
  const phoneAction = getPhoneAction(active.id, uiDirection.id, active.action);
  const choiceSummary = `UI: ${uiDirection.label}. Vibe: ${choices.vibe}. Habit: ${choices.habit}. Parents: ${choices.parent}.`;

  const copyChoices = async () => {
    await navigator.clipboard?.writeText(choiceSummary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

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
            <h1 className="mt-3 max-w-full break-words font-display text-[1.65rem] font-black leading-[0.98] tracking-normal min-[380px]:text-[1.85rem] sm:max-w-3xl sm:text-6xl lg:text-7xl">
              <span className="sm:hidden">Pick Kai's feel.</span>
              <span className="hidden sm:inline">Pick the Kai they actually want to use.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-muted">
              <span className="sm:hidden">Tap, try, send picks.</span>
              <span className="hidden sm:inline">Tonight should be a product reaction, not a document review. Tap the UI directions, try the app flow, then pick what should drive the next sprint.</span>
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

          <section className="mt-4 rounded-calm border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
              <div>
                <p className="eyebrow">choose the feel</p>
                <h2 className="mt-2 break-words font-display text-[1.65rem] font-black leading-none tracking-normal min-[380px]:text-[1.85rem] sm:text-4xl">
                  <span className="sm:hidden">Pick a UI direction.</span>
                  <span className="hidden sm:inline">Three UI directions to react to.</span>
                </h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-muted sm:text-base sm:leading-7">
                  <span className="sm:hidden">Which one feels most like Kai?</span>
                  <span className="hidden sm:inline">They do not need to approve a roadmap. They need to say which version feels like Kai.</span>
                </p>
              </div>
              <div className="rounded-kai border border-line bg-paper p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-muted">current pick</p>
                <p className="mt-1 text-xl font-black">{uiDirection.label}</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-muted">{uiDirection.tagline}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {uiDirections.map((direction) => (
                <button
                  key={direction.id}
                  type="button"
                  onClick={() => setUiDirectionId(direction.id)}
                  className={`focus-ring min-h-40 rounded-calm border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${
                    uiDirection.id === direction.id ? "border-ink bg-ink text-paper shadow-soft" : "border-line bg-paper text-ink"
                  }`}
                >
                  <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${uiDirection.id === direction.id ? "bg-white/15 text-paper/75" : "bg-white text-muted"}`}>
                    option
                  </span>
                  <span className="mt-4 block font-display text-2xl font-black leading-none">{direction.label}</span>
                  <span className={`mt-2 block text-sm font-semibold leading-5 ${uiDirection.id === direction.id ? "text-paper/72" : "text-muted"}`}>{direction.bestFor}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-calm border border-ink bg-ink p-5 text-paper shadow-calm sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-paper/60">how to use this preview</p>
                <h2 className="mt-2 font-display text-3xl font-black leading-none tracking-normal">Tap, pick, send the answer back.</h2>
              </div>
              <div className="grid gap-2 text-sm font-black">
                <span className="rounded-full bg-white/10 px-4 py-3">1. Pick a UI direction</span>
                <span className="rounded-full bg-white/10 px-4 py-3">2. Tap the walkthrough steps</span>
                <span className="rounded-full bg-white/10 px-4 py-3">3. Send the choices</span>
              </div>
            </div>
          </section>

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
              <p className="mt-2 font-display text-2xl font-black leading-none">Choose a direction, then pick the blockers.</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-muted">
                The fastest useful feedback is Lev saying which UI direction feels exciting, weird, or missing.
              </p>
            </aside>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <StatusList title="What is done" tone="done" items={doneItems} />
            <StatusList title="What blocks the next sprint" tone="blocked" items={blockerItems} />
          </section>

          <section id="choices" className="mt-4 rounded-calm border border-line bg-white p-5 shadow-sm sm:p-6">
            <p className="eyebrow">three decisions</p>
            <h2 className="mt-2 font-display text-3xl font-black leading-none tracking-normal">Make the next sprint concrete.</h2>
            <div className="mt-5 grid gap-4">
              {choiceGroups.map((group) => (
                <ChoiceGroup
                  key={group.id}
                  title={group.title}
                  options={[...group.options]}
                  value={choices[group.id]}
                  onChange={(value) => setChoices((current) => ({ ...current, [group.id]: value }))}
                />
              ))}
            </div>
            <div className="mt-5 rounded-kai border border-line bg-paper p-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wider text-muted">send this back</p>
                  <p className="mt-2 break-words text-sm font-black leading-6">{choiceSummary}</p>
                </div>
                <button
                  type="button"
                  onClick={copyChoices}
                  className="focus-ring min-h-11 rounded-full border border-line bg-white px-4 text-sm font-black hover:border-ink/35"
                >
                  {copied ? "Copied" : "Copy picks"}
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className="order-first min-w-0 overflow-hidden lg:order-none lg:sticky lg:top-6">
          <div className={`mx-auto w-full max-w-[17rem] rounded-[2rem] border border-ink p-2 shadow-calm min-[380px]:max-w-[18rem] sm:max-w-sm sm:p-3 ${uiDirection.background}`}>
            <div className="rounded-[1.55rem] bg-white/96 p-3 sm:p-4">
              <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-ink/20" />
              <div className="rounded-[1.35rem] border border-line bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted">{uiDirection.label}</p>
                    <p className="mt-1 text-sm font-black">{active.label}</p>
                  </div>
                  <span className={`grid size-10 place-items-center rounded-full font-serif text-2xl italic ${uiDirection.accent}`}>k</span>
                </div>
                <div className={`mt-5 rounded-[1.2rem] p-3 sm:p-4 ${uiDirection.wash}`}>
                  <p className="text-[11px] font-black uppercase tracking-wider text-muted">{uiDirection.tagline}</p>
                  <p className="mt-2 font-display text-xl font-black leading-none sm:text-2xl">{active.screen}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-muted">{active.detail}</p>
                </div>
                <div className="mt-3 rounded-[1.2rem] border border-line bg-white p-3 sm:p-4">
                  <p className="text-sm font-black">{phoneAction}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <PhoneStat label="streak" value="3" />
                  <PhoneStat label="belt" value="white" />
                  <PhoneStat label="reps" value="7" />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <MiniAction icon={Camera} label={uiDirection.id === "quest" ? "Quest" : "Photo"} onClick={() => setActiveId("camera")} active={active.id === "camera"} />
                <MiniAction icon={uiDirection.id === "social" ? UsersRound : MessageCircle} label={uiDirection.id === "social" ? "Share" : "Chat"} onClick={() => setActiveId(uiDirection.id === "social" ? "feedback" : "start")} active={active.id === "start" || active.id === "feedback"} />
                <MiniAction icon={uiDirection.id === "quest" ? Trophy : uiDirection.id === "social" ? Flame : UserRoundCheck} label={uiDirection.id === "quest" ? "XP" : uiDirection.id === "social" ? "Streak" : "Win"} onClick={() => setActiveId("progress")} active={active.id === "progress"} />
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

function ChoiceGroup({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <fieldset className="rounded-kai border border-line bg-paper p-4">
      <legend className="px-1 text-sm font-black">{title}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`focus-ring min-h-11 rounded-full border px-4 text-sm font-black transition ${
              value === option ? "border-ink bg-ink text-paper shadow-sm" : "border-line bg-white text-ink hover:border-ink/35"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
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

function MiniAction({ icon: Icon, label, onClick, active }: { icon: typeof Camera; label: string; onClick: () => void; active: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring grid min-h-16 place-items-center rounded-[1.1rem] border p-2 text-center transition ${
        active ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink/35"
      }`}
    >
      <Icon size={17} aria-hidden="true" />
      <p className="mt-1 text-[10px] font-black">{label}</p>
    </button>
  );
}

function getPhoneAction(step: (typeof walkthrough)[number]["id"], direction: (typeof uiDirections)[number]["id"], fallback: string) {
  if (step === "camera") {
    if (direction === "quest") return "Save the food-photo rep and earn progress.";
    if (direction === "social") return "Turn this into a private lifestyle card.";
    return "Kai asks one context question before remembering it.";
  }
  if (step === "progress") {
    if (direction === "quest") return "+40 XP, streak protected, next belt closer.";
    if (direction === "social") return "Kai notices the pattern without making it public.";
    return "Progress stays quiet until it helps.";
  }
  if (step === "feedback") return "Pick the direction before we harden the next sprint.";
  return fallback;
}
