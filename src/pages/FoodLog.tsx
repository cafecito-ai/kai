// /food/log — log a meal (photo or quick note).
//
// Replaces the v0 EnginePhysical food-camera section. Same backend
// (/api/food-photo + /api/food-photo-upload, both wired to T-022's
// body-comment generator), clean design language matching the rest
// of the app.
//
// Two modes:
//   - Photo: tap "Take or choose a photo" → file picker (capture=env)
//   - Note:  type a one-liner like "turkey sandwich, apple, water"
// Submit → server returns items + nutrition + KAI's 1-2 sentence
// observational comment (filtered for forbidden body-language).

import { ArrowLeft, Camera, Pencil, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { api } from "../lib/api";
import { appendLocalInput } from "../lib/local-score";
import { useKaiStore } from "../stores/kaiStore";
import type { FoodPhotoResult } from "../lib/types";

// Mirror the API write into the local input log so the daily score, XP, missions
// and the goal ring all reflect the meal even in local/offline mode (matches
// how check-in / sleep / journal log locally).
function recordFoodLocally(result: FoodPhotoResult, note: string) {
  appendLocalInput({
    date: new Date().toISOString().slice(0, 10),
    source: "food_log",
    value: {
      items: result.items.map((i) => i.name).filter(Boolean).slice(0, 8),
      note: note.trim() || undefined,
    },
  });
}

type Phase = "form" | "sending" | "done";
type Mode = "photo" | "note";

export function FoodLog() {
  const navigate = useNavigate();
  const setPendingSeed = useKaiStore((s) => s.setPendingSeed);
  const [mode, setMode] = useState<Mode>("photo");
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<FoodPhotoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function submitPhoto(file: File) {
    setPhase("sending");
    setError(null);
    try {
      const r = await api.uploadFoodPhoto(file, note.trim() || undefined);
      recordFoodLocally(r, note);
      setResult(r);
      setPhase("done");
    } catch {
      setError("Couldn't upload that photo — try again or use a quick note.");
      setPhase("form");
    }
  }

  async function submitNote() {
    if (!note.trim()) return;
    setPhase("sending");
    setError(null);
    try {
      const r = await api.analyzeFoodPhoto({ note: note.trim() });
      recordFoodLocally(r, note);
      setResult(r);
      setPhase("done");
    } catch {
      setError("Couldn't save — try again.");
      setPhase("form");
    }
  }

  if (phase === "done" && result) {
    return (
      <DoneState
        result={result}
        onClose={() => navigate("/home")}
        onTalk={() => {
          const names = result.items.map((i) => i.name).filter(Boolean).slice(0, 5).join(", ");
          const seed = names
            ? `i just logged my food: ${names}. can we talk about it?`
            : "i just logged a meal. can we talk about my food and energy?";
          setPendingSeed(seed);
          navigate("/chat");
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-md flex-col px-5 pt-2 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/home"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          food log
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <div className="pb-5">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          Log a meal
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          A photo or a one-liner — KAI gives you a 1-2 sentence read. Never a
          calorie target. Never about how you look.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("photo")}
          aria-pressed={mode === "photo"}
          className={`
            flex flex-1 items-center justify-center gap-1.5 rounded-full
            border px-3 py-2 text-xs font-medium shadow-card transition
            ${
              mode === "photo"
                ? "border-text-primary bg-text-primary text-background"
                : "border-glass-border bg-surface text-text-primary hover:bg-surface-muted"
            }
          `}
        >
          <Camera size={12} aria-hidden="true" /> Photo
        </button>
        <button
          type="button"
          onClick={() => setMode("note")}
          aria-pressed={mode === "note"}
          className={`
            flex flex-1 items-center justify-center gap-1.5 rounded-full
            border px-3 py-2 text-xs font-medium shadow-card transition
            ${
              mode === "note"
                ? "border-text-primary bg-text-primary text-background"
                : "border-glass-border bg-surface text-text-primary hover:bg-surface-muted"
            }
          `}
        >
          <Pencil size={12} aria-hidden="true" /> Quick note
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-warning-soft bg-warning-soft px-3 py-2 text-sm text-warning">
          {error}
        </p>
      )}

      {mode === "photo" ? (
        <div className="flex flex-1 flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) submitPhoto(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={phase === "sending"}
            className="
              flex flex-1 flex-col items-center justify-center gap-3 rounded-glass
              border border-dashed border-glass-border bg-surface px-6 py-12
              text-center shadow-card transition active:scale-[0.99]
              hover:bg-surface-muted focus-ring
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            <Camera size={32} className="text-text-secondary" aria-hidden="true" />
            <span className="text-sm font-medium text-text-primary">
              Take or choose a meal photo
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              {phase === "sending" ? "uploading…" : "tap to start"}
            </span>
          </button>
          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              add a note (optional)
            </p>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="School lunch · before practice · etc."
              maxLength={200}
              className="
                w-full rounded-lg border border-glass-border bg-surface
                px-4 py-3 text-base text-text-primary
                placeholder:text-text-muted shadow-card focus-ring
              "
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Turkey sandwich, apple, water"
            rows={4}
            maxLength={500}
            className="
              w-full resize-none rounded-lg border border-glass-border bg-surface
              px-4 py-3 text-base text-text-primary
              placeholder:text-text-muted shadow-card focus-ring
            "
          />
          <button
            type="button"
            onClick={submitNote}
            disabled={!note.trim() || phase === "sending"}
            className="
              flex h-12 w-full items-center justify-center gap-2 rounded-full
              bg-text-primary text-background font-medium
              shadow-card transition active:scale-[0.99]
              disabled:cursor-not-allowed disabled:bg-text-soft focus-ring
            "
          >
            {phase === "sending" ? "Sending to KAI…" : "Log it"}
          </button>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            Descriptive notes are fine — "felt heavy" / "energized after"
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Done state
// ─────────────────────────────────────────────────────────────────────

function DoneState({
  result,
  onClose,
  onTalk,
}: {
  result: FoodPhotoResult;
  onClose: () => void;
  onTalk: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col px-5 pt-2 pb-6 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <div className="h-10 w-10" aria-hidden="true" />
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          logged
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <div className="flex flex-col items-center pt-4 pb-3">
        <KaiOrb size={88} />
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
          <Sparkles size={12} aria-hidden="true" /> Meal logged
        </p>
      </div>

      {/* KAI's read */}
      {result.bodyComment && (
        <div className="mt-2">
          <KaiMessage orbSize={32}>{result.bodyComment}</KaiMessage>
        </div>
      )}

      {/* Items KAI saw */}
      {result.items.length > 0 && (
        <section className="mt-5 rounded-glass border border-glass-border bg-surface p-4 shadow-card">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            what KAI saw
          </p>
          <ul className="mt-3 divide-y divide-glass-border">
            {result.items.map((item, i) => (
              <li
                key={`${item.name}-${i}`}
                className="py-2 first:pt-0 last:pb-0"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 text-sm font-medium text-text-primary">· {item.name}</span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                    {item.nutrition ? "nutrition matched" : "visual read"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  {formatFoodAmountContext(item.estimatedGrams)}
                  {item.nutrition ? ` ${formatItemNutritionContext(item.nutrition)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Macro breakdown — calories + the full protein/carbs/fat split, plus a
          per-item breakdown. Everything is labeled so a bare "33g" can't be
          mistaken for a macro (that number is the portion weight, shown above). */}
      {result.totals && (
        <details className="mt-3 rounded-glass border border-glass-border bg-surface p-4 shadow-card">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted focus-ring">
            Show rough macros
          </summary>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <MacroStat label="calories" value={Math.round(result.totals.calories)} />
            <MacroStat label="protein" value={Math.round(result.totals.protein)} unit="g" />
            <MacroStat label="carbs" value={Math.round(result.totals.carbs)} unit="g" />
            <MacroStat label="fat" value={Math.round(result.totals.fat)} unit="g" />
          </div>

          {result.items.some((it) => it.nutrition) && (
            <ul className="mt-3 space-y-1 border-t border-glass-border pt-3">
              {result.items
                .filter((it) => it.nutrition)
                .map((item, i) => (
                  <li
                    key={`macro-${item.name}-${i}`}
                    className="flex items-baseline justify-between gap-2 font-mono text-[11px] text-text-secondary"
                  >
                    <span className="min-w-0 truncate">{item.name}</span>
                    <span className="shrink-0 text-text-muted">
                      {Math.round(item.nutrition!.calories)} cal · {Math.round(item.nutrition!.protein)}g P ·{" "}
                      {Math.round(item.nutrition!.carbs)}g C · {Math.round(item.nutrition!.fat)}g F
                    </span>
                  </li>
                ))}
            </ul>
          )}

          <p className="mt-3 text-xs leading-5 text-text-secondary">
            The gram estimate is just the amount KAI used for the nutrition lookup. Use this to sanity-check
            the read, not to measure or hit a target.
          </p>
        </details>
      )}

      <div className="mt-auto space-y-2 pt-5">
        <button
          type="button"
          onClick={onClose}
          className="
            flex h-12 w-full items-center justify-center rounded-full
            bg-text-primary text-background font-medium
            shadow-card transition active:scale-[0.99] focus-ring
          "
        >
          Back to home
        </button>
        <button
          type="button"
          onClick={onTalk}
          className="
            flex h-12 w-full items-center justify-center rounded-full
            border border-glass-border bg-surface text-text-primary font-medium
            shadow-card transition hover:bg-surface-muted active:scale-[0.99] focus-ring
          "
        >
          Talk to KAI
        </button>
      </div>
    </div>
  );
}

/** One labeled macro cell in the breakdown grid — keeps every number tied to
 *  a word so nothing reads as a bare, ambiguous gram count. */
function MacroStat({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="rounded-lg bg-surface-muted px-2 py-2 text-center">
      <p className="font-mono text-base text-text-primary">
        {value}
        {unit ?? ""}
      </p>
      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">{label}</p>
    </div>
  );
}

function formatFoodAmountContext(estimatedGrams?: number): string {
  if (!estimatedGrams) {
    return "Amount was not clear enough to estimate.";
  }
  return `Estimated amount used for the nutrition lookup: about ${Math.round(estimatedGrams)}g.`;
}

function formatItemNutritionContext(nutrition: FoodPhotoResult["items"][number]["nutrition"]): string {
  if (!nutrition) return "";
  return `Rough item read: ${Math.round(nutrition.calories)} cal, ${Math.round(nutrition.protein)}g protein, ${Math.round(
    nutrition.carbs,
  )}g carbs, ${Math.round(nutrition.fat)}g fat.`;
}
