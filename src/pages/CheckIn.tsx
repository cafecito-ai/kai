// /check-in — emotional check-in flow (T-015).
//
// Three slots, none more than a tap or one sentence:
//   1. Mood 1–5 (required)
//   2. What's on your mind (optional)
//   3. What would make today better (optional)
//
// Submit → POST /api/check-in → backend records score_input + generates a
// Mind agent reflection. Success state shows the reflection in a KaiMessage
// bubble. Tapping Done returns to /home where the Daily Score will reflect
// the new mood input.
//
// Time-aware: the screen labels itself "Morning reflection" or "Evening
// reflection" based on user's local time. AGENT_PLAN T-015 says check-ins
// are available "once per morning (5am-noon) and once per evening
// (5pm-11pm)" — the backend returns duplicateInWindow=true if the user is
// repeating; we surface a soft notice but never block.

import { ArrowLeft, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { api } from "../lib/api";
import { appendLocalInput, offlineReflection } from "../lib/local-score";
import { useKaiStore } from "../stores/kaiStore";

type Phase = "form" | "submitting" | "done" | "error";

const MOODS: Array<{ value: 1 | 2 | 3 | 4 | 5; emoji: string; label: string }> =
  [
    { value: 1, emoji: "🥀", label: "Really rough" },
    { value: 2, emoji: "🌧", label: "Off" },
    { value: 3, emoji: "🌤", label: "Okay" },
    { value: 4, emoji: "☀️", label: "Pretty good" },
    { value: 5, emoji: "🌟", label: "Really good" },
  ];

export function CheckIn() {
  const navigate = useNavigate();
  const setPendingSeed = useKaiStore((s) => s.setPendingSeed);
  const [mood, setMood] = useState<number | null>(null);
  const [mind, setMind] = useState("");
  const [better, setBetter] = useState("");
  const [screenHours, setScreenHours] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [reflection, setReflection] = useState<string>("");
  const [duplicateInWindow, setDuplicateInWindow] = useState(false);

  // Detect the current time window for the headline.
  const [headline, setHeadline] = useState(() => headlineForNow());
  useEffect(() => {
    const id = setInterval(() => setHeadline(headlineForNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  async function submit() {
    if (mood == null) return;
    setPhase("submitting");

    // ALWAYS write to local store first so /home reflects the check-in
    // immediately, regardless of whether the Worker is reachable.
    appendLocalInput({
      date: new Date().toISOString().slice(0, 10),
      source: "check_in",
      value: {
        mood,
        mind,
        better,
        screenHours: screenHours ?? undefined,
      },
    });

    try {
      const res = await api.submitCheckIn({
        mood,
        mind: mind || undefined,
        better: better || undefined,
      });
      setReflection(
        res.reflection ||
          offlineReflection(mood, mind, better),
      );
      setDuplicateInWindow(res.duplicateInWindow);
      setPhase("done");
    } catch {
      // Worker unreachable. The local store already has this check-in,
      // so /home updates correctly. Use a smart mood-keyed fallback so
      // the reflection is still meaningful.
      setReflection(offlineReflection(mood, mind, better));
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
          {headline.eyebrow}
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {phase === "done" ? (
        <DoneState
          reflection={reflection}
          duplicate={duplicateInWindow}
          onClose={() => navigate("/home")}
          onKeepTalking={() => {
            const moodLabel = MOODS.find((m) => m.value === mood)?.label.toLowerCase();
            const seed = [
              "i just did my check-in.",
              moodLabel ? `feeling ${moodLabel}.` : "",
              mind.trim() ? `what's on my mind: ${mind.trim()}.` : "",
              better.trim() ? `what might help: ${better.trim()}.` : "",
              "can we keep talking about it?",
            ]
              .filter(Boolean)
              .join(" ");
            setPendingSeed(seed);
            navigate("/chat");
          }}
        />
      ) : (
        <FormState
          mood={mood}
          setMood={setMood}
          mind={mind}
          setMind={setMind}
          better={better}
          setBetter={setBetter}
          screenHours={screenHours}
          setScreenHours={setScreenHours}
          submitting={phase === "submitting"}
          onSubmit={submit}
          headline={headline.title}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────────────

function FormState({
  mood,
  setMood,
  mind,
  setMind,
  better,
  setBetter,
  screenHours,
  setScreenHours,
  submitting,
  onSubmit,
  headline,
}: {
  mood: number | null;
  setMood: (m: number) => void;
  mind: string;
  setMind: (s: string) => void;
  better: string;
  setBetter: (s: string) => void;
  screenHours: number | null;
  setScreenHours: (n: number | null) => void;
  submitting: boolean;
  onSubmit: () => void;
  headline: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-7 pb-6">
      <div>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          {headline}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Takes 30 seconds. KAI just wants a read.
        </p>
      </div>

      {/* Mood picker */}
      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          How are you?
        </p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => {
            const selected = mood === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={`
                  flex flex-1 min-w-[90px] flex-col items-center gap-1
                  rounded-lg border py-3 text-xs font-medium
                  transition active:scale-[0.98]
                  ${
                    selected
                      ? "border-text-primary bg-text-primary text-background shadow-card-lg"
                      : "border-glass-border bg-surface text-text-primary shadow-card hover:bg-surface-muted"
                  }
                `}
                aria-pressed={selected}
              >
                <span className="text-2xl leading-none">{m.emoji}</span>
                <span className="leading-tight">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* What's on your mind */}
      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          What's on your mind?  <span className="ml-1 normal-case text-text-soft">— optional</span>
        </p>
        <textarea
          value={mind}
          onChange={(e) => setMind(e.target.value)}
          placeholder="A messy sentence is enough."
          rows={3}
          maxLength={500}
          className="
            w-full resize-none rounded-lg border border-glass-border bg-surface
            px-4 py-3 text-base text-text-primary
            placeholder:text-text-muted shadow-card focus-ring
          "
        />
      </div>

      {/* What would make today better */}
      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          What would make today better?  <span className="ml-1 normal-case text-text-soft">— optional</span>
        </p>
        <input
          type="text"
          value={better}
          onChange={(e) => setBetter(e.target.value)}
          placeholder="One thing."
          maxLength={200}
          className="
            w-full rounded-lg border border-glass-border bg-surface
            px-4 py-3 text-base text-text-primary
            placeholder:text-text-muted shadow-card focus-ring
          "
        />
      </div>

      {/* Screen time — only surfaced for evening check-ins per AGENT_PLAN
          T-018, and entirely optional. Observational only — never a target. */}
      {isEvening() && (
        <div className="space-y-2.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
            On your phone today?  <span className="ml-1 normal-case text-text-soft">— optional</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 4, 6, 8, 10].map((h) => {
              const selected = screenHours === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => setScreenHours(selected ? null : h)}
                  className={`
                    rounded-full border px-4 py-2 text-sm font-medium transition
                    ${
                      selected
                        ? "border-text-primary bg-text-primary text-background"
                        : "border-glass-border bg-surface text-text-primary hover:bg-surface-muted"
                    }
                  `}
                >
                  ~{h}h
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto pb-2">
        <button
          type="button"
          disabled={mood == null || submitting}
          onClick={onSubmit}
          className="
            flex h-12 w-full items-center justify-center gap-2 rounded-full
            bg-text-primary text-background font-medium
            shadow-card transition active:scale-[0.99]
            disabled:cursor-not-allowed disabled:bg-text-soft
            focus-ring
          "
        >
          {submitting ? "Sending to KAI…" : "Done"}
        </button>
      </div>
    </div>
  );
}

function isEvening(): boolean {
  const h = new Date().getHours();
  return h >= 17 && h < 23;
}

// ─────────────────────────────────────────────────────────────────────
// Done state
// ─────────────────────────────────────────────────────────────────────

function DoneState({
  reflection,
  duplicate,
  onClose,
  onKeepTalking,
}: {
  reflection: string;
  duplicate: boolean;
  onClose: () => void;
  onKeepTalking: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col pb-6">
      <div className="flex flex-col items-center gap-2 pt-6 pb-4">
        <KaiOrb size={88} />
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
          <Sparkles size={12} aria-hidden="true" /> Checked in
        </p>
      </div>

      <div className="mt-4">
        <KaiMessage orbSize={32}>{reflection}</KaiMessage>
      </div>

      {duplicate ? (
        <p className="mt-4 text-center text-xs text-text-muted">
          You already checked in this window. Two check-ins a day is fine —
          just noting.
        </p>
      ) : null}

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
        <button
          type="button"
          onClick={onKeepTalking}
          className="
            flex h-12 w-full items-center justify-center rounded-full
            border border-glass-border bg-surface text-text-primary font-medium
            shadow-card transition hover:bg-surface-muted active:scale-[0.99]
            focus-ring
          "
        >
          Keep talking to KAI
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function headlineForNow(now = new Date()): {
  eyebrow: string;
  title: string;
} {
  const h = now.getHours();
  if (h >= 5 && h < 12) {
    return { eyebrow: "morning check-in", title: "Morning reflection" };
  }
  if (h >= 17 && h < 23) {
    return { eyebrow: "evening check-in", title: "Evening reflection" };
  }
  return { eyebrow: "check-in", title: "Quick read" };
}
