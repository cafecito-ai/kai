// /energy — quick energy / fatigue check-in (T-027).
//
//   - 1-5 picker (Wiped / Low / Okay / Steady / Sharp)
//   - Optional one-line note
//   - Saves to score_inputs(energy_check_in)
//   - If today + yesterday are both ≤2, surfaces a short recovery note
//     (the AGENT_PLAN T-027 trigger)
//
// Default frame: "your body needs something" — never "you're lazy."

import { ArrowLeft, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { api } from "../lib/api";
import {
  detectLowEnergyStreak,
  lowEnergyRecoveryNote,
  submitLocalEnergy,
  type EnergyValue,
} from "../lib/local-energy";
import { readLocalInputs } from "../lib/local-score";

type Phase = "form" | "sending" | "done";

const LEVELS: Array<{ value: EnergyValue; emoji: string; label: string }> = [
  { value: 1, emoji: "🪫", label: "Wiped" },
  { value: 2, emoji: "🌧", label: "Low" },
  { value: 3, emoji: "🌤", label: "Okay" },
  { value: 4, emoji: "⚡", label: "Steady" },
  { value: 5, emoji: "✨", label: "Sharp" },
];

export function EnergyCheckIn() {
  const navigate = useNavigate();
  const [value, setValue] = useState<EnergyValue | null>(null);
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [recoveryNote, setRecoveryNote] = useState<string | null>(null);

  async function submit() {
    if (value == null || phase === "sending") return;
    setPhase("sending");

    // Local first.
    submitLocalEnergy(value, note);

    // Pattern check after writing — uses the fresh local store.
    if (detectLowEnergyStreak(readLocalInputs())) {
      setRecoveryNote(lowEnergyRecoveryNote());
    }

    // Best-effort sync to the score store so /home picks it up.
    try {
      await api.recordScoreInput({
        source: "energy_check_in",
        value: { energy: value, note: note || undefined },
      });
    } catch {
      // Local copy persists — fine.
    }

    setPhase("done");
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
          energy check-in
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {phase === "done" ? (
        <Done
          value={value!}
          recoveryNote={recoveryNote}
          onClose={() => navigate("/home")}
        />
      ) : (
        <Form
          value={value}
          setValue={setValue}
          note={note}
          setNote={setNote}
          submitting={phase === "sending"}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

function Form({
  value,
  setValue,
  note,
  setNote,
  submitting,
  onSubmit,
}: {
  value: EnergyValue | null;
  setValue: (v: EnergyValue) => void;
  note: string;
  setNote: (s: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-7 pb-6">
      <div>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          How's your energy?
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Just a quick read. No right answer — your body is talking, you're listening.
        </p>
      </div>

      {/* 1-5 picker */}
      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          Right now
        </p>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => {
            const selected = value === l.value;
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => setValue(l.value)}
                aria-pressed={selected}
                className={`
                  flex flex-1 min-w-[80px] flex-col items-center gap-1
                  rounded-lg border py-3 text-xs font-medium
                  transition active:scale-[0.98]
                  ${
                    selected
                      ? "border-text-primary bg-text-primary text-background shadow-card-lg"
                      : "border-glass-border bg-surface text-text-primary shadow-card hover:bg-surface-muted"
                  }
                `}
              >
                <span className="text-2xl leading-none">{l.emoji}</span>
                <span className="leading-tight">{l.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional note */}
      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          One word on why?  <span className="ml-1 normal-case text-text-soft">— optional</span>
        </p>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Late night. Big meal. Allergies. Whatever."
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
          disabled={value == null || submitting}
          onClick={onSubmit}
          className="
            flex h-12 w-full items-center justify-center gap-2 rounded-full
            bg-text-primary text-background font-medium
            shadow-card transition active:scale-[0.99]
            disabled:cursor-not-allowed disabled:bg-text-soft
            focus-ring
          "
        >
          <Zap size={16} aria-hidden="true" />
          {submitting ? "Sending to KAI…" : "Log it"}
        </button>
      </div>
    </div>
  );
}

function Done({
  value,
  recoveryNote,
  onClose,
}: {
  value: EnergyValue;
  recoveryNote: string | null;
  onClose: () => void;
}) {
  const message = ackForLevel(value);
  return (
    <div className="flex flex-1 flex-col pb-6">
      <div className="flex flex-col items-center pt-6 pb-4">
        <KaiOrb size={88} />
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
          <Sparkles size={12} aria-hidden="true" /> Logged
        </p>
      </div>

      <div className="mt-2">
        <KaiMessage orbSize={32}>{message}</KaiMessage>
      </div>

      {recoveryNote && (
        <div className="mt-3">
          <p className="mb-1.5 ml-12 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            two days low
          </p>
          <KaiMessage orbSize={32}>{recoveryNote}</KaiMessage>
        </div>
      )}

      <div className="mt-auto space-y-2 pb-2">
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
        {(value <= 2 || recoveryNote) && (
          <Link
            to="/mobility"
            className="
              flex h-12 w-full items-center justify-center rounded-full
              border border-glass-border bg-surface text-text-primary font-medium
              shadow-card transition hover:bg-surface-muted active:scale-[0.99] focus-ring
            "
          >
            Try a recovery routine
          </Link>
        )}
      </div>
    </div>
  );
}

function ackForLevel(v: EnergyValue): string {
  switch (v) {
    case 1:
      return "Wiped — that's a real signal. Easy food, water, no extra demands today.";
    case 2:
      return "Low. Could be sleep, food, or just one of those days. Be gentle with how much you ask of yourself.";
    case 3:
      return "Logged. Solid baseline. Notice what's different if it shifts.";
    case 4:
      return "Steady — that's where most of your good days live. Lock in what's working.";
    case 5:
      return "Sharp. Use it — but don't burn it. Save some for tomorrow.";
  }
}
