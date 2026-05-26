import {
  Activity,
  ArrowRight,
  Brain,
  Camera,
  Check,
  ChevronLeft,
  Compass,
  Dumbbell,
  Feather,
  Flame,
  HeartPulse,
  Leaf,
  Loader2,
  Mail,
  MessageCircleHeart,
  Moon,
  PenLine,
  Repeat,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  Utensils,
  Wind,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
type MissionId = "mind" | "body" | "confidence" | "discipline" | "food" | "sleep" | "social" | "goals";

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
  { id: "body", label: "Body", copy: "Move, recover, feel better.", icon: HeartPulse, engine: "physical", route: "/health?module=movement" },
  { id: "confidence", label: "Confidence", copy: "Stop shrinking yourself.", icon: Sparkles, engine: "mental", route: "/mental?module=purpose" },
  { id: "discipline", label: "Discipline", copy: "Build systems, not hype.", icon: Target, engine: "mental", route: "/mental?module=purpose" },
  { id: "food", label: "Food", copy: "Log without shame.", icon: Utensils, engine: "physical", route: "/health?module=food" },
  { id: "sleep", label: "Sleep", copy: "Reset the foundation.", icon: Moon, engine: "physical", route: "/health?module=movement" },
  { id: "social", label: "Social", copy: "Handle pressure and loneliness.", icon: UsersRound, engine: "mental", route: "/mental?module=checkin" },
  { id: "goals", label: "Goals", copy: "Make the next move real.", icon: Flame, engine: "mental", route: "/mental?module=purpose" }
];

const steps = ["Gate", "Kai", "Tour", "Vibe", "Signals", "Focus", "Context", "Reveal"];

const CONSENT_POLL_MS = 5000;

export function Onboarding() {
  const navigate = useNavigate();
  const { setKai, setPrimaryEngine, setConsentPending, hydrate } = useUserStore();
  const storedConsentStatus = useUserStore((state) => state.consentStatus);
  const storedParentEmail = useUserStore((state) => state.parentEmail);
  const [demoBuild] = useState<DemoBuildSlice | null>(() => loadDemoBuild());
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("16");
  const [parentEmail, setParentEmail] = useState(storedParentEmail ?? "");
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
  const [consentSending, setConsentSending] = useState(false);
  const [consentMessage, setConsentMessage] = useState("");

  const normalizedAge = Number(age) || undefined;
  const isMinor = Boolean(normalizedAge && normalizedAge < 18);
  const selectedMission = missionChoices.find((item) => item.id === mission) ?? missionChoices[0];
  const selectedTone = toneChoices.find((tone) => tone.id === kaiTone) ?? toneChoices[0];
  const primaryEngine: EngineId = selectedMission.engine;
  const progress = ((step + 1) / steps.length) * 100;
  const calibration = useMemo(() => calibrationScore({ vibes, signals, context }), [vibes, signals, context]);

  // Spec §8 Step 2: under-18 cannot proceed past the age gate until the
  // parent has clicked the consent link. We treat consentStatus from the
  // hydrated user profile as the source of truth.
  const awaitingConsent = isMinor && step === 0 && storedConsentStatus === "pending";
  const consentBlocked = isMinor && storedConsentStatus !== "complete" && storedConsentStatus !== "not_required";

  // Poll the user profile while we wait for parent consent. Auto-advance
  // when it lands. No-op for adults or once consent is complete.
  useEffect(() => {
    if (!awaitingConsent) return;
    let cancelled = false;
    const id = window.setInterval(() => {
      void api
        .getUser()
        .then((profile) => {
          if (cancelled) return;
          hydrate(profile);
          if (profile.consentStatus === "complete") {
            setStep((value) => (value === 0 ? 1 : value));
          }
        })
        .catch(() => undefined);
    }, CONSENT_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [awaitingConsent, hydrate]);

  async function requestConsent() {
    const normalized = parentEmail.trim();
    if (!normalized) {
      setError("Add a parent email so we can send the consent link.");
      return;
    }
    setConsentSending(true);
    setError("");
    setConsentMessage("");
    try {
      await api.sendParentConsent({ parentEmail: normalized, teenName: kaiName || "Kai user" });
      setConsentPending(normalized);
      setConsentMessage(`Consent link sent to ${normalized}. We will continue automatically once your parent confirms.`);
    } catch {
      setError("Could not send the consent email right now. Try again in a minute.");
    } finally {
      setConsentSending(false);
    }
  }

  function next() {
    setError("");
    if (step === 0 && isMinor) {
      if (!parentEmail.trim()) {
        setError("Parent email is required for teen accounts.");
        return;
      }
      if (storedConsentStatus === "complete") {
        setStep((value) => Math.min(steps.length - 1, value + 1));
        return;
      }
      void requestConsent();
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
    if (consentBlocked) {
      // Spec §8 Step 2: never write onboarding_completed without consent.
      setSaving(false);
      setStep(0);
      setError("Waiting on parent consent before we can finish setup.");
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
    <main className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-5xl flex-col justify-center px-1 py-4 text-inkDeep">
      <section className="overflow-hidden rounded-[34px] border border-[#0A0A0A0F] bg-paper shadow-[0_24px_90px_rgba(10,10,10,0.12)]">
        <div className="grid min-h-[720px] lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="relative hidden bg-inkDeep p-7 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/70">
                <ShieldCheck size={14} aria-hidden="true" />
                Private by default
              </div>
              <h1 className="mt-8 max-w-sm font-display text-5xl font-semibold leading-[0.94] tracking-normal">A friend in your corner. Built around you.</h1>
              <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-white/62">
                No diagnosis. No fake hype. Just someone in your corner who actually pays attention — and a stack of stuff you can do whenever you want.
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

          <div className="flex min-w-0 flex-col p-4 sm:p-6 lg:p-8">
            <OnboardingHeader step={step} progress={progress} />
            <div className="flex flex-1 flex-col justify-center py-6">
              {error && <p className="mb-4 rounded-[18px] border border-[#E35D4F]/25 bg-[#FFF0EC] p-3 text-sm font-black text-[#C4473E]">{error}</p>}
              {step === 0 && awaitingConsent && (
                <WaitingForConsent
                  parentEmail={parentEmail}
                  consentSending={consentSending}
                  consentMessage={consentMessage}
                  onResend={() => void requestConsent()}
                />
              )}
              {step === 0 && !awaitingConsent && <AgeGate age={age} setAge={setAge} isMinor={isMinor} parentEmail={parentEmail} setParentEmail={setParentEmail} fromDemo={Boolean(demoBuild)} consentStatus={storedConsentStatus} />}
              {step === 1 && <KaiBuilder kaiName={kaiName} setKaiName={setKaiName} kaiTone={kaiTone} setKaiTone={setKaiTone} selectedTone={selectedTone} />}
              {step === 2 && <PossibilitiesTour kaiName={kaiName || "Kai"} />}
              {step === 3 && <VibeScan selected={vibes} onToggle={toggleVibe} />}
              {step === 4 && <SignalScan signals={signals} setSignals={setSignals} />}
              {step === 5 && <MissionPick mission={mission} setMission={setMission} />}
              {step === 6 && <ContextDrop context={context} setContext={setContext} />}
              {step === 7 && <Reveal kaiName={kaiName || "Kai"} tone={selectedTone} mission={selectedMission} calibration={calibration} vibes={vibes} isMinor={isMinor} parentEmail={parentEmail} />}
            </div>
            <footer className="grid gap-2 sm:grid-cols-[auto_1fr]">
              {step > 0 && (
                <Button type="button" variant="secondary" onClick={back} className="w-full sm:w-auto">
                  <ChevronLeft size={18} aria-hidden="true" />
                  Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={next}
                  disabled={consentSending || awaitingConsent}
                  className="min-h-12 w-full"
                >
                  {consentSending ? "Sending" : step === 0 && isMinor && storedConsentStatus !== "complete" ? "Send parent consent" : awaitingConsent ? "Waiting for parent" : step === 6 ? "Reveal Kai" : "Next"}
                  {!awaitingConsent && <ArrowRight size={18} aria-hidden="true" />}
                </Button>
              ) : (
                <Button type="button" onClick={() => void finish()} disabled={saving || consentBlocked} className="min-h-12 w-full">
                  {saving ? "Saving" : consentBlocked ? "Waiting for parent" : "Start my first rep"}
                  {!consentBlocked && <ArrowRight size={18} aria-hidden="true" />}
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
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-inkMute">
          {steps[step]} · {step + 1}/{steps.length}
        </p>
        <Link to="/crisis" className="text-xs font-black text-[#C4473E]">
          Crisis
        </Link>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F0EFEC]">
        <div className="h-full rounded-full bg-inkDeep transition-all duration-500" style={{ width: `${progress}%` }} />
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
  fromDemo,
  consentStatus
}: {
  age: string;
  setAge: (value: string) => void;
  isMinor: boolean;
  parentEmail: string;
  setParentEmail: (value: string) => void;
  fromDemo: boolean;
  consentStatus: "not_required" | "pending" | "complete";
}) {
  return (
    <div>
      <Eyebrow>Start clean</Eyebrow>
      <h2 className="mt-2 max-w-xl font-display text-4xl font-semibold leading-[0.98] tracking-normal sm:text-5xl">First, the safety stuff. Then the fun part.</h2>
      <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-inkSoft">
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
      {isMinor && consentStatus === "complete" && (
        <div className="mt-4 rounded-[18px] border border-[#D7F0EA] bg-[#F4FFFC] p-4 text-sm font-semibold leading-6 text-[#218A7D]">
          Parent already confirmed access. You can keep going.
        </div>
      )}
      {isMinor && consentStatus !== "complete" && (
        <div className="mt-4 rounded-[18px] border border-[#0A0A0A0F] bg-white p-4 text-sm font-semibold leading-6 text-inkSoft">
          You can’t move on until your parent clicks the consent link. We will send it as soon as you continue.
        </div>
      )}
    </div>
  );
}

function WaitingForConsent({
  parentEmail,
  consentSending,
  consentMessage,
  onResend
}: {
  parentEmail: string;
  consentSending: boolean;
  consentMessage: string;
  onResend: () => void;
}) {
  return (
    <div>
      <Eyebrow>Hold here</Eyebrow>
      <div className="mt-3 flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-warmPaper text-inkDeep">
          <Mail size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-4xl font-semibold leading-[0.98] tracking-normal sm:text-5xl">
            Waiting on your parent.
          </h2>
          <p className="mt-3 max-w-lg text-sm font-semibold leading-6 text-inkSoft">
            We sent a consent link to <span className="font-black text-inkDeep">{parentEmail}</span>. We check every few seconds and move you forward the moment they confirm.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-[#0A0A0A0F] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Loader2 className="motion-safe:animate-spin text-inkSoft" size={18} aria-hidden="true" />
          <p className="text-sm font-black text-inkDeep">Listening for confirmation…</p>
        </div>
        {consentMessage && <p className="mt-3 text-sm font-semibold leading-6 text-inkSoft">{consentMessage}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onResend}
            disabled={consentSending}
            className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border border-[#0A0A0A0F] bg-warmPaper px-4 text-sm font-black text-inkDeep disabled:opacity-50"
          >
            {consentSending ? "Sending" : "Resend email"}
          </button>
          <Link
            to="/crisis"
            className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border border-[#C4473E]/30 bg-white px-4 text-sm font-black text-[#C4473E]"
          >
            Crisis support
          </Link>
        </div>
      </div>

      <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-inkSoft">
        If your parent didn’t get the email, double-check the address by going Back, then send again.
      </p>
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
      <Eyebrow>Meet your person</Eyebrow>
      <div className="mt-3 flex items-center gap-4">
        <KaiAvatar size={72} label={kaiName || "Kai"} pulse />
        <div>
          <h2 className="font-display text-4xl font-semibold leading-none tracking-normal">Name them. Pick how they sound.</h2>
          <p className="mt-2 text-sm font-semibold text-inkSoft">Not a therapist. Not a chatbot. Think: a friend who actually shows up.</p>
        </div>
      </div>
      <label className="mt-6 block text-sm font-black">
        Companion name
        <input className="field mt-2 text-lg" value={kaiName} maxLength={20} onChange={(event) => setKaiName(event.target.value)} />
      </label>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {toneChoices.map((tone) => (
          <button key={tone.id} type="button" onClick={() => setKaiTone(tone.id)} className={`focus-ring min-h-32 rounded-[24px] border p-4 text-left transition ${kaiTone === tone.id ? "border-inkDeep bg-inkDeep text-white" : "border-[#0A0A0A0F] bg-white text-inkDeep"}`}>
            <span className="text-lg font-black">{tone.label}</span>
            <span className={`mt-2 block text-sm font-semibold leading-5 ${kaiTone === tone.id ? "text-white/62" : "text-inkMute"}`}>{tone.copy}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 rounded-[18px] border border-[#0A0A0A0F] bg-white p-4 text-sm font-semibold leading-6 text-inkSoft">"{selectedTone.preview}"</p>
    </div>
  );
}

const possibilityCards: Array<{ title: string; copy: string; icon: typeof Brain }> = [
  { title: "Snap a meal", copy: "Photo in, breakdown out. No calorie shame, no good/bad food.", icon: Camera },
  { title: "Talk through a feeling", copy: "Body + mind scan when something's loud and you can't name it.", icon: MessageCircleHeart },
  { title: "Reframe a stuck thought", copy: "Catch the loop. Shift the angle. Move on with your day.", icon: Repeat },
  { title: "Set a goal that's actually yours", copy: "School, sport, music, hustle, anything. Yours, not anyone else's.", icon: Target },
  { title: "Reset with breath", copy: "Two minutes. Box breath, 4-7-8, calm, energize. Real biology, not vibes.", icon: Wind },
  { title: "Move and stretch", copy: "5 to 25 minute flows. Soft on your body, no punishment cardio.", icon: Leaf },
  { title: "Write to your future self", copy: "Quiet, kind of weirdly powerful. Try it on a hard day.", icon: PenLine },
  { title: "Track the stuff that matters to you", copy: "Streaks, belts, an avatar that grows. Optional. Never public unless you say so.", icon: Sparkles }
];

function PossibilitiesTour({ kaiName }: { kaiName: string }) {
  return (
    <div>
      <Eyebrow>Quick tour</Eyebrow>
      <div className="mt-3 flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-warmPaper text-inkDeep">
          <Compass size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-4xl font-semibold leading-[0.98] tracking-normal sm:text-5xl">
            Here&rsquo;s what we can actually do together.
          </h2>
          <p className="mt-3 max-w-lg text-sm font-semibold leading-6 text-inkSoft">
            {kaiName} is your menu. None of this is a homework list — it&rsquo;s what&rsquo;s on the table whenever you want it.
          </p>
        </div>
      </div>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {possibilityCards.map((card) => {
          const Icon = card.icon;
          return (
            <li
              key={card.title}
              className="flex min-h-24 items-start gap-3 rounded-[24px] border border-[#0A0A0A0F] bg-white p-4"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-warmPaper text-inkDeep">
                <Icon size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-base font-black text-inkDeep">{card.title}</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-inkMute">{card.copy}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 rounded-[24px] border border-[#0A0A0A0F] bg-inkDeep p-5 text-white">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/12">
            <Flame size={18} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold leading-6 text-white/80">
            <span className="font-black text-white">You can do whatever you want with this.</span> Skip around. Stack the small stuff. Bring real goals. {kaiName} will keep up.
          </p>
        </div>
      </div>
    </div>
  );
}

function VibeScan({ selected, onToggle }: { selected: VibeId[]; onToggle: (id: VibeId) => void }) {
  return (
    <div>
      <Eyebrow>Vibe scan</Eyebrow>
      <h2 className="mt-2 max-w-xl font-display text-4xl font-semibold leading-[0.98] tracking-normal sm:text-5xl">Pick the 3 that feel most true right now.</h2>
      <p className="mt-4 text-sm font-semibold text-inkSoft">No perfect answer. Kai just needs the starting weather.</p>
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {vibeChoices.map((vibe) => {
          const Icon = vibe.icon;
          const active = selected.includes(vibe.id);
          return (
            <button key={vibe.id} type="button" onClick={() => onToggle(vibe.id)} className={`focus-ring min-h-24 rounded-[24px] border p-4 text-left transition ${active ? "border-inkDeep bg-inkDeep text-white" : "border-[#0A0A0A0F] bg-white text-inkDeep"}`}>
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
                  <button key={label} type="button" onClick={() => setSignals((items) => ({ ...items, [id]: index }))} className={`focus-ring min-h-11 rounded-full text-sm font-black ${signals[id] === index ? "bg-inkDeep text-white" : "bg-warmPaper text-inkSoft"}`}>
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
      <Eyebrow>First focus</Eyebrow>
      <h2 className="mt-2 max-w-xl font-display text-4xl font-semibold leading-[0.98] tracking-normal sm:text-5xl">What is Kai helping with first?</h2>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {missionChoices.map((item) => {
          const Icon = item.icon;
          const active = mission === item.id;
          return (
            <button key={item.id} type="button" onClick={() => setMission(item.id)} className={`focus-ring flex min-h-24 items-center gap-3 rounded-[24px] border p-4 text-left transition ${active ? "border-inkDeep bg-inkDeep text-white" : "border-[#0A0A0A0F] bg-white text-inkDeep"}`}>
              <span className={`grid size-11 shrink-0 place-items-center rounded-full ${active ? "bg-white/12" : "bg-warmPaper"}`}>
                <Icon size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-base font-black">{item.label}</span>
                <span className={`mt-1 block text-sm font-semibold ${active ? "text-white/62" : "text-inkMute"}`}>{item.copy}</span>
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
      <h2 className="mt-2 max-w-xl font-display text-4xl font-semibold leading-[0.98] tracking-normal sm:text-5xl">Anything Kai needs to know?</h2>
      <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-inkSoft">A messy sentence is enough. Or skip it and let Kai learn as you use the app.</p>
      <textarea className="field mt-6 min-h-40 text-base" value={context} onChange={(event) => setContext(event.target.value)} placeholder="Example: school pressure has been loud, sleep is bad, and I want to feel more confident..." />
    </div>
  );
}

function Reveal({
  kaiName,
  tone,
  mission,
  calibration,
  vibes,
  isMinor,
  parentEmail
}: {
  kaiName: string;
  tone: (typeof toneChoices)[number];
  mission: (typeof missionChoices)[number];
  calibration: number;
  vibes: VibeId[];
  isMinor: boolean;
  parentEmail: string;
}) {
  const MissionIcon = mission.icon;
  const pepTalk = buildPepTalk({ kaiName, vibes, mission });
  return (
    <div>
      <Eyebrow>Kai is calibrated</Eyebrow>
      <div className="mt-3 rounded-[30px] border border-[#0A0A0A0F] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <KaiAvatar size={76} label={kaiName} pulse />
          <div>
            <h2 className="font-display text-4xl font-semibold leading-none tracking-normal">{kaiName} is ready.</h2>
            <p className="mt-2 text-sm font-semibold text-inkSoft">One useful rep. The rest is whenever you want.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <RevealStat label="Voice" value={tone.label} />
          <RevealStat label="Read" value={`${calibration}%`} />
          <RevealStat label="Unit" value={mission.engine === "physical" ? "Body" : "Mind"} />
        </div>
      </div>

      <div className="mt-4 rounded-[28px] border border-[#0A0A0A0F] bg-warmPaper p-5">
        <div className="flex items-start gap-3">
          <KaiAvatar size={44} label={kaiName} />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-inkMute">{kaiName} &middot; first read</p>
            <p className="mt-2 text-base font-semibold leading-7 text-inkDeep">{pepTalk.opener}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-inkSoft">{pepTalk.middle}</p>
            <p className="mt-3 text-sm font-black leading-6 text-inkDeep">{pepTalk.closer}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-[#0A0A0A0F] bg-inkDeep p-5 text-white">
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

      <div className="mt-4 rounded-[24px] border border-[#0A0A0A0F] bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-warmPaper text-inkDeep">
            <Feather size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-inkMute">Also on the menu</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-inkSoft">
              Meal photo. Breath reset. Feelings check-in. Goals you actually care about. Future-self letters. Sleep + movement. All of it is one tap away whenever you want it.
            </p>
          </div>
        </div>
      </div>

      {isMinor && parentEmail.trim() && (
        <p className="mt-4 rounded-[18px] border border-[#D7F0EA] bg-[#F4FFFC] p-3 text-sm font-semibold leading-6 text-inkSoft">
          Parent consent email will be sent to {parentEmail.trim()}. Private answers stay private.
        </p>
      )}
    </div>
  );
}

// Build a friend-style read for the Reveal: a calm acknowledgement of the
// vibes the teen brought in, a real-talk middle, and a closer that names
// possibility without overselling. No corporate hype, no "should", no
// promised outcomes — per CLAUDE.md §1.
function buildPepTalk({
  kaiName,
  vibes,
  mission
}: {
  kaiName: string;
  vibes: VibeId[];
  mission: (typeof missionChoices)[number];
}): { opener: string; middle: string; closer: string } {
  const vibeLabels = vibes.map((id) => vibeChoices.find((choice) => choice.id === id)?.label.toLowerCase()).filter(Boolean) as string[];
  const vibePhrase = formatVibeList(vibeLabels);
  const opener = vibePhrase
    ? `Hey — ${kaiName} here. You came in carrying ${vibePhrase}, and you said you want help with ${mission.label.toLowerCase()}. That tracks. Naming it is the hard part, and you already did.`
    : `Hey — ${kaiName} here. You said you want help with ${mission.label.toLowerCase()}. That's a real place to start.`;
  const middle =
    "Nothing here is locked. We start with one small rep, see how it lands, and you decide what's next. School, sport, music, a business idea, a feeling you can't shake — any of it is fair game.";
  const closer = "You can do anything you want with this. Let's go.";
  return { opener, middle, closer };
}

function formatVibeList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-inkMute">{children}</p>;
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
    <div className="rounded-[20px] bg-warmPaper p-4">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-inkMute">{label}</p>
      <p className="mt-2 truncate text-lg font-black capitalize text-inkDeep">{value}</p>
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
