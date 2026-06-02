// /journal — free-text journaling (T-016).
//
// One big text area, char counter, send button. On submit:
//   - Local-mode: log to localStorage with a heuristic sentiment, show
//     a mood-appropriate reflection
//   - API-mode: POST /api/journal, render the Mind agent's reflection
//
// Either way the entry flows into score_inputs and bumps today's mental
// + mood sub-scores when the user lands back on /home.

import { ArrowLeft, ArrowUp } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { api } from "../lib/api";
import { appendLocalInput } from "../lib/local-score";

const MAX_CHARS = 5000;

type Phase = "compose" | "sending" | "done";

export function Journal() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<Phase>("compose");
  const [reflection, setReflection] = useState("");

  async function send() {
    const content = draft.trim();
    if (!content || phase === "sending") return;
    setPhase("sending");

    // Log to local store first so /home reflects it immediately.
    const sentiment = localSentiment(content);
    appendLocalInput({
      date: new Date().toISOString().slice(0, 10),
      source: "journal",
      value: { sentiment, chars: content.length },
    });

    try {
      const res = await api.submitJournal({ content });
      setReflection(res.reflection || offlineJournalReflection(content, sentiment));
      setPhase("done");
    } catch {
      setReflection(offlineJournalReflection(content, sentiment));
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
          journal
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {phase === "done" ? (
        <DoneState
          reflection={reflection}
          onClose={() => navigate("/home")}
        />
      ) : (
        <Composer
          draft={draft}
          setDraft={setDraft}
          sending={phase === "sending"}
          onSend={send}
        />
      )}
    </div>
  );
}

function Composer({
  draft,
  setDraft,
  sending,
  onSend,
}: {
  draft: string;
  setDraft: (s: string) => void;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 pb-6">
      <div>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          Write anything.
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          No one's reading this but you. KAI reads it to learn — never to
          judge.
        </p>
      </div>

      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
        placeholder="Start anywhere. A messy sentence is fine."
        className="
          min-h-[40vh] w-full flex-1 resize-none
          rounded-lg border border-glass-border bg-surface
          px-4 py-4 text-base leading-relaxed text-text-primary
          placeholder:text-text-muted shadow-card focus-ring
        "
      />

      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] text-text-muted">
          {draft.length} / {MAX_CHARS}
        </p>
        <button
          type="button"
          onClick={onSend}
          disabled={draft.trim().length === 0 || sending}
          className="
            inline-flex h-11 items-center gap-2 rounded-full
            bg-text-primary px-5 text-background font-medium
            shadow-card transition active:scale-[0.99]
            disabled:cursor-not-allowed disabled:bg-text-soft focus-ring
          "
        >
          {sending ? "Sending…" : "Send to KAI"}
          {!sending && <ArrowUp size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function DoneState({
  reflection,
  onClose,
}: {
  reflection: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col pb-6">
      <div className="flex flex-col items-center pt-6 pb-4">
        <KaiOrb size={88} />
      </div>
      <div className="mt-2">
        <KaiMessage orbSize={32}>{reflection}</KaiMessage>
      </div>
      <p className="mt-4 text-center text-xs text-text-muted">
        Saved. This entry is private to you.
      </p>
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
        <Link
          to="/chat"
          className="
            flex h-12 w-full items-center justify-center rounded-full
            border border-glass-border bg-surface text-text-primary font-medium
            shadow-card transition hover:bg-surface-muted active:scale-[0.99]
            focus-ring
          "
        >
          Keep talking to KAI
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Local-mode helpers
// ─────────────────────────────────────────────────────────────────────

// Same heuristic as workers/src/routes/journal.ts → estimateSentiment.
// Kept here so the frontend can compute sentiment without a network round.
function localSentiment(text: string): number {
  const lower = text.toLowerCase();
  const POS = [
    "good", "great", "happy", "grateful", "love", "excited", "proud",
    "calm", "okay", "fine", "better", "won", "win", "hopeful", "easy",
    "relief",
  ];
  const NEG = [
    "bad", "sad", "anxious", "angry", "afraid", "scared", "lonely",
    "tired", "exhausted", "hate", "stressed", "stress", "overwhelmed",
    "lost", "worried", "stuck", "hard",
  ];
  let pos = 0;
  let neg = 0;
  for (const w of POS) {
    const m = lower.match(new RegExp(`\\b${w}\\b`, "g"));
    if (m) pos += m.length;
  }
  for (const w of NEG) {
    const m = lower.match(new RegExp(`\\b${w}\\b`, "g"));
    if (m) neg += m.length;
  }
  if (pos + neg === 0) return 0;
  return Math.max(-1, Math.min(1, ((pos - neg) / (pos + neg)) * 0.7));
}

function offlineJournalReflection(_content: string, sentiment: number): string {
  if (sentiment <= -0.4) {
    return "Heavy stuff. You wrote it down, which means you're already further than you were five minutes ago. Sleep on it before deciding anything big.";
  }
  if (sentiment >= 0.4) {
    return "You've got a clear thread today — notice what's working. That's the kind of pattern worth feeding.";
  }
  return "Logged. Mixed days are real days. The one thing worth holding onto: you bothered to write it down.";
}
