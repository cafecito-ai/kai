// Onboarding — KAI v3 §4 step order.
//
//   1. Name input          (user's first name)
//   2. Age                 (optional, non-gating)
//   3. Focus areas         (multi-select chips, what they want to work on)
//   4. Hardest lately      (free text, optional, skippable)
//   5. Meet KAI            (intro both agents: Mind + Body)
//   6. Tone picker         (warm / balanced / direct)
//   7. Goal                (optional North Star seed)
//   8. Confirm             (save and enter the app)
//
// Existing API contracts preserved: api.submitIntake and api.updateUser.
// The v0 three-engine picker + 6-question intake battery are retired in favor
// of focus-area multi-select + a single free-text question (covers v3 §4 step 4).
//
// requires_safety_review per AGENT_PLAN — touches the consent flow. Ratner
// has authorized build-phase changes per DECISIONS.md D-007; production sign-
// off still rests with Ratner per CLAUDE.md §9.

import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Dumbbell,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { KaiOrb } from "../components/KaiOrb";
import { api } from "../lib/api";
import {
  formatFollowUpsForIntake,
  pickFollowUps,
  type FollowUpResponse,
} from "../lib/onboarding-followups";
import { seedNorthStarFromFocus, setNorthStar } from "../lib/local-northstar";
import { setSchedule } from "../lib/local-schedule";
import type { EngineId, KaiTone } from "../lib/types";
import { useUserStore } from "../stores/userStore";

// ─────────────────────────────────────────────────────────────────────
// Step content
// ─────────────────────────────────────────────────────────────────────

// Focus areas grouped into three calm sections so the chip wall reads as
// "scan a section" rather than "wall of 17". Group labels are intentionally
// short and warm (not "categories").
type FocusAreaId =
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

type FocusOption = { id: FocusAreaId; label: string };
type FocusGroup = { label: string; options: FocusOption[] };

const FOCUS_GROUPS: FocusGroup[] = [
  {
    label: "How you're feeling",
    options: [
      { id: "mental_clarity", label: "Mental clarity" },
      { id: "managing_stress", label: "Managing stress" },
      { id: "anxiety", label: "Anxiety" },
      { id: "mood", label: "Mood" },
      { id: "confidence", label: "Confidence" },
    ],
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
      { id: "family_stuff", label: "Family stuff" },
    ],
  },
  {
    label: "How your body feels",
    options: [
      { id: "better_sleep", label: "Better sleep" },
      { id: "energy", label: "Energy" },
      { id: "getting_stronger", label: "Getting stronger" },
      { id: "eating_better", label: "Eating better" },
      { id: "body_image", label: "Body image" },
    ],
  },
];

// Map focus areas → suggested primary engine. Ties and ambiguity default to
// "mental" per AGENT_PLAN T-006 §4 ("unclear → mental, more general-purpose
// voice"). Body image is intentionally mental-leaning — it's an identity
// conversation, not a physique conversation.
const MENTAL_LEANING: FocusAreaId[] = [
  "mental_clarity",
  "managing_stress",
  "anxiety",
  "mood",
  "confidence",
  "finding_purpose",
  "motivation",
  "focus",
  "social_life",
  "friendships",
  "family_stuff",
  "school_pressure",
  "body_image",
];

function suggestEngine(focusAreas: FocusAreaId[]): EngineId {
  if (focusAreas.length === 0) return "mental";
  const mentalCount = focusAreas.filter((a) =>
    MENTAL_LEANING.includes(a),
  ).length;
  const physicalCount = focusAreas.length - mentalCount;
  return physicalCount > mentalCount ? "physical" : "mental";
}

const TONES: Array<{ id: KaiTone; title: string; preview: string }> = [
  {
    id: "warm",
    title: "Warm",
    preview:
      "That sounds like a lot. We can slow it down and start with what feels easiest.",
  },
  {
    id: "balanced",
    title: "Balanced",
    preview:
      "We can keep this small. Pick the easiest next move and build from there.",
  },
  {
    id: "direct",
    title: "Direct",
    preview: "Two clean options. Pick one, give it ten minutes, reassess.",
  },
];

const DEMO_STORAGE_KEY = "kai_demo_build_v1";
type DemoBuildSlice = {
  firstName?: string;
  kaiName?: string;
  kaiTone?: KaiTone;
};

function loadDemoBuild(): DemoBuildSlice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as DemoBuildSlice)
      : null;
  } catch {
    return null;
  }
}

function isKaiTone(v: unknown): v is KaiTone {
  return v === "warm" || v === "balanced" || v === "direct";
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

// Rawz/5 — 8 steps now (inserted adaptive follow-up between Hardest
// and Meet KAI). Net flow stays under 90 seconds for most users since
// the new step is at most 3 quick-tap questions, all skippable.
const TOTAL_STEPS = 10;

export function Onboarding() {
  const navigate = useNavigate();
  const { setKai, setPrimaryEngine } = useUserStore();

  const [step, setStep] = useState(0);
  const [demoBuild] = useState<DemoBuildSlice | null>(() => loadDemoBuild());

  const [firstName, setFirstName] = useState(demoBuild?.firstName ?? "");
  const [age, setAge] = useState("");
  const [focusAreas, setFocusAreas] = useState<FocusAreaId[]>([]);
  const [hardestLately, setHardestLately] = useState("");
  // The user's one big goal — becomes the North Star title on Home.
  const [bigGoal, setBigGoal] = useState("");
  // Optional custom schedule KAI builds from a free-text request.
  const [wantSchedule, setWantSchedule] = useState<"yes" | "no" | null>(null);
  const [scheduleText, setScheduleText] = useState("");
  // Rawz/5 — adaptive follow-up responses keyed by question id.
  const [followUps, setFollowUps] = useState<FollowUpResponse>({});
  const [kaiName] = useState(demoBuild?.kaiName?.trim() || "KAI");
  const [kaiTone, setKaiTone] = useState<KaiTone>(
    isKaiTone(demoBuild?.kaiTone) ? demoBuild.kaiTone : "balanced",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const ageNum = Number(age) || undefined;
  const primaryEngine = useMemo(() => suggestEngine(focusAreas), [focusAreas]);

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0:
        return firstName.trim().length > 0;
      case 1:
        // Age is optional and never gated — any age can continue, no parent
        // verification (per Ratner + Lev approval, 2026-06-08).
        return age.trim() === "" || (ageNum !== undefined && ageNum >= 1 && ageNum <= 120);
      case 2:
        return focusAreas.length > 0;
      case 3: // hardest lately
      case 4: // adaptive follow-ups (Rawz/5)
      case 5: // meet KAI
      case 6: // tone
      case 7: // big goal (optional, skippable)
      case 8: // schedule (optional — yes/no)
        return true;
      case 9: // confirm + save
        return !saving;
      default:
        return true;
    }
  }, [step, firstName, age, ageNum, focusAreas, saving]);

  function next() {
    if (!canAdvance) return;
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else void finish();
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  async function finish() {
    setSaving(true);
    setError("");
    try {
      const keyedResponses: Record<string, string> = {
        focus_areas: focusAreas.join(","),
        first_name: firstName.trim(),
      };
      if (hardestLately.trim()) {
        keyedResponses.hardest_lately = hardestLately.trim();
      }
      // Rawz/5 — pack adaptive follow-up answers into the intake payload
      // so the Mind + Body agents have richer day-one context.
      const questions = pickFollowUps(focusAreas);
      Object.assign(keyedResponses, formatFollowUpsForIntake(questions, followUps));
      // Seed the long-term North Star goal from what they chose to work on.
      // Shown next to the Daily Score on Home; editable there.
      // The big goal they typed becomes the North Star title; if they
      // skipped it, fall back to seeding from their focus areas.
      if (bigGoal.trim()) {
        setNorthStar(bigGoal.trim(), "custom");
      } else {
        seedNorthStarFromFocus(focusAreas);
      }
      // Optional custom system — generate it from their description + goal.
      // NON-blocking: a full system is a bigger model call, so we don't make
      // onboarding hang on it. It fills into their System section once it lands.
      if (wantSchedule === "yes" && scheduleText.trim()) {
        const g = bigGoal.trim() || undefined;
        void api
          .scheduleGenerate(scheduleText.trim(), g)
          .then((res) => {
            if (res.items.length > 0) setSchedule(res.items);
          })
          .catch(() => {});
      }
      // displayName = the teen's name (what KAI calls them). kaiName = what
      // they call KAI. Previously firstName only landed in user_intake.summary
      // and never users.display_name, so the chat agent kept falling back to
      // "friend" even after onboarding. Fix: write it through here.
      await api.updateUser({
        displayName: firstName.trim() || undefined,
        kaiName,
        kaiTone,
        primaryEngine,
        age: ageNum,
        onboardingCompleted: true,
      });
      // Intake summarization can take a few seconds because it may call the
      // model. Do not hold the teen on the final screen after the required
      // onboarding-complete write has succeeded.
      void api.submitIntake(keyedResponses).catch(() => {});
      setKai(kaiName, kaiTone);
      setPrimaryEngine(primaryEngine);
      // Flow: Welcome → Onboarding → Home. Welcome already happened
      // before we got here; on finish we land on the live app.
      navigate("/home");
    } catch {
      // Don't strand the user if the API hiccups — preserve in-memory state
      // and let them into the app. Settings flow lets them retry.
      setError(
        "Couldn't save your answers just now. You can keep going — we'll retry.",
      );
      setKai(kaiName, kaiTone);
      setPrimaryEngine(primaryEngine);
      navigate("/home");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-8 pt-6">
        <Progress current={step + 1} total={TOTAL_STEPS} />

        <main className="mt-8 flex-1 animate-fade-slide-up" key={step}>
          {step === 0 && (
            <NameStep value={firstName} onChange={setFirstName} />
          )}
          {step === 1 && (
            <AgeStep
              age={age}
              setAge={setAge}
            />
          )}
          {step === 2 && (
            <FocusStep value={focusAreas} onChange={setFocusAreas} />
          )}
          {step === 3 && (
            <HardestStep
              value={hardestLately}
              onChange={setHardestLately}
              onSkip={next}
            />
          )}
          {/* Rawz/5 — adaptive follow-ups based on the focus areas they
              picked in step 2. Up to 3 quick-tap questions, all skippable. */}
          {step === 4 && (
            <FollowUpsStep
              focusAreas={focusAreas}
              responses={followUps}
              onChange={setFollowUps}
            />
          )}
          {step === 5 && <MeetKaiStep firstName={firstName} />}
          {step === 6 && (
            <ToneStep value={kaiTone} onChange={setKaiTone} />
          )}
          {step === 7 && (
            <GoalStep
              firstName={firstName}
              value={bigGoal}
              onChange={setBigGoal}
              onSkip={next}
            />
          )}
          {step === 8 && (
            <ScheduleStep
              choice={wantSchedule}
              setChoice={setWantSchedule}
              text={scheduleText}
              onChangeText={setScheduleText}
              onSkip={() => {
                setWantSchedule("no");
                next();
              }}
            />
          )}
          {step === 9 && (
            <ConfirmStep
              firstName={firstName}
              focusAreas={focusAreas}
              tone={kaiTone}
              error={error}
              saving={saving}
            />
          )}
        </main>

        <Footer
          step={step}
          onBack={back}
          onNext={next}
          canAdvance={canAdvance}
          isLast={step === TOTAL_STEPS - 1}
          saving={saving}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────────────────────────────

function NameStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Heading
        eyebrow="welcome"
        title="What should KAI call you?"
        blurb="Your first name. KAI is your wellness companion — this is just so you're not 'user'."
      />
      <input
        autoFocus
        type="text"
        value={value}
        maxLength={30}
        onChange={(e) => onChange(e.target.value)}
        placeholder="First name"
        className="
          w-full rounded-lg border border-glass-border bg-surface
          px-4 py-3.5 text-lg
          text-text-primary placeholder:text-text-muted
          shadow-card focus-ring
        "
      />
    </div>
  );
}

function AgeStep({
  age,
  setAge,
}: {
  age: string;
  setAge: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Heading
        eyebrow="step 2"
        title="How old are you?"
        blurb="KAI is built for you."
      />
      <input
        autoFocus
        type="number"
        inputMode="numeric"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        placeholder="Age"
        className="
          w-full rounded-lg border border-glass-border bg-surface
          px-4 py-3.5 text-lg
          text-text-primary placeholder:text-text-muted
          shadow-card focus-ring
        "
      />
    </div>
  );
}

function FocusStep({
  value,
  onChange,
}: {
  value: FocusAreaId[];
  onChange: (v: FocusAreaId[]) => void;
}) {
  function toggle(id: FocusAreaId) {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  }
  return (
    <div className="space-y-8">
      <Heading
        eyebrow="step 3"
        title="What do you want to work on?"
        blurb="Pick a few. You can change this later."
      />
      <div className="space-y-6">
        {FOCUS_GROUPS.map((group) => (
          <div key={group.label} className="space-y-2.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.options.map(({ id, label }) => {
                const selected = value.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    className={`
                      rounded-full border px-4 py-2 text-sm font-medium transition active:scale-[0.98]
                      ${
                        selected
                          ? "border-text-primary bg-text-primary text-background"
                          : "border-glass-border bg-surface text-text-primary hover:bg-surface-muted"
                      }
                    `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HardestStep({
  value,
  onChange,
  onSkip,
}: {
  value: string;
  onChange: (v: string) => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-6">
      <Heading
        eyebrow="step 4 — optional"
        title="What's been hardest lately?"
        blurb="One sentence is enough. Or skip and tell KAI later."
      />
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="A messy sentence is enough."
        rows={4}
        className="
          w-full rounded-lg border border-glass-border bg-surface
          px-4 py-3.5 text-base
          text-text-primary placeholder:text-text-muted
          shadow-card focus-ring
          resize-none
        "
      />
      <button
        type="button"
        onClick={onSkip}
        className="text-sm font-medium text-text-muted underline-offset-4 hover:underline"
      >
        Skip for now
      </button>
    </div>
  );
}

// The one big goal — its answer becomes the North Star title on Home,
// shown next to the Daily Score and editable there. Optional/skippable.
function ScheduleStep({
  choice,
  setChoice,
  text,
  onChangeText,
  onSkip,
}: {
  choice: "yes" | "no" | null;
  setChoice: (c: "yes" | "no") => void;
  text: string;
  onChangeText: (v: string) => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-6">
      <Heading
        eyebrow="step 9 — optional"
        title="Want KAI to build your system?"
        blurb="A full lifestyle system around your goal — habits, workouts, sleep, routines, mindset, and what to avoid. Totally optional, and you can change any part of it later."
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setChoice("yes")}
          aria-pressed={choice === "yes"}
          className={`flex h-12 flex-1 items-center justify-center rounded-full border text-sm font-semibold transition ${
            choice === "yes"
              ? "border-text-primary bg-text-primary text-background shadow-card-lg"
              : "border-glass-border bg-surface text-text-primary shadow-card hover:bg-surface-muted"
          }`}
        >
          Yes, build one
        </button>
        <button
          type="button"
          onClick={onSkip}
          aria-pressed={choice === "no"}
          className="flex h-12 flex-1 items-center justify-center rounded-full border border-glass-border bg-surface text-sm font-semibold text-text-secondary shadow-card transition hover:bg-surface-muted"
        >
          No schedule
        </button>
      </div>

      {choice === "yes" && (
        <div className="space-y-2 animate-fade-slide-up">
          <p className="text-sm text-text-secondary">
            Describe what you're going for in a sentence — KAI builds the whole system.
          </p>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => onChangeText(e.target.value.slice(0, 200))}
            rows={3}
            placeholder='e.g. "Build my whole system around getting stronger and disciplined"'
            className="
              w-full resize-none rounded-lg border border-glass-border bg-surface
              px-4 py-3.5 text-base text-text-primary placeholder:text-text-muted
              shadow-card focus-ring
            "
          />
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            Anything works — a workout split, a study routine, a morning routine.
          </p>
        </div>
      )}
    </div>
  );
}

function GoalStep({
  firstName,
  value,
  onChange,
  onSkip,
}: {
  firstName: string;
  value: string;
  onChange: (v: string) => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-6">
      <Heading
        eyebrow="step 8 — optional"
        title={
          firstName
            ? `What are you working toward, ${firstName}?`
            : "What are you working toward?"
        }
        blurb="Your one big goal. KAI keeps it on your home screen and fills the ring as you show up. Change it anytime."
      />
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Make the team. Get genuinely stronger. Feel less anxious."
        rows={3}
        maxLength={80}
        className="
          w-full rounded-lg border border-glass-border bg-surface
          px-4 py-3.5 text-base
          text-text-primary placeholder:text-text-muted
          shadow-card focus-ring
          resize-none
        "
      />
      <button
        type="button"
        onClick={onSkip}
        className="text-sm font-medium text-text-muted underline-offset-4 hover:underline"
      >
        Skip for now
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Rawz/5 — adaptive follow-up step
// ─────────────────────────────────────────────────────────────────────

function FollowUpsStep({
  focusAreas,
  responses,
  onChange,
}: {
  focusAreas: FocusAreaId[];
  responses: FollowUpResponse;
  onChange: (next: FollowUpResponse) => void;
}) {
  const questions = useMemo(() => pickFollowUps(focusAreas), [focusAreas]);

  function setAnswer(qid: string, value: string) {
    onChange({ ...responses, [qid]: value });
  }

  // If for some reason no questions matched (e.g. user picked focus
  // areas with no follow-ups defined), gracefully degrade to a simple
  // pass-through.
  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <Heading
          eyebrow="step 5"
          title="A few quick reads."
          blurb="Nothing to tune from what you picked — let's keep going."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Heading
        eyebrow="step 5"
        title="A few quick reads."
        blurb={`${questions.length === 1 ? "One question" : `${questions.length} questions`} based on what you picked. Tap an option or skip — both fine.`}
      />

      <div className="space-y-5">
        {questions.map((q, idx) => {
          const value = responses[q.id] ?? "";
          return (
            <section key={q.id}>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                {idx + 1} of {questions.length}
              </p>
              <p className="mt-1 text-base font-medium text-text-primary leading-snug">
                {q.prompt}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {q.options.map((opt) => {
                  const selected = value === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(q.id, selected ? "" : opt)}
                      aria-pressed={selected}
                      className={`
                        rounded-full border px-3 py-1.5 text-xs font-medium transition
                        ${
                          selected
                            ? "border-text-primary bg-text-primary text-background"
                            : "border-glass-border bg-surface text-text-primary hover:bg-surface-muted"
                        }
                      `}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={
                  value && !q.options.includes(value) ? value : ""
                }
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Or type something else"
                maxLength={120}
                className="
                  mt-2 w-full rounded-lg border border-glass-border bg-surface
                  px-3 py-2 text-sm text-text-primary
                  placeholder:text-text-muted shadow-card focus-ring
                "
              />
            </section>
          );
        })}
      </div>

      <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        All skippable
      </p>
    </div>
  );
}

function MeetKaiStep({ firstName }: { firstName: string }) {
  return (
    <div className="space-y-6">
      <Heading
        eyebrow="step 6"
        title={`Hey ${firstName}, meet KAI.`}
        blurb="KAI has two sides — both look out for you."
      />
      <div className="flex justify-center py-2">
        <KaiOrb size={120} />
      </div>
      <div className="space-y-3">
        <div className="rounded-lg border border-glass-border bg-accent-cool-soft/40 p-4 shadow-card">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-cool/15 text-accent-cool">
              <Brain size={18} />
            </span>
            <p className="font-display text-lg font-semibold">Mind</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            For mood, stress, sleep, confidence, friendships, goals,
            anything you're sorting out in your head.
          </p>
        </div>
        <div className="rounded-lg border border-glass-border bg-accent-warm-soft/50 p-4 shadow-card">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-warm/15 text-accent-warm">
              <Dumbbell size={18} />
            </span>
            <p className="font-display text-lg font-semibold">Body</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            For training, food, recovery, sleep, posture — coaching that
            actually knows the science.
          </p>
        </div>
      </div>
      <p className="text-center text-xs leading-relaxed text-text-muted">
        You always just talk to KAI. The right side answers based on what
        you bring up.
      </p>
    </div>
  );
}

function ToneStep({
  value,
  onChange,
}: {
  value: KaiTone;
  onChange: (v: KaiTone) => void;
}) {
  return (
    <div className="space-y-6">
      <Heading
        eyebrow="step 7"
        title="How should KAI talk?"
        blurb="You can change this any time in settings."
      />
      <div className="space-y-2">
        {TONES.map((t) => {
          const selected = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`
                w-full rounded-lg border p-4 text-left transition active:scale-[0.99]
                ${
                  selected
                    ? "border-text-primary bg-text-primary text-background shadow-card-lg"
                    : "border-glass-border bg-surface text-text-primary shadow-card hover:bg-surface-muted"
                }
              `}
            >
              <p className="font-display text-lg font-semibold">{t.title}</p>
              <p
                className={`mt-1.5 text-sm leading-snug ${
                  selected ? "text-background/75" : "text-text-secondary"
                }`}
              >
                "{t.preview}"
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConfirmStep({
  firstName,
  focusAreas,
  tone,
  error,
  saving,
}: {
  firstName: string;
  focusAreas: FocusAreaId[];
  tone: KaiTone;
  error: string;
  saving: boolean;
}) {
  const allOptions = FOCUS_GROUPS.flatMap((g) => g.options);
  const focusLabels = allOptions
    .filter((f) => focusAreas.includes(f.id))
    .map((f) => f.label);
  return (
    <div className="space-y-6">
      <Heading
        eyebrow="step 9"
        title={`You're set, ${firstName}.`}
        blurb="Ready to meet your home screen?"
      />
      <div className="rounded-lg border border-glass-border bg-surface p-5 shadow-card">
        <Row label="Focus">
          {focusLabels.length ? focusLabels.join(", ") : "Open to anything"}
        </Row>
        <Row label="Tone">
          {tone[0].toUpperCase() + tone.slice(1)}
        </Row>
      </div>
      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {saving && <p className="text-xs text-text-muted">Finishing setup…</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Layout helpers
// ─────────────────────────────────────────────────────────────────────

function Heading({
  eyebrow,
  title,
  blurb,
}: {
  eyebrow: string;
  title: string;
  blurb?: string;
}) {
  // KAI orb + typewriter on the title — makes every onboarding step
  // feel like KAI is the one asking the question, continuing the
  // "magical guide" thread established in the Welcome walkthrough.
  // Re-keys on `title` so each step replays the typing animation.
  // In test mode (vitest), we skip the animation so DOM assertions
  // can find the full title immediately on render.
  const isTest =
    typeof import.meta !== "undefined" &&
    // Vitest sets MODE = "test"; reduced-motion users also bypass animation.
    (((import.meta as unknown as { env?: { MODE?: string } }).env?.MODE === "test") ||
      (typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
  const charsPerMs = 28;
  const [charIdx, setCharIdx] = useState(isTest ? title.length : 0);
  useEffect(() => {
    setCharIdx(isTest ? title.length : 0);
  }, [title, isTest]);
  useEffect(() => {
    if (isTest) return;
    if (charIdx >= title.length) return;
    const t = window.setTimeout(() => setCharIdx((c) => c + 1), charsPerMs);
    return () => window.clearTimeout(t);
  }, [charIdx, title, isTest]);
  const done = charIdx >= title.length;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="kai-step-orb-enter inline-flex">
          <KaiOrb size={36} face={false} />
        </span>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          {eyebrow}
        </p>
      </div>
      <h1
        className="font-display text-3xl font-semibold leading-tight tracking-tight"
        aria-live="polite"
      >
        {title.slice(0, charIdx)}
        {!done && (
          <span
            className="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[2px] bg-text-primary/60 animate-pulse"
            aria-hidden="true"
          />
        )}
      </h1>
      {blurb && (
        <p className="text-sm leading-relaxed text-text-secondary">{blurb}</p>
      )}
      <style>{`
        @keyframes kai-step-orb-enter {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .kai-step-orb-enter {
          animation: kai-step-orb-enter 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </div>
  );
}

function Progress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = (current / total) * 100;
  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
        {current} of {total}
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-text-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border-line py-2 last:border-b-0 last:pb-0 first:pt-0">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
        {label}
      </span>
      <span className="text-right text-sm text-text-primary">{children}</span>
    </div>
  );
}

function Footer({
  step,
  onBack,
  onNext,
  canAdvance,
  isLast,
  saving,
}: {
  step: number;
  onBack: () => void;
  onNext: () => void;
  canAdvance: boolean;
  isLast: boolean;
  saving: boolean;
}) {
  // Keep the same total time-on-page feel across steps — fade the footer in
  // alongside the step content so the buttons don't pop.
  useEffect(() => {
    // intentionally empty — animation lives on `main` via `key={step}`
  }, [step]);

  return (
    <div
      className="mt-8 flex items-center gap-3"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {step > 0 && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="
            flex h-12 w-12 items-center justify-center rounded-full
            border border-glass-border bg-surface
            text-text-secondary shadow-card transition
            hover:bg-surface-muted focus-ring
          "
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvance || saving}
        className="
          flex h-12 flex-1 items-center justify-center gap-2 rounded-full
          bg-text-primary text-background
          font-medium
          shadow-card transition
          active:scale-[0.99]
          disabled:cursor-not-allowed disabled:bg-text-soft
          focus-ring
        "
      >
        {isLast ? (saving ? "Finishing…" : "Start") : "Continue"}
        {!isLast && <ArrowRight size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
