// NorthStarCard — the long-term goal tile next to the Daily Score.
//
// The ring fills ONLY from completing goal-aligned "moves" KAI generates for the
// specific goal (per client: progress is earned by actions that actually move
// you toward the goal, not generic logging). Tap the tile -> a sheet with the
// goal, the ring, and today's 3 checkable moves.

import { Target, Pencil, Check, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { ScoreRing } from "./ScoreRing";
import { api } from "../lib/api";
import {
  completeMove,
  getMovesForToday,
  getNorthStar,
  northStarProgress,
  setMovesForToday,
  setNorthStar,
  type GoalMoves,
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
    return () => window.removeEventListener("kai:state-changed", on);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          group relative flex flex-col rounded-glass border border-glass-border
          bg-surface p-5 text-left shadow-card-lg transition
          active:scale-[0.99] hover:bg-surface-muted focus-ring
        "
      >
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            Your goal
          </p>
          <Pencil
            size={12}
            className="text-text-muted opacity-0 transition group-hover:opacity-100"
            aria-hidden="true"
          />
        </div>

        <div className="mt-3 flex justify-center">
          <div className="relative inline-flex items-center justify-center">
            <ScoreRing value={pct} size={96} />
            <span className="absolute inset-0 flex items-center justify-center">
              {goal ? (
                <span className="font-mono text-xl font-bold leading-none text-text-primary">
                  {pct}
                  <span className="text-xs text-text-muted">%</span>
                </span>
              ) : (
                <Target size={22} className="text-text-muted" aria-hidden="true" />
              )}
            </span>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-text-primary">
          {goal ?? "Set your big goal"}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          {goal ? (pct > 0 ? `${pct}% there` : "Make a move ↗") : "Tap to set"}
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
          onChanged={refresh}
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
  onChanged,
}: {
  goal: string | null;
  pct: number;
  onClose: () => void;
  onSaveGoal: (goal: string) => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(!goal);
  const [text, setText] = useState(goal ?? "");
  const [moves, setMoves] = useState<GoalMoves | null>(() => getMovesForToday());
  const [loading, setLoading] = useState(false);

  // Fetch today's moves if we don't have them yet for the current goal.
  useEffect(() => {
    if (!goal || editing) return;
    if (getMovesForToday()) {
      setMoves(getMovesForToday());
      return;
    }
    void loadMoves(goal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, editing]);

  async function loadMoves(g: string) {
    setLoading(true);
    try {
      const res = await api.northStarMoves(g);
      if (res.moves.length > 0) {
        setMovesForToday(res.moves);
        setMoves(getMovesForToday());
      }
    } catch {
      /* leave moves null — show retry */
    } finally {
      setLoading(false);
    }
  }

  function tick(i: number) {
    completeMove(i);
    setMoves(getMovesForToday());
    onChanged();
  }

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
              The goal that takes weeks or months. KAI will give you real moves
              toward it — the ring fills as you actually do them.
            </p>
            <textarea
              autoFocus
              value={text}
              maxLength={80}
              rows={2}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Make the varsity team. Get a girlfriend. Get genuinely stronger."
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
                  setMoves(null);
                  void loadMoves(text.trim());
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
              <div className="relative inline-flex items-center justify-center">
                <ScoreRing value={pct} size={72} />
                <span className="absolute inset-0 flex items-center justify-center font-mono text-base font-bold text-text-primary">
                  {pct}%
                </span>
              </div>
              <p className="text-sm leading-snug text-text-secondary">
                Your ring fills as you do things that actually move you toward
                this — not from generic logging.
              </p>
            </div>

            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
              Moves toward it — today
            </p>

            {loading && !moves ? (
              <p className="mt-3 text-sm text-text-muted">KAI is thinking of your moves…</p>
            ) : moves && moves.moves.length > 0 ? (
              <div className="mt-3 space-y-2">
                {moves.moves.map((m, i) => {
                  const done = moves.done.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => !done && tick(i)}
                      disabled={done}
                      className={`
                        flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition
                        ${
                          done
                            ? "border-success-soft bg-success-soft/40"
                            : "border-glass-border bg-surface hover:bg-surface-muted active:scale-[0.99]"
                        }
                      `}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          done
                            ? "border-success bg-success text-background"
                            : "border-glass-border"
                        }`}
                      >
                        {done && <Check size={14} aria-hidden="true" />}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          done ? "text-text-secondary line-through" : "text-text-primary"
                        }`}
                      >
                        {m}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => goal && loadMoves(goal)}
                  className="mt-1 inline-flex items-center gap-1.5 px-1 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted transition hover:text-text-primary"
                >
                  <RefreshCw size={11} aria-hidden="true" /> New moves
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => goal && loadMoves(goal)}
                className="mt-3 text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                Get today's moves
              </button>
            )}

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
