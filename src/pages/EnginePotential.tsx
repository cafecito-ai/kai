import { Award, CheckCircle2, RefreshCw, Target } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { EnginePanel } from "../components/engines/EnginePanel";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
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
        <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
          <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#EEEAFF] text-plum">
            <Award />
          </div>
          <p className="eyebrow">strengths discovery</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Turn patterns into a first experiment.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">Energy, curiosity, feedback, repetition, courage, and one useful experiment. No big life plan required.</p>
          <div className="mt-4 grid gap-2">
            {["What do people ask me for help with?", "What do I keep practicing without being told?", "What problem do I notice faster than others?"].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => createEntry({ entryType: "strengths_discovery", title: prompt, payload: { prompt }, eventType: "strengths_discovery", eventValue: 28 })}
                className="focus-ring rounded-kai border border-line bg-paper p-3 text-left text-sm font-semibold transition hover:bg-white"
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>
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
