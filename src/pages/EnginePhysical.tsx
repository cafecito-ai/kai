import { Camera, CheckCircle2, Dumbbell, Eye, Lock, Moon, ScanLine, ShieldCheck, Utensils, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { EngineGuidesIndex } from "../components/engines/EngineGuidesIndex";
import { EnginePanel } from "../components/engines/EnginePanel";
import { SecondaryShelf } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import {
  describeFoodPhotoResult,
  formatFoodNutrition,
  getFoodPhotoFollowups,
  getFoodPhotoConfidenceLabel,
  getNutritionEstimateCaption,
  MEAL_CONTEXTS,
  type MealContextId
} from "../lib/food-photo";
import { localSafetyCheck } from "../lib/safety";
import type { EngineEntry, FoodPhotoItem, FoodPhotoResult } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";

export function EnginePhysical() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const [meal, setMeal] = useState("Turkey sandwich, apple, water");
  const [entries, setEntries] = useState<EngineEntry[]>([]);
  const [saving, setSaving] = useState("");
  const [foodPhoto, setFoodPhoto] = useState<File | null>(null);
  const [foodSafetyMessage, setFoodSafetyMessage] = useState("");
  const [foodPhotoMessage, setFoodPhotoMessage] = useState("");
  const [foodPhotoResult, setFoodPhotoResult] = useState<FoodPhotoResult | null>(null);
  const [mealContext, setMealContext] = useState<MealContextId>("school_lunch");
  const [bodyScanPhoto, setBodyScanPhoto] = useState<File | null>(null);
  const [bodyScanSaved, setBodyScanSaved] = useState(false);

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
    setFoodPhotoResult(null);
    const safety = localSafetyCheck(meal);
    if (!safety.safe) {
      setFoodSafetyMessage(
        "This sounds bigger than a normal food note. Kai will not score, reward, or optimize restriction. If eating or body thoughts feel hard to control, bring in a trusted adult or clinician."
      );
      return;
    }

    const photoResult = mode === "food_photo_stub" ? await api.analyzeFoodPhoto({ note: meal }) : null;
    if (photoResult) setFoodPhotoResult(photoResult);

    await completeEntry({
      entryType: mode,
      title: mode === "meal_log" ? "Fuel note" : "Food photo stub",
      payload:
        mode === "meal_log"
          ? { meal, mealContext, mode: "fuel_note" }
          : {
              meal,
              mealContext,
              mealId: photoResult?.mealId,
              items: photoResult?.items ?? [],
              totals: photoResult?.totals ?? null,
              confidence: photoResult?.confidence,
              notes: photoResult?.notes,
              labels: ["meal", "editable", "no calorie target"]
            },
      eventType: mode === "meal_log" ? "meal_logged" : "food_photo_stub",
      eventValue: mode === "meal_log" ? 24 : 12
    });
  }

  async function uploadFoodPhoto() {
    setFoodSafetyMessage("");
    setFoodPhotoMessage("");
    setFoodPhotoResult(null);
    if (!foodPhoto) {
      setFoodPhotoMessage("Choose or take a food photo first.");
      return;
    }
    const safety = localSafetyCheck(meal);
    if (!safety.safe) {
      setFoodSafetyMessage(
        "This sounds bigger than a normal food note. Kai will not score, reward, or optimize restriction. If eating or body thoughts feel hard to control, bring in a trusted adult or clinician."
      );
      return;
    }

    setSaving("food_photo_upload");
    try {
      const photoResult = await api.uploadFoodPhoto(foodPhoto, meal);
      setFoodPhotoResult(photoResult);
      setFoodPhotoMessage(photoResult.items.length > 0 ? `Photo saved. Kai saw: ${photoResult.items.map((item) => item.name).join(", ")}.` : "Photo saved. Add a note if Kai could not read the food clearly.");
      await completeEntry({
        entryType: "food_photo",
        title: "Food photo",
        payload: {
          meal,
          mealContext,
          mealId: photoResult.mealId,
          r2Key: photoResult.r2Key,
          items: photoResult.items,
          totals: photoResult.totals,
          confidence: photoResult.confidence,
          notes: photoResult.notes,
          labels: ["meal", "photo", "editable", "no calorie target"]
        },
        eventType: "food_photo",
        eventValue: 28
      });
      setFoodPhoto(null);
    } catch {
      setFoodPhotoMessage("Could not upload that photo yet. The fuel note still works.");
    } finally {
      setSaving("");
    }
  }

  async function saveBodyScanPreview() {
    setBodyScanSaved(false);
    await completeEntry({
      entryType: "body_scan_preview",
      title: "Private body scan preview",
      payload: {
        hasPhoto: Boolean(bodyScanPhoto),
        mode: "private_preview",
        focus: ["posture", "mobility", "readiness", "confidence"],
        guardrails: ["no body score", "no comparison", "no attractiveness rating", "teen-safe framing"]
      },
      eventType: "body_scan_preview",
      eventValue: 18
    });
    setBodyScanSaved(true);
    setBodyScanPhoto(null);
  }

  return (
    <EnginePanel title="Physical" label="Body" accent="text-sage" intro="Food camera, movement, sleep, hydration, posture, mobility, and recovery. Useful, pattern-aware, never obsessive.">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-calm border border-line bg-ink p-5 text-paper shadow-calm sm:p-6">
          <p className="eyebrow text-soft">start here</p>
          <h2 className="mt-3 max-w-xl font-display text-4xl font-black leading-none tracking-normal">
            Fuel notes, not calorie math.
          </h2>
          <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-paper/70">
            The first version captures what happened, how it felt, and what helped. It avoids good/bad meal labels, body scoring, and weight-loss loops.
          </p>
          <textarea className="field mt-5 min-h-28 border-white/10 bg-white/10 text-paper placeholder:text-paper/50" value={meal} onChange={(event) => setMeal(event.target.value)} />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Meal context">
            {MEAL_CONTEXTS.map((context) => (
              <button
                key={context.id}
                type="button"
                onClick={() => setMealContext(context.id)}
                className={`focus-ring shrink-0 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wider ${
                  mealContext === context.id
                    ? "border-white bg-white text-ink"
                    : "border-white/15 bg-white/10 text-paper/70"
                }`}
              >
                {context.label}
              </button>
            ))}
          </div>
          {foodSafetyMessage && <p className="mt-3 rounded-kai border border-white/15 bg-white/10 p-3 text-sm font-semibold leading-6 text-paper">{foodSafetyMessage}</p>}
          <label className="focus-ring mt-4 flex cursor-pointer items-center gap-3 rounded-kai border border-white/15 bg-white/10 p-3 text-sm font-black text-paper hover:border-white/40">
            <Camera size={18} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{foodPhoto ? foodPhoto.name : "Take or choose a food photo"}</span>
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => setFoodPhoto(event.target.files?.[0] ?? null)}
            />
          </label>
          {foodPhotoMessage && <p className="mt-3 rounded-kai border border-white/15 bg-white/10 p-3 text-sm font-semibold leading-6 text-paper">{foodPhotoMessage}</p>}
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
              disabled={!foodPhoto || saving === "food_photo_upload"}
              onClick={() => void uploadFoodPhoto()}
            >
              {saving === "food_photo_upload" ? "Uploading" : "Analyze selected photo"}
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
          {foodPhotoResult && <FoodPhotoResultCard result={foodPhotoResult} mealContext={mealContext} />}
        </section>
        <details className="group rounded-calm border border-line bg-white p-5 shadow-sm">
          <summary className="focus-ring -m-2 flex cursor-pointer list-none items-center justify-between gap-4 rounded-kai p-2">
            <span>
              <span className="eyebrow block">how body works</span>
              <span className="mt-2 block font-display text-2xl font-black leading-none tracking-normal">Descriptive, not judgmental.</span>
              <span className="mt-2 block text-sm font-semibold leading-6 text-muted">Kai keeps context, patterns, and guardrails behind the first rep.</span>
            </span>
            <span className="shrink-0 rounded-full border border-line bg-paper px-3 py-2 text-xs font-black text-muted group-open:bg-ink group-open:text-paper">
              Open
            </span>
          </summary>
          <div className="mt-4 grid gap-3">
            <div className="overflow-hidden rounded-calm border border-line bg-white shadow-sm">
              <img src="/images/food-photo-examples.png" alt="Example food photos for Kai food logging" className="h-48 w-full object-cover" />
              <div className="p-4">
                <p className="eyebrow">photo examples</p>
                <h3 className="mt-2 font-display text-xl font-black tracking-normal">Photos are context.</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Kai can use photos as context, then asks what helped and how it felt. No calorie targets or food scores.</p>
              </div>
            </div>
            <PhysicalModule icon={<Utensils />} title="Meal pattern" copy="What was eaten, when it happened, hunger/fullness, energy after, and any useful context." />
            <PhysicalModule icon={<Camera />} title="Camera tracker" copy="R2 upload, Workers AI vision, USDA estimate, and a review step before it becomes a remembered pattern." />
            <PhysicalModule icon={<Wind />} title="Guardrail" copy="Risk language redirects to support. No restriction rewards or body comparison." />
          </div>
        </details>
      </div>
      <SecondaryShelf eyebrow="more body reps" title="Movement, sleep, and recovery." summary="Use these when fuel is not the right first rep." count="3 tools">
        <div className="grid gap-4 md:grid-cols-3">
          <ActionCard
            icon={<Dumbbell />}
            title="Movement (manual)"
            copy="Practice, sport, walk, lift, stretch — log any session that wasn't a guided routine."
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
      </SecondaryShelf>
      <SecondaryShelf eyebrow="private beta" title="Full body scan preview." summary="A camera-first flow for posture, mobility, recovery, and progress context. No body score. No comparison." count="safe preview" defaultOpen>
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-calm border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 grid size-12 place-items-center rounded-full bg-bodyWash text-body">
              <ScanLine />
            </div>
            <p className="eyebrow">body scan</p>
            <h2 className="mt-2 font-display text-3xl font-black leading-none tracking-normal">Posture and readiness, not appearance.</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted">
              This v1 preview captures the experience and privacy model. Kai frames scans around alignment, tightness, recovery, and useful mobility suggestions.
            </p>
            <label className="focus-ring mt-4 flex cursor-pointer items-center gap-3 rounded-kai border border-line bg-paper p-3 text-sm font-black text-ink hover:border-ink/35">
              <Camera size={18} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{bodyScanPhoto ? bodyScanPhoto.name : "Take or choose a private scan photo"}</span>
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => {
                  setBodyScanSaved(false);
                  setBodyScanPhoto(event.target.files?.[0] ?? null);
                }}
              />
            </label>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <BodyScanPrinciple icon={<Lock />} title="Private by default" copy="The teen controls whether a scan is saved. No social sharing." />
              <BodyScanPrinciple icon={<ShieldCheck />} title="No body score" copy="Kai never rates attractiveness, size, leanness, or compares bodies." />
              <BodyScanPrinciple icon={<Eye />} title="Pattern view" copy="Progress means posture, comfort, recovery, and confidence over time." />
              <BodyScanPrinciple icon={<Wind />} title="Next move" copy="Suggestions stay practical: stretch, breathe, recover, hydrate, adjust form." />
            </div>
            {bodyScanSaved && (
              <p className="mt-4 rounded-kai border border-sage/25 bg-bodyWash p-3 text-sm font-black text-body">
                Scan preview saved as a private Body rep.
              </p>
            )}
            <Button className="mt-4" variant="secondary" onClick={() => void saveBodyScanPreview()}>
              Save private scan preview
            </Button>
          </section>
          <section className="rounded-calm border border-line bg-warmPaper p-5 shadow-sm sm:p-6">
            <p className="eyebrow">what Kai can say</p>
            <h3 className="mt-2 font-display text-2xl font-black tracking-normal">Supportive read, not a diagnosis.</h3>
            <div className="mt-4 space-y-3">
              {[
                "Your shoulders look a little rounded today. Try two minutes of chest opener and see if breathing feels easier.",
                "This looks like a recovery day, not a push day. Mobility and sleep beat forcing intensity.",
                "Progress timeline is private. We are watching confidence and function, not chasing a perfect body."
              ].map((copy) => (
                <p key={copy} className="rounded-kai border border-line bg-white p-3 text-sm font-semibold leading-6 text-muted">
                  {copy}
                </p>
              ))}
            </div>
          </section>
        </div>
      </SecondaryShelf>
      <SecondaryShelf eyebrow="body history" title="Recent physical entries" count={`${entries.length} saved`}>
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
      </SecondaryShelf>
      <EngineGuidesIndex
        engine="physical"
        title="Body + safety guides"
        intro="Quick reads on sleep, nutrition, body literacy, and the harder topics. Each one is 3-5 minutes. Kai links to these when relevant."
      />
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

function FoodPhotoResultCard({ result, mealContext }: { result: FoodPhotoResult; mealContext: MealContextId }) {
  const itemsWithNutrition = result.items.filter((item) => item.nutrition);
  const followups = getFoodPhotoFollowups(result, mealContext);
  return (
    <div className="mt-4 rounded-kai border border-white/15 bg-white/10 p-4 text-paper">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-soft">camera read</p>
          <h3 className="mt-1 font-display text-2xl font-black tracking-normal">Review what Kai saw.</h3>
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-paper/75">
          {getFoodPhotoConfidenceLabel(result.confidence)}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-paper/75">{describeFoodPhotoResult(result)}</p>
      {/* T-022 — Body agent's comment on the meal. Specific, observational,
          energy-focused. Comes back filtered for forbidden body-language. */}
      {result.bodyComment && (
        <div className="mt-3 rounded-kai border border-accent-cool/30 bg-accent-cool/10 p-3">
          <p className="text-xs font-black uppercase tracking-wider text-accent-cool">KAI says</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-paper">{result.bodyComment}</p>
        </div>
      )}
      {result.items.length > 0 && (
        <div className="mt-3 grid gap-2">
          {result.items.map((item, idx) => (
            <FoodPhotoItemRow key={`${item.name}-${idx}`} item={item} />
          ))}
        </div>
      )}
      {itemsWithNutrition.length > 0 && (
        <details className="mt-3 rounded-kai border border-white/15 bg-white/10 p-3">
          <summary className="focus-ring cursor-pointer list-none text-sm font-black text-paper">
            Show nutrition estimate
          </summary>
          <p className="mt-2 text-xs font-semibold leading-5 text-paper/65">{getNutritionEstimateCaption()}</p>
          {result.totals && (
            <p className="mt-2 rounded-kai border border-white/15 bg-ink/30 p-3 text-sm font-black text-paper">
              {formatFoodNutrition(result.totals)}
            </p>
          )}
        </details>
      )}
      <div className="mt-3 rounded-kai border border-white/15 bg-ink/25 p-3">
        <p className="text-xs font-black uppercase tracking-wider text-paper/60">next time Kai can ask</p>
        <div className="mt-2 grid gap-2">
          {followups.map((prompt) => (
            <p key={prompt} className="rounded-kai border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-paper/75">
              {prompt}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function FoodPhotoItemRow({ item }: { item: FoodPhotoItem }) {
  return (
    <div className="rounded-kai border border-white/15 bg-ink/25 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black capitalize">{item.name}</p>
        <p className="text-xs font-bold uppercase tracking-wider text-paper/60">
          {item.estimatedGrams ? `about ${item.estimatedGrams}g` : "portion unknown"}
        </p>
      </div>
      {item.nutrition && <p className="mt-1 text-xs font-semibold text-paper/65">{formatFoodNutrition(item.nutrition)}</p>}
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

function BodyScanPrinciple({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="rounded-kai border border-line bg-white p-3">
      <div className="mb-2 text-body">{icon}</div>
      <h3 className="text-sm font-black">{title}</h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-muted">{copy}</p>
    </div>
  );
}
