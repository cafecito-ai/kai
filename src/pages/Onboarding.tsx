import { ArrowRight, Check, ChevronLeft, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KaiAvatar } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import { KAI_ACTIONS, type KaiAction } from "../lib/kai-actions";
import type { EngineId, KaiTone } from "../lib/types";
import { useKaiStore } from "../stores/kaiStore";
import { useUserStore } from "../stores/userStore";

type MultiKey = "identity" | "pain" | "improve" | "routine" | "motivation" | "distraction" | "habits" | "commitment";
type SliderKey = "painImpact" | "distractionHours" | "dailyMinutes";
type Answers = Record<MultiKey, string[]> & Record<SliderKey, number>;

type Option = {
  label: string;
  value: string;
};

type Step =
  | {
      kind: "welcome";
      title: string;
      subtitle: string;
    }
  | {
      kind: "identity";
      key: MultiKey;
      title: string;
      options: Option[];
      multi?: boolean;
      helper?: string;
    }
  | {
      kind: "slider";
      key: MultiKey;
      sliderKey: SliderKey;
      title: string;
      options: Option[];
      sliderLabel: string;
      min: number;
      max: number;
      suffix?: string;
      multi?: boolean;
    }
  | {
      kind: "mirror";
      title: string;
    }
  | {
      kind: "commit";
      key: MultiKey;
      sliderKey: SliderKey;
      title: string;
      options: Option[];
      sliderLabel: string;
      min: number;
      max: number;
      suffix?: string;
    }
  | {
      kind: "building";
      title: string;
    };

const initialAnswers: Answers = {
  identity: [],
  pain: [],
  improve: [],
  routine: [],
  motivation: [],
  distraction: [],
  habits: [],
  commitment: [],
  painImpact: 6,
  distractionHours: 3,
  dailyMinutes: 12
};

const steps: Step[] = [
  {
    kind: "welcome",
    title: "Let’s build your personalized system.",
    subtitle: "Takes under 2 minutes."
  },
  {
    kind: "identity",
    key: "identity",
    title: "Which version of yourself do you want to become most?",
    multi: true,
    helper: "Pick every signal that feels true.",
    options: options("More disciplined", "More confident", "Better shape", "More focused", "Less distracted", "More productive", "More social", "More calm", "Better sleep", "More spiritual")
  },
  {
    kind: "slider",
    key: "pain",
    sliderKey: "painImpact",
    title: "What’s been hurting your progress the most lately?",
    sliderLabel: "How much does this affect your life?",
    min: 1,
    max: 10,
    multi: false,
    options: options("Overthinking", "Procrastination", "Phone addiction", "Lack of motivation", "Low confidence", "Bad sleep", "Stress/anxiety", "Loneliness", "Inconsistency", "No structure")
  },
  {
    kind: "identity",
    key: "improve",
    title: "If KAI worked perfectly, what would improve first?",
    options: options("Energy", "Confidence", "Discipline", "Body/fitness", "Mental clarity", "Productivity", "Relationships", "Happiness", "Focus", "Consistency")
  },
  {
    kind: "identity",
    key: "routine",
    title: "Which best describes your current routine?",
    options: options("Locked in", "Trying to improve", "All over the place", "Burned out", "Motivated but inconsistent", "Completely restarting")
  },
  {
    kind: "identity",
    key: "motivation",
    title: "What motivates you MOST?",
    helper: "This shapes KAI’s push, rewards, and reminders.",
    options: options("Winning", "Progress", "Competition", "Recognition", "Accountability", "Peace of mind", "Self improvement", "Streaks/rewards")
  },
  {
    kind: "slider",
    key: "distraction",
    sliderKey: "distractionHours",
    title: "What distracts you the most daily?",
    sliderLabel: "How many hours/day do you feel distracted?",
    min: 0,
    max: 10,
    suffix: "h",
    options: options("TikTok/social media", "YouTube", "Gaming", "Overthinking", "Friends/social life", "Laziness", "Stress", "Lack of routine")
  },
  {
    kind: "identity",
    key: "habits",
    title: "What habits do you want to build?",
    multi: true,
    options: options("Gym", "Reading", "Meditation", "Journaling", "Better sleep", "Studying", "Cold showers", "Stretching", "Drinking water", "Less screen time")
  },
  {
    kind: "mirror",
    title: "Here’s what I’m seeing."
  },
  {
    kind: "commit",
    key: "commitment",
    sliderKey: "dailyMinutes",
    title: "How serious are you about improving?",
    sliderLabel: "How many minutes per day can you commit?",
    min: 5,
    max: 45,
    suffix: "m",
    options: options("Casual", "Ready for change", "Fully locked in")
  },
  {
    kind: "building",
    title: "Building your system."
  }
];

const buildLines = ["Analyzing habits…", "Building your focus system…", "Customizing your experience…"];

export function Onboarding() {
  const navigate = useNavigate();
  const { setKai, setPrimaryEngine, setConsentPending, markOnboardingComplete } = useUserStore();
  const hydrateKaiChat = useKaiStore((state) => state.hydrate);
  const [name, setName] = useState("");
  const [age, setAge] = useState("16");
  const [parentEmail, setParentEmail] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentStep = steps[step];
  const normalizedAge = Number(age) || undefined;
  const needsParentConsent = Boolean(normalizedAge && normalizedAge < 13);
  const profile = useMemo(() => buildProfile(answers), [answers]);
  const canContinue = currentStep.kind === "welcome" ? Boolean(name.trim()) && (!needsParentConsent || Boolean(parentEmail.trim())) : stepIsComplete(currentStep, answers);
  const progress = Math.round(((step + 1) / steps.length) * 100);

  function updateMulti(key: MultiKey, value: string, multi = false) {
    setAnswers((current) => {
      const existing = current[key];
      const next = multi ? (existing.includes(value) ? existing.filter((item) => item !== value) : [...existing, value]) : [value];
      return { ...current, [key]: next };
    });
  }

  function updateSlider(key: SliderKey, value: number) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function next() {
    setError("");
    if (currentStep.kind === "welcome") {
      if (!name.trim()) {
        setError("Tell KAI what to call you first.");
        return;
      }
      if (needsParentConsent && !parentEmail.trim()) {
        setError("Parent email is required for users under 13.");
        return;
      }
    }
    if (!canContinue) return;
    if (currentStep.kind === "commit") {
      setStep((value) => Math.min(value + 1, steps.length - 1));
      window.setTimeout(() => {
        void finish();
      }, 1700);
      return;
    }
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  async function finish() {
    setSaving(true);
    setError("");
    const action = firstActionFor(profile, answers);
    const engine = engineForAction(action);
    const tone = toneFor(answers);
    try {
      await api.submitIntake(buildIntakeAnswers(answers, profile, action));
      await api.updateUser({
        kaiName: "KAI",
        kaiTone: tone,
        primaryEngine: engine,
        age: normalizedAge,
        parentEmail: parentEmail.trim() || undefined,
        onboardingCompleted: true
      });
      if (needsParentConsent && parentEmail.trim()) {
        await api.sendParentConsent({ parentEmail: parentEmail.trim(), teenName: name.trim() });
        setConsentPending(parentEmail.trim());
      }
      saveLocalProfile(profile, answers, action);
    } catch {
      saveLocalProfile(profile, answers, action);
      setError("KAI could not sync setup yet, but your system is ready on this device.");
    } finally {
      setKai("KAI", tone);
      setPrimaryEngine(engine);
      markOnboardingComplete();
      hydrateKaiChat("kai", {
        conversationId: null,
        messages: [
          {
            id: "onboarding-kai-first-message",
            role: "assistant",
            content: buildFirstMessage(name.trim(), answers, profile, action)
          }
        ],
        nextAction: action
      });
      setSaving(false);
      navigate("/walkthrough");
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-2xl flex-col justify-center px-3 py-4 text-[#111116] sm:px-4">
      <section className="relative overflow-hidden rounded-[34px] border border-[#0A0A0A0F] bg-[#FBFAF6] shadow-[0_24px_90px_rgba(10,10,10,0.12)]">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(122,185,255,0.28),transparent_62%)]" />
        <header className="relative border-b border-[#0A0A0A0F] bg-white/78 px-4 py-4 backdrop-blur-xl sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <KaiAvatar size={44} label="KAI" pulse />
              <div>
                <p className="font-mono text-[10px] font-medium uppercase tracking-normal text-[#8A8A8F]">KAI setup</p>
                <h1 className="text-xl font-black leading-tight">Build your system</h1>
              </div>
            </div>
            <Link to="/crisis" className="text-xs font-black text-[#C4473E]">
              Crisis
            </Link>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#F0EFEC]">
            <div className="h-full rounded-full bg-[#111116] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </header>

        <div className="relative min-h-[33rem] px-4 py-5 sm:px-5">
          <StepContent
            step={currentStep}
            answers={answers}
            profile={profile}
            name={name}
            age={age}
            parentEmail={parentEmail}
            needsParentConsent={needsParentConsent}
            saving={saving}
            onName={setName}
            onAge={setAge}
            onParentEmail={setParentEmail}
            onToggle={updateMulti}
            onSlider={updateSlider}
          />
        </div>

        {error && <p className="mx-4 mb-3 rounded-[18px] border border-[#E35D4F]/25 bg-[#FFF0EC] p-3 text-sm font-black text-[#C4473E] sm:mx-5">{error}</p>}

        {currentStep.kind !== "building" && (
          <footer className="relative grid gap-2 border-t border-[#0A0A0A0F] bg-white/78 p-3 backdrop-blur-xl sm:grid-cols-[auto_1fr] sm:p-4">
            {step > 0 && (
              <Button type="button" variant="secondary" onClick={() => setStep((value) => value - 1)} className="w-full sm:w-auto">
                <ChevronLeft size={18} aria-hidden="true" />
                Back
              </Button>
            )}
            <Button type="button" onClick={next} disabled={!canContinue} className="min-h-12 w-full">
              {step === 0 ? "Start" : currentStep.kind === "commit" ? "Build my system" : "Next"}
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </footer>
        )}
      </section>
    </main>
  );
}

function StepContent({
  step,
  answers,
  profile,
  name,
  age,
  parentEmail,
  needsParentConsent,
  saving,
  onName,
  onAge,
  onParentEmail,
  onToggle,
  onSlider
}: {
  step: Step;
  answers: Answers;
  profile: ReturnType<typeof buildProfile>;
  name: string;
  age: string;
  parentEmail: string;
  needsParentConsent: boolean;
  saving: boolean;
  onName: (value: string) => void;
  onAge: (value: string) => void;
  onParentEmail: (value: string) => void;
  onToggle: (key: MultiKey, value: string, multi?: boolean) => void;
  onSlider: (key: SliderKey, value: number) => void;
}) {
  if (step.kind === "welcome") {
    return (
      <div className="flex min-h-[30rem] flex-col justify-between">
        <div>
          <div className="mt-5 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#8BD8B7]/35 blur-2xl" />
              <KaiAvatar size={96} label="KAI" pulse />
            </div>
          </div>
          <h2 className="mt-8 text-center text-4xl font-black leading-[0.98] tracking-normal sm:text-5xl">{step.title}</h2>
          <p className="mt-3 text-center text-sm font-black text-[#7A7A82]">{step.subtitle}</p>
        </div>

        <section className="space-y-3 rounded-[28px] border border-[#0A0A0A0F] bg-white p-4 shadow-sm">
          <input className="field" value={name} onChange={(event) => onName(event.target.value)} placeholder="First name" aria-label="First name" />
          <div className="grid grid-cols-[5.5rem_1fr] gap-2">
            <input className="field" inputMode="numeric" value={age} onChange={(event) => onAge(event.target.value)} aria-label="Age" />
            <input
              className="field"
              type="email"
              value={parentEmail}
              onChange={(event) => onParentEmail(event.target.value)}
              placeholder={needsParentConsent ? "Parent email required" : "Parent email optional"}
              aria-label="Parent email"
            />
          </div>
          <p className="text-xs font-semibold leading-5 text-[#77777D]">Parent email is only required under 13.</p>
        </section>
      </div>
    );
  }

  if (step.kind === "building") {
    return (
      <div className="flex min-h-[30rem] flex-col items-center justify-center text-center">
        <div className="grid h-28 w-28 place-items-center rounded-[32px] bg-[#111116] text-white shadow-[0_18px_60px_rgba(17,17,22,0.24)]">
          <LoaderCircle className="animate-spin" size={42} aria-hidden="true" />
        </div>
        <h2 className="mt-7 text-4xl font-black leading-none tracking-normal">{step.title}</h2>
        <div className="mt-5 space-y-3">
          {buildLines.map((line, index) => (
            <p key={line} className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#4F5056] shadow-sm" style={{ animation: `kaiFade 1.4s ease ${index * 0.25}s infinite alternate` }}>
              {line}
            </p>
          ))}
        </div>
        {saving && <p className="mt-6 text-xs font-black text-[#8A8A8F]">Syncing your profile…</p>}
        <style>{`@keyframes kaiFade { from { opacity: .44; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    );
  }

  if (step.kind === "mirror") {
    return (
      <div className="flex min-h-[30rem] flex-col justify-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-normal text-[#8A8A8F]">KAI read</p>
        <h2 className="mt-3 text-4xl font-black leading-[0.98] tracking-normal">{step.title}</h2>
        <div className="mt-5 rounded-[30px] bg-[#111116] p-5 text-white shadow-[0_22px_70px_rgba(17,17,22,0.2)]">
          <p className="text-2xl font-black leading-tight tracking-normal">{mirrorLine(answers)}</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <ScorePill label="Discipline" value={profile.scores.discipline} />
            <ScorePill label="Focus" value={profile.scores.focus} />
            <ScorePill label="Stress" value={profile.scores.stress} />
            <ScorePill label="Dopamine" value={profile.scores.dopamineDependence} />
          </div>
        </div>
      </div>
    );
  }

  if (step.kind === "slider" || step.kind === "commit") {
    return (
      <div>
        <StepHeader title={step.title} helper={step.kind === "commit" ? "Pick the honest version. KAI will scale the pressure." : undefined} />
        <OptionGrid step={step} answers={answers} onToggle={onToggle} />
        <SliderBlock
          label={step.sliderLabel}
          value={answers[step.sliderKey]}
          min={step.min}
          max={step.max}
          suffix={step.suffix}
          onChange={(value) => onSlider(step.sliderKey, value)}
        />
      </div>
    );
  }

  return (
    <div>
      <StepHeader title={step.title} helper={step.helper} />
      <OptionGrid step={step} answers={answers} onToggle={onToggle} />
    </div>
  );
}

function StepHeader({ title, helper }: { title: string; helper?: string }) {
  return (
    <header>
      <p className="font-mono text-[10px] font-bold uppercase tracking-normal text-[#8A8A8F]">Tap what fits</p>
      <h2 className="mt-3 text-4xl font-black leading-[0.98] tracking-normal sm:text-5xl">{title}</h2>
      {helper && <p className="mt-3 text-sm font-semibold leading-6 text-[#68686E]">{helper}</p>}
    </header>
  );
}

function OptionGrid({ step, answers, onToggle }: { step: Extract<Step, { key: MultiKey }>; answers: Answers; onToggle: (key: MultiKey, value: string, multi?: boolean) => void }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-2">
      {step.options.map((option) => {
        const selected = answers[step.key].includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(step.key, option.value, "multi" in step ? step.multi : false)}
            className={`focus-ring min-h-[4.25rem] rounded-[22px] border px-3 py-3 text-left text-sm font-black leading-tight transition ${
              selected ? "border-[#111116] bg-[#111116] text-white shadow-[0_14px_34px_rgba(17,17,22,0.18)]" : "border-[#0A0A0A0F] bg-white text-[#27272D] hover:border-[#111116]/20"
            }`}
          >
            <span className="flex items-center justify-between gap-2">
              {option.label}
              {selected && <Check size={16} aria-hidden="true" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SliderBlock({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <section className="mt-6 rounded-[28px] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black leading-5 text-[#303036]">{label}</p>
        <p className="grid h-12 min-w-12 place-items-center rounded-2xl bg-[#111116] px-3 text-lg font-black text-white">
          {value}
          {suffix ?? ""}
        </p>
      </div>
      <input className="mt-5 w-full accent-[#111116]" type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </section>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/8 p-3">
      <p className="text-[11px] font-black text-white/58">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function stepIsComplete(step: Step, answers: Answers) {
  if (step.kind === "welcome" || step.kind === "mirror" || step.kind === "building") return true;
  return answers[step.key].length > 0;
}

function options(...labels: string[]): Option[] {
  return labels.map((label) => ({ label, value: label }));
}

function buildProfile(answers: Answers) {
  const text = (key: MultiKey) => answers[key].join(" ").toLowerCase();
  const pain = text("pain");
  const identity = text("identity");
  const motivation = text("motivation");
  const distraction = text("distraction");
  const routine = text("routine");

  const discipline = clampScore(45 + match(identity, /disciplined|productive|focused/) * 12 + match(routine, /locked in|trying/) * 8 - match(routine, /all over|burned|restarting/) * 8);
  const focus = clampScore(52 + match(identity, /focused|less distracted/) * 12 - answers.distractionHours * 4 - match(distraction, /tiktok|youtube|gaming|overthinking/) * 7);
  const confidence = clampScore(50 + match(identity, /confident|social/) * 10 - match(pain, /low confidence|loneliness/) * 10);
  const consistency = clampScore(48 + match(motivation, /streaks|accountability|progress/) * 9 - match(pain, /inconsistency|no structure|procrastination/) * 10);
  const stress = clampScore(35 + answers.painImpact * 5 + match(pain, /stress|anxiety|overthinking|bad sleep/) * 10);
  const dopamineDependence = clampScore(30 + answers.distractionHours * 7 + match(distraction, /tiktok|youtube|gaming/) * 12 + match(pain, /phone addiction/) * 18);
  const motivationIntensity = clampScore(42 + match(motivation, /winning|competition|recognition|streaks/) * 11 + match(routine, /motivated|locked/) * 8);
  const socialEnergy = clampScore(48 + match(identity, /social/) * 14 + match(motivation, /recognition|accountability/) * 7 - match(pain, /loneliness/) * 8);

  return {
    scores: {
      discipline,
      focus,
      confidence,
      consistency,
      stress,
      dopamineDependence,
      motivationIntensity,
      socialEnergy
    },
    priority: answers.improve[0] || answers.identity[0] || "Consistency",
    challenge: answers.pain[0] || "No structure",
    motivationStyle: answers.motivation[0] || "Progress"
  };
}

function match(text: string, pattern: RegExp) {
  return pattern.test(text) ? 1 : 0;
}

function clampScore(value: number) {
  return Math.max(8, Math.min(96, Math.round(value)));
}

function mirrorLine(answers: Answers) {
  const wants = list(answers.identity, "more discipline");
  const pain = list(answers.pain, "staying structured");
  const first = list(answers.improve, "consistency");
  return `Got it. You want ${wants}. Your biggest friction looks like ${pain}. If this works, ${first.toLowerCase()} improves first.`;
}

function list(values: string[], fallback: string) {
  if (!values.length) return fallback;
  if (values.length === 1) return values[0].toLowerCase();
  return `${values.slice(0, 2).map((value) => value.toLowerCase()).join(" and ")}`;
}

function firstActionFor(profile: ReturnType<typeof buildProfile>, answers: Answers): KaiAction {
  const text = [...answers.identity, ...answers.pain, ...answers.improve, ...answers.distraction, ...answers.habits].join(" ").toLowerCase();
  if (/sleep|tired|bad sleep|better sleep/.test(text)) return KAI_ACTIONS.sleep;
  if (/body|fitness|gym|shape/.test(text)) return KAI_ACTIONS.scan;
  if (/stretch/.test(text)) return KAI_ACTIONS.stretch;
  if (/phone|tiktok|youtube|gaming|screen|distracted/.test(text) || profile.scores.dopamineDependence > 70) return KAI_ACTIONS.screen;
  if (/confidence|low confidence/.test(text)) return KAI_ACTIONS.confidence;
  if (/social|loneliness|relationships/.test(text)) return KAI_ACTIONS.social;
  if (/productive|discipline|procrastination|studying|structure|focused/.test(text)) return KAI_ACTIONS.goal;
  return KAI_ACTIONS.talk;
}

function engineForAction(action: KaiAction): EngineId {
  if (["food", "sleep", "stretch", "scan"].includes(action.id)) return "physical";
  if (action.id === "goal") return "potential";
  return "mental";
}

function toneFor(answers: Answers): KaiTone {
  const text = answers.motivation.join(" ").toLowerCase();
  if (/winning|competition|accountability/.test(text)) return "direct";
  if (/peace|self improvement/.test(text)) return "warm";
  return "balanced";
}

function buildIntakeAnswers(answers: Answers, profile: ReturnType<typeof buildProfile>, firstMove: KaiAction) {
  return {
    q1: `Identity: ${answers.identity.join(", ")}`,
    q2: `Pain point: ${answers.pain.join(", ")}. Impact: ${answers.painImpact}/10. Routine: ${answers.routine.join(", ")}`,
    q3: `Goal visualization: ${answers.improve.join(", ")}. Habits: ${answers.habits.join(", ")}`,
    q4: `Distractions: ${answers.distraction.join(", ")}. Distracted hours/day: ${answers.distractionHours}`,
    q5: `Motivation style: ${answers.motivation.join(", ")}. Commitment: ${answers.commitment.join(", ")}. Minutes/day: ${answers.dailyMinutes}`,
    q6: `Internal scores: ${JSON.stringify(profile.scores)}. First recommended move: ${firstMove.label}. Route: ${firstMove.route}.`
  };
}

function buildFirstMessage(name: string, answers: Answers, profile: ReturnType<typeof buildProfile>, firstMove: KaiAction) {
  return `Good to meet you${name ? `, ${name}` : ""}. I built your starting system around ${profile.priority.toLowerCase()}, with ${profile.challenge.toLowerCase()} as the main obstacle. Your first move is ${firstMove.label.toLowerCase()}. Tell me what is going on today, and I’ll keep the next rep simple.`;
}

function saveLocalProfile(profile: ReturnType<typeof buildProfile>, answers: Answers, firstMove: KaiAction) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    "kai.onboardingProfile",
    JSON.stringify({
      version: 2,
      profile,
      answers,
      firstMove,
      savedAt: new Date().toISOString()
    })
  );
}
