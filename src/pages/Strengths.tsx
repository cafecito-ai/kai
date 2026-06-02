// /strengths — Strengths Discovery Q&A flow.
//
// 15 questions across 5 sections (energy / curiosity / feedback /
// repetition / courage). Takes ~15 minutes. Skippable per-question.
// On submit, KAI returns a short summary of the patterns it sees.
//
// This page replaces the old v0 "Strengths discovery card" that was
// buried inside /engine/mental and /engine/potential. Same questions,
// same backend endpoint (api.submitStrengthsDiscovery), but clean
// design language matching the rest of the app.
//
// Surfaces from Profile → "Strengths discovery". Lev or anyone else
// can come back later to update answers.

import { ArrowLeft, ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { api } from "../lib/api";
import { STRENGTHS_DISCOVERY_QUESTIONS } from "../lib/strengths-questions";

type Phase = "intro" | "answering" | "submitting" | "summary";

const SECTION_LABELS: Record<string, string> = {
  energy: "Energy",
  curiosity: "Curiosity",
  feedback: "Feedback",
  repetition: "Repetition",
  courage: "Courage",
};

const STORAGE_KEY = "kai_strengths_responses_v1";

export function Strengths() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intro");
  const [responses, setResponses] = useState<Record<string, string>>(() => readLocal());
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  const answered = useMemo(
    () =>
      STRENGTHS_DISCOVERY_QUESTIONS.filter((q) => responses[q.id]?.trim()).length,
    [responses],
  );

  function setAnswer(id: string, value: string) {
    const next = { ...responses, [id]: value };
    setResponses(next);
    writeLocal(next);
  }

  async function submit() {
    if (answered === 0) return;
    setPhase("submitting");
    setError(null);
    try {
      const result = await api.submitStrengthsDiscovery(responses);
      setSummary(result.summary);
      setPhase("summary");
    } catch {
      // Offline / no-AI fallback — stitch the first 3 answers into a
      // working draft so the user still gets something back.
      const fallback = STRENGTHS_DISCOVERY_QUESTIONS.map(
        (q) => responses[q.id]?.trim(),
      )
        .filter(Boolean)
        .slice(0, 3)
        .join("; ");
      setSummary(
        fallback
          ? `A few patterns to play with: ${fallback}.`
          : "Your answers are saved on this device. Come back when you're online and I'll pull them into a read.",
      );
      setPhase("summary");
    }
  }

  function startOver() {
    setResponses({});
    writeLocal({});
    setSummary("");
    setPhase("intro");
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-6 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/profile"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          strengths discovery
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {phase === "intro" && (
        <IntroCard
          answered={answered}
          total={STRENGTHS_DISCOVERY_QUESTIONS.length}
          onStart={() => setPhase("answering")}
          onResume={() => setPhase("answering")}
        />
      )}

      {phase === "answering" && (
        <AnswerForm
          responses={responses}
          setAnswer={setAnswer}
          answered={answered}
          total={STRENGTHS_DISCOVERY_QUESTIONS.length}
          onSubmit={submit}
          onClose={() => setPhase("intro")}
        />
      )}

      {phase === "submitting" && (
        <div className="mt-12 rounded-glass border border-glass-border bg-surface p-8 text-center shadow-card">
          <KaiOrb size={64} />
          <p className="mt-4 text-sm text-text-secondary">
            Pulling patterns from what you wrote…
          </p>
        </div>
      )}

      {phase === "summary" && (
        <SummaryView
          summary={summary}
          onEdit={() => setPhase("answering")}
          onStartOver={startOver}
          onDone={() => navigate("/profile")}
        />
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-warning-soft bg-warning-soft px-3 py-2 text-sm text-warning">
          {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Intro
// ─────────────────────────────────────────────────────────────────────

function IntroCard({
  answered,
  total,
  onStart,
  onResume,
}: {
  answered: number;
  total: number;
  onStart: () => void;
  onResume: () => void;
}) {
  const hasProgress = answered > 0;
  return (
    <div className="pt-2">
      <div className="text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-cool-soft">
          <Sparkles size={22} className="text-accent-cool" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight">
          Turn patterns into a first experiment
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          15 questions in 5 sections — energy, curiosity, feedback, repetition,
          courage. About 15 minutes. No big life plan required.
        </p>
      </div>

      <section className="mt-6 rounded-glass border border-glass-border bg-surface p-4 shadow-card">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          how it works
        </p>
        <ul className="mt-3 space-y-2 text-sm text-text-primary">
          <li>· Skip anything that doesn't land. Half a thought is fine.</li>
          <li>· Your answers save on this device as you type.</li>
          <li>· KAI gives you a short read at the end — not a label.</li>
        </ul>
      </section>

      <div className="mt-6">
        {hasProgress ? (
          <>
            <button
              type="button"
              onClick={onResume}
              className="
                flex h-12 w-full items-center justify-center gap-2 rounded-full
                bg-text-primary text-background font-medium
                shadow-card transition active:scale-[0.99] focus-ring
              "
            >
              Resume — {answered} of {total} answered
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onStart}
            className="
              flex h-12 w-full items-center justify-center gap-2 rounded-full
              bg-text-primary text-background font-medium
              shadow-card transition active:scale-[0.99] focus-ring
            "
          >
            Start
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Answer form
// ─────────────────────────────────────────────────────────────────────

function AnswerForm({
  responses,
  setAnswer,
  answered,
  total,
  onSubmit,
  onClose,
}: {
  responses: Record<string, string>;
  setAnswer: (id: string, value: string) => void;
  answered: number;
  total: number;
  onSubmit: () => void;
  onClose: () => void;
}) {
  // Group questions by section so we can render section headers between them.
  const sectionOrder = ["energy", "curiosity", "feedback", "repetition", "courage"];
  return (
    <div>
      <div className="sticky top-0 z-10 mb-3 -mx-5 bg-background/90 px-5 py-2 backdrop-blur">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full bg-text-primary transition-all duration-300"
            style={{ width: `${(answered / total) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          {answered} of {total} answered — skip any that don't land
        </p>
      </div>

      <div className="space-y-6">
        {sectionOrder.map((section) => {
          const qs = STRENGTHS_DISCOVERY_QUESTIONS.filter(
            (q) => q.section === section,
          );
          if (qs.length === 0) return null;
          return (
            <section key={section} className="space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                {SECTION_LABELS[section]}
              </p>
              {qs.map((q, idx) => {
                const globalIdx =
                  STRENGTHS_DISCOVERY_QUESTIONS.findIndex((x) => x.id === q.id) + 1;
                return (
                  <div
                    key={q.id}
                    className="rounded-glass border border-glass-border bg-surface p-4 shadow-card"
                  >
                    <label htmlFor={q.id} className="block">
                      <span className="block text-sm font-medium leading-snug text-text-primary">
                        {globalIdx}. {q.prompt}
                      </span>
                      <textarea
                        id={q.id}
                        value={responses[q.id] ?? ""}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        placeholder="Anything you've got. Half a thought is fine."
                        rows={3}
                        className="
                          mt-2.5 w-full resize-none rounded-lg border border-glass-border bg-surface
                          px-3 py-2.5 text-sm text-text-primary
                          placeholder:text-text-muted focus-ring
                        "
                      />
                    </label>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="
            flex flex-1 h-12 items-center justify-center rounded-full
            border border-glass-border bg-surface text-text-primary font-medium
            shadow-card transition hover:bg-surface-muted focus-ring
          "
        >
          Pause
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={answered === 0}
          className="
            flex flex-[2] h-12 items-center justify-center gap-2 rounded-full
            bg-text-primary text-background font-medium
            shadow-card transition active:scale-[0.99]
            disabled:cursor-not-allowed disabled:bg-text-soft focus-ring
          "
        >
          See KAI's read
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        Saved on your device as you type
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Summary view
// ─────────────────────────────────────────────────────────────────────

function SummaryView({
  summary,
  onEdit,
  onStartOver,
  onDone,
}: {
  summary: string;
  onEdit: () => void;
  onStartOver: () => void;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col pb-6">
      <div className="flex flex-col items-center pt-4 pb-3 text-center">
        <KaiOrb size={88} />
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
          <Sparkles size={12} aria-hidden="true" /> A working draft
        </p>
      </div>

      <div className="mt-4">
        <KaiMessage orbSize={32}>{summary}</KaiMessage>
      </div>

      <p className="mt-4 text-center text-xs text-text-secondary">
        Self-knowledge isn't a project you finish. Come back whenever you want
        to add or change an answer.
      </p>

      <div className="mt-6 space-y-2">
        <button
          type="button"
          onClick={onDone}
          className="
            flex h-12 w-full items-center justify-center rounded-full
            bg-text-primary text-background font-medium
            shadow-card transition active:scale-[0.99] focus-ring
          "
        >
          Done
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="
            flex h-11 w-full items-center justify-center rounded-full
            border border-glass-border bg-surface text-sm font-medium text-text-primary
            shadow-card transition hover:bg-surface-muted focus-ring
          "
        >
          Edit my answers
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="
            flex h-11 w-full items-center justify-center gap-1.5 rounded-full
            text-xs font-medium text-text-muted
            transition hover:bg-surface-muted focus-ring
          "
        >
          <RefreshCw size={12} aria-hidden="true" />
          Clear all and start over
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Local persistence (answers save as you type)
// ─────────────────────────────────────────────────────────────────────

function readLocal(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function writeLocal(responses: Record<string, string>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
  } catch {
    /* quota — fine */
  }
}
