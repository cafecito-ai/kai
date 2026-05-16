import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Clipboard, MessageCircle, ShieldCheck, Trophy, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import type { DemoFeedbackChoices } from "../lib/types";

type StepId = "ui" | "habit" | "onboarding" | "parent" | "review";

type ChoiceOption<T extends keyof DemoFeedbackChoices> = {
  value: DemoFeedbackChoices[T];
  title: string;
  copy: string;
  phone: string;
};

const steps: Array<{ id: StepId; eyebrow: string; title: string; copy: string }> = [
  {
    id: "ui",
    eyebrow: "step 1",
    title: "Pick Kai's feel.",
    copy: "This sets the emotional direction for every other screen."
  },
  {
    id: "habit",
    eyebrow: "step 2",
    title: "Pick the first daily habit.",
    copy: "This becomes the first loop we make feel great."
  },
  {
    id: "onboarding",
    eyebrow: "step 3",
    title: "Pick how a new kid starts.",
    copy: "This decides whether Kai feels instant, personal, or goal-driven."
  },
  {
    id: "parent",
    eyebrow: "step 4",
    title: "Pick what parents see.",
    copy: "This keeps the product teen-first while making safety clear."
  },
  {
    id: "review",
    eyebrow: "finish",
    title: "Send the build direction.",
    copy: "This is the output. Lev's choices become the next sprint brief."
  }
];

const uiOptions: Array<ChoiceOption<"ui">> = [
  {
    value: "Calm Coach",
    title: "Calm Coach",
    copy: "Quiet, trusted, and useful. Feels like a wellness companion.",
    phone: "Kai asks one clean question and gives one next move."
  },
  {
    value: "Quest Mode",
    title: "Quest Mode",
    copy: "Streaks, belts, XP, and character growth. Feels like progress.",
    phone: "Kai turns each healthy action into a visible rep."
  },
  {
    value: "Lifestyle Feed",
    title: "Lifestyle Feed",
    copy: "Photos, wins, identity, and optional sharing. Feels teen-led.",
    phone: "Kai remembers the lifestyle pattern without making it public."
  }
];

const habitOptions: Array<ChoiceOption<"habit">> = [
  {
    value: "Food Camera",
    title: "Food Camera",
    copy: "Snap food, review what Kai saw, answer one context question.",
    phone: "Review lunch before practice."
  },
  {
    value: "Emotional Check-in",
    title: "Emotional Check-in",
    copy: "Name the pressure and get one reset that fits the moment.",
    phone: "What feels loud right now?"
  },
  {
    value: "Streaks + Belts",
    title: "Streaks + Belts",
    copy: "Make daily reps visible with levels, streaks, and belt progress.",
    phone: "+40 XP toward green belt."
  },
  {
    value: "Home-screen Character",
    title: "Home-screen Character",
    copy: "Kai lives as a visible companion and changes as habits build.",
    phone: "Kai changed because you came back."
  }
];

const onboardingOptions: Array<ChoiceOption<"onboarding">> = [
  {
    value: "Fast Start",
    title: "Fast Start",
    copy: "Ask one question and let the kid try Kai immediately.",
    phone: "Start with what is loud today."
  },
  {
    value: "Personality Setup",
    title: "Personality Setup",
    copy: "Let the kid shape Kai's voice before the first real session.",
    phone: "Should Kai be direct, calm, or funny?"
  },
  {
    value: "Goal Setup",
    title: "Goal Setup",
    copy: "Start with school, sport, body, or confidence goals.",
    phone: "Pick the thing you want Kai to help with."
  }
];

const parentOptions: Array<ChoiceOption<"parent">> = [
  {
    value: "Safety-only",
    title: "Safety-only",
    copy: "Parents are notified only for safety boundaries and consent.",
    phone: "Private by default. Safety is not delayed."
  },
  {
    value: "Weekly Summary",
    title: "Weekly Summary",
    copy: "Parents get a light weekly recap without journal details.",
    phone: "This week: 4 reps, 2 resets, 1 food photo."
  },
  {
    value: "Shared Wins",
    title: "Shared Wins",
    copy: "The kid can choose wins to share when they feel proud.",
    phone: "Share this win with a parent?"
  }
];

const defaults: DemoFeedbackChoices = {
  ui: "Calm Coach",
  habit: "Food Camera",
  onboarding: "Fast Start",
  parent: "Safety-only"
};

export function Demo() {
  const [stepIndex, setStepIndex] = useState(0);
  const [choices, setChoices] = useState<DemoFeedbackChoices>(defaults);
  const [sessionId] = useState(() => makeSessionId());
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const activeStep = steps[stepIndex];
  const summary = useMemo(() => buildSummary(choices), [choices]);
  const preview = getPreview(choices, activeStep.id);
  const canGoBack = stepIndex > 0;
  const canGoNext = stepIndex < steps.length - 1;

  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    const prevTitle = document.title;
    document.title = "Kai Demo Sprint";
    return () => {
      tag.remove();
      document.title = prevTitle;
    };
  }, []);

  const next = () => setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  const back = () => setStepIndex((current) => Math.max(0, current - 1));

  const copySummary = async () => {
    try {
      await navigator.clipboard?.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const saveFeedback = async (nextChoices = choices, source: "auto" | "manual" = "manual") => {
    setSaveState("saving");
    try {
      await api.submitDemoFeedback({
        sessionId,
        choices: nextChoices,
        summary: buildSummary(nextChoices),
        stepId: activeStep.id,
        stepIndex,
        source
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  const recordChoice = <T extends keyof DemoFeedbackChoices>(key: T, value: DemoFeedbackChoices[T]) => {
    const nextChoices = { ...choices, [key]: value };
    setChoices(nextChoices);
    void saveFeedback(nextChoices, "auto");
  };

  const goNext = () => {
    void saveFeedback(choices, "auto");
    next();
  };

  return (
    <main className="min-h-screen bg-[#070707] text-paper sm:pb-8">
      <section className="mx-auto grid w-full max-w-[calc(100vw-1rem)] gap-3 py-2 sm:max-w-6xl sm:gap-4 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="min-w-0">
          <MobileHeader stepIndex={stepIndex} />
          <Hero />
          <ProgressRail stepIndex={stepIndex} onJump={setStepIndex} />

          <section className="mt-3 rounded-[1.35rem] border border-white/10 bg-[#111111] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:mt-4 sm:rounded-calm sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A3FF12]">{activeStep.eyebrow}</p>
              <AnswerStatus saveState={saveState} />
            </div>
            <h1 className="mt-2 break-words font-display text-[1.85rem] font-black leading-none tracking-normal sm:text-5xl">
              {activeStep.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-paper/68 sm:text-base sm:leading-7">
              {activeStep.copy}
            </p>

            <div className="mt-5">
              {activeStep.id === "ui" && <OptionGrid options={uiOptions} value={choices.ui} onChoose={(value) => recordChoice("ui", value)} />}
              {activeStep.id === "habit" && <OptionGrid options={habitOptions} value={choices.habit} onChoose={(value) => recordChoice("habit", value)} />}
              {activeStep.id === "onboarding" && <OptionGrid options={onboardingOptions} value={choices.onboarding} onChoose={(value) => recordChoice("onboarding", value)} />}
              {activeStep.id === "parent" && <OptionGrid options={parentOptions} value={choices.parent} onChoose={(value) => recordChoice("parent", value)} />}
              {activeStep.id === "review" && (
                <ReviewPanel
                  choices={choices}
                  summary={summary}
                  copied={copied}
                  saveState={saveState}
                  onCopy={copySummary}
                  onSave={() => saveFeedback(choices, "manual")}
                />
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <button
                type="button"
                onClick={back}
                disabled={!canGoBack}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 text-sm font-black text-paper disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={17} />
                Back
              </button>
              <p className="hidden text-center text-xs font-black uppercase tracking-wider text-paper/45 sm:block">
                {stepIndex + 1} of {steps.length}
              </p>
              {canGoNext ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#A3FF12,#22D3EE)] px-5 text-sm font-black text-[#070707] shadow-[0_12px_36px_rgba(34,211,238,0.28)]"
                >
                  <span className="sm:hidden">Next</span>
                  <span className="hidden sm:inline">Next decision</span>
                  <ArrowRight size={17} />
                </button>
              ) : (
                <Link to="/onboarding" className="min-w-0">
                  <Button className="w-full sm:w-auto">
                    Try app flow
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              )}
            </div>
          </section>

          <div className="mt-3 lg:hidden">
            <PhonePreview choices={choices} preview={preview} activeStep={activeStep.id} onJump={setStepIndex} />
          </div>

          <section className="mt-4 hidden gap-4 lg:grid lg:grid-cols-2">
            <StatusList title="What is already built" items={["Mobile app shell", "Food-photo analysis path", "Progress streaks and belts", "Mental reset and primer flows"]} />
            <StatusList title="What this decides" items={["First habit loop", "Product tone", "Onboarding shape", "Parent visibility model"]} />
          </section>
        </div>

        <aside className="hidden min-w-0 lg:sticky lg:top-6 lg:block">
          <PhonePreview choices={choices} preview={preview} activeStep={activeStep.id} onJump={setStepIndex} />
          <PathSoFar choices={choices} />
        </aside>
      </section>
    </main>
  );
}

function MobileHeader({ stepIndex }: { stepIndex: number }) {
  return (
    <section className="relative overflow-hidden rounded-[1.35rem] border border-white/12 bg-[#111111] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.4)] sm:hidden">
      <div className="absolute -right-12 -top-16 size-36 rounded-full bg-[#A3FF12]/35 blur-2xl" />
      <div className="absolute -bottom-16 left-8 size-32 rounded-full bg-[#22D3EE]/25 blur-2xl" />
      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A3FF12]">Lev's demo sprint</p>
          <h1 className="mt-1 font-display text-[1.75rem] font-black leading-none tracking-normal">Design Kai in 5 taps.</h1>
        </div>
        <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-paper font-serif text-2xl italic text-[#070707] shadow-[0_0_36px_rgba(163,255,18,0.35)]">k</span>
      </div>
      <p className="relative mt-3 text-sm font-semibold leading-5 text-paper/70">Make one call at a time. The preview updates and saves as you choose.</p>
      <p className="relative mt-3 text-xs font-black uppercase tracking-wider text-paper">Decision {stepIndex + 1} of {steps.length}</p>
    </section>
  );
}

function Hero() {
  return (
    <section className="relative hidden overflow-hidden rounded-calm border border-white/12 bg-[#111111] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:block sm:p-7 lg:p-9">
      <div className="absolute -right-20 -top-20 size-56 rounded-full bg-[#A3FF12]/25 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 size-40 rounded-full bg-[#22D3EE]/18 blur-3xl" />
      <p className="relative text-[11px] font-black uppercase tracking-[0.2em] text-[#A3FF12]">demo sprint for Lev + Offy</p>
      <h1 className="mt-3 max-w-3xl break-words font-display text-[1.65rem] font-black leading-none tracking-normal sm:text-6xl">
        <span className="sm:hidden">Design Kai in 5 taps.</span>
        <span className="relative hidden sm:inline">Choose the app path as you go.</span>
      </h1>
      <p className="relative mt-3 max-w-2xl text-sm font-semibold leading-6 text-paper/68 sm:mt-4 sm:text-base sm:leading-7">
        <span className="sm:hidden">Pick what feels right. The app changes with you.</span>
        <span className="hidden sm:inline">Each click changes the preview, autosaves Lev's answers, and turns into a build direction. No document reading required.</span>
      </p>
    </section>
  );
}

function AnswerStatus({ saveState }: { saveState: "idle" | "saving" | "saved" | "error" }) {
  const label = saveState === "saving" ? "saving" : saveState === "saved" ? "answers saved" : saveState === "error" ? "save failed" : "autosave on";
  const tone = saveState === "error" ? "bg-dangerWash text-danger" : saveState === "saved" ? "bg-[#A3FF12] text-[#070707]" : "bg-white/10 text-paper/70";
  return <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${tone}`}>{label}</span>;
}

function ProgressRail({ stepIndex, onJump }: { stepIndex: number; onJump: (index: number) => void }) {
  return (
    <nav className="mt-3 grid grid-cols-5 gap-1 sm:mt-4 sm:gap-2" aria-label="Demo sprint steps">
      {steps.map((step, index) => {
        const complete = index < stepIndex;
        const active = index === stepIndex;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onJump(index)}
            className={`focus-ring min-h-12 rounded-[14px] border px-2 py-2 text-center transition sm:min-h-16 sm:rounded-kai sm:px-3 sm:py-3 sm:text-left ${
              active ? "border-[#A3FF12] bg-[#A3FF12] text-[#070707] shadow-[0_10px_30px_rgba(163,255,18,0.25)]" : "border-white/12 bg-white/8 text-paper hover:border-white/30"
            }`}
          >
            <span className={`block text-[8px] font-black uppercase tracking-wider sm:text-[10px] ${active ? "text-[#070707]/55" : "text-paper/48"}`}>
              {complete ? "picked" : step.eyebrow}
            </span>
            <span className="mt-1 flex items-center justify-center gap-1 text-[11px] font-black sm:justify-start sm:gap-2 sm:text-sm">
              {complete && <CheckCircle2 size={15} />}
              {labelForStep(step.id)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function OptionGrid<T extends string>({
  options,
  value,
  onChoose
}: {
  options: Array<{ value: T; title: string; copy: string; phone: string }>;
  value: T;
  onChoose: (value: T) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-3 md:gap-3">
      {options.map((option) => {
        const selected = option.value === value;
        const tone = optionTone(option.title);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChoose(option.value)}
            className={`focus-ring min-h-24 rounded-[20px] border p-4 text-left transition hover:-translate-y-0.5 md:min-h-40 md:rounded-calm ${
              selected ? `border-transparent ${tone.selected} text-paper shadow-[0_20px_54px_rgba(0,0,0,0.32)]` : `border-white/12 ${tone.idle} text-ink hover:border-white/30`
            }`}
          >
            <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${selected ? "bg-white/18 text-paper/82" : "bg-white/90 text-muted"}`}>
              {selected ? "selected" : "option"}
            </span>
            <span className="mt-3 block font-display text-xl font-black leading-none md:mt-4 md:text-2xl">{option.title}</span>
            <span className={`mt-2 block text-sm font-semibold leading-5 ${selected ? "text-paper/72" : "text-muted"}`}>
              {option.copy}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ReviewPanel({
  choices,
  summary,
  copied,
  saveState,
  onCopy,
  onSave
}: {
  choices: DemoFeedbackChoices;
  summary: string;
  copied: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  onCopy: () => void;
  onSave: () => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
        {Object.entries(choices).map(([key, value]) => (
          <div key={key} className="rounded-kai border border-white/12 bg-white/8 p-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-muted">{key}</p>
            <p className="mt-1 text-lg font-black text-paper">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-calm border border-[#A3FF12]/50 bg-[linear-gradient(135deg,#171717,#07110D)] p-4 text-paper shadow-[0_22px_60px_rgba(163,255,18,0.14)] sm:p-5">
        <p className="font-display text-2xl font-black leading-none sm:text-3xl">You designed this version of Kai.</p>
        <p className="text-[11px] font-black uppercase tracking-wider text-paper/60">build direction</p>
        <p className="mt-2 text-sm font-black leading-6 sm:text-base">{summary}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onSave} disabled={saveState === "saving" || saveState === "saved"} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#A3FF12] px-4 text-sm font-black text-[#070707] disabled:opacity-60">
            <ShieldCheck size={17} />
            {saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving" : "Save for team"}
          </button>
          <button type="button" onClick={onCopy} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-4 text-sm font-black text-paper hover:bg-white/10">
            <Clipboard size={17} />
            {copied ? "Copied" : "Copy for WhatsApp"}
          </button>
        </div>
        {saveState === "error" && <p className="mt-3 text-sm font-bold text-paper/70">Save failed. Copy the summary into WhatsApp.</p>}
        {saveState === "saved" && <p className="mt-3 text-sm font-bold text-paper/70">Saved for the next build loop.</p>}
      </div>
    </div>
  );
}

function PhonePreview({
  choices,
  preview,
  activeStep,
  onJump
}: {
  choices: DemoFeedbackChoices;
  preview: { title: string; detail: string; action: string };
  activeStep: StepId;
  onJump: (index: number) => void;
}) {
  const style = styleForUi(choices.ui);
  return (
    <div className={`mx-auto w-full max-w-[17.5rem] rounded-[2rem] border border-white/20 p-2 shadow-[0_24px_90px_rgba(0,0,0,0.45)] min-[380px]:max-w-[18rem] sm:max-w-sm sm:p-3 ${style.frame}`}>
      <div className="rounded-[1.55rem] bg-white/96 p-3 text-ink sm:p-4">
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-ink/20" />
        <div className="rounded-[1.35rem] border border-line bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted">{choices.ui}</p>
              <p className="mt-1 text-sm font-black">{labelForStep(activeStep)}</p>
            </div>
            <span className={`grid size-10 place-items-center rounded-full font-serif text-2xl italic ${style.accent}`}>k</span>
          </div>
          <div className={`mt-4 rounded-[1.2rem] p-3 sm:mt-5 sm:p-4 ${style.wash}`}>
            <p className="text-[11px] font-black uppercase tracking-wider text-muted">{choices.habit}</p>
            <p className="mt-2 font-display text-xl font-black leading-none sm:text-2xl">{preview.title}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted">{preview.detail}</p>
          </div>
          <div className="mt-3 rounded-[1.2rem] border border-line bg-white p-3 sm:p-4">
            <p className="text-sm font-black">{preview.action}</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <PhoneStat label="streak" value={choices.habit === "Streaks + Belts" ? "5" : "3"} />
            <PhoneStat label="belt" value={choices.ui === "Quest Mode" ? "green" : "white"} />
            <PhoneStat label="reps" value={choices.onboarding === "Fast Start" ? "1" : "7"} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <MiniAction icon={Camera} label="Habit" onClick={() => onJump(1)} active={activeStep === "habit"} />
          <MiniAction icon={MessageCircle} label="Start" onClick={() => onJump(2)} active={activeStep === "onboarding"} />
          <MiniAction icon={choices.ui === "Lifestyle Feed" ? UsersRound : Trophy} label="Finish" onClick={() => onJump(4)} active={activeStep === "review"} />
        </div>
      </div>
    </div>
  );
}

function PathSoFar({ choices }: { choices: DemoFeedbackChoices }) {
  return (
    <section className="mx-auto mt-3 max-w-sm rounded-[22px] border border-white/12 bg-white/8 p-4 shadow-sm sm:rounded-calm">
      <p className="eyebrow">path so far</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.values(choices).map((choice) => (
          <span key={choice} className="rounded-full border border-white/12 bg-white/90 px-3 py-2 text-xs font-black text-ink">
            {choice}
          </span>
        ))}
      </div>
    </section>
  );
}

function StatusList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-calm border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-bodyWash text-body">
          <CheckCircle2 size={19} />
        </span>
        <h2 className="font-display text-2xl font-black tracking-normal">{title}</h2>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-muted">
            <span className="mt-2 size-2 shrink-0 rounded-full bg-body" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
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

function getPreview(choices: DemoFeedbackChoices, step: StepId) {
  if (step === "ui") {
    return {
      title: choices.ui,
      detail: optionFor(uiOptions, choices.ui).phone,
      action: "Pick the emotional direction before the next sprint."
    };
  }
  if (step === "habit") {
    return {
      title: optionFor(habitOptions, choices.habit).phone,
      detail: `First loop: ${choices.habit}. Style: ${choices.ui}.`,
      action: choices.habit === "Food Camera" ? "Kai asks one context question before remembering it." : "Kai turns the habit into one daily rep."
    };
  }
  if (step === "onboarding") {
    return {
      title: optionFor(onboardingOptions, choices.onboarding).phone,
      detail: `${choices.onboarding} gets Lev into ${choices.habit.toLowerCase()} faster.`,
      action: "The first minute decides whether he keeps tapping."
    };
  }
  if (step === "parent") {
    return {
      title: optionFor(parentOptions, choices.parent).phone,
      detail: `Parent model: ${choices.parent}. Teen experience stays first.`,
      action: "Safety is clear without turning Kai into surveillance."
    };
  }
  return {
    title: "Build direction ready",
    detail: buildSummary(choices),
    action: "Save this for the team and copy it into WhatsApp."
  };
}

function optionFor<T extends string>(options: Array<{ value: T; phone: string }>, value: T) {
  return options.find((option) => option.value === value) ?? options[0];
}

function styleForUi(ui: DemoFeedbackChoices["ui"]) {
  if (ui === "Quest Mode") return { frame: "bg-[#101828]", accent: "bg-[#6D5DF6] text-white", wash: "bg-[#EEE9FF]" };
  if (ui === "Lifestyle Feed") return { frame: "bg-[#12372A]", accent: "bg-[#10B981] text-white", wash: "bg-[#DCFCE7]" };
  return { frame: "bg-[#181818]", accent: "bg-ink text-paper", wash: "bg-warmPaper" };
}

function optionTone(title: string) {
  if (title.includes("Quest") || title.includes("Streaks") || title.includes("Goal")) {
    return { selected: "bg-[linear-gradient(135deg,#6D5DF6,#22D3EE)]", idle: "bg-[#F1EDFF]" };
  }
  if (title.includes("Lifestyle") || title.includes("Character") || title.includes("Shared")) {
    return { selected: "bg-[linear-gradient(135deg,#10B981,#A3FF12)]", idle: "bg-[#E9FFF4]" };
  }
  if (title.includes("Emotional") || title.includes("Personality") || title.includes("Weekly")) {
    return { selected: "bg-[linear-gradient(135deg,#FF6B6B,#F59E0B)]", idle: "bg-[#FFF4E8]" };
  }
  return { selected: "bg-[linear-gradient(135deg,#111111,#3A3A3A)]", idle: "bg-white" };
}

function labelForStep(step: StepId) {
  if (step === "ui") return "Feel";
  if (step === "habit") return "Habit";
  if (step === "onboarding") return "Start";
  if (step === "parent") return "Parent";
  return "Review";
}

function buildSummary(choices: DemoFeedbackChoices) {
  return `Build Kai as ${choices.ui} with ${choices.habit} as the first daily habit, ${choices.onboarding} onboarding, and ${choices.parent} parent visibility.`;
}

function makeSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
