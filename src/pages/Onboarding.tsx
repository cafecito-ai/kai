import { Activity, Brain, ChevronLeft, Sparkles, ShieldAlert, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DisclosureBanner } from "../components/safety/DisclosureBanner";
import { ChoiceCard, StepShell } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import type { EngineId, KaiTone } from "../lib/types";
import { useUserStore } from "../stores/userStore";

// Demo carry-over — when a teen completes /demo and clicks the SignupNudge,
// they land here with kai_demo_build_v1 still in localStorage. We pre-fill the
// Kai name + tone so they don't have to re-type what they already chose, and
// show a small banner so they know the demo bled through.
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

const intakeQuestions = [
  "Walk me into a normal day for you. What does it look like from wake-up to bed?",
  "What's one thing you wish was different right now?",
  "What's one thing you actually like about your life right now?",
  "Where do you feel pressure these days, and where is it coming from?",
  "If you had an extra hour every day for anything, no judgment, what would you do?",
  "On a scale of 1 to 10, how are you actually doing this week?"
];

const engineChoices: Array<{ id: EngineId | "unsure"; title: string; copy: string; icon: typeof Activity; tone: string }> = [
  { id: "physical", title: "Body", copy: "Food, sleep, movement, energy.", icon: Activity, tone: "bg-bodyWash text-body" },
  { id: "potential", title: "Goals", copy: "School, sport, ideas, future.", icon: Target, tone: "bg-goalsWash text-goals" },
  { id: "mental", title: "Reset", copy: "Stress, feelings, self-talk.", icon: Brain, tone: "bg-resetWash text-reset" },
  { id: "unsure", title: "Not sure", copy: "Let Kai read the pattern.", icon: ShieldAlert, tone: "bg-careWash text-care" }
];

const toneChoices: Array<{ id: KaiTone; title: string; copy: string; preview: string }> = [
  { id: "balanced", title: "Balanced", copy: "Asks questions, offers options, does not push.", preview: "We can keep this small. Pick the easiest next move and we will build from there." },
  { id: "warm", title: "Warm", copy: "Gentler, more reflective, more feeling-aware.", preview: "That sounds like a lot to hold. We can slow it down and start with what feels most manageable." },
  { id: "direct", title: "Direct", copy: "Faster, practical, clearer options sooner.", preview: "Here are two clean options. Pick one, do it for ten minutes, then reassess." }
];

export function Onboarding() {
  const navigate = useNavigate();
  const { setKai, setPrimaryEngine, setConsentPending } = useUserStore();
  const [demoBuild] = useState<DemoBuildSlice | null>(() => loadDemoBuild());
  const fromDemo = Boolean(demoBuild);
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("16");
  const [parentEmail, setParentEmail] = useState("");
  const [kaiName, setKaiName] = useState(() => {
    const name = demoBuild?.kaiName?.trim();
    return name && name.length > 0 ? name : "Kai";
  });
  const [kaiTone, setKaiTone] = useState<KaiTone>(() =>
    isValidKaiTone(demoBuild?.kaiTone) ? demoBuild.kaiTone : "balanced"
  );
  const [manualEngine, setManualEngine] = useState<EngineId | "unsure">("unsure");
  const [responses, setResponses] = useState<string[]>(() => {
    const initial = Array(intakeQuestions.length).fill("");
    // Pre-seed Q5 ("extra hour every day") with what they said they want to
    // try in the demo — gives Kai useful context without filling answers for
    // questions the user hasn't actually engaged with.
    const triedNotes: string[] = [];
    if (demoBuild?.goalText) triedNotes.push(`In the demo, said: "${demoBuild.goalText}"`);
    if (demoBuild?.feelingsSummary) triedNotes.push(`Feelings check: ${demoBuild.feelingsSummary}`);
    if (demoBuild?.mealSummary) triedNotes.push(demoBuild.mealSummary);
    if (triedNotes.length) initial[4] = triedNotes.join(" — ");
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const normalizedAge = Number(age) || undefined;
  const isMinor = Boolean(normalizedAge && normalizedAge < 18);
  const suggestedEngine = useMemo<EngineId>(() => {
    if (manualEngine !== "unsure") return manualEngine;
    const text = responses.join(" ").toLowerCase();
    if (/goal|school|sport|business|future|music|instrument|college|project/.test(text)) return "potential";
    if (/stress|sad|anxious|friend|social|identity|emotion|pressure|overthink/.test(text)) return "mental";
    return "physical";
  }, [manualEngine, responses]);
  const questionIndex = step - 4;
  const totalSteps = 11;
  const progress = ((step + 1) / totalSteps) * 100;

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
      const keyedResponses = Object.fromEntries(intakeQuestions.map((question, index) => [`q${index + 1}`, responses[index] || question]));
      const intake = await api.submitIntake(keyedResponses);
      const engine = manualEngine === "unsure" ? intake.suggestedEngine || suggestedEngine : manualEngine;
      await api.updateUser({
        kaiName: kaiName || "Kai",
        kaiTone,
        primaryEngine: engine,
        age: normalizedAge,
        parentEmail: normalizedParentEmail || undefined,
        onboardingCompleted: true
      });
      if (isMinor && normalizedParentEmail) {
        await api.sendParentConsent({
          parentEmail: normalizedParentEmail,
          teenName: kaiName || "Kai user"
        });
        setConsentPending(normalizedParentEmail);
      }
      setKai(kaiName || "Kai", kaiTone);
      setPrimaryEngine(engine);
      navigate(`/engine/${engine}`);
    } catch {
      setError("Could not save onboarding yet. You can keep going in demo mode.");
      setKai(kaiName || "Kai", kaiTone);
      setPrimaryEngine(suggestedEngine);
      navigate(`/engine/${suggestedEngine}`);
    } finally {
      setSaving(false);
    }
  }

  if (step === 0) {
    return (
      <StepShell eyebrow="step 1 of 11" title="First, how old are you?" progress={progress} footer={<NextBack onNext={() => setStep(1)} nextDisabled={isMinor && !parentEmail.trim()} />}>
        <div className="space-y-4">
          {fromDemo && <DemoCarryoverBanner build={demoBuild!} />}
          <DisclosureBanner />
          {error && <p className="rounded-kai border border-danger/25 bg-dangerWash p-3 text-sm font-bold text-danger">{error}</p>}
          <label className="block text-sm font-black">
            Age
            <input className="field mt-2" inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value)} />
          </label>
          <label className="block text-sm font-black">
            Parent email {isMinor ? "(required)" : "(optional)"}
            <input className="field mt-2" type="email" value={parentEmail} onChange={(event) => setParentEmail(event.target.value)} placeholder="parent@example.com" />
          </label>
          {isMinor && (
            <div className="rounded-kai border border-line bg-paper p-3 text-sm font-semibold leading-6 text-muted">
              Kai sends a consent email for teen accounts. The parent view confirms consent only; it does not show private answers, goals, meals, or chats.
            </div>
          )}
        </div>
      </StepShell>
    );
  }

  if (step === 1) {
    return (
      <StepShell eyebrow="step 2 of 11" title="What should Kai call you?" progress={progress} footer={<NextBack onBack={() => setStep(0)} onNext={() => setStep(2)} />}>
        <label className="block text-sm font-black">
          Mentor name
          <input className="field mt-2" value={kaiName} maxLength={20} onChange={(event) => setKaiName(event.target.value)} />
        </label>
        <p className="mt-3 text-sm font-semibold leading-6 text-muted">Default is Kai. You can change this later in settings.</p>
      </StepShell>
    );
  }

  if (step === 2) {
    return (
      <StepShell eyebrow="step 3 of 11" title="How should Kai sound?" progress={progress} footer={<NextBack onBack={() => setStep(1)} onNext={() => setStep(3)} />}>
        <div className="space-y-2">
          {toneChoices.map((tone) => (
            <ChoiceCard key={tone.id} selected={kaiTone === tone.id} onClick={() => setKaiTone(tone.id)}>
              <span className="block text-base font-black">{tone.title}</span>
              <span className={`mt-1 block text-sm leading-6 ${kaiTone === tone.id ? "text-paper/75" : "text-muted"}`}>{tone.copy}</span>
            </ChoiceCard>
          ))}
        </div>
        <div className="mt-4 rounded-kai border border-line bg-paper p-3 text-sm font-semibold leading-6">
          "{toneChoices.find((tone) => tone.id === kaiTone)?.preview}"
        </div>
      </StepShell>
    );
  }

  if (step === 3) {
    return (
      <StepShell eyebrow="step 4 of 11" title="What feels most useful today?" progress={progress} footer={<NextBack onBack={() => setStep(2)} onNext={() => setStep(4)} />}>
        <div className="grid gap-2">
          {engineChoices.map(({ id, title, copy, icon: Icon, tone }) => (
            <ChoiceCard key={id} selected={manualEngine === id} onClick={() => setManualEngine(id)}>
              <span className="flex items-start gap-3">
                <span className={`grid size-10 shrink-0 place-items-center rounded-full ${manualEngine === id ? "bg-white/15 text-paper" : tone}`}>
                  <Icon size={19} />
                </span>
                <span>
                  <span className="block text-base font-black">{title}</span>
                  <span className={`mt-1 block text-sm leading-6 ${manualEngine === id ? "text-paper/75" : "text-muted"}`}>{copy}</span>
                </span>
              </span>
            </ChoiceCard>
          ))}
        </div>
      </StepShell>
    );
  }

  if (questionIndex >= 0 && questionIndex < intakeQuestions.length) {
    return (
      <StepShell eyebrow={`step ${step + 1} of 11`} title={intakeQuestions[questionIndex]} progress={progress} footer={<NextBack onBack={() => setStep(step - 1)} onNext={() => setStep(step + 1)} nextLabel={questionIndex === intakeQuestions.length - 1 ? "See Kai's read" : "Next"} />}>
        <textarea
          className="field min-h-40"
          value={responses[questionIndex]}
          onChange={(event) => setResponses((items) => items.map((item, index) => (index === questionIndex ? event.target.value : item)))}
          placeholder="A messy sentence is enough."
        />
        <button type="button" className="mt-3 text-sm font-black text-muted" onClick={() => setStep(step + 1)}>
          Skip for now
        </button>
      </StepShell>
    );
  }

  return (
    <StepShell eyebrow="step 11 of 11" title={`Let's start with ${labelForEngine(suggestedEngine)}.`} progress={100} footer={<NextBack onBack={() => setStep(9)} onNext={() => void finish()} nextLabel={saving ? "Saving" : "Sounds good. Start"} nextDisabled={saving} />}>
      <div className="space-y-4">
        <div className="rounded-kai border border-line bg-paper p-4 text-sm font-semibold leading-6">
          {manualEngine === "unsure"
            ? "Based on your answers, this is the lane most likely to help first. You can switch any time."
            : "You picked this lane. Kai will use it as your starting point, and the other lanes stay one tap away."}
        </div>
        <div className="grid gap-2">
          {engineChoices.filter((engine) => engine.id !== "unsure").map(({ id, title, copy, icon: Icon, tone }) => (
            <ChoiceCard key={id} selected={suggestedEngine === id} onClick={() => setManualEngine(id as EngineId)}>
              <span className="flex items-start gap-3">
                <span className={`grid size-10 shrink-0 place-items-center rounded-full ${suggestedEngine === id ? "bg-white/15 text-paper" : tone}`}>
                  <Icon size={19} />
                </span>
                <span>
                  <span className="block text-base font-black">{title}</span>
                  <span className={`mt-1 block text-sm leading-6 ${suggestedEngine === id ? "text-paper/75" : "text-muted"}`}>{copy}</span>
                </span>
              </span>
            </ChoiceCard>
          ))}
        </div>
        {isMinor && parentEmail.trim() && (
          <div className="rounded-kai border border-line bg-careWash p-3 text-sm font-semibold leading-6 text-muted">
            Parent consent email will be sent to {parentEmail.trim()}. Crisis resources remain available any time.
          </div>
        )}
        <Link to="/crisis" className="inline-flex text-sm font-black text-danger">
          Open crisis resources
        </Link>
      </div>
    </StepShell>
  );
}

function NextBack({
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
      {onBack && (
        <Button type="button" variant="secondary" onClick={onBack} className="w-full sm:w-auto">
          <ChevronLeft size={18} />
          Back
        </Button>
      )}
      <Button type="button" onClick={onNext} disabled={nextDisabled} className="w-full">
        {nextLabel}
      </Button>
    </div>
  );
}

function labelForEngine(engine: EngineId) {
  if (engine === "physical") return "Body";
  if (engine === "potential") return "Goals";
  return "Reset";
}

function DemoCarryoverBanner({ build }: { build: DemoBuildSlice }) {
  const triedLabels: Record<string, string> = {
    win: "one win",
    feelings: "feelings check",
    fuel: "fuel snap"
  };
  const triedLine = (build.tried ?? []).map((k) => triedLabels[k] ?? k).join(" · ");
  const parts = [
    build.kaiName && build.kaiName !== "Kai" ? `name: ${build.kaiName}` : null,
    build.kaiTone ? `tone: ${build.kaiTone}` : null,
    build.vibes?.length ? `vibes: ${build.vibes.slice(0, 3).join(", ")}` : null,
    triedLine ? `tried: ${triedLine}` : null
  ].filter(Boolean).join(" · ");
  return (
    <div className="rounded-kai border border-goals/30 bg-goalsWash p-3 text-sm">
      <p className="flex items-center gap-2 font-black text-goals">
        <Sparkles size={14} /> Picked up where you left off in the demo
      </p>
      {parts && <p className="mt-1 font-semibold leading-5 text-muted">{parts}</p>}
      <p className="mt-1.5 text-xs font-semibold leading-5 text-muted/85">
        Pre-filled the next couple steps — you can change any of it.
      </p>
    </div>
  );
}
