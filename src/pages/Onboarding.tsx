import { ArrowLeft, ArrowRight, Brain, HeartPulse, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KaiAvatar } from "../components/ui/AppPrimitives";
import { api } from "../lib/api";
import { KAI_ACTIONS, type KaiAction } from "../lib/kai-actions";
import type { EngineId, KaiTone } from "../lib/types";
import { useKaiStore } from "../stores/kaiStore";
import { useUserStore } from "../stores/userStore";

type FocusId =
  | "mental_clarity"
  | "managing_stress"
  | "anxiety"
  | "mood"
  | "confidence"
  | "motivation"
  | "focus"
  | "finding_purpose"
  | "school_pressure"
  | "social_life"
  | "friendships"
  | "family_stuff"
  | "better_sleep"
  | "energy"
  | "getting_stronger"
  | "eating_better"
  | "body_image";

type FollowUp = {
  id: string;
  focusArea: FocusId;
  prompt: string;
  options: string[];
  priority: number;
};

const TOTAL_STEPS = 7;
const LOCAL_PROFILE_KEY = "kai_demo_build_v2";

const focusGroups: Array<{ label: string; options: Array<{ id: FocusId; label: string }> }> = [
  {
    label: "How you’re feeling",
    options: [
      { id: "mental_clarity", label: "Mental clarity" },
      { id: "managing_stress", label: "Managing stress" },
      { id: "anxiety", label: "Anxiety" },
      { id: "mood", label: "Mood" },
      { id: "confidence", label: "Confidence" }
    ]
  },
  {
    label: "How you spend your days",
    options: [
      { id: "motivation", label: "Motivation" },
      { id: "focus", label: "Focus" },
      { id: "finding_purpose", label: "Finding purpose" },
      { id: "school_pressure", label: "School pressure" },
      { id: "social_life", label: "Social life" },
      { id: "friendships", label: "Friendships" },
      { id: "family_stuff", label: "Family stuff" }
    ]
  },
  {
    label: "How your body feels",
    options: [
      { id: "better_sleep", label: "Better sleep" },
      { id: "energy", label: "Energy" },
      { id: "getting_stronger", label: "Getting stronger" },
      { id: "eating_better", label: "Eating better" },
      { id: "body_image", label: "Body image" }
    ]
  }
];

const followUps: FollowUp[] = [
  { id: "sleep_hours", focusArea: "better_sleep", prompt: "Roughly how many hours of sleep are you getting?", options: ["Under 5", "5-6", "6-7", "7-8", "8+"], priority: 95 },
  { id: "energy_low", focusArea: "energy", prompt: "When is your energy lowest?", options: ["Mornings", "After school", "Evenings", "All day"], priority: 90 },
  { id: "anxiety_when", focusArea: "anxiety", prompt: "When does it hit hardest?", options: ["Mornings", "At school", "Before bed", "Around people", "Randomly"], priority: 88 },
  { id: "stress_source", focusArea: "managing_stress", prompt: "Where do you feel stress most?", options: ["School", "Social stuff", "Family", "Sports", "Inside my head"], priority: 85 },
  { id: "training_setup", focusArea: "getting_stronger", prompt: "What’s your training situation?", options: ["Gym access", "Home only", "Sport-specific", "Just starting"], priority: 85 },
  { id: "eating_goal", focusArea: "eating_better", prompt: "What does better eating mean right now?", options: ["More energy", "Eating regularly", "Less junk", "More variety"], priority: 80 },
  { id: "school_source", focusArea: "school_pressure", prompt: "What’s the biggest piece of school pressure?", options: ["Grades", "Parents", "College apps", "Workload", "Comparing"], priority: 78 },
  { id: "social_focus", focusArea: "social_life", prompt: "What’s the social situation?", options: ["Making friends", "Current friends", "A fight", "Feeling lonely"], priority: 75 },
  { id: "confidence_where", focusArea: "confidence", prompt: "Where do you want confidence most?", options: ["At school", "Around people", "In sports", "Inside my head"], priority: 75 },
  { id: "purpose_anchor", focusArea: "finding_purpose", prompt: "Something you’ve cared about for a while?", options: ["Family", "Friends", "Sport", "Art", "Creating", "Helping people"], priority: 72 },
  { id: "motivation_start", focusArea: "motivation", prompt: "What do you want to start or restart?", options: ["Workout routine", "Reading", "Sleep schedule", "Creative project", "Showing up"], priority: 70 },
  { id: "focus_lost", focusArea: "focus", prompt: "Where do you lose focus most?", options: ["Homework", "Class", "Conversations", "Alone", "Everywhere"], priority: 70 },
  { id: "mental_clarity_block", focusArea: "mental_clarity", prompt: "What clouds your head most?", options: ["Stress", "Sleep", "Screens", "Schedule", "My thoughts"], priority: 68 },
  { id: "mood_pull_out", focusArea: "mood", prompt: "When you’re off, what usually helps?", options: ["A walk", "A friend", "Sleep", "Eating", "Music"], priority: 65 },
  { id: "body_image_frame", focusArea: "body_image", prompt: "Where should KAI keep the focus?", options: ["How I feel", "What I can do", "Thought loops", "All of it"], priority: 65 },
  { id: "friendships_situation", focusArea: "friendships", prompt: "What’s the friendship situation?", options: ["Making new ones", "Keeping current ones", "A fight", "Feeling left out"], priority: 60 },
  { id: "family_dynamic", focusArea: "family_stuff", prompt: "Pick what fits best.", options: ["Parent stuff", "Sibling stuff", "Big change", "Complicated"], priority: 55 }
];

const toneOptions: Array<{ id: KaiTone; title: string; preview: string }> = [
  { id: "warm", title: "Warm", preview: "That sounds like a lot. We can slow it down and start with what feels easiest." },
  { id: "balanced", title: "Balanced", preview: "We can keep this small. Pick the easiest next move and build from there." },
  { id: "direct", title: "Direct", preview: "Two clean options. Pick one, give it ten minutes, reassess." }
];

export function Onboarding() {
  const navigate = useNavigate();
  const { setKai, setPrimaryEngine, markOnboardingComplete } = useUserStore();
  const hydrateKaiChat = useKaiStore((state) => state.hydrate);
  const saved = useMemo(readSavedProfile, []);
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(saved?.firstName ?? "");
  const [focusAreas, setFocusAreas] = useState<FocusId[]>([]);
  const [hardestLately, setHardestLately] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [tone, setTone] = useState<KaiTone>(isKaiTone(saved?.kaiTone) ? saved.kaiTone : "balanced");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedFollowUps = useMemo(() => selectFollowUps(focusAreas), [focusAreas]);
  const primaryEngine = useMemo(() => inferEngine(focusAreas), [focusAreas]);
  const firstAction = useMemo(() => actionFor(focusAreas, hardestLately), [focusAreas, hardestLately]);
  const canAdvance = useMemo(() => {
    if (step === 0) return firstName.trim().length > 0;
    if (step === 1) return focusAreas.length > 0;
    if (step === 6) return !saving;
    return true;
  }, [step, firstName, focusAreas.length, saving]);

  function next() {
    if (!canAdvance) return;
    setError("");
    if (step < TOTAL_STEPS - 1) {
      setStep((value) => value + 1);
      return;
    }
    void finish();
  }

  function back() {
    setError("");
    setStep((value) => Math.max(0, value - 1));
  }

  async function finish() {
    setSaving(true);
    setError("");
    const profile = buildInternalProfile({ focusAreas, hardestLately, responses, tone });
    const intake = buildIntake({ firstName, focusAreas, hardestLately, responses, profile, firstAction, tone });
    saveLocalProfile({ firstName: firstName.trim(), kaiTone: tone, focusAreas, hardestLately, responses, profile });
    try {
      await api.submitIntake(intake);
      await api.updateUser({
        kaiName: "KAI",
        kaiTone: tone,
        primaryEngine,
        onboardingCompleted: true
      });
    } catch {
      setError("Couldn’t sync your answers just now. You can keep going; KAI saved this on your device.");
    } finally {
      setKai("KAI", tone);
      setPrimaryEngine(primaryEngine);
      markOnboardingComplete();
      hydrateKaiChat("kai", {
        conversationId: null,
        messages: [
          {
            id: "onboarding-kai-first-message",
            role: "assistant",
            content: buildFirstMessage(firstName.trim(), focusAreas, hardestLately, firstAction)
          }
        ],
        nextAction: firstAction
      });
      setSaving(false);
      navigate("/walkthrough");
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-8 pt-6">
        <ProgressBar current={step + 1} total={TOTAL_STEPS} />
        <main key={step} className="mt-8 flex-1 animate-[fadeUp_220ms_ease-out]">
          {step === 0 && <NameStep value={firstName} onChange={setFirstName} />}
          {step === 1 && <FocusStep value={focusAreas} onChange={setFocusAreas} />}
          {step === 2 && <HardestStep value={hardestLately} onChange={setHardestLately} onSkip={next} />}
          {step === 3 && <FollowUpStep followUps={selectedFollowUps} responses={responses} onChange={setResponses} />}
          {step === 4 && <MeetKaiStep firstName={firstName.trim() || "there"} />}
          {step === 5 && <ToneStep value={tone} onChange={setTone} />}
          {step === 6 && (
            <ReadyStep
              firstName={firstName.trim() || "there"}
              focusAreas={focusAreas}
              tone={tone}
              error={error}
              saving={saving}
            />
          )}
        </main>
        <Nav step={step} canAdvance={canAdvance} saving={saving} onBack={back} onNext={next} />
      </div>
    </div>
  );
}

function NameStep({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-6">
      <StepTitle eyebrow="welcome" title="What should KAI call you?" blurb="Your first name. KAI is your wellness companion, not another school survey." />
      <input autoFocus type="text" value={value} maxLength={30} onChange={(event) => onChange(event.target.value)} placeholder="First name" aria-label="First name" className="field text-lg shadow-soft" />
    </div>
  );
}

function FocusStep({ value, onChange }: { value: FocusId[]; onChange: (value: FocusId[]) => void }) {
  function toggle(id: FocusId) {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  }
  return (
    <div className="space-y-8">
      <StepTitle eyebrow="step 3" title="What do you want to work on?" blurb="Pick a few. KAI will personalize the first read from this." />
      <div className="space-y-6">
        {focusGroups.map((group) => (
          <section key={group.label} className="space-y-2.5">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const selected = value.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggle(option.id)}
                    className={`focus-ring rounded-full border px-4 py-2 text-sm font-black transition active:scale-[0.98] ${
                      selected ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink hover:bg-warmPaper"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function HardestStep({ value, onChange, onSkip }: { value: string; onChange: (value: string) => void; onSkip: () => void }) {
  return (
    <div className="space-y-6">
      <StepTitle eyebrow="step 4 · optional" title="What’s been hardest lately?" blurb="One messy sentence is enough. Or skip and tell KAI later." />
      <textarea autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder="A messy sentence is enough." rows={4} className="field min-h-32 resize-none text-base shadow-soft" />
      <button type="button" onClick={onSkip} className="text-sm font-black text-muted underline-offset-4 hover:underline">
        Skip for now
      </button>
    </div>
  );
}

function FollowUpStep({ followUps, responses, onChange }: { followUps: FollowUp[]; responses: Record<string, string>; onChange: (value: Record<string, string>) => void }) {
  function setResponse(id: string, value: string) {
    onChange({ ...responses, [id]: value });
  }
  if (followUps.length === 0) {
    return <StepTitle eyebrow="step 5" title="A few quick reads." blurb="Nothing else needed. KAI has enough to start." />;
  }
  return (
    <div className="space-y-6">
      <StepTitle eyebrow="step 5" title="A few quick reads." blurb={`${followUps.length === 1 ? "One question" : `${followUps.length} questions`} based on what you picked. Tap an option or skip.`} />
      <div className="space-y-5">
        {followUps.map((followUp, index) => {
          const selected = responses[followUp.id] ?? "";
          return (
            <section key={followUp.id}>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                {index + 1} of {followUps.length}
              </p>
              <p className="mt-1 text-base font-black leading-snug text-ink">{followUp.prompt}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {followUp.options.map((option) => {
                  const active = selected === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setResponse(followUp.id, active ? "" : option)}
                      aria-pressed={active}
                      className={`focus-ring rounded-full border px-3 py-1.5 text-xs font-black transition ${active ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink hover:bg-warmPaper"}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={selected && !followUp.options.includes(selected) ? selected : ""}
                onChange={(event) => setResponse(followUp.id, event.target.value)}
                placeholder="Or type something else"
                maxLength={120}
                className="field mt-2 min-h-11 rounded-[14px] py-2 text-sm shadow-soft"
              />
            </section>
          );
        })}
      </div>
      <p className="text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">All skippable</p>
    </div>
  );
}

function MeetKaiStep({ firstName }: { firstName: string }) {
  return (
    <div className="space-y-6">
      <StepTitle eyebrow="step 6" title={`Hey ${firstName}, meet KAI.`} blurb="KAI has two sides. You always just talk to KAI; the right side answers." />
      <div className="flex justify-center py-2">
        <KaiAvatar size={120} label="KAI" pulse />
      </div>
      <div className="space-y-3">
        <KaiSide icon="mind" title="Mind" copy="For mood, stress, sleep, confidence, friendships, goals, and anything you’re sorting out in your head." />
        <KaiSide icon="body" title="Body" copy="For training, food, recovery, sleep, posture, and healthier routines." />
      </div>
      <p className="text-center text-xs font-semibold leading-relaxed text-muted">No agents to manage. Tell KAI what is loud and it opens the right move.</p>
    </div>
  );
}

function KaiSide({ icon, title, copy }: { icon: "mind" | "body"; title: string; copy: string }) {
  const Icon = icon === "mind" ? Brain : HeartPulse;
  return (
    <div className={`rounded-kai border border-line p-4 shadow-soft ${icon === "mind" ? "bg-goalsWash/70" : "bg-bodyWash/70"}`}>
      <div className="flex items-center gap-2.5">
        <span className={`grid h-9 w-9 place-items-center rounded-full ${icon === "mind" ? "bg-goals/15 text-goals" : "bg-body/15 text-body"}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
        <p className="font-display text-lg font-black">{title}</p>
      </div>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">{copy}</p>
    </div>
  );
}

function ToneStep({ value, onChange }: { value: KaiTone; onChange: (value: KaiTone) => void }) {
  return (
    <div className="space-y-6">
      <StepTitle eyebrow="step 7" title="How should KAI talk?" blurb="You can change this later." />
      <div className="space-y-2">
        {toneOptions.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`focus-ring w-full rounded-kai border p-4 text-left transition active:scale-[0.99] ${
                selected ? "border-ink bg-ink text-paper shadow-calm" : "border-line bg-white text-ink shadow-soft hover:bg-warmPaper"
              }`}
            >
              <p className="font-display text-lg font-black">{option.title}</p>
              <p className={`mt-1.5 text-sm font-semibold leading-snug ${selected ? "text-paper/75" : "text-muted"}`}>"{option.preview}"</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReadyStep({
  firstName,
  focusAreas,
  tone,
  error,
  saving
}: {
  firstName: string;
  focusAreas: FocusId[];
  tone: KaiTone;
  error: string;
  saving: boolean;
}) {
  const labels = labelFocusAreas(focusAreas);
  return (
    <div className="space-y-6">
      <StepTitle eyebrow="step 7" title={`You’re set, ${firstName}.`} blurb="Ready to meet your home screen?" />
      <div className="rounded-kai border border-line bg-white p-5 shadow-soft">
        <SummaryRow label="Focus">{labels.length ? labels.join(", ") : "Open to anything"}</SummaryRow>
        <SummaryRow label="Tone">{tone[0].toUpperCase() + tone.slice(1)}</SummaryRow>
      </div>
      {error && <p className="rounded-kai border border-danger/30 bg-dangerWash p-3 text-sm font-black text-danger">{error}</p>}
      <Link to="/crisis" className="inline-flex items-center gap-1.5 text-sm font-black text-danger underline-offset-4 hover:underline">
        <ShieldAlert size={14} aria-hidden="true" />
        Open crisis resources
      </Link>
      {saving && <p className="text-xs font-semibold text-muted">Saving and opening KAI…</p>}
    </div>
  );
}

function StepTitle({ eyebrow, title, blurb }: { eyebrow: string; title: string; blurb?: string }) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted">{eyebrow}</p>
      <h1 className="font-display text-3xl font-black leading-tight tracking-normal">{title}</h1>
      {blurb && <p className="text-sm font-semibold leading-relaxed text-muted">{blurb}</p>}
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
        {current} of {total}
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-ink transition-all duration-500 ease-out" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2 first:pt-0 last:border-b-0 last:pb-0">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{label}</span>
      <span className="text-right text-sm font-semibold text-ink">{children}</span>
    </div>
  );
}

function Nav({ step, canAdvance, saving, onBack, onNext }: { step: number; canAdvance: boolean; saving: boolean; onBack: () => void; onNext: () => void }) {
  const last = step === TOTAL_STEPS - 1;
  return (
    <div className="mt-8 flex items-center gap-3" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
      {step > 0 && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="focus-ring flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-muted shadow-soft transition hover:bg-warmPaper"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvance || saving}
        className="focus-ring flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink font-black text-paper shadow-soft transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-soft"
      >
        {last ? (saving ? "Opening KAI…" : "Start") : "Continue"}
        {!last && <ArrowRight size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}

function selectFollowUps(focusAreas: FocusId[]) {
  const selected = new Set(focusAreas);
  return followUps.filter((item) => selected.has(item.focusArea)).sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id)).slice(0, 3);
}

function inferEngine(focusAreas: FocusId[]): EngineId {
  const physical = new Set<FocusId>(["better_sleep", "energy", "getting_stronger", "eating_better"]);
  const physicalCount = focusAreas.filter((area) => physical.has(area)).length;
  return physicalCount > focusAreas.length - physicalCount ? "physical" : "mental";
}

function actionFor(focusAreas: FocusId[], hardest: string): KaiAction {
  const text = `${focusAreas.join(" ")} ${hardest}`.toLowerCase();
  if (/better_sleep|sleep|tired|wired/.test(text)) return KAI_ACTIONS.sleep;
  if (/eating_better|food|eat|fuel|hungry/.test(text)) return KAI_ACTIONS.food;
  if (/getting_stronger|body_image|body|training|gym|shape/.test(text)) return KAI_ACTIONS.scan;
  if (/focus|school_pressure|motivation|purpose|procrastinat|structure/.test(text)) return KAI_ACTIONS.goal;
  if (/confidence/.test(text)) return KAI_ACTIONS.confidence;
  if (/social_life|friendships|family_stuff|lonely|left out/.test(text)) return KAI_ACTIONS.social;
  if (/screen|phone|tiktok|youtube|gaming|scroll/.test(text)) return KAI_ACTIONS.screen;
  return KAI_ACTIONS.talk;
}

function buildInternalProfile(input: { focusAreas: FocusId[]; hardestLately: string; responses: Record<string, string>; tone: KaiTone }) {
  const text = `${input.focusAreas.join(" ")} ${input.hardestLately} ${Object.values(input.responses).join(" ")}`.toLowerCase();
  return {
    scores: {
      discipline: score(58, text, [/motivation/, /focus/, /school_pressure/, /showing up/], [/procrastinat/, /no structure/]),
      focus: score(56, text, [/focus/, /mental_clarity/, /homework/, /class/], [/screens/, /phone/, /tiktok/, /youtube/]),
      confidence: score(54, text, [/confidence/, /sports/, /around people/], [/low confidence/, /body_image/]),
      consistency: score(52, text, [/sleep schedule/, /workout routine/, /showing up/], [/randomly/, /everywhere/]),
      stress: score(38, text, [/stress/, /anxiety/, /school/, /family/, /inside my head/], []),
      dopamineDependence: score(30, text, [/screens/, /phone/, /tiktok/, /youtube/, /gaming/], []),
      motivationIntensity: input.tone === "direct" ? 82 : input.tone === "balanced" ? 68 : 55,
      socialEnergy: score(50, text, [/social_life/, /friendships/, /around people/], [/lonely/, /feeling left out/])
    },
    focusAreas: input.focusAreas,
    tone: input.tone
  };
}

function score(base: number, text: string, plus: RegExp[], minus: RegExp[]) {
  return Math.max(8, Math.min(96, Math.round(base + plus.filter((pattern) => pattern.test(text)).length * 10 - minus.filter((pattern) => pattern.test(text)).length * 8)));
}

function buildIntake(input: { firstName: string; focusAreas: FocusId[]; hardestLately: string; responses: Record<string, string>; profile: ReturnType<typeof buildInternalProfile>; firstAction: KaiAction; tone: KaiTone }) {
  return {
    first_name: input.firstName.trim(),
    focus_areas: input.focusAreas.join(","),
    hardest_lately: input.hardestLately.trim(),
    followups: JSON.stringify(input.responses),
    kai_tone: input.tone,
    internal_scores: JSON.stringify(input.profile.scores),
    first_recommended_move: `${input.firstAction.label} (${input.firstAction.route})`
  };
}

function buildFirstMessage(name: string, focusAreas: FocusId[], hardest: string, firstAction: KaiAction) {
  const labels = labelFocusAreas(focusAreas);
  const focus = labels.length ? labels.slice(0, 3).join(", ") : "what is loud today";
  const obstacle = hardest.trim() ? ` You said the hard part lately is: ${hardest.trim()}.` : "";
  return `KAI here${name ? `, ${name}` : ""}. I’ve got your starting point: ${focus}.${obstacle} First move is ${firstAction.label.toLowerCase()}. Tell me what is loud today and I’ll keep it small enough to do.`;
}

function labelFocusAreas(ids: FocusId[]) {
  const all = focusGroups.flatMap((group) => group.options);
  return ids.map((id) => all.find((item) => item.id === id)?.label ?? id);
}

function saveLocalProfile(value: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify({ ...value, savedAt: new Date().toISOString() }));
  window.localStorage.setItem("kai.onboardingProfile", JSON.stringify({ version: 3, ...value, savedAt: new Date().toISOString() }));
}

function readSavedProfile() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as { firstName?: string; kaiTone?: string }) : null;
  } catch {
    return null;
  }
}

function isKaiTone(value: unknown): value is KaiTone {
  return value === "warm" || value === "balanced" || value === "direct";
}
