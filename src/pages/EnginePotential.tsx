import { Award, CheckCircle2, Target } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { EnginePanel } from "../components/engines/EnginePanel";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import type { Goal } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";

export function EnginePotential() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    void api.getGoals().then((result) => setGoals(result.goals)).catch(() => undefined);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const fallback = { id: crypto.randomUUID(), category: "custom" as const, title, status: "active" as const };
    setGoals((items) => [...items, fallback]);
    try {
      const result = await api.createGoal({ category: "custom", title });
      setGoals((items) => items.map((goal) => (goal.id === fallback.id ? result.goal : goal)));
    } catch {
      // Keep the optimistic local goal in demo mode.
    }
    addEvent({ engine: "potential", eventType: "goal_created", eventValue: 18, payload: { title } });
    setTitle("");
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
          <Button className="mt-5" onClick={() => addEvent({ engine: "potential", eventType: "strengths_discovery", eventValue: 28, payload: { completed: true } })}>Complete discovery</Button>
        </section>
        <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
          <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#EEEAFF] text-plum">
            <Target />
          </div>
          <p className="eyebrow">goals</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Make the next move visible.</h2>
          <form onSubmit={submit} className="mt-4 flex gap-2">
            <input className="field min-w-0 flex-1" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Start a goal" />
            <Button>Add</Button>
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
                  addEvent({ engine: "potential", eventType: "goal_hit", eventValue: 40, payload: { goalId: goal.id } });
                }}
              >
                <CheckCircle2 className={goal.status === "achieved" ? "text-sage" : "text-soft"} />
                <span className="font-semibold">{goal.title}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </EnginePanel>
  );
}
