import { BookOpen, Brain, CheckCircle2, History, MessageCircle, RefreshCw, Target, Wind } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { EngineGuidesIndex } from "../components/engines/EngineGuidesIndex";
import { UnitWorkspace, type UnitModule } from "../components/engines/UnitWorkspace";
import { BreathingPlayer } from "../components/mental/BreathingPlayer";
import { ClinicalReviewBanner } from "../components/mental/ClinicalReviewBanner";
import { FeelingsCheckIn } from "../components/mental/FeelingsCheckIn";
import { FutureSelfLetter } from "../components/mental/FutureSelfLetter";
import { MeditationPlayer } from "../components/mental/MeditationPlayer";
import { SocialMediaReset } from "../components/mental/SocialMediaReset";
import { ThoughtReframe } from "../components/mental/ThoughtReframe";
import { DisclosureBanner } from "../components/safety/DisclosureBanner";
import { KaiChat } from "../components/kai/KaiChat";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import { getMentalPatternItems, mentalNextNudge, type MentalPatternItem, type MentalPatternKind } from "../lib/mental-history";
import type { EngineEntry, Goal } from "../lib/types";
import { useKaiStore } from "../stores/kaiStore";
import { useProgressStore } from "../stores/progressStore";
import { StrengthsDiscoveryCard } from "./EnginePotential";

const StressPrimer = lazy(() =>
  import("../components/physical/StressPrimer").then((module) => ({ default: module.StressPrimer }))
);
const IdentityPrimer = lazy(() =>
  import("../components/physical/IdentityPrimer").then((module) => ({ default: module.IdentityPrimer }))
);
const RelationshipsPrimer = lazy(() =>
  import("../components/physical/RelationshipsPrimer").then((module) => ({ default: module.RelationshipsPrimer }))
);

export function EngineMental() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const rememberToolCompletion = useKaiStore((state) => state.rememberToolCompletion);
  const [entries, setEntries] = useState<EngineEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalTitle, setGoalTitle] = useState("");
  const [nextStep, setNextStep] = useState("Spend 10 minutes on the smallest useful version.");
  const [reframe, setReframe] = useState("This still matters. I can make the next move smaller without quitting.");
  // All four flows (feelings, thought, social, letter) are now structured
  // components below. No remaining inline-action items.

  useEffect(() => {
    void api.getEngineEntries("mental").then((result) => setEntries(result.entries)).catch(() => undefined);
    void api.getGoals().then((result) => setGoals(result.goals)).catch(() => undefined);
  }, []);

  async function completeReset(input: { eventType: string; title: string; payload?: unknown; eventValue?: number }) {
    const optimistic: EngineEntry = {
      id: crypto.randomUUID(),
      engine: "mental",
      entryType: input.eventType,
      title: input.title,
      payload: input.payload ?? { completed: true },
      completedAt: new Date().toISOString()
    };
    setEntries((items) => [optimistic, ...items].slice(0, 8));
    addEvent({ engine: "mental", eventType: input.eventType, eventValue: input.eventValue ?? 24, payload: input.payload ?? { completed: true } });
    rememberToolCompletion({
      title: input.title,
      summary: mentalCompletionSummary(input.eventType, input.payload),
      nextActionId: mentalNextAction(input.eventType)
    });
    try {
      const result = await api.createEngineEntry("mental", {
        entryType: input.eventType,
        title: input.title,
        payload: input.payload ?? { completed: true },
        completed: true
      });
      setEntries((items) => items.map((item) => (item.id === optimistic.id ? result.entry : item)));
    } catch {
      // Keep the optimistic entry in demo mode.
    }
  }

  async function createGoal() {
    const title = goalTitle.trim();
    if (!title) return;
    const fallback: Goal = { id: crypto.randomUUID(), category: "custom", title, description: "Created with Kai after a mental reset.", status: "active" };
    setGoals((items) => [fallback, ...items]);
    setGoalTitle("");
    try {
      const result = await api.createGoal({ category: "custom", title, description: "Created with Kai after a mental reset." });
      setGoals((items) => items.map((goal) => (goal.id === fallback.id ? result.goal : goal)));
    } catch {
      // Keep the optimistic goal in demo mode.
    }
    await completeReset({
      eventType: "goal_created",
      title,
      payload: { title, source: "kai_mental_reset" },
      eventValue: 22
    });
  }

  const checkinPatterns = getMentalPatternItems(entries, "checkin");
  const reframePatterns = getMentalPatternItems(entries, "reframe");
  const resetPatterns = getMentalPatternItems(entries, "reset");
  const socialPatterns = getMentalPatternItems(entries, "social");
  const identityPatterns = getMentalPatternItems(entries, "identity");
  const goalPatterns = getMentalPatternItems(entries, "goal");

  const modules: UnitModule[] = [
    {
      id: "checkin",
      label: "Check-in",
      summary: "Name it",
      icon: Brain,
      content: (
        <div className="grid gap-4">
          <ClinicalReviewBanner />
          <DisclosureBanner />
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <FeelingsCheckIn
              onComplete={(payload) => {
                const peak = Math.max(...Object.values(payload.emotions));
                void completeReset({
                  eventType: "feelings_check_in",
                  title: "Feelings check-in",
                  payload,
                  eventValue: 18 + (payload.bodyArea ? 4 : 0) + (payload.note.trim().length > 0 ? 4 : 0) + (peak > 0 ? 2 : 0)
                });
              }}
            />
            <ThoughtReframe
              onComplete={(payload) =>
                void completeReset({
                  eventType: "thought_reframe",
                  title: "Thought reframe",
                  payload,
                  eventValue: 22 + (payload.evidenceFor.trim() ? 4 : 0) + (payload.evidenceAgainst.trim() ? 4 : 0)
                })
              }
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <MentalPatternPanel title="Feeling patterns" kind="checkin" items={checkinPatterns} />
            <MentalPatternPanel title="Reframes to keep" kind="reframe" items={reframePatterns} inverse />
          </div>
        </div>
      )
    },
    {
      id: "reset",
      label: "Reset",
      summary: "Breathe + settle",
      icon: Wind,
      content: (
        <div className="grid gap-4">
          <BreathingPlayer
            onSessionComplete={({ patternId, seconds }) =>
              void completeReset({
                eventType: "mental_breathing",
                title: `Breathing - ${patternId}`,
                payload: { patternId, seconds },
                eventValue: Math.min(40, 8 + Math.round(seconds / 10))
              })
            }
          />
          <MeditationPlayer
            onSessionComplete={({ durationSeconds, elapsedSeconds, completed }) =>
              void completeReset({
                eventType: "meditation",
                title: `Meditation - ${Math.round(durationSeconds / 60)} min`,
                payload: { durationSeconds, elapsedSeconds, completed },
                eventValue: Math.min(45, 10 + Math.round(elapsedSeconds / 12))
              })
            }
          />
          <SocialMediaReset
            onComplete={(payload) =>
              void completeReset({
                eventType: "social_reset",
                title: "Social media reset",
                payload,
                eventValue: 18 + (payload.replacement.trim() ? 6 : 0)
              })
            }
          />
          <FutureSelfLetter
            onComplete={(payload) =>
              void completeReset({
                eventType: "letter_written",
                title: `Letter to ${payload.direction} me`,
                payload,
                eventValue: 18 + (payload.body.trim().length > 120 ? 8 : 4)
              })
            }
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <MentalPatternPanel title="Body resets" kind="reset" items={resetPatterns} />
            <MentalPatternPanel title="Social boundaries" kind="social" items={socialPatterns} />
            <MentalPatternPanel title="Identity notes" kind="identity" items={identityPatterns} />
          </div>
        </div>
      )
    },
    {
      id: "purpose",
      label: "Purpose",
      summary: "Goals + identity",
      icon: Target,
      content: (
        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm">
              <div className="mb-5 grid size-12 place-items-center rounded-full bg-resetWash text-reset">
                <Target />
              </div>
              <p className="eyebrow">identity habit</p>
              <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Make one next move visible.</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-muted">Goals are treated as identity practice: small systems, honest effort, no fake hype.</p>
              <div className="mt-4 grid gap-2">
                <input className="field" value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="One thing I want to build, practice, repair, or try" />
                <Button onClick={() => void createGoal()} disabled={!goalTitle.trim()}>Add goal</Button>
              </div>
              <div className="mt-4 space-y-2">
                {goals.length === 0 && <p className="rounded-kai border border-line bg-paper p-3 text-sm text-muted">No goals yet. Add one tiny thing worth doing this week.</p>}
                {goals.slice(0, 4).map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    className="focus-ring flex w-full items-center gap-3 rounded-kai border border-line bg-paper p-3 text-left transition hover:bg-white"
                    onClick={() => {
                      setGoals((items) => items.map((item) => (item.id === goal.id ? { ...item, status: "achieved" } : item)));
                      void api.updateGoal(goal.id, { status: "achieved" }).catch(() => undefined);
                      void completeReset({ eventType: "goal_completed", title: goal.title, payload: { goalId: goal.id }, eventValue: 40 });
                    }}
                  >
                    <CheckCircle2 className={goal.status === "achieved" ? "text-sage" : "text-soft"} />
                    <span className="font-semibold">{goal.title}</span>
                  </button>
                ))}
              </div>
            </section>
            <div className="grid gap-4">
              <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm">
                <div className="mb-5 grid size-12 place-items-center rounded-full bg-resetWash text-reset"><Target /></div>
                <p className="eyebrow">next step planner</p>
                <h2 className="mt-2 font-display text-2xl font-black tracking-normal">Shrink it until it can start.</h2>
                <textarea className="field mt-4 min-h-24" value={nextStep} onChange={(event) => setNextStep(event.target.value)} />
                <Button className="mt-4" variant="secondary" onClick={() => void completeReset({ eventType: "next_step_planned", title: "Next step", payload: { nextStep }, eventValue: 22 })}>Save next step</Button>
              </section>
              <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm">
                <div className="mb-5 grid size-12 place-items-center rounded-full bg-resetWash text-reset"><RefreshCw /></div>
                <p className="eyebrow">reframe</p>
                <h2 className="mt-2 font-display text-2xl font-black tracking-normal">A goal can change without becoming a failure.</h2>
                <textarea className="field mt-4 min-h-24" value={reframe} onChange={(event) => setReframe(event.target.value)} />
                <Button className="mt-4" variant="secondary" onClick={() => void completeReset({ eventType: "goal_reframed", title: "Goal reframe", payload: { reframe }, eventValue: 24 })}>Save reframe</Button>
              </section>
            </div>
          </div>
          <StrengthsDiscoveryCard onComplete={(summary) => void completeReset({ eventType: "strengths_discovery", title: "Strengths summary", payload: { summary, source: "kai_mental_reset" }, eventValue: 60 })} />
          <MentalPatternPanel title="Goal patterns" kind="goal" items={goalPatterns} />
        </div>
      )
    },
    {
      id: "guides",
      label: "Guides",
      summary: "Learn fast",
      icon: BookOpen,
      content: (
        <div className="grid gap-4">
          <MentorCouncilPanel />
          <Suspense fallback={null}>
            <StressPrimer onRead={({ articleId }) => addEvent({ engine: "mental", eventType: "stress_primer_read", eventValue: 6, payload: { articleId } })} />
            <IdentityPrimer onRead={({ articleId }) => addEvent({ engine: "mental", eventType: "identity_primer_read", eventValue: 6, payload: { articleId } })} />
            <RelationshipsPrimer onRead={({ articleId }) => addEvent({ engine: "mental", eventType: "relationships_primer_read", eventValue: 6, payload: { articleId } })} />
            <EngineGuidesIndex engine="mental" title="Mind + growth guides" intro="Emotion, identity, stress, confidence, relationships, purpose, and habits. Each is short. Kai links here in chat when topics come up." />
            <EngineGuidesIndex engine="potential" eyebrow="goals guides" title="Purpose + doing guides" intro="Focus, motivation, money, decisions, and skill-building are here when Kai needs a practical next move." />
          </Suspense>
        </div>
      )
    },
    {
      id: "history",
      label: "History",
      summary: `${entries.length} saved`,
      icon: History,
      content: (
        <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm">
          <p className="eyebrow">reset history</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Recent mental work</h2>
          <div className="mt-4 space-y-2">
            {entries.length === 0 && <p className="rounded-kai border border-line bg-paper p-3 text-sm text-muted">No Reset entries yet. Complete one check-in, breathing session, or letter.</p>}
            {entries.slice(0, 6).map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-kai border border-line bg-paper p-3">
                <Brain className="text-coral" size={18} />
                <div>
                  <p className="text-sm font-black">{entry.title || labelForEntry(entry.entryType)}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{labelForEntry(entry.entryType)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )
    }
  ];

  return <UnitWorkspace title="Talk it through" label="Mind moves" tone="mental" intro="Feelings, confidence, purpose, identity, discipline, habits, and social pressure. Supportive, honest, never clinical." modules={modules} />;
}

function labelForEntry(entryType: string) {
  return entryType.replace(/_/g, " ");
}

function mentalNextAction(eventType: string) {
  if (eventType.includes("goal") || eventType.includes("strengths") || eventType.includes("next_step")) return "goal" as const;
  if (eventType.includes("breathing") || eventType.includes("meditation") || eventType.includes("social")) return "reset" as const;
  return "talk" as const;
}

function mentalCompletionSummary(eventType: string, payload: unknown) {
  const data = payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
  if (eventType === "feelings_check_in") return "Check-in is saved. Kai has more context for what is loud right now.";
  if (eventType === "thought_reframe") return "Reframe is saved. Keep the kinder version close for the next hard moment.";
  if (eventType.includes("breathing") || eventType.includes("meditation")) return "Reset is saved. Notice if your body feels even 5% steadier.";
  if (eventType === "social_reset") return "Social reset is saved. Protect your attention without making it dramatic.";
  if (eventType === "letter_written") return "Letter is saved. That is identity work, not just journaling.";
  if (eventType.includes("goal")) return "Goal rep is saved. One smaller next move beats more pressure.";
  if (typeof data.summary === "string") return "Strengths are saved. Kai can use them when a goal needs traction.";
  return "Mind rep is saved. Kai can use it for the next suggestion.";
}

function MentalPatternPanel({ title, kind, items, inverse = false }: { title: string; kind: MentalPatternKind; items: MentalPatternItem[]; inverse?: boolean }) {
  return (
    <section className={`rounded-[24px] border p-4 shadow-sm ${inverse ? "border-white/10 bg-ink text-paper" : "border-line bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-wider ${inverse ? "text-paper/45" : "text-muted"}`}>Kai notices</p>
          <h3 className={`mt-1 text-lg font-black ${inverse ? "text-paper" : "text-ink"}`}>{title}</h3>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${inverse ? "border-white/15 bg-white/10 text-paper/60" : "border-line bg-paper text-muted"}`}>
          private
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {items.length === 0 && (
          <p className={`rounded-kai border p-3 text-sm font-semibold leading-6 ${inverse ? "border-white/15 bg-white/10 text-paper/65" : "border-line bg-paper text-muted"}`}>
            {mentalNextNudge(kind)}
          </p>
        )}
        {items.map((item) => (
          <div key={item.id} className={`rounded-kai border p-3 ${inverse ? "border-white/15 bg-white/10" : "border-line bg-paper"}`}>
            <div className="flex items-start justify-between gap-3">
              <p className={`text-sm font-black ${inverse ? "text-paper" : "text-ink"}`}>{item.title}</p>
              <p className={`shrink-0 text-[10px] font-black uppercase tracking-wider ${inverse ? "text-paper/45" : "text-muted"}`}>{item.meta}</p>
            </div>
            <p className={`mt-1 text-sm font-semibold leading-5 ${inverse ? "text-paper/68" : "text-muted"}`}>{item.body}</p>
          </div>
        ))}
      </div>
      {items[0] && <p className={`mt-3 text-xs font-black leading-5 ${inverse ? "text-paper/55" : "text-muted"}`}>{mentalNextNudge(kind, items[0])}</p>}
    </section>
  );
}

function MentorCouncilPanel() {
  const guides = [
    "Daniel Siegel",
    "Andrew Huberman",
    "Viktor Frankl",
    "James Clear",
    "Carl Jung",
    "Stoic philosophy",
    "Modern teen psychology principles"
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[24px] border border-line bg-white p-5 shadow-sm">
        <div className="mb-5 grid size-12 place-items-center rounded-full bg-resetWash text-reset">
          <MessageCircle />
        </div>
        <p className="eyebrow">guide chat</p>
        <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Learn the pattern, then pick the rep.</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-muted">
          Kai can explain a situation through Daniel Siegel, Andrew Huberman, Viktor Frankl, James Clear, Carl Jung, stoic philosophy, or modern teen psychology principles.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {guides.map((guide) => (
            <span key={guide} className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-black text-ink">
              {guide}
            </span>
          ))}
        </div>
      </div>
      <KaiChat embedded mode="mental" />
    </section>
  );
}
