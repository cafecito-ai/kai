import {
  Activity,
  ArrowRight,
  Brain,
  Check,
  ChevronLeft,
  Dumbbell,
  Flame,
  HeartPulse,
  Moon,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  Utensils,
  Zap
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KaiAvatar } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import type { EngineId, KaiTone } from "../lib/types";
import { useUserStore } from "../stores/userStore";

const DEMO_STORAGE_KEY = "kai_demo_build_v1";

type DemoBuildSlice = {
  firstName?: string;
  vibes?: string[];
  kaiName?: string;
  kaiTone?: KaiTone;
  tried?: string[];
  goalText?: string;
  feelingsSummary?: string;
  mealSummary?: string;
};

type VibeId = "stressed" | "locked_in" | "tired" | "motivated" | "lonely" | "confident" | "chaotic" | "bored";
type SignalId = "sleep" | "energy" | "confidence" | "movement" | "food" | "social";
type MissionId = "mind" | "body" | "stretch" | "confidence" | "discipline" | "food" | "sleep" | "social" | "goals";

function loadDemoBuild(): DemoBuildSlice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as DemoBuildSlice;
  } catch {
    return null;
  }
}

function isValidKaiTone(v: unknown): v is KaiTone {
  return v === "warm" || v === "balanced" || v === "direct";
}

const toneChoices: Array<{ id: KaiTone; label: string; copy: string; preview: string }> = [
  { id: "balanced", label: "Real", copy: "Calm, honest, not corny.", preview: "We can keep this small. Pick the next rep and build from there." },
  { id: "warm", label: "Soft", copy: "More patient and reflective.", preview: "That sounds like a lot to hold. Let's slow it down and choose one manageable move." },
  { id: "direct", label: "Direct", copy: "Faster, practical, clearer.", preview: "Here are two clean options. Pick one, do it for ten minutes, then reassess." }
];

const vibeChoices: Array<{ id: VibeId; label: string; icon: typeof Brain }> = [
  { id: "stressed", label: "Stressed", icon: Brain },
  { id: "locked_in", label: "Locked in", icon: Zap },
  { id: "tired", label: "Tired", icon: Moon },
  { id: "motivated", label: "Motivated", icon: Flame },
  { id: "lonely", label: "Lonely", icon: UsersRound },
  { id: "confident", label: "Confident", icon: Sparkles },
  { id: "chaotic", label: "Chaotic", icon: Activity },
  { id: "bored", label: "Bored", icon: Target }
];

const signalCopy: Record<SignalId, { label: string; low: string; mid: string; high: string; icon: typeof Brain }> = {
  sleep: { label: "Sleep", low: "Rough", mid: "Okay", high: "Solid", icon: Moon },
  energy: { label: "Energy", low: "Low", mid: "Fine", high: "High", icon: Zap },
  confidence: { label: "Confidence", low: "Quiet", mid: "Mixed", high: "Strong", icon: Sparkles },
  movement: { label: "Movement", low: "None", mid: "Some", high: "Active", icon: Dumbbell },
  food: { label: "Food/body", low: "Messy", mid: "Neutral", high: "Good", icon: Utensils },
  social: { label: "Social", low: "Heavy", mid: "Normal", high: "Connected", icon: UsersRound }
};

const missionChoices: Array<{ id: MissionId; label: string; copy: string; icon: typeof Brain; engine: "mental" | "physical"; route: string }> = [
  { id: "mind", label: "Mind", copy: "Feel less overloaded.", icon: Brain, engine: "mental", route: "/mental?module=checkin" },
  { id: "body", label: "Body scan", copy: "To keep your posture, alignment, and body composition in check.", icon: HeartPulse, engine: "physical", route: "/health?module=scan" },
  { id: "stretch", label: "Stretch / move", copy: "To maintain mobility and prevent injury.", icon: Dumbbell, engine: "physical", route: "/health?module=movement" },
  { id: "confidence", label: "Confidence", copy: "Stop shrinking yourself.", icon: Sparkles, engine: "mental", route: "/mental?module=purpose" },
  { id: "discipline", label: "Discipline", copy: "Build systems, not hype.", icon: Target, engine: "mental", route: "/mental?module=purpose" },
  { id: "food", label: "Log food", copy: "To fuel your workouts correctly.", icon: Utensils, engine: "physical", route: "/health?module=food" },
  { id: "sleep", label: "Log sleep", copy: "To ensure your body is actually recovering from the work.", icon: Moon, engine: "physical", route: "/health?module=movement" },
  { id: "social", label: "Social", copy: "Handle pressure and loneliness.", icon: UsersRound, engine: "mental", route: "/mental?module=checkin" },
  { id: "goals", label: "Goals", copy: "Make the next move real.", icon: Flame, engine: "mental", route: "/mental?module=purpose" }
];

const steps = ["Gate", "Kai", "Vibe", "Signals", "Mission", "Context", "Reveal"];

export function Onboarding() {
  const navigate = useNavigate();
  const { setKai, setPrimaryEngine, setConsentPending } = useUserStore();
  const [demoBuild] = useState<DemoBuildSlice | null>(() => loadDemoBuild());
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("16");
  const [parentEmail, setParentEmail] = useState("");
  const [kaiName, setKaiName] = useState(() => {
    const name = demoBuild?.kaiName?.trim();
    return name && name.length > 0 ? name : "Kai";
  });
  const [kaiTone, setKaiTone] = useState<KaiTone>(() => (isValidKaiTone(demoBuild?.kaiTone) ? demoBuild.kaiTone : "balanced"));
  const [vibes, setVibes] = useState<VibeId[]>(() => normalizeDemoVibes(demoBuild?.vibes));
  const [signals, setSignals] = useState<Record<SignalId, number>>({
    sleep: 1,
    energy: 1,
    confidence: 1,
    movement: 1,
    food: 1,
    social: 1
  });
  const [mission, setMission] = useState<MissionId>(() => inferDemoMission(demoBuild));
  const [context, setContext] = useState(() => {
    const parts = [demoBuild?.goalText, demoBuild?.feelingsSummary, demoBuild?.mealSummary].filter(Boolean);
    return parts.join(" ");
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const normalizedAge = Number(age) || undefined;
  const isMinor = Boolean(normalizedAge && normalizedAge < 18);
  const selectedMission = missionChoices.find((item) => item.id === mission) ?? missionChoices[0];
  const selectedTone = toneChoices.find((tone) => tone.id === kaiTone) ?? toneChoices[0];
  const primaryEngine: EngineId = selectedMission.engine;
  const progress = ((step + 1) / steps.length) * 100;
  const calibration = useMemo(() => calibrationScore({ vibes, signals, context }), [vibes, signals, context]);

  function next() {
    setError("");
    if (step === 0 && isMinor && !parentEmail.trim()) {
      setError("Parent email is required for teen accounts.");
      return;
    }
    setStep((value) => Math.min(steps.length - 1, value + 1));
  }

  function back() {
    setError("");
    setStep((value) => Math.max(0, value - 1));
  }

  function toggleVibe(id: VibeId) {
    setVibes((items) => {
      if (items.includes(id)) return items.filter((item) => item !== id);
      return [...items, id].slice(-3);
    });
  }

  async function finish() {
    setSaving(true);
    setError("");
    const normalizedParentEmail = parentEmail.trim();
    if (isMinor && !normalizedParentEmail) {
      setSaving(false);
      setStep(0);
      setError("Parent email is required for teen accounts.");
      return;
    }

    try {
      const intake = await api.submitIntake(buildIntakeAnswers({ vibes, signals, mission, context, kaiTone }));
      const routedEngine = intake.suggestedEngine === "potential" ? "mental" : intake.suggestedEngine;
      const engine = selectedMission.engine || routedEngine || primaryEngine;
      await api.updateUser({
        kaiName: kaiName || "Kai",
        kaiTone,
        primaryEngine: engine,
        age: normalizedAge,
        parentEmail: normalizedParentEmail || undefined,
        onboardingCompleted: true
      });
      if (isMinor && normalizedParentEmail) {
        await api.sendParentConsent({ parentEmail: normalizedParentEmail, teenName: kaiName || "Kai user" });
        setConsentPending(normalizedParentEmail);
      }
      setKai(kaiName || "Kai", kaiTone);
      setPrimaryEngine(engine);
      navigate(selectedMission.route);
    } catch {
      setError("Could not save onboarding yet. Kai saved the setup locally so you can keep moving.");
      setKai(kaiName || "Kai", kaiTone);
      setPrimaryEngine(primaryEngine);
      navigate(selectedMission.route);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-5xl flex-col justify-center overflow-x-hidden px-3 py-4 text-[#111116] sm:px-4">
      <section className="min-w-0 overflow-hidden rounded-[34px] border border-[#0A0A0A0F] bg-[#FAFAF7] shadow-[0_24px_90px_rgba(10,10,10,0.12)]">
        <div className="grid min-h-[720px] min-w-0 lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="relative hidden bg-[#111116] p-7 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/70">
                <ShieldCheck size={14} aria-hidden="true" />
                Private by default
              </div>
              <h1 className="mt-8 max-w-sm font-display text-5xl font-semibold leading-[0.94] tracking-normal">Build the Kai that actually fits you.</h1>
              <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-white/62">
                Fast setup. No diagnosis. No fake motivation. Kai learns your first pattern and gives you one useful rep.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <KaiAvatar size={54} label={kaiName || "Kai"} pulse />
                <div>
                  <p className="text-sm font-black">{kaiName || "Kai"}</p>
                  <p className="text-xs font-semibold capitalize text-white/55">{selectedTone.label} mode</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <CalibrationPill label="Vibes" value={String(vibes.length)} />
                <CalibrationPill label="Read" value={`${calibration}%`} />
                <CalibrationPill label="Unit" value={selectedMission.engine === "physical" ? "Body" : "Mind"} />
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
            <OnboardingHeader step={step} progress={progress} />
            <div className="flex flex-1 flex-col justify-center py-6">
              {error && <p className="mb-4 rounded-[18px] border border-[#E35D4F]/25 bg-[#FFF0EC] p-3 text-sm font-black text-[#C4473E]">{error}</p>}
              {step === 0 && <AgeGate age={age} setAge={setAge} isMinor={isMinor} parentEmail={parentEmail} setParentEmail={setParentEmail} fromDemo={Boolean(demoBuild)} />}
              {step === 1 && <KaiBuilder kaiName={kaiName} setKaiName={setKaiName} kaiTone={kaiTone} setKaiTone={setKaiTone} selectedTone={selectedTone} />}
              {step === 2 && <VibeScan selected={vibes} onToggle={toggleVibe} />}
              {step === 3 && <SignalScan signals={signals} setSignals={setSignals} />}
              {step === 4 && <MissionPick mission={mission} setMission={setMission} />}
              {step === 5 && <ContextDrop context={context} setContext={setContext} />}
              {step === 6 && <Reveal kaiName={kaiName || "Kai"} tone={selectedTone} mission={selectedMission} calibration={calibration} isMinor={isMinor} parentEmail={parentEmail} />}
            </div>
            <footer className="grid gap-2 sm:grid-cols-[auto_1fr]">
              {step > 0 && (
                <Button type="button" variant="secondary" onClick={back} className="w-full sm:w-auto">
                  <ChevronLeft size={18} aria-hidden="true" />
                  Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button type="button" onClick={next} className="min-h-12 w-full">
                  {step === 5 ? "Reveal Kai" : "Next"}
                  <ArrowRight size={18} aria-hidden="true" />
                </Button>
              ) : (
                <Button type="button" onClick={() => void finish()} disabled={saving} className="min-h-12 w-full">
                  {saving ? "Saving" : "Start my first rep"}
                  <ArrowRight size={18} aria-hidden="true" />
                </Button>
              )}
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}

function OnboardingHeader({ step, progress }: { step: number; progress: number }) {
  return (
    <header>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#8A8A8F]">
          {steps[step]} · {step + 1}/{steps.length}
        </p>
        <Link to="/crisis" className="text-xs font-black text-[#C4473E]">
          Crisis
        </Link>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F0EFEC]">
        <div className="h-full rounded-full bg-[#111116] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </header>
  );
}

function AgeGate({
  age,
  setAge,
  isMinor,
  parentEmail,
  setParentEmail,
  fromDemo
}: {
  age: string;
  setAge: (value: string) => void;
  isMinor: boolean;
  parentEmail: string;
  setParentEmail: (value: string) => void;
  fromDemo: boolean;
}) {
  return (
    <div>
      <Eyebrow>Start clean</Eyebrow>
      <h2 className="mt-2 max-w-xl break-words font-display text-4xl font-semibold leading-[0.98] tracking-normal sm:text-5xl">First, the safety stuff. Then the fun part.</h2>
      <p className="mt-4 max-w-full break-words text-sm font-semibold leading-6 text-[#5E5E64] sm:max-w-lg">
        Kai needs age for teen safety rules. Private answers, meals, goals, and chats stay private.
      </p>
      {fromDemo && <p className="mt-4 rounded-[18px] border border-[#D6D0FF] bg-[#F8F6FF] p-3 text-sm font-black text-[#6C5CE7]">Picked up your demo choices. You can change anything.</p>}
      <div className="mt-6 grid gap-3 sm:grid-cols-[9rem_1fr]">
        <label className="block text-sm font-black">
          Age
          <input className="field mt-2 text-lg" inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value)} />
        </label>
        <label className="block text-sm font-black">
          Parent email {isMinor ? "(required)" : "(optional)"}
          <input className="field mt-2 text-lg" type="email" value={parentEmail} onChange={(event) => setParentEmail(event.target.value)} placeholder="parent@example.com" />
        </label>
      </div>
      {isMinor && (
        <div className="mt-4 rounded-[18px] border border-[#0A0A0A0F] bg-white p-4 text-sm font-semibold leading-6 text-[#5E5E64]">
          Parent consent confirms beta access. It does not unlock private answers, food logs, goals, or chats.
        </div>
      )}
    </div>
  );
}

function KaiBuilder({
  kaiName,
  setKaiName,
  kaiTone,
  setKaiTone,
  selectedTone
}: {
  kaiName: string;
  setKaiName: (value: string) => void;
  kaiTone: KaiTone;
  setKaiTone: (value: KaiTone) => void;
  selectedTone: (typeof toneChoices)[number];
}) {
  return (
    <div>
      <Eyebrow>Build Kai</Eyebrow>
      <div className="mt-3 flex items-center gap-4">
        <KaiAvatar size={72} label={kaiName || "Kai"} pulse />
        <div>
          <h2 className="font-display text-4xl font-semibold leading-none tracking-normal">Choose the voice.</h2>
          <p className="mt-2 text-sm font-semibold text-[#5E5E64]">Not a therapist. Not a corporate assistant. A useful mentor.</p>
        </div>
      </div>
      <label className="mt-6 block text-sm font-black">
        Companion name
        <input className="field mt-2 text-lg" value={kaiName} maxLength={20} onChange={(event) => setKaiName(event.target.value)} />
      </label>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {toneChoices.map((tone) => (
          <button key={tone.id} type="button" onClick={() => setKaiTone(tone.id)} className={`focus-ring min-h-32 rounded-[24px] border p-4 text-left transition ${kaiTone === tone.id ? "border-[#111116] bg-[#111116] text-white" : "border-[#0A0A0A0F] bg-white text-[#111116]"}`}>
            <span className="text-lg font-black">{tone.label}</span>
            <span className={`mt-2 block text-sm font-semibold leading-5 ${kaiTone === tone.id ? "text-white/62" : "text-[#8A8A8F]"}`}>{tone.copy}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 rounded-[18px] border border-[#0A0A0A0F] bg-white p-4 text-sm font-semibold leading-6 text-[#5E5E64]">"{selectedTone.preview}"</p>
    </div>
  );
}

function VibeScan({ selected, onToggle }: { selected: VibeId[]; onToggle: (id: VibeId) => void }) {
  return (
    <div>
      <Eyebrow>Vibe scan</Eyebrow>
      <h2 className="mt-2 max-w-xl font-display text-4xl font-semibold leading-[0.98] tracking-normal sm:text-5xl">Pick the 3 that feel most true right now.</h2>
      <p className="mt-4 text-sm font-semibold text-[#5E5E64]">No perfect answer. Kai just needs the starting weather.</p>
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {vibeChoices.map((vibe) => {
          const Icon = vibe.icon;
          const active = selected.includes(vibe.id);
          return (
            <button key={vibe.id} type="button" onClick={() => onToggle(vibe.id)} className={`focus-ring min-h-24 rounded-[24px] border p-4 text-left transition ${active ? "border-[#111116] bg-[#111116] text-white" : "border-[#0A0A0A0F] bg-white text-[#111116]"}`}>
              <Icon size={20} aria-hidden="true" />
              <span className="mt-3 block text-sm font-black">{vibe.label}</span>
              {active && <Check className="mt-2 text-[#A3FF12]" size={16} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SignalScan({ signals, setSignals }: { signals: Record<SignalId, number>; setSignals: React.Dispatch<React.SetStateAction<Record<SignalId, number>>> }) {
  return (
    <div>
      <Eyebrow>Life signals</Eyebrow>
      <h2 className="mt-2 max-w-xl font-display text-4xl font-semibold leading-[0.98] tracking-normal sm:text-5xl">Give Kai the dashboard.</h2>
      <div className="mt-6 grid gap-3">
        {(Object.keys(signalCopy) as SignalId[]).map((id) => {
          const signal = signalCopy[id];
          const Icon = signal.icon;
          return (
            <div key={id} className="rounded-[24px] border border-[#0A0A0A0F] bg-white p-4">
              <div className="flex items-center gap-2">
                <Icon size={18} aria-hidden="true" />
                <p className="text-sm font-black">{signal.label}</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[signal.low, signal.mid, signal.high].map((label, index) => (
                  <button key={label} type="button" onClick={() => setSignals((items) => ({ ...items, [id]: index }))} className={`focus-ring min-h-11 rounded-full text-sm font-black ${signals[id] === index ? "bg-[#111116] text-white" : "bg-[#F4F1EB] text-[#5E5E64]"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MissionPick({ mission, setMission }: { mission: MissionId; setMission: (value: MissionId) => void }) {
  return (
    <div>
      <Eyebrow>First mission</Eyebrow>
      <h2 className="mt-2 max-w-xl font-display text-4xl font-semibold leading-[0.98] tracking-normal sm:text-5xl">What should Kai help with first?</h2>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {missionChoices.map((item) => {
          const Icon = item.icon;
          const active = mission === item.id;
          return (
            <button key={item.id} type="button" onClick={() => setMission(item.id)} className={`focus-ring flex min-h-24 items-center gap-3 rounded-[24px] border p-4 text-left transition ${active ? "border-[#111116] bg-[#111116] text-white" : "border-[#0A0A0A0F] bg-white text-[#111116]"}`}>
              <span className={`grid size-11 shrink-0 place-items-center rounded-full ${active ? "bg-white/12" : "bg-[#F4F1EB]"}`}>
                <Icon size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-base font-black">{item.label}</span>
                <span className={`mt-1 block text-sm font-semibold ${active ? "text-white/62" : "text-[#8A8A8F]"}`}>{item.copy}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ContextDrop({ context, setContext }: { context: string; setContext: (value: string) => void }) {
  return (
    <div>
      <Eyebrow>Optional context</Eyebrow>
      <h2 className="mt-2 max-w-xl font-display text-4xl font-semibold leading-[0.98] tracking-normal sm:text-5xl">Anything Kai should know?</h2>
      <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-[#5E5E64]">A messy sentence is enough. Or skip it and let Kai learn as you use the app.</p>
      <textarea className="field mt-6 min-h-40 text-base" value={context} onChange={(event) => setContext(event.target.value)} placeholder="Example: school pressure has been loud, sleep is bad, and I want to feel more confident..." />
    </div>
  );
}

function Reveal({
  kaiName,
  tone,
  mission,
  calibration,
  isMinor,
  parentEmail
}: {
  kaiName: string;
  tone: (typeof toneChoices)[number];
  mission: (typeof missionChoices)[number];
  calibration: number;
  isMinor: boolean;
  parentEmail: string;
}) {
  const MissionIcon = mission.icon;
  return (
    <div>
      <Eyebrow>Kai is calibrated</Eyebrow>
      <div className="mt-3 rounded-[30px] border border-[#0A0A0A0F] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <KaiAvatar size={76} label={kaiName} pulse />
          <div>
            <h2 className="font-display text-4xl font-semibold leading-none tracking-normal">{kaiName} is ready.</h2>
            <p className="mt-2 text-sm font-semibold text-[#5E5E64]">Start with one useful rep. The rest can wait.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <RevealStat label="Voice" value={tone.label} />
          <RevealStat label="Read" value={`${calibration}%`} />
          <RevealStat label="Unit" value={mission.engine === "physical" ? "Body" : "Mind"} />
        </div>
      </div>
      <div className="mt-4 rounded-[24px] border border-[#0A0A0A0F] bg-[#111116] p-5 text-white">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/12">
            <MissionIcon size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">First rep</p>
            <h3 className="mt-1 text-2xl font-black">{mission.label}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/62">{mission.copy}</p>
          </div>
        </div>
      </div>
      {isMinor && parentEmail.trim() && (
        <p className="mt-4 rounded-[18px] border border-[#D7F0EA] bg-[#F4FFFC] p-3 text-sm font-semibold leading-6 text-[#5E5E64]">
          Parent consent email will be sent to {parentEmail.trim()}. Private answers stay private.
        </p>
      )}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#8A8A8F]">{children}</p>;
}

function CalibrationPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">{label}</p>
      <p className="mt-1 truncate text-sm font-black capitalize text-white">{value}</p>
    </div>
  );
}

function RevealStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-[#F4F1EB] p-4">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-[#8A8A8F]">{label}</p>
      <p className="mt-2 truncate text-lg font-black capitalize text-[#111116]">{value}</p>
    </div>
  );
}

function normalizeDemoVibes(vibes: string[] | undefined): VibeId[] {
  if (!vibes) return [];
  const ids = new Set(vibeChoices.map((item) => item.id));
  return vibes.map((vibe) => vibe.toLowerCase().replace(/\s+/g, "_")).filter((vibe): vibe is VibeId => ids.has(vibe as VibeId)).slice(0, 3);
}

function inferDemoMission(build: DemoBuildSlice | null): MissionId {
  const text = [build?.goalText, build?.feelingsSummary, build?.mealSummary, ...(build?.tried ?? [])].join(" ").toLowerCase();
  if (/meal|food|fuel|camera/.test(text)) return "food";
  if (/stretch|move|mobility|injury|form/.test(text)) return "stretch";
  if (/body|scan|workout|sport|sleep|recovery/.test(text)) return "body";
  if (/confidence/.test(text)) return "confidence";
  if (/goal|discipline|future/.test(text)) return "goals";
  return "mind";
}

function calibrationScore({ vibes, signals, context }: { vibes: VibeId[]; signals: Record<SignalId, number>; context: string }) {
  const answeredSignals = Object.values(signals).filter((value) => value !== 1).length;
  return Math.min(96, 58 + vibes.length * 8 + answeredSignals * 3 + (context.trim().length > 12 ? 8 : 0));
}

function buildIntakeAnswers({
  vibes,
  signals,
  mission,
  context,
  kaiTone
}: {
  vibes: VibeId[];
  signals: Record<SignalId, number>;
  mission: MissionId;
  context: string;
  kaiTone: KaiTone;
}) {
  const signalLines = (Object.keys(signals) as SignalId[]).map((id) => `${signalCopy[id].label}: ${["low", "medium", "high"][signals[id]]}`);
  const missionChoice = missionChoices.find((item) => item.id === mission) ?? missionChoices[0];
  return {
    q1: `Current vibe: ${vibes.map((vibe) => vibe.replace(/_/g, " ")).join(", ") || "not sure yet"}. Signals: ${signalLines.join("; ")}.`,
    q2: `Wants help first with ${missionChoice.label}: ${missionChoice.copy}`,
    q3: `They chose ${kaiTone} tone because that is the support style they want from Kai.`,
    q4: context.trim() || "No extra context yet. Learn from early app reps.",
    q5: `First suggested route is ${missionChoice.route}.`,
    q6: `Use a supportive, honest mentor style. Avoid shame, clinical diagnosis, toxic productivity, and body comparison.`
  };
}
