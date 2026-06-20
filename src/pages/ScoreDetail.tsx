// /score — Daily Score transparency (Bucket 4).
//
// Makes it obvious how today's score is built and why it isn't 100. The score
// is Mind 40% + Sleep 30% + Mood 30% — NOT "do 3 things → 100%" — so we show
// each part's contribution, what's already counted, and the exact logs that
// would raise it. No guessing.

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ScoreRing } from "../components/ScoreRing";
import { explainScore, readLocalInputs, type ScoreComponent } from "../lib/local-score";

export function ScoreDetail() {
  const navigate = useNavigate();
  const explanation = useMemo(() => explainScore(readLocalInputs()), []);
  const { final, pointsLeft, components } = explanation;

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-5 pt-2 pb-28 sm:max-w-lg">
      <header className="flex items-center justify-between pb-1">
        <Link
          to="/home"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">today's score</p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {/* Hero ring + the headline that removes the guesswork. */}
      <div className="flex flex-col items-center text-center">
        <div className="relative inline-flex items-center justify-center">
          <ScoreRing value={final} size={132} />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex items-baseline gap-0.5">
              <span className="font-mono text-4xl font-bold leading-none text-text-primary">{final}</span>
              <span className="font-mono text-sm text-text-muted">/100</span>
            </span>
          </span>
        </div>
        <p className="mt-4 font-display text-lg font-semibold text-text-primary">
          {pointsLeft === 0 ? "You maxed today. Nothing left on the table." : `${pointsLeft} points still on the table`}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Your score is <span className="text-text-primary">Mind 40%</span> +{" "}
          <span className="text-text-primary">Sleep 30%</span> +{" "}
          <span className="text-text-primary">Mood 30%</span> — not a checklist. Here's exactly where it stands.
        </p>
      </div>

      <div className="space-y-3">
        {components.map((c) => (
          <ComponentCard key={c.key} c={c} onGo={(to) => navigate(to)} />
        ))}
      </div>
    </div>
  );
}

function ComponentCard({ c, onGo }: { c: ScoreComponent; onGo: (to: string) => void }) {
  const maxContribution = c.weight; // a 100 sub-score contributes its full weight
  return (
    <div className="rounded-glass border border-glass-border bg-surface p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-base font-semibold text-text-primary">
          {c.label} <span className="font-mono text-xs font-normal text-text-muted">· {c.weight}% of score</span>
        </p>
        <p className="font-mono text-sm font-bold text-text-primary">
          {c.contribution}
          <span className="text-text-muted">/{maxContribution}</span>
        </p>
      </div>

      {/* Progress within this part. */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-text-primary transition-all duration-300"
          style={{ width: `${c.value}%` }}
        />
      </div>

      {c.done.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.done.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success"
            >
              <Check size={11} aria-hidden="true" /> {d}
            </span>
          ))}
        </div>
      )}

      {c.todos.length > 0 ? (
        <div className="mt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Raise it</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {c.todos.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => onGo(t.to)}
                className="
                  inline-flex items-center gap-1 rounded-full
                  border border-accent-soft bg-accent-soft/40
                  px-3 py-1 text-xs font-medium text-accent
                  transition hover:bg-accent-soft/60 active:scale-[0.98] focus-ring
                "
              >
                {t.label}
                <ArrowRight size={12} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-success">Maxed — nothing left here today.</p>
      )}
    </div>
  );
}
