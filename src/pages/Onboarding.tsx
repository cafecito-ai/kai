// Onboarding — one continuous, cinematic conversation with KAI.
//
// This MERGES the old Welcome intro and onboarding into a single flow: KAI is
// the on-screen animated character (aurora world, gestures) the whole time.
// A short intro ("Hi, I'm KAI" / "Let me learn about you"), then KAI asks the
// onboarding questions with the answer controls appearing right there on the
// stage. No cut to a different screen.
//
// Two kinds of stage:
//   - intro    : KAI says a line, you TAP to continue (no input)
//   - question : an input panel docks at the bottom; answering advances
//
// The DATA layer is unchanged from the stepped form: same collected fields and
// the same `finish()` persistence (api.submitIntake / updateUser, North Star +
// system seed, identity layer, hero image). Only the presentation changed.
//
// requires_safety_review per AGENT_PLAN — touches the consent flow. Ratner has
// authorized build-phase changes per DECISIONS.md D-007; production sign-off
// still rests with Ratner per CLAUDE.md §9.

import { ArrowLeft, ArrowRight, ArrowUp, ImagePlus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { KaiCharacter } from "../components/KaiCharacter";
import { MagicEffect, type MagicKind } from "../components/MagicEffect";
import { MagicField } from "../components/MagicField";
import { api } from "../lib/api";
import {
  formatFollowUpsForIntake,
  pickFollowUps,
  type FollowUpResponse,
} from "../lib/onboarding-followups";
import { getNorthStar, seedNorthStarFromFocus, setNorthStar } from "../lib/local-northstar";
import {
  flushPendingOnboardingIntake,
  queueOnboardingIntake,
} from "../lib/pending-onboarding-intake";
import { setSchedule } from "../lib/local-schedule";
import { setSystemGoal } from "../lib/local-systems";
import {
  setHeroImage,
  setHeroPosition,
  setIdentityStatement,
  setOriginStory,
} from "../lib/local-identity";
import { useStorageUserId } from "../lib/storage-user-id";
import type { EngineId, KaiTone } from "../lib/types";
import { useUserStore } from "../stores/userStore";

const WALKTHROUGH_KEY = "kai_walkthrough_seen_v1";

type Gesture = "wave" | "point" | "reach" | "idle" | "talk";

// ─────────────────────────────────────────────────────────────────────
// Focus areas (unchanged from the form)
// ─────────────────────────────────────────────────────────────────────

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

const FOCUS_LABELS: Record<string, string> = Object.fromEntries(
  FOCUS_GROUPS.flatMap((g) => g.options).map((o) => [o.id, o.label]),
);

// Map focus areas → suggested primary engine. Ties default to "mental"
// (AGENT_PLAN T-006 §4). Body image is intentionally mental-leaning.
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
  const mentalCount = focusAreas.filter((a) => MENTAL_LEANING.includes(a)).length;
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

const BLOCKER_CHIPS = ["Motivation", "Discipline", "Confidence", "Sleep", "Stress", "Time"];

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
    return parsed && typeof parsed === "object" ? (parsed as DemoBuildSlice) : null;
  } catch {
    return null;
  }
}

function isKaiTone(v: unknown): v is KaiTone {
  return v === "warm" || v === "balanced" || v === "direct";
}

// ─────────────────────────────────────────────────────────────────────
// Conversation model
// ─────────────────────────────────────────────────────────────────────

type Draft = {
  firstName: string;
  age: string;
  focusAreas: FocusAreaId[];
  hardestLately: string;
  followUps: FollowUpResponse;
  biggestBlocker: string;
  kaiTone: KaiTone;
  bigGoal: string;
  identityStatement: string; // "Someone who keeps his word" — who they want to become
  whyMatters: string; // origin story: "what made you want to start today" (write-once)
  heroImageFile: File | null;
};

type InputKind =
  | "text"
  | "longtext"
  | "number"
  | "chips-multi"
  | "chips-single"
  | "tone-cards"
  | "photo";

type StageKind = "intro" | "question";

type Stage = {
  id: string;
  kind: StageKind;
  // KAI staging on the cinematic canvas.
  kaiOffsetX: number;
  kaiTopPct: number;
  kaiScale: number;
  gesture: Gesture;
  magic?: MagicKind;
  hint?: string; // intro-only "tap to continue" affordance
  kaiLines: (d: Draft) => string[]; // KAI's spoken prompt
  // question-only:
  input?: InputKind;
  field?: keyof Draft;
  followKey?: string; // follow-ups write draft.followUps[followKey]
  options?: string[];
  placeholder?: string;
  optional?: boolean;
  canSend?: (d: Draft) => boolean;
  reaction?: (d: Draft) => string; // KAI's one-liner after the user answers
};

// Question-stage staging: KAI sits up and small so the bottom of the screen
// is free for the input panel.
const Q = { kaiOffsetX: 0, kaiTopPct: 0.24, kaiScale: 0.82, gesture: "talk" as Gesture };

const INTRO_STAGES: Stage[] = [
  {
    id: "hi",
    kind: "intro",
    kaiOffsetX: 0,
    kaiTopPct: 0.32,
    kaiScale: 1.0,
    gesture: "wave",
    magic: "burst",
    hint: "tap to continue",
    kaiLines: () => ["Hey — I'm KAI.", "Glad you're here."],
  },
  {
    id: "who",
    kind: "intro",
    kaiOffsetX: 0,
    kaiTopPct: 0.32,
    kaiScale: 1.0,
    gesture: "reach",
    magic: "converge",
    hint: "tap to continue",
    kaiLines: () => [
      "I'm not just some chatbot.",
      "I'm your coach, your planner, the one in your corner keeping you honest.",
    ],
  },
  {
    id: "value",
    kind: "intro",
    kaiOffsetX: 0,
    kaiTopPct: 0.32,
    kaiScale: 1.0,
    gesture: "talk",
    hint: "tap to continue",
    kaiLines: () => [
      "Sleep, training, your head, your habits, staying focused — I help with all of it.",
      "And I take the thinking off your plate.",
    ],
  },
  {
    id: "how-score",
    kind: "intro",
    kaiOffsetX: 0,
    kaiTopPct: 0.32,
    kaiScale: 1.0,
    gesture: "point",
    hint: "tap to continue",
    kaiLines: () => [
      "Every day you get one simple score — your Mind, your Sleep, your Mood.",
      "I'll always show you exactly what moves it. No guessing.",
    ],
  },
  {
    id: "how-system",
    kind: "intro",
    kaiOffsetX: 0,
    kaiTopPct: 0.32,
    kaiScale: 1.0,
    gesture: "reach",
    magic: "starBurst",
    hint: "tap to continue",
    kaiLines: () => [
      "Then we build your System — small daily moves, built around your goal.",
      "Show up, and your System gets stronger. So do you.",
    ],
  },
  {
    id: "learn",
    kind: "intro",
    kaiOffsetX: 0,
    kaiTopPct: 0.32,
    kaiScale: 1.0,
    gesture: "reach",
    magic: "converge",
    hint: "tap to begin",
    kaiLines: () => ["That's the deal — and it's all yours.", "First, let me learn about you."],
  },
];

const QUESTION_STAGES: Stage[] = [
  {
    id: "name",
    kind: "question",
    ...Q,
    input: "text",
    field: "firstName",
    placeholder: "First name",
    kaiLines: () => ["What should I call you?"],
    canSend: (d) => d.firstName.trim().length > 0,
    reaction: (d) => `Nice to meet you, ${d.firstName.trim()}.`,
  },
  {
    id: "age",
    kind: "question",
    ...Q,
    input: "number",
    field: "age",
    placeholder: "Age",
    optional: true,
    kaiLines: (d) => [
      `How old are you${d.firstName.trim() ? `, ${d.firstName.trim()}` : ""}? Just so I get you right.`,
    ],
  },
  {
    id: "focus",
    kind: "question",
    ...Q,
    input: "chips-multi",
    field: "focusAreas",
    kaiLines: () => ["What do you want to work on?", "Pick a few that feel right."],
    canSend: (d) => d.focusAreas.length > 0,
    reaction: () => "Good list. Let's make these real.",
  },
  {
    id: "hardest",
    kind: "question",
    ...Q,
    input: "longtext",
    field: "hardestLately",
    placeholder: "A messy sentence is enough.",
    optional: true,
    kaiLines: () => ["Real talk. What's been hardest lately?", "One messy sentence is plenty, or skip it."],
  },
  {
    id: "tone",
    kind: "question",
    ...Q,
    input: "tone-cards",
    field: "kaiTone",
    kaiLines: () => ["How should I talk to you?"],
    reaction: () => "Got it. That's how I'll show up.",
  },
  {
    id: "goal",
    kind: "question",
    ...Q,
    input: "longtext",
    field: "bigGoal",
    placeholder: "e.g. Make the team. Get stronger. Feel less anxious.",
    optional: true,
    kaiLines: (d) => [
      `So ${d.firstName.trim() || "tell me"}, what are you working toward?`,
      "Your one big thing. I'll build a plan around it.",
    ],
  },
  {
    id: "identity",
    kind: "question",
    ...Q,
    input: "longtext",
    field: "identityStatement",
    placeholder: "e.g. Someone who keeps his word. Someone who never quits.",
    optional: true,
    kaiLines: () => [
      "Who do you want to become?",
      "However it comes out — there's no wrong answer.",
    ],
    reaction: () => "Love that. That's who we're building.",
  },
  {
    id: "why",
    kind: "question",
    ...Q,
    input: "longtext",
    field: "whyMatters",
    placeholder: "e.g. I'm tired of wasting my potential. I need structure.",
    optional: true,
    kaiLines: () => [
      "What made you want to start today?",
      "Just be real with me — I'll hold onto this one.",
    ],
  },
  {
    id: "photo",
    kind: "question",
    ...Q,
    input: "photo",
    field: "heroImageFile",
    optional: true,
    kaiLines: () => ["Want to add a photo of where you're headed?", "Totally optional."],
  },
  {
    id: "meet",
    kind: "intro",
    kaiOffsetX: 0,
    kaiTopPct: 0.3,
    kaiScale: 0.98,
    gesture: "reach",
    magic: "starBurst",
    hint: "tap to continue",
    kaiLines: (d) => [
      `Hey ${d.firstName.trim() || "there"}. I'm KAI.`,
      "My job isn't to judge you. My job is to help you become the person you just described.",
    ],
  },
  {
    id: "blocker",
    kind: "question",
    ...Q,
    input: "chips-single",
    field: "biggestBlocker",
    options: BLOCKER_CHIPS,
    optional: true,
    kaiLines: () => ["So — what's the biggest thing holding you back right now?"],
  },
  {
    id: "finale",
    kind: "intro",
    kaiOffsetX: 0,
    kaiTopPct: 0.34,
    kaiScale: 1.05,
    gesture: "wave",
    magic: "heart",
    kaiLines: (d) => [`That's everything, ${d.firstName.trim() || "friend"}.`, "Let's get to it."],
  },
];

// In test (vitest) and reduced-motion: skip the particle bursts.
function detectStatic(): boolean {
  try {
    if (
      typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE === "test"
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined" && window.matchMedia) {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* ignore */
    }
  }
  return false;
}

function makeInitialDraft(demo: DemoBuildSlice | null): Draft {
  return {
    firstName: demo?.firstName ?? "",
    age: "",
    focusAreas: [],
    hardestLately: "",
    followUps: {},
    biggestBlocker: "",
    kaiTone: isKaiTone(demo?.kaiTone) ? demo.kaiTone : "balanced",
    bigGoal: "",
    identityStatement: "",
    whyMatters: "",
    heroImageFile: null,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

export function Onboarding() {
  const navigate = useNavigate();
  const { setKai, setPrimaryEngine, onboardingCompletedAt } = useUserStore();
  const userId = useStorageUserId();

  const [demoBuild] = useState<DemoBuildSlice | null>(() => loadDemoBuild());
  const [isStatic] = useState(() => detectStatic());

  const [draft, setDraft] = useState<Draft>(() => makeInitialDraft(demoBuild));
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const [cursor, setCursor] = useState(0);
  const [lines, setLines] = useState<string[]>(() => INTRO_STAGES[0].kaiLines(makeInitialDraft(demoBuild)));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const kaiName = demoBuild?.kaiName?.trim() || "KAI";
  const ageNum = Number(draft.age) || undefined;
  const primaryEngine = useMemo(() => suggestEngine(draft.focusAreas), [draft.focusAreas]);

  // Already-onboarded users never see the flow (mirrors old Welcome). QA
  // override: set localStorage "kai_force_onboarding" = "1" to walk the flow
  // without resetting backend state (lets Lev/Ratner preview onboarding).
  useEffect(() => {
    let forced = false;
    try {
      forced = localStorage.getItem("kai_force_onboarding") === "1";
    } catch {
      /* no-op */
    }
    if (onboardingCompletedAt && !forced) navigate("/home", { replace: true });
  }, [navigate, onboardingCompletedAt]);

  // The full script: intro stages + question stages, with adaptive follow-ups
  // spliced after "hardest". Focus is chosen before the splice point, and the
  // intro stages are constant-length, so live/past indices stay stable.
  const stages = useMemo<Stage[]>(() => {
    const followStages: Stage[] = pickFollowUps(draft.focusAreas).map((q) => ({
      id: `followup_${q.id}`,
      kind: "question",
      ...Q,
      input: "chips-single",
      optional: true,
      options: q.options,
      followKey: q.id,
      kaiLines: () => [q.prompt],
    }));
    const questions: Stage[] = [];
    for (const s of QUESTION_STAGES) {
      questions.push(s);
      if (s.id === "hardest") questions.push(...followStages);
    }
    return [...INTRO_STAGES, ...questions];
  }, [draft.focusAreas]);

  const stage = stages[cursor];
  const isFinale = stage?.id === "finale";
  const introTappable = stage?.kind === "intro" && !isFinale;

  // Advance to `next`, optionally leading KAI's next lines with a reaction.
  function goTo(next: number, leadLines: string[], d: Draft) {
    setCursor(next);
    setLines([...leadLines, ...stages[next].kaiLines(d)]);
  }

  function applyValue(d: Draft, s: Stage, value: unknown): Draft {
    if (s.followKey) {
      return { ...d, followUps: { ...d.followUps, [s.followKey]: value as string } };
    }
    if (s.field) return { ...d, [s.field]: value } as Draft;
    return d;
  }

  function handleAnswer(value: unknown) {
    if (!stage) return;
    const nd = applyValue(draftRef.current, stage, value);
    setDraft(nd);
    const reaction = stage.reaction ? stage.reaction(nd) : null;
    goTo(cursor + 1, reaction ? [reaction] : [], nd);
  }

  function handleSkip() {
    if (!stage) return;
    goTo(cursor + 1, [], draftRef.current);
  }

  function advanceIntro() {
    if (!introTappable) return;
    goTo(cursor + 1, [], draftRef.current);
  }

  function handleBack() {
    // Rewind to the previous answerable (question) stage.
    let p = cursor - 1;
    while (p >= 0 && stages[p].kind !== "question") p--;
    if (p < 0) return;
    setCursor(p);
    setLines(stages[p].kaiLines(draftRef.current));
  }

  // Swipe-to-advance — intro stages only (never skip a question by swiping).
  const touchStart = useRef(0);
  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!introTappable) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (dx < -40) advanceIntro();
  }

  async function finish() {
    setSaving(true);
    setError("");
    const d = draftRef.current;
    try {
      const keyedResponses: Record<string, string> = {
        focus_areas: d.focusAreas.join(","),
        first_name: d.firstName.trim(),
      };
      if (d.hardestLately.trim()) {
        keyedResponses.hardest_lately = d.hardestLately.trim();
      }
      const questions = pickFollowUps(d.focusAreas);
      Object.assign(keyedResponses, formatFollowUpsForIntake(questions, d.followUps));
      let goalText = d.bigGoal.trim();
      if (goalText) {
        setNorthStar(goalText, "custom");
      } else {
        seedNorthStarFromFocus(d.focusAreas);
        goalText = getNorthStar()?.goal ?? "";
      }
      if (goalText) {
        setSystemGoal(goalText, userId);
        void api
          .scheduleGenerate(goalText, goalText)
          .then((res) => {
            if (res.items.length > 0) setSchedule(res.items);
          })
          .catch(() => {});
      }
      // Two distinct answers: the identity statement ("who you want to become",
      // editable, leads KAI's home greeting) and the write-once day-one origin
      // story ("why you're here today").
      const identity = d.identityStatement.trim();
      const origin = d.whyMatters.trim();
      const blocker = d.biggestBlocker.trim();
      if (identity) {
        setIdentityStatement(identity);
        keyedResponses.identity_statement = identity;
      }
      if (origin) {
        setOriginStory(origin); // write-once
        keyedResponses.origin_story = origin;
      }
      if (blocker) keyedResponses.biggest_blocker = blocker;
      if (d.heroImageFile) {
        // Already stored (with its chosen framing) when the user confirmed the
        // photo in the upload step, so we don't re-store here (that would reset
        // the reframe position).
        keyedResponses.hero_image = "set";
      }
      try {
        localStorage.setItem(WALKTHROUGH_KEY, "1");
      } catch {
        /* no-op */
      }
      await api.updateUser({
        displayName: d.firstName.trim() || undefined,
        kaiName,
        kaiTone: d.kaiTone,
        primaryEngine,
        age: ageNum,
        onboardingCompleted: true,
      });
      // Queue the intake locally and flush (retries on failure) instead of a
      // one-shot submit, matching the app's intake-retry behavior.
      queueOnboardingIntake(keyedResponses);
      void flushPendingOnboardingIntake();
      setKai(kaiName, d.kaiTone);
      setPrimaryEngine(primaryEngine);
      navigate("/home");
    } catch {
      setError("Couldn't save your answers just now. You can keep going, we'll retry.");
      setKai(kaiName, d.kaiTone);
      setPrimaryEngine(primaryEngine);
      navigate("/home");
    } finally {
      setSaving(false);
    }
  }

  const progressPct = stages.length > 1 ? ((cursor + 1) / stages.length) * 100 : 100;
  const canBack = !saving && !isFinale && stages.slice(0, cursor).some((s) => s.kind === "question");

  return (
    <div
      className="relative mx-auto flex h-[100vh] w-full max-w-md select-none flex-col overflow-hidden px-5 pb-6 pt-3 sm:max-w-lg"
      onClick={introTappable ? advanceIntro : undefined}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ cursor: introTappable ? "pointer" : "default" }}
    >
      <MagicField />

      {/* Header: back + thin progress bar */}
      <header className="relative z-20 flex items-center gap-3 pb-3">
        {canBack ? (
          <button
            type="button"
            aria-label="Back"
            onClick={(e) => {
              e.stopPropagation();
              handleBack();
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-glass-border bg-surface/70 text-text-secondary backdrop-blur transition hover:bg-surface focus-ring"
          >
            <ArrowLeft size={15} aria-hidden="true" />
          </button>
        ) : (
          <span className="h-8 w-8 shrink-0" aria-hidden="true" />
        )}
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-muted/70">
          <div
            className="h-full rounded-full bg-text-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* THE STAGE — KAI sits center and speaks through a bubble below him,
          so it reads as KAI talking to you. He scales smoothly between
          stages; the bubble re-keys per stage to replay its pop. */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-2">
        {/* KAI — persists across stages (not re-keyed), scales per stage. */}
        <div
          className="relative shrink-0"
          style={{
            transform: `scale(${stage.kaiScale})`,
            transition: "transform 900ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Orbiting particles — small magical aura. */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <span className="kai-orbit-1 absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
              <span className="block h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(123,110,246,0.9)]" />
            </span>
            <span className="kai-orbit-2 absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
              <span className="block h-1.5 w-1.5 rounded-full bg-accent-cool shadow-[0_0_10px_rgba(104,197,184,0.9)]" />
            </span>
            <span className="kai-orbit-3 absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
              <span className="block h-1.5 w-1.5 rounded-full bg-accent-warm shadow-[0_0_10px_rgba(240,168,104,0.9)]" />
            </span>
          </div>

          <KaiCharacter size={200} face speaking gesture={stage.gesture} />

          {stage.magic && !isStatic && <MagicEffect kind={stage.magic} triggerKey={cursor} />}

          {cursor === 0 && (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent/70 kai-tap-ring"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Speech bubble — KAI's line(s), with a tail pointing up at him. */}
        <SpeechBubble key={`bubble-${cursor}`} lines={lines} />

        {/* Tap hint — intro stages only. */}
        {introTappable && stage.hint && (
          <p
            key={`hint-${cursor}`}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted kai-hint-pulse"
            aria-hidden="true"
          >
            {stage.hint}
          </p>
        )}
      </div>

      {/* Bottom slot — input panel for questions, Start button on finale. */}
      {isFinale ? (
        <div className="relative z-20 pt-2" style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}>
          <button
            type="button"
            onClick={() => void finish()}
            disabled={saving}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-text-primary text-lg font-semibold text-background shadow-card transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-text-soft focus-ring"
          >
            {saving ? "Finishing…" : "Start"}
            {!saving && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </div>
      ) : stage.kind === "question" ? (
        <div
          className="relative z-20 max-h-[46vh] overflow-y-auto rounded-t-3xl border-t border-glass-border bg-surface/80 px-1 pt-3 backdrop-blur"
          style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
          onClick={(e) => e.stopPropagation()}
        >
          {error && (
            <p className="mb-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <Composer key={stage.id} stage={stage} draft={draft} onSend={handleAnswer} onSkip={handleSkip} />
        </div>
      ) : null}

      {STAGE_STYLE}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Speech bubble — KAI's line(s), tail pointing up at him.
// ─────────────────────────────────────────────────────────────────────

function SpeechBubble({ lines }: { lines: string[] }) {
  return (
    <div className="relative z-10 -mt-12 kai-bubble-pop">
      {/* Tail — a small rotated square that pokes up toward KAI. */}
      <div
        className="absolute -top-1.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 rounded-[3px] border-l border-t border-glass-border bg-surface"
        aria-hidden="true"
      />
      <div
        className="relative max-w-[17rem] rounded-3xl border border-glass-border bg-surface px-5 py-3.5 text-center shadow-card sm:max-w-sm"
        aria-live="polite"
      >
        {lines.map((l, i) => (
          <p
            key={i}
            className="kai-stagger-pop font-display text-lg font-medium leading-snug tracking-tight text-text-primary sm:text-xl"
            style={{ animationDelay: `${i * 260}ms` }}
          >
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Composers (one per input kind) — reused on the cinematic stage
// ─────────────────────────────────────────────────────────────────────

function Composer({
  stage,
  draft,
  onSend,
  onSkip,
}: {
  stage: Stage;
  draft: Draft;
  onSend: (value: unknown) => void;
  onSkip: () => void;
}) {
  switch (stage.input) {
    case "text":
    case "longtext":
      return (
        <TextComposer
          stage={stage}
          draft={draft}
          multiline={stage.input === "longtext"}
          onSend={onSend}
          onSkip={onSkip}
        />
      );
    case "number":
      return <AgeComposer stage={stage} draft={draft} onSend={onSend} onSkip={onSkip} />;
    case "chips-multi":
      return <FocusComposer draft={draft} onSend={onSend} />;
    case "chips-single":
      return <ChipsComposer stage={stage} draft={draft} onSend={onSend} onSkip={onSkip} />;
    case "tone-cards":
      return <ToneComposer onSend={onSend} />;
    case "photo":
      return <PhotoComposer draft={draft} onSend={onSend} onSkip={onSkip} />;
    default:
      return null;
  }
}

function SendButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Send"
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-text-primary text-background shadow-card transition active:scale-[0.95] disabled:cursor-not-allowed disabled:bg-text-soft focus-ring"
    >
      <ArrowUp size={18} aria-hidden="true" />
    </button>
  );
}

function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start text-sm font-medium text-text-muted underline-offset-4 hover:underline"
    >
      Skip
    </button>
  );
}

function TextComposer({
  stage,
  draft,
  multiline,
  onSend,
  onSkip,
}: {
  stage: Stage;
  draft: Draft;
  multiline: boolean;
  onSend: (value: unknown) => void;
  onSkip: () => void;
}) {
  const initial = stage.field ? String(draft[stage.field] ?? "") : "";
  const [val, setVal] = useState(initial);
  const trimmed = val.trim();
  const gateOk = stage.canSend
    ? stage.canSend({ ...draft, [stage.field as keyof Draft]: val } as Draft)
    : trimmed.length > 0;

  function send() {
    if (!gateOk) return;
    onSend(trimmed);
  }

  return (
    <div className="flex flex-col gap-2 px-2 pb-1">
      <div className="flex items-end gap-2">
        {multiline ? (
          <textarea
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={stage.placeholder}
            rows={2}
            maxLength={280}
            className="w-full resize-none rounded-2xl border border-glass-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-muted shadow-card focus-ring"
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={val}
            maxLength={30}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            placeholder={stage.placeholder}
            className="w-full rounded-full border border-glass-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-muted shadow-card focus-ring"
          />
        )}
        <SendButton disabled={!gateOk} onClick={send} />
      </div>
      {stage.optional && <SkipButton onClick={onSkip} />}
    </div>
  );
}

function AgeComposer({
  stage,
  draft,
  onSend,
  onSkip,
}: {
  stage: Stage;
  draft: Draft;
  onSend: (value: unknown) => void;
  onSkip: () => void;
}) {
  const [val, setVal] = useState(draft.age);
  const n = Number(val);
  const valid = val.trim() !== "" && Number.isFinite(n) && n >= 1 && n <= 120;

  function send() {
    if (!valid) return;
    onSend(val.trim());
  }

  return (
    <div className="flex flex-col gap-2 px-2 pb-1">
      <div className="flex items-end gap-2">
        <input
          autoFocus
          type="number"
          inputMode="numeric"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder={stage.placeholder}
          className="w-full rounded-full border border-glass-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-muted shadow-card focus-ring"
        />
        <SendButton disabled={!valid} onClick={send} />
      </div>
      <SkipButton onClick={onSkip} />
    </div>
  );
}

function FocusComposer({ draft, onSend }: { draft: Draft; onSend: (value: unknown) => void }) {
  const [sel, setSel] = useState<FocusAreaId[]>(draft.focusAreas);

  function toggle(id: FocusAreaId) {
    setSel((cur) => (cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id]));
  }

  return (
    <div className="flex flex-col gap-3 px-2 pb-1">
      <div className="space-y-4">
        {FOCUS_GROUPS.map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.options.map(({ id, label }) => {
                const selected = sel.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    aria-pressed={selected}
                    className={`rounded-full border px-3.5 py-2 text-sm font-medium transition active:scale-[0.98] ${
                      selected
                        ? "border-text-primary bg-text-primary text-background"
                        : "border-glass-border bg-surface text-text-primary hover:bg-surface-muted"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="sticky bottom-0 flex justify-end bg-surface/80 pt-1 backdrop-blur">
        <button
          type="button"
          onClick={() => sel.length > 0 && onSend(sel)}
          disabled={sel.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-text-primary px-5 py-2.5 text-sm font-medium text-background shadow-card transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-text-soft focus-ring"
        >
          Send
          <ArrowUp size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function ChipsComposer({
  stage,
  draft,
  onSend,
  onSkip,
}: {
  stage: Stage;
  draft: Draft;
  onSend: (value: unknown) => void;
  onSkip: () => void;
}) {
  const options = stage.options ?? [];
  const existing = stage.followKey
    ? draft.followUps[stage.followKey] ?? ""
    : stage.field
      ? String(draft[stage.field] ?? "")
      : "";
  const [custom, setCustom] = useState(options.includes(existing) ? "" : existing);

  function sendCustom() {
    const v = custom.trim();
    if (v) onSend(v);
  }

  return (
    <div className="flex flex-col gap-3 px-2 pb-1">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onSend(opt)}
            className="rounded-full border border-glass-border bg-surface px-3.5 py-2 text-sm font-medium text-text-primary transition active:scale-[0.98] hover:bg-surface-muted focus-ring"
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendCustom();
            }
          }}
          placeholder="…or say it in your own words"
          maxLength={120}
          className="w-full rounded-full border border-glass-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted shadow-card focus-ring"
        />
        <SendButton disabled={!custom.trim()} onClick={sendCustom} />
      </div>
      {stage.optional && <SkipButton onClick={onSkip} />}
    </div>
  );
}

function ToneComposer({ onSend }: { onSend: (value: unknown) => void }) {
  return (
    <div className="flex flex-col gap-2 px-2 pb-1">
      {TONES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSend(t.id)}
          className="w-full rounded-2xl border border-glass-border bg-surface p-3.5 text-left shadow-card transition active:scale-[0.99] hover:bg-surface-muted focus-ring"
        >
          <p className="font-display text-base font-semibold text-text-primary">{t.title}</p>
          <p className="mt-1 text-sm leading-snug text-text-secondary">"{t.preview}"</p>
        </button>
      ))}
    </div>
  );
}

function PhotoComposer({
  draft,
  onSend,
  onSkip,
}: {
  draft: Draft;
  onSend: (value: unknown) => void;
  onSkip: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(draft.heroImageFile);
  const [preview, setPreview] = useState<string | null>(null);
  // Vertical reframe — for a tall photo, slide up to frame the face.
  const [posY, setPosY] = useState(50);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function use() {
    if (!file) return;
    setBusy(true);
    // Store the photo now (with the chosen framing) so finish() doesn't have
    // to re-store and reset the position. Only apply framing if it stored —
    // setHeroImage returns false on decode failure / quota, and setHeroPosition
    // is a no-op without a stored photo.
    const stored = await setHeroImage(file);
    if (stored) setHeroPosition(`50% ${posY}%`);
    setBusy(false);
    onSend(file);
  }

  return (
    <div className="flex flex-col gap-3 px-2 pb-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setFile(f);
            setPosY(50);
          }
          e.target.value = "";
        }}
      />
      {preview ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-glass-border shadow-card">
            <img
              src={preview}
              alt="Your future"
              style={{ objectPosition: `50% ${posY}%` }}
              className="aspect-square w-full object-cover"
            />
          </div>
          {/* Reframe — drag to move the photo (e.g. up to the face). */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                Reframe
              </span>
              <span className="font-mono text-[10px] text-text-muted">top · bottom</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={posY}
              onChange={(e) => setPosY(Number(e.target.value))}
              className="w-full accent-accent"
              aria-label="Reframe photo vertically"
            />
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-glass-border bg-surface text-center shadow-card transition hover:bg-surface-muted focus-ring"
        >
          <span className="flex flex-col items-center gap-2 text-text-secondary">
            <ImagePlus size={24} aria-hidden="true" />
            <span className="text-sm font-medium text-text-primary">Choose a photo</span>
          </span>
        </button>
      )}
      <div className="flex items-center justify-between">
        {preview ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm font-medium text-text-muted underline-offset-4 hover:underline"
          >
            Choose another
          </button>
        ) : (
          <SkipButton onClick={onSkip} />
        )}
        {preview && file && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void use()}
            className="inline-flex items-center gap-2 rounded-full bg-text-primary px-5 py-2.5 text-sm font-medium text-background shadow-card transition active:scale-[0.98] disabled:bg-text-soft focus-ring"
          >
            {busy ? "Saving…" : "Use this photo"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Stage keyframes (lifted from Welcome) — KAI fly-in, orbits, line pop,
// hint pulse, tap ring. Rendered once at module scope via a portal-free
// style tag attached to the page.
// ─────────────────────────────────────────────────────────────────────

const STAGE_STYLE = (
  <style>{`
    @keyframes kai-bubble-pop {
      0%   { opacity: 0; transform: translateY(10px) scale(0.92); }
      100% { opacity: 1; transform: translateY(0)    scale(1); }
    }
    .kai-bubble-pop { animation: kai-bubble-pop 520ms cubic-bezier(0.16, 1, 0.3, 1) both; }

    @keyframes kai-orbit-1 {
      0%   { transform: translate(-50%, -50%) rotate(0deg)   translateX(85px) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg) translateX(85px) rotate(-360deg); }
    }
    .kai-orbit-1 { animation: kai-orbit-1 9000ms linear infinite; }
    @keyframes kai-orbit-2 {
      0%   { transform: translate(-50%, -50%) rotate(120deg) translateX(105px) rotate(-120deg); }
      100% { transform: translate(-50%, -50%) rotate(480deg) translateX(105px) rotate(-480deg); }
    }
    .kai-orbit-2 { animation: kai-orbit-2 14000ms linear infinite; }
    @keyframes kai-orbit-3 {
      0%   { transform: translate(-50%, -50%) rotate(240deg) translateX(70px) rotate(-240deg); }
      100% { transform: translate(-50%, -50%) rotate(-120deg) translateX(70px) rotate(120deg); }
    }
    .kai-orbit-3 { animation: kai-orbit-3 11000ms linear infinite; }

    @keyframes kai-tap-ring {
      0%   { transform: translate(-50%, -50%) scale(0.95); opacity: 0.9; }
      100% { transform: translate(-50%, -50%) scale(1.35); opacity: 0; }
    }
    .kai-tap-ring { animation: kai-tap-ring 1800ms ease-out infinite; }

    @keyframes kai-line-pop {
      0%   { transform: translateY(14px) scale(0.96); opacity: 0; filter: blur(6px); }
      100% { transform: translateY(0)    scale(1);    opacity: 1; filter: blur(0); }
    }
    .kai-stagger-pop { animation: kai-line-pop 700ms cubic-bezier(0.16, 1, 0.3, 1) both; }

    @keyframes kai-hint-pulse {
      0%, 100% { opacity: 0.45; }
      50%      { opacity: 0.8;  }
    }
    .kai-hint-pulse { animation: kai-hint-pulse 1800ms ease-in-out infinite; }
  `}</style>
);
