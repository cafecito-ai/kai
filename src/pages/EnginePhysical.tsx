import { Camera, Check, Dumbbell, Moon, ScanLine, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { UnitWorkspace, type UnitModule } from "../components/engines/UnitWorkspace";
import { PhysicalTrackerWidget, trackerEventValue } from "../components/physical/PhysicalTrackerWidget";
import { SleepWidget, sleepEventValue } from "../components/physical/SleepWidget";
import { Note } from "../components/ui/AppPrimitives";
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
import { KaiCueNote } from "../components/kai/KaiCueNote";
import { DisclosureBanner } from "../components/safety/DisclosureBanner";
import { localSafetyCheck } from "../lib/safety";
import type { BodyScanResult, FoodPhotoItem, FoodPhotoResult, ProgressEvent } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";

const FOOD_EVENT_TYPES = new Set(["food_photo", "food_photo_stub", "meal_logged"]);

export function EnginePhysical() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const events = useProgressStore((state) => state.events);
  const todaysFoodLogs = useMemo(() => filterTodaysFoodLogs(events), [events]);
  const [meal, setMeal] = useState("Turkey sandwich, apple, water");
  const [saving, setSaving] = useState("");
  const [foodPhoto, setFoodPhoto] = useState<File | null>(null);
  const [foodSafetyMessage, setFoodSafetyMessage] = useState("");
  const [foodPhotoMessage, setFoodPhotoMessage] = useState("");
  const [foodPhotoResult, setFoodPhotoResult] = useState<FoodPhotoResult | null>(null);
  const [mealContext, setMealContext] = useState<MealContextId>("school_lunch");
  const [bodyScanPhoto, setBodyScanPhoto] = useState<File | null>(null);
  const [bodyScanResult, setBodyScanResult] = useState<BodyScanResult | null>(null);
  const [bodyScanMessage, setBodyScanMessage] = useState("");
  const [kaiCue, setKaiCue] = useState<string | null>(null);

  async function completeEntry(input: { entryType: string; title: string; payload?: unknown; eventType: string; eventValue: number }) {
    setFoodSafetyMessage("");
    setSaving(input.entryType);
    addEvent({ engine: "physical", eventType: input.eventType, eventValue: input.eventValue, payload: input.payload });
    try {
      await api.createEngineEntry("physical", {
        entryType: input.entryType,
        title: input.title,
        payload: input.payload,
        completed: true
      });
    } catch {
      // Demo mode — the optimistic local progress event still shows in the home dashboard.
    } finally {
      setSaving("");
    }
    // Fire the Kai cue request non-blocking after the entry write.
    // Worker falls back to a static cue on any failure, so we don't
    // need to handle errors in the UI.
    void api
      .generateKaiCue({
        eventType: input.eventType,
        eventValue: input.eventValue,
        payload: (input.payload as Record<string, unknown> | undefined) ?? undefined
      })
      .then(({ cue }) => setKaiCue(cue))
      .catch(() => undefined);
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

  async function runBodyScan() {
    setBodyScanResult(null);
    setBodyScanMessage("");
    if (!bodyScanPhoto) {
      setBodyScanMessage("Choose a scan photo first.");
      return;
    }
    setSaving("body_scan");
    try {
      const result = await api.uploadBodyScan(bodyScanPhoto);
      setBodyScanResult(result);
      // Mirror the food-photo pattern: register the scan as a Physical
      // progress event so the dashboard reflects it. Payload deliberately
      // does NOT include the cue text — see worker comment in
      // routes/body-scan.ts for the rationale.
      addEvent({
        engine: "physical",
        eventType: "body_scan",
        eventValue: 18,
        payload: { scanId: result.scanId, confidence: result.confidence, cueCount: result.cues.length }
      });
      setBodyScanPhoto(null);
    } catch {
      setBodyScanMessage("Could not analyze that scan. The photo still saves to your private history — try again with full body visible.");
    } finally {
      setSaving("");
    }
  }

  const modules: UnitModule[] = [
    {
      id: "food",
      label: "Food",
      summary: "Photo + fuel",
      icon: Camera,
      content: (
        <div className="grid gap-4">
          <p className="max-w-[26ch] text-sm font-semibold leading-snug text-muted">
            Snap whenever you eat. Kai notes what's on the plate.
          </p>

          {/* Hero — dark camera CTA. The `<label>` wraps a hidden file input so the
              whole card is the tap-target on phone (matches Claude Design mock). */}
          <label className="camera-cta focus-ring">
            <div className="glow" aria-hidden="true" />
            <div className="relative flex items-center gap-4">
              <div className="shutter-mini" aria-hidden="true"><div /></div>
              <div>
                <div className="font-display text-[22px] font-black leading-[1.05] tracking-tight">Snap a meal</div>
                <div className="mt-1 text-sm font-semibold leading-snug text-paper/70">One photo. That's it.</div>
              </div>
            </div>
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => setFoodPhoto(event.target.files?.[0] ?? null)}
            />
          </label>

          {foodPhoto && (
            <section className="rounded-calm border border-line bg-white p-4 shadow-sm">
              <p className="eyebrow">selected</p>
              <p className="mt-1 truncate text-sm font-black text-ink">{foodPhoto.name}</p>
              <Button
                className="mt-3"
                disabled={saving === "food_photo_upload"}
                onClick={() => void uploadFoodPhoto()}
              >
                {saving === "food_photo_upload" ? "Uploading" : "Analyze photo"}
              </Button>
            </section>
          )}

          {/* Or write it out — preserved as a collapsed disclosure so the
              fuel-note flow stays accessible without crowding the hero. */}
          <details className="rounded-calm border border-line bg-white p-4 shadow-sm">
            <summary className="focus-ring cursor-pointer list-none text-sm font-black text-ink">
              Or write a fuel note
            </summary>
            <textarea
              className="field mt-3 min-h-24"
              value={meal}
              onChange={(event) => setMeal(event.target.value)}
              placeholder="What did you eat? A messy sentence is enough."
            />
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Meal context">
              {MEAL_CONTEXTS.map((context) => (
                <button
                  key={context.id}
                  type="button"
                  onClick={() => setMealContext(context.id)}
                  className={`focus-ring shrink-0 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${mealContext === context.id ? "border-ink bg-ink text-paper" : "border-line bg-white text-muted"}`}
                >
                  {context.label}
                </button>
              ))}
            </div>
            <Button className="mt-3" disabled={saving === "meal_log"} onClick={() => void logMeal("meal_log")}>
              {saving === "meal_log" ? "Logging" : "Log fuel note"}
            </Button>
          </details>

          {foodSafetyMessage && (
            <Note tone="warm">{foodSafetyMessage}</Note>
          )}
          {foodPhotoMessage && (
            <p className="rounded-kai border border-line bg-warmPaper p-3 text-sm font-semibold leading-snug text-ink">
              {foodPhotoMessage}
            </p>
          )}
          {foodPhotoResult && <FoodPhotoResultCard result={foodPhotoResult} mealContext={mealContext} />}

          {/* Today list per Claude Design v2 Food spec. Empty state is a
            * dashed card; with entries renders a small list row each.
            * Pulls from progressStore (single source of truth) — same
            * data the home dashboard reflects. */}
          <TodayFoodList logs={todaysFoodLogs} />
        </div>
      )
    },
    {
      id: "sleep",
      label: "Sleep",
      summary: "Tap to time it",
      icon: Moon,
      content: (
        <SleepWidget
          onSleepStart={(session) =>
            void completeEntry({
              entryType: "sleep_start",
              title: "Tapped Sleep",
              payload: session,
              eventType: "sleep_start",
              eventValue: 6
            })
          }
          onWokeUp={(result) =>
            void completeEntry({
              entryType: "sleep_end",
              title: "Tapped Woke Up",
              payload: result,
              eventType: "sleep_log",
              eventValue: sleepEventValue(result.durationMinutes)
            })
          }
        />
      )
    },
    {
      id: "scan",
      label: "Scan",
      summary: "Private beta",
      icon: ScanLine,
      content: (
        <div className="grid gap-4">
          {/* Persistent reassurance — sage Note. Stays visible across every
              scan interaction so the teen never sees the scan without the
              "no body score" message in view. */}
          <Note tone="sage" icon={<ShieldCheck size={15} aria-hidden="true" />}>
            No body score here. Posture and alignment only. Photos stay on your device.
          </Note>

          <section className="rounded-calm border border-line bg-white p-5 shadow-sm sm:p-6">
            <p className="eyebrow">setup</p>
            <h2 className="mt-2 font-display text-3xl font-black leading-none tracking-tight">Posture and readiness, not appearance.</h2>
            <p className="mt-3 max-w-[28ch] text-sm font-semibold leading-snug text-muted">
              Lean your phone where it can see all of you. Stand still for four seconds.
            </p>

            {/* Numbered setup tips — small ordered list, deliberately not a card */}
            <ol className="mt-5 grid gap-2">
              {[
                "Lean phone on a shelf or book.",
                "Step back so your full body fits.",
                "Stand neutral. Look forward."
              ].map((tip, idx) => (
                <li key={tip} className="flex items-center gap-3 rounded-kai border border-line bg-paper p-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink font-mono text-[11px] font-black text-paper">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold leading-snug text-ink">{tip}</span>
                </li>
              ))}
            </ol>

            <label className="focus-ring mt-5 flex cursor-pointer items-center gap-3 rounded-kai border border-line bg-paper p-3 text-sm font-black text-ink hover:border-ink/35">
              <Camera size={18} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{bodyScanPhoto ? bodyScanPhoto.name : "Take or choose a scan photo"}</span>
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => {
                  setBodyScanResult(null);
                  setBodyScanMessage("");
                  setBodyScanPhoto(event.target.files?.[0] ?? null);
                }}
              />
            </label>

            {bodyScanMessage && (
              <Note tone="warm" className="mt-4">{bodyScanMessage}</Note>
            )}

            <Button
              className="mt-4"
              variant="secondary"
              disabled={!bodyScanPhoto || saving === "body_scan"}
              onClick={() => void runBodyScan()}
            >
              {saving === "body_scan" ? "Reading posture" : bodyScanPhoto ? "I'm set · Capture" : "Pick a photo first"}
            </Button>
          </section>

          {bodyScanResult && <BodyScanResultCard result={bodyScanResult} />}
        </div>
      )
    },
    {
      id: "tracker",
      label: "Move",
      summary: "Phone down, follow Kai",
      icon: Dumbbell,
      content: (
        <PhysicalTrackerWidget
          onComplete={(result) =>
            void completeEntry({
              entryType: "tracker_session",
              title: result.title,
              payload: result,
              eventType: result.completed ? "workout" : "workout_partial",
              eventValue: trackerEventValue(result.durationSeconds, result.elapsedSeconds)
            })
          }
        />
      )
    }
  ];

  return (
    <UnitWorkspace
      title="Physical"
      label="Body"
      tone="physical"
      intro="Four cards: food camera, body scan, sleep, and guided movement. Useful, pattern-aware, never obsessive."
      modules={modules}
      banners={<DisclosureBanner />}
      liveNote={kaiCue ? <KaiCueNote cue={kaiCue} onDismiss={() => setKaiCue(null)} /> : null}
    />
  );
}

function FoodPhotoResultCard({ result, mealContext }: { result: FoodPhotoResult; mealContext: MealContextId }) {
  const itemsWithNutrition = result.items.filter((item) => item.nutrition);
  const followups = getFoodPhotoFollowups(result, mealContext);
  // Mock spec (Claude Design v2 Food handoff): the result title is the
  // literal item list joined with commas + a period. "Turkey sandwich,
  // apple, water." not "Review what Kai saw." Reads like Kai actually
  // noticed something specific rather than a generic recap header.
  const literalTitle =
    result.items.length > 0
      ? result.items
          .map((item, idx) => {
            const name = item.name.trim();
            // Lowercase all items after the first for grammar.
            const cased = idx === 0 ? name.charAt(0).toUpperCase() + name.slice(1) : name.toLowerCase();
            return cased;
          })
          .join(", ") + "."
      : "Couldn't read the photo cleanly.";
  return (
    <div className="rounded-calm border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-muted">Kai noticed</p>
          <h3 className="mt-1 font-display text-2xl font-black tracking-normal text-ink">{literalTitle}</h3>
        </div>
        <span className="rounded-full border border-line bg-warmPaper px-3 py-1 text-xs font-black uppercase tracking-wider text-inkSoft">
          {getFoodPhotoConfidenceLabel(result.confidence)}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-muted">{describeFoodPhotoResult(result)}</p>
      {result.items.length > 0 && (
        <div className="mt-3 grid gap-2">
          {result.items.map((item, idx) => (
            <FoodPhotoItemRow key={`${item.name}-${idx}`} item={item} />
          ))}
        </div>
      )}
      {itemsWithNutrition.length > 0 && (
        <details className="mt-3 rounded-kai border border-line bg-warmPaper p-3">
          <summary className="focus-ring cursor-pointer list-none text-sm font-black text-ink">
            Show nutrition
          </summary>
          <p className="mt-2 text-xs font-semibold leading-5 text-inkSoft">{getNutritionEstimateCaption()}</p>
          {result.totals && (
            <p className="mt-2 rounded-kai border border-line bg-white p-3 text-sm font-black text-ink">
              {formatFoodNutrition(result.totals)}
            </p>
          )}
        </details>
      )}
      <div className="mt-3 rounded-kai border border-line bg-warmPaper p-3">
        <p className="text-xs font-black uppercase tracking-wider text-inkSoft">Next time Kai can ask</p>
        <div className="mt-2 grid gap-2">
          {followups.map((prompt) => (
            <p key={prompt} className="rounded-kai border border-line bg-white px-3 py-2 text-sm font-semibold text-muted">
              {prompt}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function FoodPhotoItemRow({ item }: { item: FoodPhotoItem }) {
  // Mock spec (Claude Design v2): item rows show NAMES ONLY — no portion
  // grams. Showing grams to a teen reads in the same family as showing
  // calories — it nudges toward counting and measurement framing that
  // the engine deliberately avoids. Vision's estimated_grams is still
  // captured in the worker payload (drives the nutrition disclosure
  // math), it's just not surfaced visually.
  return (
    <div className="flex items-center gap-3 rounded-kai border border-line bg-warmPaper p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-bodyWash text-body">
        <Check size={14} aria-hidden="true" />
      </span>
      <p className="text-sm font-black capitalize text-ink">{item.name}</p>
    </div>
  );
}

/**
 * Posture cues from the body-scan vision pass. Same light-surface
 * palette as FoodPhotoResultCard so the two analyzed-photo views
 * read consistently across the Physical engine.
 *
 * Each cue is a short focus + a one-sentence next move. We render
 * them as a small numbered list — never as a "score." The persistent
 * sage Note above the scan setup carries the reassurance copy;
 * we deliberately don't re-state it here so the result feels useful
 * rather than defensive.
 */
/**
 * Today list for the Food card. Empty state per Claude Design v2 mock:
 * a dashed-border card with calm copy ("Nothing logged today. That's
 * fine. Snap when you eat."). With logs: small list rows showing the
 * time + item names.
 *
 * Pulls from progressStore.events (the canonical source). The payload
 * shape on a food event comes from completeEntry() in this file:
 *   payload.items: FoodPhotoItem[]  (vision/manual items, with .name)
 *   payload.meal: string             (fuel-note text, fallback)
 */
function TodayFoodList({ logs }: { logs: ProgressEvent[] }) {
  if (logs.length === 0) {
    return (
      <section className="grid gap-2">
        <p className="eyebrow text-muted">Today</p>
        <div className="rounded-kai border border-dashed border-line bg-white p-5 text-center">
          <p className="text-sm font-black text-ink">Nothing logged today.</p>
          <p className="mt-1 text-sm font-semibold text-inkSoft">That's fine. Snap when you eat.</p>
        </div>
      </section>
    );
  }
  return (
    <section className="grid gap-2">
      <p className="eyebrow text-muted">Today · {logs.length} {logs.length === 1 ? "log" : "logs"}</p>
      <div className="grid gap-2">
        {logs.map((log) => (
          <TodayFoodRow key={log.id} log={log} />
        ))}
      </div>
    </section>
  );
}

function TodayFoodRow({ log }: { log: ProgressEvent }) {
  const time = formatLogTime(log.occurredAt);
  const summary = summarizeFoodLog(log);
  return (
    <div className="flex items-center gap-3 rounded-kai border border-line bg-white p-3">
      <span className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-inkSoft">{time}</span>
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{summary}</p>
    </div>
  );
}

function filterTodaysFoodLogs(events: ProgressEvent[]): ProgressEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  return events
    .filter((event) => event.engine === "physical" && FOOD_EVENT_TYPES.has(event.eventType))
    .filter((event) => event.occurredAt.slice(0, 10) === today)
    .reverse(); // newest first
}

function summarizeFoodLog(log: ProgressEvent): string {
  const payload = log.payload as { items?: Array<{ name?: string }>; meal?: string } | undefined;
  const items = Array.isArray(payload?.items) ? payload!.items : [];
  if (items.length > 0) {
    const names = items
      .map((item) => (typeof item?.name === "string" ? item.name.trim() : ""))
      .filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }
  if (typeof payload?.meal === "string" && payload.meal.trim()) return payload.meal.trim();
  return "Meal logged";
}

function formatLogTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function BodyScanResultCard({ result }: { result: BodyScanResult }) {
  const confidenceLabel =
    result.confidence === "high" ? "clear read" : result.confidence === "medium" ? "partial read" : "low confidence";
  return (
    <div className="grid gap-3">
      {/* Mock spec: reassurance Note PERSISTS on the result state too,
        * not only above the setup. Different copy here to acknowledge
        * the analysis just ran without scoring anything. Without this
        * the user is left with a result card that could feel
        * judgmental despite the prompt + filter guardrails. */}
      <Note tone="sage" icon={<ShieldCheck size={15} aria-hidden="true" />}>
        Posture only. We didn't measure anything else.
      </Note>

      <div className="rounded-calm border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-muted">Kai noticed</p>
            <h3 className="mt-1 font-display text-2xl font-black tracking-normal text-ink">
              {result.cues.length > 0
                ? result.cues.map((cue) => cue.focus).join(". ") + "."
                : "Saved. Try again with full body visible."}
            </h3>
          </div>
          <span className="rounded-full border border-line bg-warmPaper px-3 py-1 text-xs font-black uppercase tracking-wider text-inkSoft">
            {confidenceLabel}
          </span>
        </div>
        {result.notes && (
          <p className="mt-3 text-sm font-semibold leading-6 text-muted">{result.notes}</p>
        )}
        {result.cues.length > 0 && (
          <>
            <p className="eyebrow mt-4 text-muted">Try today</p>
            <ol className="mt-2 grid gap-2">
              {result.cues.map((cue, idx) => (
                <li key={`${cue.focus}-${idx}`} className="rounded-kai border border-line bg-warmPaper p-3">
                  <p className="text-sm font-semibold leading-snug text-ink">{cue.suggestion}</p>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
