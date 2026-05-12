import { Camera, CheckCircle2, Dumbbell, Moon, Utensils, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { EnginePanel } from "../components/engines/EnginePanel";
import { RelationshipsPrimer } from "../components/physical/RelationshipsPrimer";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import { localSafetyCheck } from "../lib/safety";
import type { EngineEntry } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";

export function EnginePhysical() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const [meal, setMeal] = useState("Turkey sandwich, apple, water");
  const [entries, setEntries] = useState<EngineEntry[]>([]);
  const [saving, setSaving] = useState("");
  const [foodSafetyMessage, setFoodSafetyMessage] = useState("");

  useEffect(() => {
    void api.getEngineEntries("physical").then((result) => setEntries(result.entries)).catch(() => undefined);
  }, []);

  async function completeEntry(input: { entryType: string; title: string; payload?: unknown; eventType: string; eventValue: number }) {
    setFoodSafetyMessage("");
    setSaving(input.entryType);
    const optimistic: EngineEntry = {
      id: crypto.randomUUID(),
      engine: "physical",
      entryType: input.entryType,
      title: input.title,
      payload: input.payload ?? {},
      completedAt: new Date().toISOString()
    };
    setEntries((items) => [optimistic, ...items].slice(0, 8));
    addEvent({ engine: "physical", eventType: input.eventType, eventValue: input.eventValue, payload: input.payload });
    try {
      const result = await api.createEngineEntry("physical", {
        entryType: input.entryType,
        title: input.title,
        payload: input.payload,
        completed: true
      });
      setEntries((items) => items.map((item) => (item.id === optimistic.id ? result.entry : item)));
    } catch {
      // Keep the optimistic entry in demo mode.
    } finally {
      setSaving("");
    }
  }

  async function logMeal(mode: "meal_log" | "food_photo_stub") {
    const safety = localSafetyCheck(meal);
    if (!safety.safe) {
      setFoodSafetyMessage(
        "This sounds bigger than a normal food note. Kai will not score, reward, or optimize restriction. If eating or body thoughts feel hard to control, bring in a trusted adult or clinician."
      );
      return;
    }

    const photoResult = mode === "food_photo_stub" ? await api.analyzeFoodPhoto({ note: meal }) : null;

    await completeEntry({
      entryType: mode,
      title: mode === "meal_log" ? "Fuel note" : "Food photo stub",
      payload:
        mode === "meal_log"
          ? { meal, mode: "fuel_note" }
          : {
              meal,
              mealId: photoResult?.mealId,
              items: photoResult?.items ?? [],
              notes: photoResult?.notes,
              labels: ["meal", "editable", "no calorie target"]
            },
      eventType: mode === "meal_log" ? "meal_logged" : "food_photo_stub",
      eventValue: mode === "meal_log" ? 24 : 12
    });
  }

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
          {foodSafetyMessage && <p className="mt-3 rounded-kai border border-white/15 bg-white/10 p-3 text-sm font-semibold leading-6 text-paper">{foodSafetyMessage}</p>}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {foodExamples.map((example) => (
              <button
                key={example.title}
                type="button"
                onClick={() => setMeal(example.note)}
                className="focus-ring overflow-hidden rounded-kai border border-white/15 bg-white/10 text-left"
              >
                <img src="/images/food-photo-examples.png" alt={example.title} className={`h-24 w-full object-cover ${example.position}`} />
                <span className="block px-2 py-1.5 text-[11px] font-black text-paper/80">{example.title}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={saving === "meal_log"}
              onClick={() => logMeal("meal_log")}
            >
              {saving === "meal_log" ? "Logging" : "Log fuel note"}
            </Button>
            <Button
              variant="secondary"
              className="border-white/20 bg-white/10 text-paper hover:border-white/50"
              disabled={saving === "food_photo_stub"}
              onClick={() => void logMeal("food_photo_stub")}
            >
              Use photo example
            </Button>
          </div>
        </section>
        <section className="grid gap-3">
          <div className="overflow-hidden rounded-kai border border-line bg-white shadow-sm">
            <img src="/images/food-photo-examples.png" alt="Example food photos for Kai food logging" className="h-48 w-full object-cover" />
            <div className="p-4">
              <p className="eyebrow">photo examples</p>
              <h3 className="mt-2 font-display text-xl font-black tracking-normal">Descriptive, not judgmental.</h3>
              <p className="mt-2 text-sm leading-6 text-muted">Kai can use photos as context, then asks what helped and how it felt. No calorie targets or food scores.</p>
            </div>
          </div>
          <PhysicalModule icon={<Utensils />} title="Meal pattern" copy="What was eaten, hunger/fullness, energy after, and any useful context." />
          <PhysicalModule icon={<Camera />} title="Photo flow" copy="R2 upload and Workers AI vision slot. Output stays soft: sandwich, fruit, water." />
          <PhysicalModule icon={<Wind />} title="Guardrail" copy="Risk language redirects to support. No restriction rewards or body comparison." />
        </section>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <ActionCard
          icon={<Dumbbell />}
          title="Movement"
          copy="Practice, sport, walk, lift, stretch."
          action={saving === "movement_log" ? "Logging" : "Log 35 min"}
          onClick={() =>
            completeEntry({
              entryType: "movement_log",
              title: "Movement",
              payload: { type: "sport", duration: 35 },
              eventType: "workout",
              eventValue: 30
            })
          }
        />
        <ActionCard
          icon={<Moon />}
          title="Sleep"
          copy="Quality, blockers, and one experiment."
          action={saving === "sleep_log" ? "Logging" : "Log sleep"}
          onClick={() =>
            completeEntry({
              entryType: "sleep_log",
              title: "Sleep check",
              payload: { quality: 7 },
              eventType: "sleep_log",
              eventValue: 18
            })
          }
        />
        <ActionCard
          icon={<Wind />}
          title="Recovery"
          copy="Breathing, soreness, hydration, reset."
          action={saving === "recovery_reset" ? "Saving" : "Complete reset"}
          onClick={() =>
            completeEntry({
              entryType: "recovery_reset",
              title: "Recovery reset",
              payload: { pattern: "box" },
              eventType: "breathing_session",
              eventValue: 20
            })
          }
        />
      </div>
      <RelationshipsPrimer
        onRead={({ articleId }) =>
          addEvent({
            engine: "physical",
            eventType: "relationships_primer_read",
            eventValue: 6,
            payload: { articleId }
          })
        }
      />
      <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">body history</p>
            <h2 className="mt-1 font-display text-2xl font-black tracking-normal">Recent physical entries</h2>
          </div>
          <span className="rounded-full bg-lime px-3 py-1 text-xs font-black text-sage">{entries.length} saved</span>
        </div>
        <div className="space-y-2">
          {entries.length === 0 && <p className="rounded-kai border border-line bg-paper p-3 text-sm text-muted">No Body entries yet. Log one fuel, movement, sleep, or recovery note.</p>}
          {entries.slice(0, 6).map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 rounded-kai border border-line bg-paper p-3">
              <CheckCircle2 className="text-sage" size={18} />
              <div>
                <p className="text-sm font-black">{entry.title || labelForEntry(entry.entryType)}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{labelForEntry(entry.entryType)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </EnginePanel>
  );
}

const foodExamples = [
  { title: "sandwich + apple", note: "Turkey sandwich, apple, water", position: "object-left" },
  { title: "yogurt bowl", note: "Yogurt, berries, granola", position: "object-center" },
  { title: "rice bowl", note: "Rice bowl with chicken, greens, avocado", position: "object-right" }
];

function labelForEntry(entryType: string) {
  return entryType.replace(/_/g, " ");
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
