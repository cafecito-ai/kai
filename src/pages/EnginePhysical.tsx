import { Camera, Dumbbell, Moon, Wind } from "lucide-react";
import { useState } from "react";
import { EnginePanel } from "../components/engines/EnginePanel";
import { Button } from "../components/ui/Button";
import { useProgressStore } from "../stores/progressStore";

export function EnginePhysical() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const [meal, setMeal] = useState("Turkey sandwich, apple, water");

  return (
    <EnginePanel title="Physical Wellness" intro="Food, movement, sleep, stretching, and breathing. Useful, not obsessive.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Module icon={<Camera />} title="Food photo">
          <p className="text-sm text-ink/70">Upload flow is wired for R2 and Workers AI. Local demo uses editable recognition output.</p>
          <textarea className="focus-ring mt-3 w-full rounded-kai border border-ink/15 p-3" value={meal} onChange={(event) => setMeal(event.target.value)} />
          <Button className="mt-3" onClick={() => addEvent({ engine: "physical", eventType: "meal_logged", eventValue: 24, payload: { meal } })}>Log meal</Button>
        </Module>
        <Module icon={<Dumbbell />} title="Workout">
          <Button onClick={() => addEvent({ engine: "physical", eventType: "workout", eventValue: 30, payload: { type: "sport", duration: 35 } })}>Log 35 min</Button>
        </Module>
        <Module icon={<Moon />} title="Sleep">
          <Button variant="secondary" onClick={() => addEvent({ engine: "physical", eventType: "sleep_log", eventValue: 18, payload: { quality: 7 } })}>Log sleep</Button>
        </Module>
        <Module icon={<Wind />} title="Breathing and stretching">
          <div className="mb-3 h-28 animate-pulse rounded-full bg-sky/25" />
          <Button variant="secondary" onClick={() => addEvent({ engine: "physical", eventType: "breathing_session", eventValue: 20, payload: { pattern: "box" } })}>Complete session</Button>
        </Module>
      </div>
    </EnginePanel>
  );
}

function Module({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-kai border border-ink/10 bg-white p-5">
      <div className="mb-3 text-sage">{icon}</div>
      <h2 className="mb-3 text-xl font-black">{title}</h2>
      {children}
    </section>
  );
}
