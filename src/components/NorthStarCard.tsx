// NorthStarCard — the long-term goal tile shown next to the Daily Score on
// Home (client request 2026-06-02). A ring that fills with cumulative progress
// ("the more you do, the more it fills"), the goal text, and a tap-to-edit.

import { Target, Pencil } from "lucide-react";
import { useEffect, useState } from "react";

import { ScoreRing } from "./ScoreRing";
import {
  getNorthStar,
  northStarProgress,
  setNorthStar,
} from "../lib/local-northstar";

export function NorthStarCard() {
  const [goal, setGoal] = useState<string | null>(null);
  const [pct, setPct] = useState(0);
  const [editing, setEditing] = useState(false);

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
        onClick={() => setEditing(true)}
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
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              {goal ? (
                <>
                  <span className="font-mono text-xl font-bold leading-none text-text-primary">
                    {pct}
                    <span className="text-xs text-text-muted">%</span>
                  </span>
                </>
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
          {goal ? (pct > 0 ? `${pct}% there` : "Just getting going") : "Tap to set"}
        </p>
      </button>

      {editing && (
        <NorthStarEditor
          initial={goal ?? ""}
          onClose={() => setEditing(false)}
          onSave={(g) => {
            setNorthStar(g, "custom");
            refresh();
            setEditing(false);
          }}
        />
      )}
    </>
  );
}

function NorthStarEditor({
  initial,
  onClose,
  onSave,
}: {
  initial: string;
  onClose: () => void;
  onSave: (goal: string) => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-glass border border-glass-border bg-surface p-5 shadow-card-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-xl font-semibold tracking-tight text-text-primary">
          What's the one big thing?
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
          The goal that takes weeks or months — the thing all the small days add
          up to. Your ring fills as you keep showing up.
        </p>
        <textarea
          autoFocus
          value={text}
          maxLength={80}
          rows={2}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Make the varsity team. Get genuinely stronger. Feel less anxious."
          className="
            mt-4 w-full resize-none rounded-lg border border-glass-border bg-background
            px-4 py-3 text-base text-text-primary placeholder:text-text-muted
            shadow-card focus-ring
          "
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="
              flex h-11 flex-1 items-center justify-center rounded-full
              border border-glass-border bg-surface text-sm font-medium text-text-primary
              transition hover:bg-surface-muted focus-ring
            "
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(text)}
            disabled={!text.trim()}
            className="
              flex h-11 flex-1 items-center justify-center rounded-full
              bg-text-primary text-sm font-medium text-background
              transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-text-soft focus-ring
            "
          >
            Save goal
          </button>
        </div>
      </div>
    </div>
  );
}
