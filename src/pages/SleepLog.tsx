// /sleep/log — log last night's sleep (T-017).
//
//   - Hours (required, 0–14 step 0.25)
//   - Quality 1–5 (optional)
//   - Notes (optional, short)
//
// Submit → local store + (best-effort) API call. Mind agent reflects when
// patterns are notable (3+ nights under 6h). Single entries get a short
// acknowledgement so the user isn't lectured every night.

import { ArrowLeft, Minus, Moon, Plus, Star } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { api } from "../lib/api";
import { appendLocalInput, readLocalInputs } from "../lib/local-score";
import { useKaiStore } from "../stores/kaiStore";

type Phase = "form" | "sending" | "done";

export function SleepLog() {
  const navigate = useNavigate();
  const setPendingSeed = useKaiStore((s) => s.setPendingSeed);
  const [hours, setHours] = useState<number>(7);
  const [quality, setQuality] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [reflection, setReflection] = useState("");
  const [bodyComment, setBodyComment] = useState<string | undefined>(undefined);

  function bump(delta: number) {
    setHours((h) => clamp(round025(h + delta)));
  }

  async function submit() {
    if (phase === "sending") return;
    setPhase("sending");

    // Local first.
    appendLocalInput({
      date: new Date().toISOString().slice(0, 10),
      source: "sleep_log",
      value: { hours, quality: quality ?? undefined, notes: notes || undefined },
    });

    try {
      const res = await api.submitSleep({
        hours,
        quality: quality ?? undefined,
        notes: notes || undefined,
      });
      setReflection(res.reflection || offlineSleepReflection(hours));
      // T-024 — Body recovery comment when context warrants it.
      setBodyComment(res.bodyComment);
      setPhase("done");
    } catch {
      setReflection(localSleepReflection(hours));
      setBodyComment(undefined);
      setPhase("done");
    }
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
          sleep log
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {phase === "done" ? (
        <DoneState
          reflection={reflection}
          bodyComment={bodyComment}
          onClose={() => navigate("/home")}
          onTalk={() => {
            const q = quality != null ? `, felt like ${quality}/5` : "";
            const n = notes.trim() ? `. notes: ${notes.trim()}` : "";
            setPendingSeed(
              `i just logged my sleep — ${formatHours(hours)} hours${q}${n}. what can i actually do to sleep better and feel more rested?`,
            );
            navigate("/chat");
          }}
        />
      ) : (
        <Form
          hours={hours}
          setHours={setHours}
          bump={bump}
          quality={quality}
          setQuality={setQuality}
          notes={notes}
          setNotes={setNotes}
          submitting={phase === "sending"}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

function Form({
  hours,
  setHours,
  bump,
  quality,
  setQuality,
  notes,
  setNotes,
  submitting,
  onSubmit,
}: {
  hours: number;
  setHours: (h: number) => void;
  bump: (d: number) => void;
  quality: number | null;
  setQuality: (q: number | null) => void;
  notes: string;
  setNotes: (s: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-7 pb-6">
      <div>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          How'd you sleep?
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          A guess is fine. Quality and notes are optional.
        </p>
      </div>

      {/* Hours stepper */}
      <div className="rounded-glass border border-glass-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
            Hours
          </p>
          <Moon className="text-accent" size={16} aria-hidden="true" />
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => bump(-0.25)}
            aria-label="Less"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-glass-border bg-surface text-text-primary shadow-card transition hover:bg-surface-muted active:scale-95 focus-ring"
          >
            <Minus size={18} aria-hidden="true" />
          </button>
          <div className="text-center">
            <p className="font-mono text-5xl font-bold leading-none">
              {formatHours(hours)}
            </p>
            <p className="mt-1 text-xs text-text-muted">hours</p>
          </div>
          <button
            type="button"
            onClick={() => bump(0.25)}
            aria-label="More"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-glass-border bg-surface text-text-primary shadow-card transition hover:bg-surface-muted active:scale-95 focus-ring"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={14}
          step={0.25}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="mt-5 w-full accent-text-primary"
          aria-label="Hours slider"
        />
      </div>

      {/* Quality (optional, 1-5 stars) */}
      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          Quality <span className="ml-1 normal-case text-text-soft">— optional</span>
        </p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = quality != null && n <= quality;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setQuality(quality === n ? null : n)}
                aria-label={`${n} stars`}
                className="flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95"
              >
                <Star
                  size={20}
                  className={
                    filled ? "fill-accent-warm text-accent-warm" : "text-text-muted"
                  }
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes (optional) */}
      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          Notes <span className="ml-1 normal-case text-text-soft">— optional</span>
        </p>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Late screen, weird dream, woke up at 4…"
          maxLength={200}
          className="
            w-full rounded-lg border border-glass-border bg-surface
            px-4 py-3 text-base text-text-primary
            placeholder:text-text-muted shadow-card focus-ring
          "
        />
      </div>

      <div className="mt-auto pb-2">
        <button
          type="button"
          disabled={submitting}
          onClick={onSubmit}
          className="
            flex h-12 w-full items-center justify-center rounded-full
            bg-text-primary text-background font-medium
            shadow-card transition active:scale-[0.99]
            disabled:cursor-not-allowed disabled:bg-text-soft focus-ring
          "
        >
          {submitting ? "Saving…" : "Log"}
        </button>
      </div>
    </div>
  );
}

function DoneState({
  reflection,
  bodyComment,
  onClose,
  onTalk,
}: {
  reflection: string;
  /** T-024 — optional Body recovery comment. Renders below the reflection
   *  as a second KaiMessage with a "recovery" label so the user knows
   *  this is the same KAI speaking in their physical-coach voice. */
  bodyComment?: string;
  onClose: () => void;
  onTalk: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col pb-6">
      <div className="flex flex-col items-center pt-6 pb-4">
        <KaiOrb size={88} />
      </div>
      <div className="mt-2">
        <KaiMessage orbSize={32}>{reflection}</KaiMessage>
      </div>
      {bodyComment && (
        <div className="mt-3">
          <p className="mb-1.5 ml-12 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            recovery
          </p>
          <KaiMessage orbSize={32}>{bodyComment}</KaiMessage>
        </div>
      )}
      <div className="mt-auto space-y-2 pb-2">
        <button
          type="button"
          onClick={onTalk}
          className="
            flex h-12 w-full items-center justify-center rounded-full
            bg-text-primary text-background font-medium
            shadow-card transition active:scale-[0.99] focus-ring
          "
        >
          Talk to KAI about it
        </button>
        <button
          type="button"
          onClick={onClose}
          className="
            flex h-12 w-full items-center justify-center rounded-full
            border border-glass-border bg-surface text-text-primary font-medium
            shadow-card transition hover:bg-surface-muted active:scale-[0.99] focus-ring
          "
        >
          Back to home
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function clamp(h: number): number {
  return Math.max(0, Math.min(14, h));
}

function round025(h: number): number {
  return Math.round(h * 4) / 4;
}

function formatHours(h: number): string {
  // 7 → "7", 7.5 → "7½", 7.25 → "7¼", 7.75 → "7¾"
  const whole = Math.floor(h);
  const frac = h - whole;
  if (frac === 0) return String(whole);
  if (Math.abs(frac - 0.25) < 1e-6) return `${whole}¼`;
  if (Math.abs(frac - 0.5) < 1e-6) return `${whole}½`;
  if (Math.abs(frac - 0.75) < 1e-6) return `${whole}¾`;
  return h.toFixed(2);
}

function offlineSleepReflection(hours: number): string {
  if (hours >= 7 && hours <= 9) return "Solid. Logged.";
  if (hours < 6) return "Short night. Take it easy on yourself today.";
  if (hours > 10) return "Long one. Hope it left you better than you started.";
  return "Logged.";
}

// Local-mode looks at recent localStorage inputs for the 3-night pattern.
function localSleepReflection(hoursToday: number): string {
  const inputs = readLocalInputs()
    .filter((i) => i.source === "sleep_log")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 3);
  const hours = inputs
    .map((i) => (i.value as { hours?: number }).hours)
    .filter((h): h is number => typeof h === "number");
  if (hours.length >= 3 && hours.every((h) => h < 6)) {
    return "Three short nights in a row — your nervous system is paying for that. What's getting in the way of a longer one tonight?";
  }
  if (hours.length >= 3 && hours.every((h) => h > 9)) {
    return "Lots of sleep this stretch — is the body asking for it, or are you avoiding something?";
  }
  return offlineSleepReflection(hoursToday);
}
