import { BookOpen, Camera, CheckCircle2, Dumbbell, Eye, History, Lock, Moon, ScanLine, ShieldCheck, Utensils, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { EngineGuidesIndex } from "../components/engines/EngineGuidesIndex";
import { UnitWorkspace, type UnitModule } from "../components/engines/UnitWorkspace";
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
import { movementInsight, normalizeMovementMinutes, normalizeSleepHours, sleepInsight, type SleepQuality } from "../lib/physical-logs";
import { getPhysicalHistoryItems, physicalNextNudge, type PhysicalHistoryKind, type PhysicalHistoryItem } from "../lib/physical-history";
import { localSafetyCheck } from "../lib/safety";
import type { EngineEntry, FoodPhotoItem, FoodPhotoResult } from "../lib/types";
import { useKaiStore } from "../stores/kaiStore";
import { useProgressStore } from "../stores/progressStore";

export function EnginePhysical() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const rememberToolCompletion = useKaiStore((state) => state.rememberToolCompletion);
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
  const [bodyScanMessage, setBodyScanMessage] = useState("");
  const [movementMinutes, setMovementMinutes] = useState("10");
  const [movementFocus, setMovementFocus] = useState("hips and back");
  const [sleepHours, setSleepHours] = useState("8");
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>("okay");
  const foodPhotoPreview = useObjectUrl(foodPhoto);

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
    rememberToolCompletion({
      title: input.title,
      summary: physicalCompletionSummary(input.entryType, input.payload),
      nextActionId: physicalNextAction(input.entryType)
    });
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

  async function logMeal(mode: "meal_log" | "food_example") {
    setFoodPhotoResult(null);
    setFoodPhotoMessage("");
    const safety = localSafetyCheck(meal);
    if (!safety.safe) {
      setFoodSafetyMessage(
        "This sounds bigger than a normal food note. Kai will not score, reward, or optimize restriction. If eating or body thoughts feel hard to control, bring in a trusted adult or clinician."
      );
      return;
    }

    let photoResult: FoodPhotoResult | null = null;
    setSaving(mode);
    try {
      photoResult = await api.analyzeFoodPhoto({ note: meal });
      setFoodPhotoResult(photoResult);
      setFoodPhotoMessage("Meal saved. Kai turned the note into a reviewable fuel log.");
    } catch {
      setFoodPhotoMessage("Connection dropped. Kai saved this as a local fuel note and can sync details later.");
    }

    await completeEntry({
      entryType: mode,
      title: mode === "meal_log" ? "Fuel note" : "Food example",
      payload:
        mode === "meal_log"
          ? {
              meal,
              mealContext,
              mode: "fuel_note",
              mealId: photoResult?.mealId,
              items: photoResult?.items ?? [],
              totals: photoResult?.totals ?? null,
              confidence: photoResult?.confidence,
              notes: photoResult?.notes,
              labels: ["meal", "manual", "editable", "no calorie target"]
            }
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
      eventType: mode === "meal_log" ? "meal_logged" : "food_example_logged",
      eventValue: mode === "meal_log" ? 24 : 14
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
    setBodyScanMessage("");
    setSaving("body_scan");
    try {
      const result = await api.uploadBodyScan(bodyScanPhoto);
      setEntries((items) => [result.entry, ...items].slice(0, 8));
      addEvent({ engine: "physical", eventType: "body_scan", eventValue: 22, payload: { scanId: result.scan.id, hasPhoto: Boolean(result.scan.r2Key) } });
      rememberToolCompletion({
        title: "Body scan",
        summary: result.scan.analysis.summary,
        nextActionId: "scan"
      });
      setBodyScanMessage(result.scan.analysis.summary);
      setBodyScanSaved(true);
      setBodyScanPhoto(null);
    } catch {
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
      setBodyScanMessage("Connection dropped. Kai saved a local scan preview and can sync the private scan later.");
      setBodyScanSaved(true);
      setBodyScanPhoto(null);
    } finally {
      setSaving("");
    }
  }

  function logMovement() {
    const minutes = normalizeMovementMinutes(movementMinutes);
    const focus = movementFocus.trim() || "mobility";
    void completeEntry({
      entryType: "movement_log",
      title: "Stretch / move",
      payload: { type: "stretch_move", minutes, focus, insight: movementInsight(minutes, focus) },
      eventType: "workout",
      eventValue: minutes >= 20 ? 30 : 18
    });
  }

  function logSleep() {
    const hours = normalizeSleepHours(sleepHours);
    void completeEntry({
      entryType: "sleep_log",
      title: "Log sleep",
      payload: { hours, quality: sleepQuality, insight: sleepInsight(hours, sleepQuality) },
      eventType: "sleep_log",
      eventValue: hours >= 8 ? 22 : 14
    });
  }

  const lastMovement = entries.find((entry) => entry.entryType === "movement_log");
  const lastSleep = entries.find((entry) => entry.entryType === "sleep_log");
  const foodHistory = getPhysicalHistoryItems(entries, "food");
  const scanHistory = getPhysicalHistoryItems(entries, "scan");
  const movementHistory = getPhysicalHistoryItems(entries, "movement");
  const sleepHistory = getPhysicalHistoryItems(entries, "sleep");
  const resetHistory = getPhysicalHistoryItems(entries, "reset", 2);

  const modules: UnitModule[] = [
    {
      id: "food",
      label: "Food",
      summary: "Photo + fuel",
      icon: Camera,
      content: (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[24px] border border-line bg-ink p-5 text-paper shadow-calm sm:p-6">
            <p className="eyebrow text-soft">Log food</p>
            <h2 className="mt-3 max-w-[10ch] font-display text-4xl font-black leading-none tracking-normal sm:max-w-xl">Log food</h2>
            <p className="mt-3 max-w-[17rem] text-sm font-medium leading-6 text-paper/70 sm:max-w-xl">To fuel your workouts correctly. Snap it, name it, move on.</p>
            {foodSafetyMessage && <p className="mt-3 rounded-kai border border-white/15 bg-white/10 p-3 text-sm font-semibold leading-6 text-paper">{foodSafetyMessage}</p>}
            <label className="focus-ring mt-4 block cursor-pointer overflow-hidden rounded-[24px] border border-white/15 bg-white/10 text-paper transition hover:border-white/40 hover:bg-white/[0.13]">
              <span className="flex min-h-24 items-center gap-3 p-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-ink">
                  <Camera size={20} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black">{foodPhoto ? "Photo ready" : "Take or choose a food photo"}</span>
                  <span className="mt-1 block truncate text-xs font-semibold text-paper/55">{foodPhoto ? foodPhoto.name : "Kai reads it as fuel, not a score."}</span>
                </span>
              </span>
              {foodPhotoPreview && (
                <span className="block border-t border-white/10 bg-black/25 p-2">
                  <img src={foodPhotoPreview} alt="Selected food preview" className="h-36 w-full rounded-[18px] object-cover" />
                </span>
              )}
              <input className="sr-only" type="file" accept="image/*" onChange={(event) => setFoodPhoto(event.target.files?.[0] ?? null)} />
            </label>
            {foodPhotoMessage && <p className="mt-3 rounded-kai border border-white/15 bg-white/10 p-3 text-sm font-semibold leading-6 text-paper">{foodPhotoMessage}</p>}
            <label className="mt-4 block text-xs font-black uppercase tracking-wider text-paper/45">
              Quick note
              <textarea className="field mt-2 min-h-20 border-white/10 bg-white/10 text-paper placeholder:text-paper/50" value={meal} onChange={(event) => setMeal(event.target.value)} />
            </label>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Meal context">
              {MEAL_CONTEXTS.map((context) => (
                <button key={context.id} type="button" onClick={() => setMealContext(context.id)} className={`focus-ring shrink-0 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wider ${mealContext === context.id ? "border-white bg-white text-ink" : "border-white/15 bg-white/10 text-paper/70"}`}>
                  {context.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
              {foodExamples.map((example) => (
                <button key={example.title} type="button" onClick={() => setMeal(example.note)} className="focus-ring overflow-hidden rounded-kai border border-white/15 bg-white/10 text-left">
                  <img src="/images/food-photo-examples.png" alt={example.title} className={`h-20 w-full object-cover ${example.position}`} />
                  <span className="block px-2 py-1.5 text-[11px] font-black leading-tight text-paper/80">{example.title}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button disabled={saving === "meal_log"} onClick={() => void logMeal("meal_log")}>{saving === "meal_log" ? "Logging" : "Log food"}</Button>
              <Button variant="secondary" className="border-white/20 bg-white/10 text-paper hover:border-white/50" disabled={!foodPhoto || saving === "food_photo_upload"} onClick={() => void uploadFoodPhoto()}>
                {saving === "food_photo_upload" ? "Uploading" : "Analyze selected photo"}
              </Button>
              <Button variant="secondary" className="border-white/20 bg-white/10 text-paper hover:border-white/50" disabled={saving === "food_example"} onClick={() => void logMeal("food_example")}>
                Use example note
              </Button>
            </div>
            {foodPhotoResult && <FoodPhotoResultCard result={foodPhotoResult} mealContext={mealContext} />}
          </section>
          <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm">
            <p className="eyebrow">physical loop</p>
            <h2 className="mt-2 font-display text-2xl font-black leading-none tracking-normal">Fuel, scan, stretch, sleep.</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">Kai keeps context, patterns, and guardrails behind the first rep.</p>
            <div className="mt-4 grid gap-3">
              <PhysicalModule icon={<Utensils />} title="Log food" copy="To fuel your workouts correctly." />
              <PhysicalModule icon={<Camera />} title="Body scan" copy="To keep your posture, alignment, and body composition in check — including body fat, muscle balance, recovery, and areas to improve. Kai analyzes your progress and helps guide you toward healthier, more effective ways to reach your goals safely." />
              <PhysicalModule icon={<Wind />} title="Stretch / move" copy="To maintain mobility and prevent injury. Prop your phone up and let Kai guide you through stretches in real time — tracking your movement, correcting your form, improving posture, and coaching your breathing as you go." />
              <PhysicalModule icon={<Moon />} title="Log sleep" copy="To ensure your body is actually recovering from the work." />
            </div>
            <PhysicalHistoryPanel title="Saved fuel" kind="food" items={foodHistory} />
          </section>
        </div>
      )
    },
    {
      id: "movement",
      label: "Stretch / move",
      summary: "Mobility + form",
      icon: Dumbbell,
      content: (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm">
            <div className="mb-4 grid size-11 place-items-center rounded-full bg-lime text-sage"><Dumbbell /></div>
            <p className="eyebrow">Stretch / move</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Tell Kai what your body needs.</h2>
            <p className="mt-3 text-sm leading-6 text-muted">To maintain mobility and prevent injury. Prop your phone up and let Kai guide you through stretches in real time — tracking your movement, correcting your form, improving posture, and coaching your breathing as you go.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-[8rem_1fr]">
              <label className="text-sm font-black">
                Minutes
                <input className="field mt-2" inputMode="numeric" value={movementMinutes} onChange={(event) => setMovementMinutes(event.target.value)} />
              </label>
              <label className="text-sm font-black">
                Focus
                <input className="field mt-2" value={movementFocus} onChange={(event) => setMovementFocus(event.target.value)} placeholder="hips, back, shoulders..." />
              </label>
            </div>
            <p className="mt-3 rounded-kai border border-line bg-paper p-3 text-sm font-semibold leading-6 text-muted">
              {movementInsight(normalizeMovementMinutes(movementMinutes), movementFocus)}
            </p>
            <Button className="mt-4" variant="secondary" disabled={saving === "movement_log"} onClick={logMovement}>
              {saving === "movement_log" ? "Logging" : "Log stretch / move"}
            </Button>
            {lastMovement && <SavedSignal entry={lastMovement} />}
            <PhysicalHistoryPanel title="Movement history" kind="movement" items={movementHistory} />
          </section>

          <section className="rounded-[24px] border border-line bg-ink p-5 text-paper shadow-calm">
            <div className="mb-4 grid size-11 place-items-center rounded-full bg-white/10 text-paper"><Moon /></div>
            <p className="eyebrow text-soft">Log sleep</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Recovery is the base layer.</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-paper/70">To ensure your body is actually recovering from the work.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-[8rem_1fr]">
              <label className="text-sm font-black">
                Hours
                <input className="field mt-2 border-white/10 bg-white/10 text-paper placeholder:text-paper/45" inputMode="decimal" value={sleepHours} onChange={(event) => setSleepHours(event.target.value)} />
              </label>
              <div>
                <p className="text-sm font-black">Quality</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["rough", "okay", "solid"] as SleepQuality[]).map((quality) => (
                    <button key={quality} type="button" onClick={() => setSleepQuality(quality)} className={`focus-ring min-h-11 rounded-full text-sm font-black capitalize ${sleepQuality === quality ? "bg-white text-ink" : "bg-white/10 text-paper/70"}`}>
                      {quality}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 rounded-kai border border-white/15 bg-white/10 p-3 text-sm font-semibold leading-6 text-paper/75">
              {sleepInsight(normalizeSleepHours(sleepHours), sleepQuality)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button disabled={saving === "sleep_log"} onClick={logSleep}>{saving === "sleep_log" ? "Logging" : "Log sleep"}</Button>
              <Button variant="secondary" className="border-white/20 bg-white/10 text-paper hover:border-white/50" disabled={saving === "recovery_reset"} onClick={() => void completeEntry({ entryType: "recovery_reset", title: "Recovery reset", payload: { pattern: "box", focus: "breathing and downshift" }, eventType: "breathing_session", eventValue: 20 })}>
                {saving === "recovery_reset" ? "Saving" : "Complete reset"}
              </Button>
            </div>
            {lastSleep && <SavedSignal entry={lastSleep} inverse />}
            <PhysicalHistoryPanel title="Sleep history" kind="sleep" items={sleepHistory} inverse />
            <PhysicalHistoryPanel title="Recovery resets" kind="reset" items={resetHistory} inverse />
          </section>
        </div>
      )
    },
    {
      id: "scan",
      label: "Body scan",
      summary: "Private beta",
      icon: ScanLine,
      content: (
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 grid size-12 place-items-center rounded-full bg-bodyWash text-body"><ScanLine /></div>
            <p className="eyebrow">Body scan</p>
            <h2 className="mt-2 font-display text-3xl font-black leading-none tracking-normal">Body scan</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted">To keep your posture, alignment, and body composition in check — including body fat, muscle balance, recovery, and areas to improve. Kai analyzes your progress and helps guide you toward healthier, more effective ways to reach your goals safely.</p>
            <label className="focus-ring mt-4 flex cursor-pointer items-center gap-3 rounded-kai border border-line bg-paper p-3 text-sm font-black text-ink hover:border-ink/35">
              <Camera size={18} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{bodyScanPhoto ? bodyScanPhoto.name : "Take or choose a private scan photo"}</span>
              <input className="sr-only" type="file" accept="image/*" onChange={(event) => { setBodyScanSaved(false); setBodyScanPhoto(event.target.files?.[0] ?? null); }} />
            </label>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <BodyScanPrinciple icon={<Lock />} title="Private by default" copy="The teen controls whether a scan is saved. No social sharing." />
              <BodyScanPrinciple icon={<ShieldCheck />} title="No body score" copy="Kai never rates attractiveness, size, leanness, or compares bodies." />
              <BodyScanPrinciple icon={<Eye />} title="Pattern view" copy="Progress means posture, comfort, recovery, and confidence over time." />
              <BodyScanPrinciple icon={<Wind />} title="Next move" copy="Suggestions stay practical: stretch, breathe, recover, hydrate, adjust form." />
            </div>
            {bodyScanSaved && <p className="mt-4 rounded-kai border border-sage/25 bg-bodyWash p-3 text-sm font-black text-body">{bodyScanMessage || "Private body scan saved."}</p>}
            <Button className="mt-4" variant="secondary" disabled={saving === "body_scan"} onClick={() => void saveBodyScanPreview()}>
              {saving === "body_scan" ? "Saving scan" : "Save private body scan"}
            </Button>
            <PhysicalHistoryPanel title="Private scan history" kind="scan" items={scanHistory} />
          </section>
          <section className="rounded-[24px] border border-line bg-warmPaper p-5 shadow-sm sm:p-6">
            <p className="eyebrow">what Kai can say</p>
            <h3 className="mt-2 font-display text-2xl font-black tracking-normal">Supportive read, not a diagnosis.</h3>
            <div className="mt-4 space-y-3">
              {["Your shoulders look a little rounded today. Try two minutes of chest opener and see if breathing feels easier.", "This looks like a recovery day, not a push day. Mobility and sleep beat forcing intensity.", "Progress timeline is private. We are watching confidence and function, not chasing a perfect body."].map((copy) => (
                <p key={copy} className="rounded-kai border border-line bg-white p-3 text-sm font-semibold leading-6 text-muted">{copy}</p>
              ))}
            </div>
          </section>
        </div>
      )
    },
    {
      id: "guides",
      label: "Guides",
      summary: "Body literacy",
      icon: BookOpen,
      content: <EngineGuidesIndex engine="physical" title="Body + safety guides" intro="Quick reads on sleep, nutrition, body literacy, and the harder topics. Each one is 3-5 minutes. Kai links to these when relevant." />
    },
    {
      id: "history",
      label: "History",
      summary: `${entries.length} saved`,
      icon: History,
      content: (
        <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm">
          <p className="eyebrow">body history</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Recent physical entries</h2>
          <div className="mt-4 space-y-2">
            {entries.length === 0 && <p className="rounded-kai border border-line bg-paper p-3 text-sm text-muted">No saved body reps yet. Log one fuel, movement, sleep, or recovery note.</p>}
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
      )
    }
  ];

  return <UnitWorkspace title="Take care of your body" label="Body moves" tone="physical" intro="Food. Scan. Move. Sleep. Private, useful." modules={modules} />;
}

const foodExamples = [
  { title: "sandwich + apple", note: "Turkey sandwich, apple, water", position: "object-left" },
  { title: "yogurt bowl", note: "Yogurt, berries, granola", position: "object-center" },
  { title: "rice bowl", note: "Rice bowl with chicken, greens, avocado", position: "object-right" }
];

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setUrl("");
      return undefined;
    }
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  return url;
}

function labelForEntry(entryType: string) {
  return entryType.replace(/_/g, " ");
}

function physicalNextAction(entryType: string) {
  if (entryType.includes("meal") || entryType.includes("food")) return "food" as const;
  if (entryType.includes("sleep")) return "sleep" as const;
  if (entryType.includes("movement")) return "stretch" as const;
  if (entryType.includes("scan")) return "scan" as const;
  return "reset" as const;
}

function physicalCompletionSummary(entryType: string, payload: unknown) {
  const data = readPayload(payload);
  const insight = typeof data.insight === "string" ? data.insight : "";
  if (insight) return insight;
  if (entryType.includes("meal") || entryType.includes("food")) return "Fuel is logged. Kai can use it when choosing the next body move.";
  if (entryType.includes("scan")) return "Private scan context is saved. No body score, no comparison.";
  if (entryType.includes("recovery")) return "Recovery reset is logged. Keep the next move small and steady.";
  return "Body rep is logged. Kai can use it for the next suggestion.";
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
  const sourceLabel = result.r2Key ? "camera read" : "fuel note";
  return (
    <div className="mt-4 rounded-kai border border-white/15 bg-white/10 p-4 text-paper">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-soft">{sourceLabel}</p>
          <h3 className="mt-1 font-display text-2xl font-black tracking-normal">Review what Kai saw.</h3>
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-paper/75">
          {getFoodPhotoConfidenceLabel(result.confidence)}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-paper/75">{describeFoodPhotoResult(result)}</p>
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

function BodyScanPrinciple({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="rounded-kai border border-line bg-white p-3">
      <div className="mb-2 text-body">{icon}</div>
      <h3 className="text-sm font-black">{title}</h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-muted">{copy}</p>
    </div>
  );
}

function PhysicalHistoryPanel({ title, kind, items, inverse = false }: { title: string; kind: PhysicalHistoryKind; items: PhysicalHistoryItem[]; inverse?: boolean }) {
  return (
    <div className={`mt-4 rounded-[22px] border p-4 ${inverse ? "border-white/15 bg-white/10" : "border-line bg-paper"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-wider ${inverse ? "text-paper/45" : "text-muted"}`}>Kai saved</p>
          <h3 className={`mt-1 text-base font-black ${inverse ? "text-paper" : "text-ink"}`}>{title}</h3>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${inverse ? "border-white/15 bg-white/10 text-paper/60" : "border-line bg-white text-muted"}`}>
          private
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {items.length === 0 && (
          <p className={`rounded-kai border p-3 text-sm font-semibold leading-6 ${inverse ? "border-white/15 bg-ink/20 text-paper/65" : "border-line bg-white text-muted"}`}>
            {physicalNextNudge(kind)}
          </p>
        )}
        {items.map((item) => (
          <div key={item.id} className={`rounded-kai border p-3 ${inverse ? "border-white/15 bg-ink/20" : "border-line bg-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <p className={`text-sm font-black ${inverse ? "text-paper" : "text-ink"}`}>{item.title}</p>
              <p className={`shrink-0 text-[10px] font-black uppercase tracking-wider ${inverse ? "text-paper/45" : "text-muted"}`}>{item.meta}</p>
            </div>
            <p className={`mt-1 text-sm font-semibold leading-5 ${inverse ? "text-paper/68" : "text-muted"}`}>{item.body}</p>
          </div>
        ))}
      </div>
      {items[0] && <p className={`mt-3 text-xs font-black leading-5 ${inverse ? "text-paper/55" : "text-muted"}`}>{physicalNextNudge(kind, items[0])}</p>}
    </div>
  );
}

function SavedSignal({ entry, inverse = false }: { entry: EngineEntry; inverse?: boolean }) {
  const payload = readPayload(entry.payload);
  const insight = typeof payload.insight === "string" ? payload.insight : "Saved. Kai will use this as physical context.";
  return (
    <div className={`mt-4 rounded-kai border p-3 ${inverse ? "border-white/15 bg-white/10" : "border-line bg-paper"}`}>
      <p className={`text-xs font-black uppercase tracking-wider ${inverse ? "text-paper/45" : "text-muted"}`}>Last saved</p>
      <p className={`mt-1 text-sm font-semibold leading-6 ${inverse ? "text-paper/75" : "text-muted"}`}>{insight}</p>
    </div>
  );
}

function readPayload(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
}
