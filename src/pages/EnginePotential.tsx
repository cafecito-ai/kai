import { Award, CheckCircle2, RefreshCw, Target } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { EngineGuidesIndex } from "../components/engines/EngineGuidesIndex";
import { EnginePanel } from "../components/engines/EnginePanel";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import { STRENGTHS_DISCOVERY_QUESTIONS } from "../lib/strengths-questions";
import type { EngineEntry, Goal } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";

export function EnginePotential() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [entries, setEntries] = useState<EngineEntry[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Goal["category"]>("custom");
  const [description, setDescription] = useState("");
  const [nextStep, setNextStep] = useState("Spend 10 minutes on the first draft");
  const [reframe, setReframe] = useState("This goal still matters, but the next version can be smaller.");

  useEffect(() => {
    void api.getGoals().then((result) => setGoals(result.goals)).catch(() => undefined);
    void api.getEngineEntries("potential").then((result) => setEntries(result.entries)).catch(() => undefined);
  }, []);

  async function createEntry(input: { entryType: string; title: string; payload?: unknown; eventType: string; eventValue: number }) {
    const optimistic: EngineEntry = {
      id: crypto.randomUUID(),
      engine: "potential",
      entryType: input.entryType,
      title: input.title,
      payload: input.payload ?? {},
      completedAt: new Date().toISOString()
    };
    setEntries((items) => [optimistic, ...items].slice(0, 8));
    addEvent({ engine: "potential", eventType: input.eventType, eventValue: input.eventValue, payload: input.payload });
    try {
      const result = await api.createEngineEntry("potential", {
        entryType: input.entryType,
        title: input.title,
        payload: input.payload,
        completed: true
      });
      setEntries((items) => items.map((item) => (item.id === optimistic.id ? result.entry : item)));
    } catch {
      // Keep the optimistic entry in demo mode.
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const fallback = { id: crypto.randomUUID(), category, title, description, status: "active" as const };
    setGoals((items) => [...items, fallback]);
    try {
      const result = await api.createGoal({ category, title, description });
      setGoals((items) => items.map((goal) => (goal.id === fallback.id ? result.goal : goal)));
    } catch {
      // Keep the optimistic local goal in demo mode.
    }
    await createEntry({ entryType: "goal_created", title, payload: { title, category, description }, eventType: "goal_created", eventValue: 18 });
    setTitle("");
    setDescription("");
  }

  return (
    <EnginePanel title="Potential and goals" label="Goals" accent="text-plum" intro="Find the thing you keep circling, then make it concrete enough to touch.">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <StrengthsDiscoveryCard onComplete={(summary) => createEntry({ entryType: "strengths_discovery", title: "Strengths summary", payload: { summary }, eventType: "strengths_discovery", eventValue: 60 })} />
        <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
          <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#EEEAFF] text-plum">
            <Target />
          </div>
          <p className="eyebrow">goals</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Make the next move visible.</h2>
          <form onSubmit={submit} className="mt-4 grid gap-2">
            <div className="grid gap-2 sm:grid-cols-[0.7fr_1.3fr]">
              <select className="field" value={category} onChange={(event) => setCategory(event.target.value as Goal["category"])}>
                <option value="school">School</option>
                <option value="instrument">Instrument</option>
                <option value="sport">Sport</option>
                <option value="business">Business</option>
                <option value="charity">Charity</option>
                <option value="custom">Custom</option>
              </select>
              <input className="field min-w-0" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Start a goal" />
            </div>
            <textarea className="field min-h-20" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Why this matters, in one messy sentence" />
            <Button>Add goal</Button>
          </form>
          <div className="mt-4 space-y-2">
            {goals.length === 0 && <p className="rounded-kai border border-line bg-paper p-3 text-sm text-muted">No goals yet. Add one tiny thing worth doing this week.</p>}
            {goals.map((goal) => (
              <button
                key={goal.id}
                className="focus-ring flex w-full items-center gap-3 rounded-kai border border-line bg-paper p-3 text-left transition hover:bg-white"
                onClick={() => {
                  setGoals((items) => items.map((item) => (item.id === goal.id ? { ...item, status: "achieved" } : item)));
                  void api.updateGoal(goal.id, { status: "achieved" }).catch(() => undefined);
                  void createEntry({ entryType: "goal_completed", title: goal.title, payload: { goalId: goal.id }, eventType: "goal_hit", eventValue: 40 });
                }}
              >
                <CheckCircle2 className={goal.status === "achieved" ? "text-sage" : "text-soft"} />
                <span className="font-semibold">{goal.title}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
          <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#EEEAFF] text-plum">
            <Target />
          </div>
          <p className="eyebrow">next step planner</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Make it small enough to start.</h2>
          <textarea className="field mt-4 min-h-24" value={nextStep} onChange={(event) => setNextStep(event.target.value)} />
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => createEntry({ entryType: "next_step_planned", title: "Next step", payload: { nextStep }, eventType: "next_step_planned", eventValue: 22 })}
          >
            Save next step
          </Button>
        </section>
        <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
          <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#EEEAFF] text-plum">
            <RefreshCw />
          </div>
          <p className="eyebrow">release or reframe</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal">A goal can change without becoming a failure.</h2>
          <textarea className="field mt-4 min-h-24" value={reframe} onChange={(event) => setReframe(event.target.value)} />
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => createEntry({ entryType: "goal_reframed", title: "Goal reframe", payload: { reframe }, eventType: "goal_reframed", eventValue: 24 })}
          >
            Save reframe
          </Button>
        </section>
      </div>
      <EngineGuidesIndex
        engine="potential"
        title="Doing-things guides"
        intro="Focus, motivation, money, decisions, conflict. The skills that pay off across decades."
      />
      <History entries={entries} />
    </EnginePanel>
  );
}

function History({ entries }: { entries: EngineEntry[] }) {
  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">goals history</p>
          <h2 className="mt-1 font-display text-2xl font-black tracking-normal">Recent goal work</h2>
        </div>
        <span className="rounded-full bg-[#EEEAFF] px-3 py-1 text-xs font-black text-plum">{entries.length} saved</span>
      </div>
      <div className="space-y-2">
        {entries.length === 0 && <p className="rounded-kai border border-line bg-paper p-3 text-sm text-muted">No Goal entries yet. Complete discovery or add a goal.</p>}
        {entries.slice(0, 6).map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 rounded-kai border border-line bg-paper p-3">
            <CheckCircle2 className="text-plum" size={18} />
            <div>
              <p className="text-sm font-black">{entry.title || labelForEntry(entry.entryType)}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{labelForEntry(entry.entryType)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function labelForEntry(entryType: string) {
  return entryType.replace(/_/g, " ");
}

function StrengthsDiscoveryCard({ onComplete }: { onComplete: (summary: string) => void }) {
  const [mode, setMode] = useState<"idle" | "answering" | "summary">("idle");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const answeredCount = STRENGTHS_DISCOVERY_QUESTIONS.filter((q) => responses[q.id]?.trim()).length;

  function setAnswer(id: string, value: string) {
    setResponses((prev) => ({ ...prev, [id]: value }));
  }

  async function submit() {
    if (submitting || answeredCount === 0) return;
    setSubmitting(true);
    try {
      const result = await api.submitStrengthsDiscovery(responses);
      setSummary(result.summary);
      setMode("summary");
      onComplete(result.summary);
    } catch {
      // Demo fallback: stitch the first three answers into a placeholder summary.
      const fallback = STRENGTHS_DISCOVERY_QUESTIONS
        .map((q) => responses[q.id]?.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join("; ");
      setSummary(fallback ? `A few patterns to play with: ${fallback}.` : "");
      setMode("summary");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#EEEAFF] text-plum">
        <Award />
      </div>
      <p className="eyebrow">strengths discovery</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Turn patterns into a first experiment.</h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        Fifteen questions in five sections — energy, curiosity, feedback, repetition, courage. Takes about 15 minutes. No big life plan required.
      </p>

      {mode === "idle" && (
        <Button className="mt-4" variant="secondary" onClick={() => setMode("answering")}>
          Start strengths discovery
        </Button>
      )}

      {mode === "answering" && (
        <div className="mt-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {answeredCount} of {STRENGTHS_DISCOVERY_QUESTIONS.length} answered — skip any that don't land
          </p>
          {STRENGTHS_DISCOVERY_QUESTIONS.map((q, index) => (
            <label key={q.id} className="block">
              <span className="block text-sm font-semibold leading-snug">
                {index + 1}. {q.prompt}
              </span>
              <textarea
                className="field mt-2 min-h-20 w-full"
                value={responses[q.id] ?? ""}
                onChange={(event) => setAnswer(q.id, event.target.value)}
                placeholder="Anything you've got — even half a thought is fine."
              />
            </label>
          ))}
          <div className="flex gap-2">
            <Button onClick={submit} disabled={submitting || answeredCount === 0}>
              {submitting ? "Generating summary…" : "See Kai's read"}
            </Button>
            <Button variant="secondary" onClick={() => setMode("idle")}>
              Close
            </Button>
          </div>
        </div>
      )}

      {mode === "summary" && (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Working draft from Kai</p>
          <p className="rounded-kai border border-line bg-paper p-3 text-sm leading-6 text-ink">
            {summary || "Couldn't generate a summary this time. Save what you wrote and come back to it."}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setMode("answering")}>
              Edit answers
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setResponses({});
                setSummary("");
                setMode("idle");
              }}
            >
              Start over
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
