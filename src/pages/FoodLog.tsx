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
import type { FoodPhotoResult } from "../lib/types";

type Phase = "form" | "sending" | "done";
type Mode = "photo" | "note";

export function FoodLog() {
  const navigate = useNavigate();
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
      setResult(r);
      setPhase("done");
    } catch {
      setError("Couldn't save — try again.");
      setPhase("form");
    }
  }

  if (phase === "done" && result) {
    return <DoneState result={result} onClose={() => navigate("/home")} />;
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
}: {
  result: FoodPhotoResult;
  onClose: () => void;
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
          <ul className="mt-2 space-y-1">
            {result.items.map((item, i) => (
              <li key={`${item.name}-${i}`} className="text-sm text-text-primary">
                · {item.name}
                {item.estimatedGrams ? ` · ~${Math.round(item.estimatedGrams)}g` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Optional macros */}
      {result.totals && (
        <details className="mt-3 rounded-glass border border-glass-border bg-surface p-4 shadow-card">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted focus-ring">
            Show rough macros
          </summary>
          <p className="mt-2 font-mono text-sm text-text-primary">
            ~{Math.round(result.totals.calories)} cal · ~{Math.round(result.totals.protein)}g protein
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            estimates only — not a target
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
        <Link
          to="/chat"
          className="
            flex h-12 w-full items-center justify-center rounded-full
            border border-glass-border bg-surface text-text-primary font-medium
            shadow-card transition hover:bg-surface-muted active:scale-[0.99] focus-ring
          "
        >
          Talk to KAI
        </Link>
      </div>
    </div>
  );
}
