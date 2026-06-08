// NorthStarCard — the long-term goal tile next to the Daily Score.
//
// The ring fills AUTOMATICALLY from the daily things the user logs, weighted by
// how much each correlates with this goal (see local-northstar). No tapping to
// score progress. Tap the tile -> a sheet with the goal (editable), the ring,
// and the aligned daily actions that build it (quick links to log them).

import { Target, Pencil, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ScoreRing } from "./ScoreRing";
import {
  getNorthStar,
  northStarProgress,
  setNorthStar,
  whatBuildsGoal,
} from "../lib/local-northstar";

export function NorthStarCard() {
  const [goal, setGoal] = useState<string | null>(null);
  const [pct, setPct] = useState(0);
  const [open, setOpen] = useState(false);

  function refresh() {
    setGoal(getNorthStar()?.goal ?? null);
    setPct(northStarProgress().pct);
  }

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("kai:state-changed", on);
    window.addEventListener("kai:input-appended", on);
    return () => {
      window.removeEventListener("kai:state-changed", on);
      window.removeEventListener("kai:input-appended", on);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          group relative flex flex-col items-center rounded-glass border border-glass-border
          bg-surface p-5 text-center shadow-card-lg transition
          active:scale-[0.99] hover:bg-surface-muted focus-ring
        "
      >
        {/* The goal name IS the title (per client — not the generic 'Your Goal'). */}
        <p className="line-clamp-1 max-w-full text-sm font-semibold text-text-primary">
          {goal ?? "Set your goal"}
        </p>
        <Pencil
          size={12}
          className="absolute right-3 top-3 text-text-muted opacity-0 transition group-hover:opacity-100"
          aria-hidden="true"
        />

        <div className="relative mt-4 inline-flex items-center justify-center">
          <ScoreRing value={pct} size={104} />
          <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            {goal ? (
              <>
                <span className="font-mono text-[2rem] font-bold text-text-primary">{pct}</span>
                <span className="mt-0.5 font-mono text-[10px] tracking-wide text-text-muted">%</span>
              </>
            ) : (
              <Target size={24} className="text-text-muted" aria-hidden="true" />
            )}
          </span>
        </div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          {goal ? "Your goal" : "Set a goal"}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          {goal ? (pct > 0 ? `${pct}% there` : "Log to build it") : "Tap to set"}
        </p>
      </button>

      {open && (
        <GoalSheet
          goal={goal}
          pct={pct}
          onClose={() => setOpen(false)}
          onSaveGoal={(g) => {
            setNorthStar(g, "custom");
            refresh();
          }}
        />
      )}
    </>
  );
}

function GoalSheet({
  goal,
  pct,
  onClose,
  onSaveGoal,
}: {
  goal: string | null;
  pct: number;
  onClose: () => void;
  onSaveGoal: (goal: string) => void;
}) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(!goal);
  const [text, setText] = useState(goal ?? "");
  const builds = whatBuildsGoal();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-glass border border-glass-border bg-surface p-5 shadow-card-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {editing ? (
          <>
            <p className="font-display text-xl font-semibold tracking-tight text-text-primary">
              What's the one big thing?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
              The goal that takes weeks or months. KAI fills this ring
              automatically as you log the things that move you toward it.
            </p>
            <textarea
              autoFocus
              value={text}
              maxLength={80}
              rows={2}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Build muscle. Improve at boxing. Fix my sleep. Gain confidence."
              className="
                mt-4 w-full resize-none rounded-lg border border-glass-border bg-background
                px-4 py-3 text-base text-text-primary placeholder:text-text-muted
                shadow-card focus-ring
              "
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={goal ? () => setEditing(false) : onClose}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-glass-border bg-surface text-sm font-medium text-text-primary transition hover:bg-surface-muted focus-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!text.trim()) return;
                  onSaveGoal(text);
                  setEditing(false);
                }}
                disabled={!text.trim()}
                className="flex h-11 flex-1 items-center justify-center rounded-full bg-text-primary text-sm font-medium text-background transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-text-soft focus-ring"
              >
                Save goal
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                  Your goal
                </p>
                <p className="mt-1 font-display text-xl font-semibold leading-snug tracking-tight text-text-primary">
                  {goal}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setText(goal ?? "");
                  setEditing(true);
                }}
                aria-label="Edit goal"
                className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-glass-border bg-surface text-text-muted transition hover:bg-surface-muted focus-ring"
              >
                <Pencil size={13} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4 rounded-lg border border-glass-border bg-background p-4">
              <div className="relative inline-flex shrink-0 items-center justify-center">
                <ScoreRing value={pct} size={72} />
                <span className="absolute inset-0 flex items-center justify-center font-mono text-base font-bold text-text-primary">
                  {pct}%
                </span>
              </div>
              <p className="text-sm leading-snug text-text-secondary">
                This fills on its own as you do the things that move you toward
                it — no extra taps.
              </p>
            </div>

            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
              What builds this goal
            </p>
            <div className="mt-3 space-y-2">
              {builds.map((b) => (
                <button
                  key={b.to}
                  type="button"
                  onClick={() => navigate(b.to)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 text-left transition hover:bg-surface-muted active:scale-[0.99] focus-ring"
                >
                  <span className="text-sm font-medium text-text-primary">{b.label}</span>
                  <ArrowRight size={15} className="text-text-muted" aria-hidden="true" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-text-primary text-sm font-medium text-background transition active:scale-[0.99] focus-ring"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
