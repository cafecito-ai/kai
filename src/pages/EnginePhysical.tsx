import { Camera, Dumbbell, Moon, Utensils, Wind } from "lucide-react";
import { useState } from "react";
import { EnginePanel } from "../components/engines/EnginePanel";
import { Button } from "../components/ui/Button";
import { useProgressStore } from "../stores/progressStore";

export function EnginePhysical() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const [meal, setMeal] = useState("Turkey sandwich, apple, water");

  return (
    <EnginePanel title="Physical wellness" label="Body" accent="text-sage" intro="Food, movement, sleep, stretching, and breathing. Useful, pattern-aware, never obsessive.">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-kai border border-line bg-ink p-5 text-paper shadow-soft sm:p-6">
          <p className="eyebrow text-soft">food tracking</p>
          <h2 className="mt-3 max-w-xl font-display text-4xl font-black leading-none tracking-normal">
            Fuel notes, not calorie math.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-paper/70">
            The first version captures what happened, how it felt, and what helped. It avoids good/bad meal labels, body scoring, and weight-loss loops.
          </p>
          <textarea className="field mt-5 min-h-28 border-white/10 bg-white/10 text-paper placeholder:text-paper/50" value={meal} onChange={(event) => setMeal(event.target.value)} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => addEvent({ engine: "physical", eventType: "meal_logged", eventValue: 24, payload: { meal, mode: "fuel_note" } })}>Log fuel note</Button>
            <Button variant="secondary" className="border-white/20 bg-white/10 text-paper hover:border-white/50" onClick={() => addEvent({ engine: "physical", eventType: "food_photo_stub", eventValue: 12, payload: { meal } })}>
              Photo stub
            </Button>
          </div>
        </section>
        <section className="grid gap-3">
          <PhysicalModule icon={<Utensils />} title="Meal pattern" copy="What was eaten, hunger/fullness, energy after, and any useful context." />
          <PhysicalModule icon={<Camera />} title="Photo flow" copy="R2 upload and Workers AI vision slot. Output stays soft: sandwich, fruit, water." />
          <PhysicalModule icon={<Wind />} title="Guardrail" copy="Risk language redirects to support. No restriction rewards or body comparison." />
        </section>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <ActionCard icon={<Dumbbell />} title="Movement" copy="Practice, sport, walk, lift, stretch." action="Log 35 min" onClick={() => addEvent({ engine: "physical", eventType: "workout", eventValue: 30, payload: { type: "sport", duration: 35 } })} />
        <ActionCard icon={<Moon />} title="Sleep" copy="Quality, blockers, and one experiment." action="Log sleep" onClick={() => addEvent({ engine: "physical", eventType: "sleep_log", eventValue: 18, payload: { quality: 7 } })} />
        <ActionCard icon={<Wind />} title="Recovery" copy="Breathing, soreness, hydration, reset." action="Complete reset" onClick={() => addEvent({ engine: "physical", eventType: "breathing_session", eventValue: 20, payload: { pattern: "box" } })} />
      </div>
    </EnginePanel>
  );
}

function PhysicalModule({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="rounded-kai border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 text-sage">{icon}</div>
      <h3 className="font-display text-xl font-black tracking-normal">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
    </div>
  );
}

function ActionCard({ icon, title, copy, action, onClick }: { icon: React.ReactNode; title: string; copy: string; action: string; onClick: () => void }) {
  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-4 grid size-11 place-items-center rounded-full bg-lime text-sage">{icon}</div>
      <h2 className="font-display text-2xl font-black tracking-normal">{title}</h2>
      <p className="my-3 text-sm leading-6 text-muted">{copy}</p>
      <Button variant="secondary" onClick={onClick}>{action}</Button>
    </section>
  );
}
