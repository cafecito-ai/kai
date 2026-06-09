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

import { ArrowLeft, Camera, Clock, Pencil, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { api } from "../lib/api";
import { fileToThumbnailDataUrl, saveFoodEntry } from "../lib/food-history";
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
// choose = pick a photo or go describe; confirm = preview the photo + optional
// note before submitting; describe = no photo, just type what you ate.
type View = "choose" | "confirm" | "describe";

export function FoodLog() {
  const navigate = useNavigate();
  const setPendingSeed = useKaiStore((s) => s.setPendingSeed);
  const [view, setView] = useState<View>("choose");
  const [note, setNote] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<FoodPhotoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Picking a photo doesn't submit — it moves to the confirm step so the user
  // can add a note (or not) before logging it.
  function choosePhoto(file: File) {
    setError(null);
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setView("confirm");
  }

  function clearPending() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
    setView("choose");
  }

  // Save the meal to the on-device history (photo + timestamp + what KAI saw).
  // No macros here — that side is owned by the backend.
  function recordFoodHistory(
    result: FoodPhotoResult,
    noteText: string,
    photoDataUrl?: string,
  ) {
    saveFoodEntry({
      loggedAt: new Date().toISOString(),
      photoDataUrl,
      items: result.items.map((i) => i.name).filter(Boolean).slice(0, 8),
      note: noteText.trim() || undefined,
    });
  }

  async function submitPhoto(file: File) {
    setPhase("sending");
    setError(null);
    try {
      const r = await api.uploadFoodPhoto(file, note.trim() || undefined);
      recordFoodLocally(r, note);
      const thumb = await fileToThumbnailDataUrl(file);
      recordFoodHistory(r, note, thumb);
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      setResult(r);
      setPhase("done");
    } catch {
      setError("Couldn't upload that photo — try again or describe it instead.");
      setPhase("form");
    }
  }

  async function submitNote() {
    const description = note.trim();
    if (!description) return;
    setPhase("sending");
    setError(null);
    try {
      const r = await api.analyzeFoodPhoto({ note: description });
      recordFoodLocally(r, description);
      // Described meal (no photo): the typed text IS the meal, so store it as
      // the items — fall back to the raw text if KAI didn't parse any. No
      // separate note line (it would just repeat the description).
      const names = r.items.map((i) => i.name).filter(Boolean).slice(0, 8);
      saveFoodEntry({
        loggedAt: new Date().toISOString(),
        items: names.length > 0 ? names : [description],
      });
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
        <Link
          to="/food/history"
          aria-label="Food history"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <Clock size={18} aria-hidden="true" />
        </Link>
      </header>

      <div className="pb-5">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          Log a meal
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Snap your meal, then add a note if you want. KAI gives you a 1-2
          sentence read. Never a calorie target. Never about how you look.
        </p>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-warning-soft bg-warning-soft px-3 py-2 text-sm text-warning">
          {error}
        </p>
      )}

      {/* Shared hidden file input — picking a photo goes to the confirm step. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) choosePhoto(f);
          e.target.value = "";
        }}
      />

      {/* Step 1 — choose a photo, or fall back to describing the meal. */}
      {view === "choose" && (
        <div className="flex flex-1 flex-col gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="
              flex flex-1 flex-col items-center justify-center gap-3 rounded-glass
              border border-dashed border-glass-border bg-surface px-6 py-12
              text-center shadow-card transition active:scale-[0.99]
              hover:bg-surface-muted focus-ring
            "
          >
            <Camera size={32} className="text-text-secondary" aria-hidden="true" />
            <span className="text-sm font-medium text-text-primary">
              Take or choose a meal photo
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              tap to start
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setNote("");
              setView("describe");
            }}
            className="
              flex items-center justify-center gap-1.5 rounded-full border
              border-glass-border bg-surface px-4 py-3 text-sm font-medium
              text-text-secondary shadow-card transition hover:bg-surface-muted focus-ring
            "
          >
            <Pencil size={14} aria-hidden="true" /> No photo? Describe your meal
          </button>
        </div>
      )}

      {/* Step 2a — confirm the photo, add a note (or not), then log it. */}
      {view === "confirm" && (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex-1 overflow-hidden rounded-glass border border-glass-border bg-surface-muted shadow-card">
            {pendingPreview && (
              <img
                src={pendingPreview}
                alt="Your meal"
                className="h-full w-full object-cover"
              />
            )}
          </div>
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearPending}
              disabled={phase === "sending"}
              className="
                flex h-12 flex-1 items-center justify-center rounded-full border
                border-glass-border bg-surface text-sm font-medium text-text-primary
                shadow-card transition hover:bg-surface-muted focus-ring
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              Retake
            </button>
            <button
              type="button"
              onClick={() => pendingFile && submitPhoto(pendingFile)}
              disabled={phase === "sending"}
              className="
                flex h-12 flex-[2] items-center justify-center rounded-full
                bg-text-primary font-medium text-background shadow-card transition
                active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-text-soft focus-ring
              "
            >
              {phase === "sending" ? "Sending to KAI…" : "Log it"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2b — no photo: describe the meal. Shows as a dark card on the calendar. */}
      {view === "describe" && (
        <div className="flex flex-1 flex-col gap-4">
          <textarea
            autoFocus
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
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            No photo needed. This still shows up on your calendar.
          </p>
          <div className="mt-auto flex gap-2">
            <button
              type="button"
              onClick={() => {
                setNote("");
                setView("choose");
              }}
              disabled={phase === "sending"}
              className="
                flex h-12 flex-1 items-center justify-center rounded-full border
                border-glass-border bg-surface text-sm font-medium text-text-primary
                shadow-card transition hover:bg-surface-muted focus-ring
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              Back
            </button>
            <button
              type="button"
              onClick={submitNote}
              disabled={!note.trim() || phase === "sending"}
              className="
                flex h-12 flex-[2] items-center justify-center rounded-full
                bg-text-primary font-medium text-background shadow-card transition
                active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-text-soft focus-ring
              "
            >
              {phase === "sending" ? "Sending to KAI…" : "Log it"}
            </button>
          </div>
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
