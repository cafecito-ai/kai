import {
  Check,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileText,
  Lock,
  RotateCcw,
  Trophy,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ReviewStep = {
  id: string;
  title: string;
  route: string;
  screenshot: string;
  time: string;
  owner: string;
  required: boolean;
  goal: string;
  review: string[];
  pass: string;
};

type StepReview = {
  done: boolean;
  rating: "unset" | "1" | "2" | "3" | "4" | "5";
  notes: string;
};

type Signoff = {
  reviewerName: string;
  reviewerRole: string;
  decision: "unset" | "approved" | "approved_with_fixes" | "not_approved";
  blockers: string;
  nextOwner: string;
};

type ReviewState = {
  steps: Record<string, StepReview>;
  signoff: Signoff;
};

const STORAGE_KEY = "kai_client_review_walkthrough_v1";
const LIVE_ORIGIN = "https://kai.boostaisearch.ai";

const REVIEW_STEPS: ReviewStep[] = [
  {
    id: "onboarding",
    title: "Create your KAI",
    route: "/onboarding",
    screenshot: "/review/screenshots-real/02-onboarding.png",
    time: "7 min",
    owner: "Lev",
    required: true,
    goal: "Set up KAI yourself and see if a new person could do it without anyone explaining.",
    review: [
      "Enter name and age.",
      "Pick focus areas and answer what has been hardest lately.",
      "Choose system support, one big goal, and KAI tone.",
    ],
    pass: "Setup feels personal, fast, and real — not like a form.",
  },
  {
    id: "home",
    title: "Find the first move",
    route: "/home",
    screenshot: "/review/screenshots-real/03-home.png",
    time: "5 min",
    owner: "Lev",
    required: true,
    goal: "See if the app makes it obvious what to do first.",
    review: [
      "Review Daily Score, North Star, missions, and recent activity.",
      "Open the plus button and inspect quick actions.",
      "Name the first thing Lev would tap tomorrow.",
    ],
    pass: "The first daily move is obvious in under 10 seconds.",
  },
  {
    id: "daily-actions",
    title: "Try daily actions",
    route: "/check-in",
    screenshot: "/review/screenshots-real/04-check-in.png",
    time: "9 min",
    owner: "Lev",
    required: true,
    goal: "Try the things you would actually do daily and see if they are worth opening.",
    review: [
      "Complete a check-in.",
      "Try journal, sleep, workout, food, mobility, or energy from the quick actions.",
      "Open Progress and confirm actions are reflected.",
    ],
    pass: "At least three daily actions feel useful rather than like homework.",
  },
  {
    id: "chat",
    title: "Pressure-test KAI chat",
    route: "/chat",
    screenshot: "/review/screenshots-real/05-chat.png",
    time: "8 min",
    owner: "Lev",
    required: true,
    goal: "See if KAI talks like a coach you would trust, not a therapist or a generic bot.",
    review: [
      "Ask one school-pressure prompt.",
      "Ask one friends/social prompt.",
      "Ask one fitness or motivation prompt.",
      "Rate whether responses are short, useful, and in voice.",
    ],
    pass: "KAI gives practical next steps and asks one useful follow-up.",
  },
  {
    id: "body-scan",
    title: "Safety-check body scan",
    route: "/scan",
    screenshot: "/review/screenshots-real/06-scan.png",
    time: "5 min",
    owner: "Boost AI + Lev",
    required: true,
    goal: "Check that the body scan stays about posture and movement only, and never feels creepy.",
    review: [
      "Read the scan intro and privacy promise.",
      "Inspect the capture flow on phone.",
      "Call out anything that feels creepy, body-focused, or unsafe.",
    ],
    pass: "It is clearly a posture check, not a body scanner — and the privacy promise is clear.",
  },
  {
    id: "growth",
    title: "Build a goal streak",
    route: "/goals",
    screenshot: "/review/screenshots-real/07-goals.png",
    time: "6 min",
    owner: "Lev",
    required: true,
    goal: "See if setting a goal actually turns into a real next step.",
    review: [
      "Create or inspect a goal.",
      "Open Strengths and Progress.",
      "Review badges and challenges for motivation without shame.",
    ],
    pass: "The goal loop produces a concrete next action.",
  },
  {
    id: "social",
    title: "Check friend mode",
    route: "/groups",
    screenshot: "/review/screenshots-real/08-groups.png",
    time: "4 min",
    owner: "Lev + Offy",
    required: false,
    goal: "Check what friends could actually see before you would invite anyone.",
    review: [
      "Open Groups, Inbox, Profile, and Settings.",
      "Confirm what friends can and cannot see.",
      "Capture anything that would block inviting a trusted peer.",
    ],
    pass: "Social sharing is opt-in, limited, and understandable.",
  },
  {
    id: "safety-legal",
    title: "Check safety pages",
    route: "/for-parents",
    screenshot: "/review/screenshots-real/09-parents.png",
    time: "6 min",
    owner: "Offy",
    required: true,
    goal: "Make sure the parent, crisis, and privacy pages are easy to find and clear.",
    review: [
      "Open For Parents, Crisis, Terms, and Privacy.",
      "Confirm crisis resources are reachable without logging in.",
      "Note who still needs to own legal review, clinical/safety review, and safety alerts.",
    ],
    pass: "The safety pages are clear, and it is obvious legal and clinical review still need a real person.",
  },
];

const BUILT_AREAS = [
  "Live Cloudflare-hosted review app and review quest",
  "Welcome, onboarding, personalization, goals, and KAI tone",
  "KAI chat, voice direction, and safety-first routing",
  "Daily loops: check-in, journal, sleep, workout, food, mobility, energy",
  "Daily score, XP, badges, missions, challenges, and progress",
  "Body scan flow with privacy framing and Gate 5 safety review",
  "Groups, profile, settings, parent, crisis, terms, and privacy pages",
  "Invoice, QA docs, handoff docs, scope docs, and review materials",
];

const ORIGINAL_GATES = [
  {
    gate: "G1",
    invoiceStatus: "Deposit / kickoff",
    amount: "$3,500",
    scope: "Signed agreement deposit; triggers Phase 1 Foundations & Kai.",
    built: "Completed. Repo, app shell, Cloudflare baseline, review materials, and first working scaffold exist.",
    signoff: "Paid/kickoff gate; not a product acceptance gate.",
    status: "complete",
  },
  {
    gate: "G2",
    invoiceStatus: "After Phase 1",
    amount: "$1,500",
    scope: "Kai live, customization, progress tracker, onboarding end-to-end, Lev guidance for engine customization.",
    built: "Substantially complete: welcome/onboarding, KAI tone, chat, daily score/progress, route structure, crisis resources, safety classifier, and docs.",
    signoff: "Ready for client acceptance review.",
    status: "ready",
  },
  {
    gate: "G3",
    invoiceStatus: "After Phase 2",
    amount: "$2,500",
    scope: "Physical Wellness engine: nutrition/food-photo, exercise, sleep, breathing, yoga, stretching.",
    built: "Substantially complete: food log/photo direction, workout, sleep, mobility/stretching, hydration/energy, body comments, and progress inputs.",
    signoff: "Ready for client acceptance review; friend testing still client-owned.",
    status: "ready",
  },
  {
    gate: "G4",
    invoiceStatus: "After Phase 3",
    amount: "$2,500",
    scope: "Potential & Goals engine: hidden strengths, goal-setting, check-ins, encouragement system.",
    built: "Substantially complete: strengths, goals, North Star, check-ins, badges, missions, challenges, progress/gamification.",
    signoff: "Ready for client acceptance review.",
    status: "ready",
  },
  {
    gate: "G5",
    invoiceStatus: "After Phase 4",
    amount: "$2,500",
    scope: "Mental Wellness engine: hardened safety layer, social/emotion/nervous-system modules, breathing and meditation, third-party reviewer approved.",
    built: "Engineering is partially to substantially complete: safety routing, check-in/journal, emotion/social/reset flows, body scan AI path, parent/crisis/ops architecture.",
    signoff: "Not fully sign-off complete until third-party clinical/safety reviewer and Lev testing happen.",
    status: "blocked",
  },
  {
    gate: "G6",
    invoiceStatus: "After Phase 5",
    amount: "$2,500",
    scope: "Final QA, integration testing, 15-20 real teen testers, critical bugs resolved, accessibility pass, handoff documentation.",
    built: "Handoff, QA docs, review walkthrough, smoke/build checks, and review assets exist.",
    signoff: "Blocked by real-user testing, final accessibility/performance pass, and critical bug triage from actual testers.",
    status: "blocked",
  },
] as const;

const DEFAULT_SIGNOFF: Signoff = {
  reviewerName: "",
  reviewerRole: "",
  decision: "unset",
  blockers: "",
  nextOwner: "",
};

function defaultState(): ReviewState {
  return {
    steps: Object.fromEntries(
      REVIEW_STEPS.map((step) => [
        step.id,
        { done: false, rating: "unset", notes: "" } satisfies StepReview,
      ]),
    ),
    signoff: DEFAULT_SIGNOFF,
  };
}

function liveRoute(route: string) {
  if (route.startsWith("http")) return route;
  return `${LIVE_ORIGIN}${route.startsWith("/") ? route : `/${route}`}`;
}

function loadState(): ReviewState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<ReviewState>;
    const base = defaultState();
    return {
      steps: {
        ...base.steps,
        ...(parsed.steps ?? {}),
      },
      signoff: {
        ...base.signoff,
        ...(parsed.signoff ?? {}),
      },
    };
  } catch {
    return defaultState();
  }
}

export function ClientReview() {
  const [state, setState] = useState<ReviewState>(() => loadState());
  const [activeStepId, setActiveStepId] = useState(REVIEW_STEPS[0].id);
  const [copied, setCopied] = useState(false);
  const [scoreHint, setScoreHint] = useState(false);

  useEffect(() => {
    document.title = "KAI review quest";
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Best effort only. The walkthrough still works without persistence. */
    }
  }, [state]);

  const requiredSteps = REVIEW_STEPS.filter((step) => step.required);
  const completedRequired = requiredSteps.filter((step) => state.steps[step.id]?.done).length;
  const completedTotal = REVIEW_STEPS.filter((step) => state.steps[step.id]?.done).length;
  const requiredComplete = completedRequired === requiredSteps.length;
  const percent = Math.round((completedRequired / requiredSteps.length) * 100);
  const xp = completedRequired * 100 + Math.max(0, completedTotal - completedRequired) * 50;
  const questLevel = requiredComplete ? "Final boss cleared" : `Level ${Math.min(completedRequired + 1, requiredSteps.length)}`;
  const nextReward = requiredComplete ? "Sign-off unlocked" : `${requiredSteps.length - completedRequired} required mission(s) left`;
  const activeIndex = REVIEW_STEPS.findIndex((step) => step.id === activeStepId);
  const activeStep = REVIEW_STEPS[activeIndex] ?? REVIEW_STEPS[0];
  const activeReview = state.steps[activeStep.id] ?? { done: false, rating: "unset", notes: "" };
  const summary = useMemo(() => buildSummary(state), [state]);

  function updateStep(id: string, patch: Partial<StepReview>) {
    setState((current) => ({
      ...current,
      steps: {
        ...current.steps,
        [id]: {
          ...current.steps[id],
          ...patch,
        },
      },
    }));
  }

  function updateSignoff(patch: Partial<Signoff>) {
    setState((current) => ({
      ...current,
      signoff: {
        ...current.signoff,
        ...patch,
      },
    }));
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function reset() {
    if (!window.confirm("Reset this client review walkthrough?")) return;
    setState(defaultState());
    setActiveStepId(REVIEW_STEPS[0].id);
  }

  function goSlide(direction: -1 | 1) {
    const next = Math.min(Math.max(activeIndex + direction, 0), REVIEW_STEPS.length - 1);
    setActiveStepId(REVIEW_STEPS[next].id);
  }

  function claimActive() {
    if (activeReview.done) {
      updateStep(activeStep.id, { done: false });
      return;
    }
    if (activeReview.rating === "unset") {
      setScoreHint(true);
      return;
    }
    updateStep(activeStep.id, { done: true });
    setScoreHint(false);
    if (activeIndex < REVIEW_STEPS.length - 1) goSlide(1);
  }

  return (
    <main className="min-h-[100svh] bg-[#f6f3ec] text-[#171717]">
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:py-8">
        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_80px_rgba(23,23,23,0.08)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b4f2f]">KAI review quest</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-normal text-[#171717] sm:text-6xl">
            Beat the KAI review quest.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#4c4c4c] sm:text-lg">
            Each mission opens a real KAI screen. Try it like a user, give it a quick score,
            and unlock sign-off by finishing the required missions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#171717] px-5 text-sm font-black text-white" href="#quest-deck">
              Start missions <Zap size={16} />
            </a>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-black/10 bg-[#17201d] p-6 text-white shadow-[0_24px_80px_rgba(23,23,23,0.12)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Quest progress</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-black text-[#f2d27c]">
            <Trophy size={16} /> {questLevel}
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-6xl font-semibold leading-none">{percent}%</p>
              <p className="mt-2 text-sm font-bold text-white/70">{completedRequired}/{requiredSteps.length} required missions complete</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
              <p className="text-2xl font-black">{xp}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">XP earned</p>
            </div>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/12">
            <div className="h-full rounded-full bg-[#9fd6bd] transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/8 p-4">
            <div className="flex items-start gap-3">
              {requiredComplete ? <Check className="mt-0.5 text-[#9fd6bd]" size={20} /> : <Lock className="mt-0.5 text-[#f2b56b]" size={20} />}
              <p className="m-0 text-sm leading-6 text-white/78">
                {requiredComplete
                  ? "Final boss unlocked. Capture the final decision before the meeting ends."
                  : nextReward}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgba(23,23,23,0.08)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b4f2f]">How to play</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-normal text-[#171717] sm:text-4xl">
                Quick, honest, and hard to fake.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#555]">
                No scope document to read first. Open a real screen, use it like you actually
                would, and say what feels good, broken, boring, confusing, or missing. That is
                the whole game.
              </p>
              <div className="mt-5 rounded-2xl border border-[#e2be79] bg-[#fff8ed] p-4">
                <p className="text-sm font-black text-[#70420d]">Quest rule</p>
                <p className="mt-1 text-sm leading-6 text-[#70420d]">
                  New ideas are allowed after the missions. First, play what already exists.
                </p>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <ReviewOutcome title="1. Open" body="Every mission links to the real live page." />
              <ReviewOutcome title="2. Try" body="Click, type, score, and use it like a teen would." />
              <ReviewOutcome title="3. Rate" body="Give the screen a 1-5 score and one sentence." />
              <ReviewOutcome title="4. Unlock" body="Finish required missions to unlock final sign-off." />
            </div>
          </div>
        </div>
      </section>

      <section id="quest-deck" className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgba(23,23,23,0.08)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b4f2f]">Mission deck</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-normal text-[#171717] sm:text-4xl">
                Clear the screens one by one.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#555]">
                Use the button to open the real route, test it, then claim the XP. The final
                sign-off stays locked until the required missions are complete.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goSlide(-1)}
                disabled={activeIndex <= 0}
                className="min-h-10 rounded-full border border-black/10 bg-[#f8f8f5] px-4 text-sm font-black text-[#171717] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => goSlide(1)}
                disabled={activeIndex >= REVIEW_STEPS.length - 1}
                className="min-h-10 rounded-full bg-[#171717] px-4 text-sm font-black text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="block overflow-hidden rounded-[1.5rem] border border-black/10 bg-[#171717] p-3 shadow-sm">
              <div className="overflow-hidden rounded-[1.1rem] bg-[#f6f3ec]">
                <img
                  src={activeStep.screenshot}
                  alt={`${activeStep.title} screenshot`}
                  className="block aspect-[390/844] w-full max-h-[720px] object-contain"
                />
              </div>
            </div>
            <aside className="rounded-[1.5rem] border border-black/10 bg-[#fbfaf7] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#17201d] px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                  {activeIndex + 1} of {REVIEW_STEPS.length}
                </span>
                <span className="rounded-full bg-[#efe7d8] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#725033]">{activeStep.time}</span>
                {activeStep.required ? (
	                  <span className="rounded-full bg-[#fff1db] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#9a5b13]">Main mission</span>
                ) : null}
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-normal text-[#171717]">{activeStep.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#555]">{activeStep.goal}</p>
              <ul className="mt-4 space-y-2 pl-5 text-sm leading-6 text-[#4d4d4d]">
                {activeStep.review.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <div className="mt-4 rounded-2xl bg-[#eef4f3] p-4">
	                <p className="text-xs font-black uppercase tracking-wider text-[#335c67]">Clear condition</p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#263d40]">{activeStep.pass}</p>
              </div>
              <div className="mt-4 grid gap-3">
                <a
                  href={liveRoute(activeStep.route)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-black text-white"
                >
                  Open this screen <ExternalLink size={16} />
                </a>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-[#666]">Mission score</span>
                  <select
                    value={activeReview.rating}
                    onChange={(event) => {
                      updateStep(activeStep.id, { rating: event.target.value as StepReview["rating"] });
                      setScoreHint(false);
                    }}
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm font-bold text-[#171717] [color-scheme:light]"
                  >
                    <option value="unset">No score yet</option>
                    <option value="1">1 - I would not use this</option>
                    <option value="2">2 - confusing or weak</option>
                    <option value="3">3 - usable with fixes</option>
                    <option value="4">4 - strong</option>
                    <option value="5">5 - I would ship this</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-[#666]">One-sentence feedback</span>
                  <textarea
                    value={activeReview.notes}
                    onChange={(event) => updateStep(activeStep.id, { notes: event.target.value })}
                    rows={3}
                    placeholder="What felt good, boring, broken, confusing, or missing?"
                    className="mt-2 w-full resize-y rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm leading-6 text-[#171717] placeholder:text-[#777] [color-scheme:light]"
                  />
                </label>
                <button
                  type="button"
                  onClick={claimActive}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-black ${
                    activeReview.done
                      ? "bg-[#e8f5ee] text-[#1f7a4d]"
                      : "border border-black/10 bg-white text-[#171717]"
                  }`}
                >
                  <Check size={16} /> {activeReview.done ? "+100 XP claimed — tap to undo" : "Claim XP and go next"}
                </button>
                {scoreHint && !activeReview.done ? (
                  <p className="text-center text-xs font-black text-[#9a5b13]">Give it a score first 👆</p>
                ) : null}
              </div>
            </aside>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
            {REVIEW_STEPS.map((step, index) => {
              const review = state.steps[step.id];
              const active = step.id === activeStep.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepId(step.id)}
                  className={`overflow-hidden rounded-2xl border bg-white p-2 text-left transition ${
                    active ? "border-[#335c67] ring-2 ring-[#335c67]/20" : "border-black/10 hover:border-black/25"
                  }`}
                >
                  <img src={step.screenshot} alt="" className="aspect-[390/844] w-full rounded-xl object-cover object-top" />
                  <span className="mt-2 block truncate text-xs font-black text-[#171717]">{index + 1}. {step.title}</span>
                  <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${review?.done ? "bg-[#e8f5ee] text-[#1f7a4d]" : "bg-[#f2f2f2] text-[#666]"}`}>
	                    {review?.done ? "XP claimed" : "Open"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgba(23,23,23,0.08)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b4f2f]">Final boss</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-normal text-[#171717] sm:text-4xl">Sign-off unlocks after the missions.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#555]">
                Use this during the final five minutes. If required missions are incomplete, the
                answer is not approved yet or approved with fixes, not a new feature list.
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-[#f8f8f5] px-4 text-sm font-black text-[#171717]"
            >
              <RotateCcw size={15} /> Reset
            </button>
          </div>

          <div className={`mt-6 rounded-2xl border p-4 ${requiredComplete ? "border-[#79b596] bg-[#eef8f2]" : "border-[#e2be79] bg-[#fff8ed]"}`}>
            <div className="flex items-start gap-3">
              {requiredComplete ? <ClipboardCheck className="mt-0.5 text-[#26734d]" size={22} /> : <Lock className="mt-0.5 text-[#9a5b13]" size={22} />}
              <div>
                <p className="font-black">{requiredComplete ? "Final boss unlocked" : "Final boss locked"}</p>
                <p className="mt-1 text-sm leading-6 text-[#555]">
                  {requiredComplete
                    ? "Capture the final decision and copy the summary into the follow-up note."
                    : `${requiredSteps.length - completedRequired} required mission(s) still need XP claimed.`}
                </p>
              </div>
            </div>
          </div>

          <fieldset disabled={!requiredComplete} className={!requiredComplete ? "opacity-55" : undefined}>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wider text-[#666]">Reviewer name</span>
                <input
                  value={state.signoff.reviewerName}
                  onChange={(event) => updateSignoff({ reviewerName: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-[#171717] placeholder:text-[#777] [color-scheme:light]"
                  placeholder="Lev, Offy, or meeting owner"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wider text-[#666]">Reviewer role</span>
                <input
                  value={state.signoff.reviewerRole}
                  onChange={(event) => updateSignoff({ reviewerRole: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-[#171717] placeholder:text-[#777] [color-scheme:light]"
                  placeholder="Product owner, parent/funder, Boost AI"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wider text-[#666]">Decision</span>
                <select
                  value={state.signoff.decision}
                  onChange={(event) => updateSignoff({ decision: event.target.value as Signoff["decision"] })}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm font-bold text-[#171717] [color-scheme:light]"
                >
                  <option value="unset">Choose decision</option>
                  <option value="approved">Approved for closeout</option>
                  <option value="approved_with_fixes">Approved with listed fixes</option>
                  <option value="not_approved">Not approved yet</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wider text-[#666]">Next owner</span>
                <input
                  value={state.signoff.nextOwner}
                  onChange={(event) => updateSignoff({ nextOwner: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-[#171717] placeholder:text-[#777] [color-scheme:light]"
                  placeholder="Lev testing, Offy legal, Boost AI fixes..."
                />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-wider text-[#666]">Remaining blockers or accepted fixes</span>
              <textarea
                value={state.signoff.blockers}
                onChange={(event) => updateSignoff({ blockers: event.target.value })}
                rows={4}
                className="mt-2 w-full resize-y rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm leading-6 text-[#171717] placeholder:text-[#777] [color-scheme:light]"
                placeholder="List only confirmed blockers from testing. Put new ideas in change requests."
              />
            </label>
          </fieldset>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px]">
            <pre className="max-h-80 overflow-auto rounded-2xl bg-[#17201d] p-4 text-xs leading-6 text-white/82">{summary}</pre>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={copySummary}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-black text-white"
              >
                <Copy size={16} /> {copied ? "Copied" : "Copy summary"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-normal text-[#171717]">What has been built.</h2>
            <p className="mt-3 text-sm leading-6 text-[#555]">
              This shows the original build scope is represented in the live product.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {BUILT_AREAS.map((area) => (
                <div key={area} className="rounded-2xl border border-black/10 bg-[#fbfaf7] p-4">
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 shrink-0 text-[#1f7a4d]" size={18} />
                    <p className="m-0 text-sm font-bold leading-6 text-[#333]">{area}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-black/10 bg-[#17201d] p-5 text-white shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Launch pacing</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-normal">Walk, then run.</h2>
            <div className="mt-5 space-y-3">
              <ScopeCard title="Walk" body="Lev finishes the review quest and Boost AI fixes confirmed bugs." />
              <ScopeCard title="Jog" body="15-20 invited teens test it, with parent explanation and weekly triage." />
              <ScopeCard title="Run" body="The client owns launch, pricing, legal, safety review, support, and growth." />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b4f2f]">Original gating document</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-normal text-[#171717] sm:text-4xl">
                Gate-by-gate proof against Invoice 2026-001.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#555]">
                The original schedule is a $15,000 fixed-fee build across six gates. G2-G4
                are ready for acceptance review. G5-G6 still depend on client-owned legal,
                clinical/safety, real-user testing, and final QA evidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/review/invoice-2026-002-kai-next-steps"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-[#f8f8f5] px-4 text-sm font-black text-[#171717]"
              >
                Invoice 2026-002 <FileText size={15} />
              </a>
              <a
                href="/review/boost-ai-invoice-2026-001-gating.docx"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-[#f8f8f5] px-4 text-sm font-black text-[#171717]"
              >
                Original gates <FileText size={15} />
              </a>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            {ORIGINAL_GATES.map((gate) => (
              <article key={gate.gate} className="rounded-3xl border border-black/10 bg-[#fbfaf7] p-4">
                <div className="grid gap-4 lg:grid-cols-[120px_1fr_170px]">
                  <div>
                    <p className="font-display text-4xl font-semibold text-[#171717]">{gate.gate}</p>
                    <p className="mt-1 text-sm font-black text-[#8b4f2f]">{gate.amount}</p>
                    <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                      gate.status === "complete"
                        ? "bg-[#e8f5ee] text-[#1f7a4d]"
                        : gate.status === "ready"
                          ? "bg-[#eef4f3] text-[#335c67]"
                          : "bg-[#fff1db] text-[#9a5b13]"
                    }`}>
                      {gate.status === "complete" ? "Complete" : gate.status === "ready" ? "Ready to review" : "Client-dependent"}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    <GateLine label="Original scope" value={gate.scope} />
                    <GateLine label="What we built" value={gate.built} />
                    <GateLine label="Acceptance position" value={gate.signoff} />
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-[#666]">Invoice status</p>
                    <p className="mt-2 text-sm font-black leading-6 text-[#171717]">{gate.invoiceStatus}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ReviewOutcome({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#fbfaf7] p-4">
      <p className="text-sm font-black text-[#171717]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[#666]">{body}</p>
    </div>
  );
}

function ScopeCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
      <p className="font-black text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-white/70">{body}</p>
    </div>
  );
}

function GateLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-[#666]">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-[#333]">{value}</p>
    </div>
  );
}

function buildSummary(state: ReviewState) {
  const lines = [
    "KAI client review summary",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "Step results:",
  ];

  for (const step of REVIEW_STEPS) {
    const review = state.steps[step.id];
    lines.push(
      `- ${step.title}: ${review?.done ? "reviewed" : "not reviewed"}; rating=${review?.rating ?? "unset"}; notes=${review?.notes?.trim() || "none"}`,
    );
  }

  lines.push(
    "",
    "Final decision:",
    `- Reviewer: ${state.signoff.reviewerName || "unset"} (${state.signoff.reviewerRole || "unset"})`,
    `- Decision: ${state.signoff.decision}`,
    `- Next owner: ${state.signoff.nextOwner || "unset"}`,
    `- Blockers/fixes: ${state.signoff.blockers.trim() || "none listed"}`,
    "",
    "Scope rule: Bugs in reviewed scope get fixed. New ideas become change requests after testing evidence exists.",
  );

  return lines.join("\n");
}
