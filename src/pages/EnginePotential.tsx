import { Award, CheckCircle2, Target } from "lucide-react";
import { FormEvent, useState } from "react";
import { EnginePanel } from "../components/engines/EnginePanel";
import { Button } from "../components/ui/Button";
import type { Goal } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";

export function EnginePotential() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setGoals((items) => [...items, { id: crypto.randomUUID(), category: "custom", title, status: "active" }]);
    addEvent({ engine: "potential", eventType: "goal_created", eventValue: 18, payload: { title } });
    setTitle("");
  }

  return (
    <EnginePanel title="Potential & Goals" intro="Find the thing you keep circling, then make it concrete enough to touch.">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-kai border border-ink/10 bg-white p-5">
          <Award className="mb-3 text-amber" />
          <h2 className="text-xl font-black">Strengths discovery</h2>
          <p className="mt-2 text-sm text-ink/70">Prompt sequence: energy, curiosity, feedback, repetition, courage, and first useful experiment.</p>
          <Button className="mt-4" onClick={() => addEvent({ engine: "potential", eventType: "strengths_discovery", eventValue: 28, payload: { completed: true } })}>Complete discovery</Button>
        </section>
        <section className="rounded-kai border border-ink/10 bg-white p-5">
          <Target className="mb-3 text-plum" />
          <h2 className="text-xl font-black">Goals</h2>
          <form onSubmit={submit} className="mt-3 flex gap-2">
            <input className="focus-ring min-w-0 flex-1 rounded-kai border border-ink/15 px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Start a goal" />
            <Button>Add</Button>
          </form>
          <div className="mt-4 space-y-2">
            {goals.map((goal) => (
              <button
                key={goal.id}
                className="focus-ring flex w-full items-center gap-3 rounded-kai border border-ink/10 p-3 text-left"
                onClick={() => {
                  setGoals((items) => items.map((item) => (item.id === goal.id ? { ...item, status: "achieved" } : item)));
                  addEvent({ engine: "potential", eventType: "goal_hit", eventValue: 40, payload: { goalId: goal.id } });
                }}
              >
                <CheckCircle2 className={goal.status === "achieved" ? "text-sage" : "text-ink/30"} />
                <span>{goal.title}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </EnginePanel>
  );
}
