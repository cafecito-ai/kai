// NorthStarCard — the goal tile next to the Daily Score on Home.
//
// The goal IS your main system: the title comes from the live system
// (getSystemGoal) and the ring shows your WEEKLY completion across all of the
// goal's sub-systems (allSubSystemsProgressWeek) — the SAME number shown at the
// top of the System page, so Home and /schedule finally agree. Tapping the tile
// opens the System page (/schedule).

import { ArrowUpRight, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ScoreRing } from "./ScoreRing";
import { cleanPlanTitle } from "../lib/local-northstar";
import { getSystemGoal } from "../lib/local-systems";
import { allSubSystemsProgressWeek, getSubSystems } from "../lib/local-subsystems";
import { useStorageUserId } from "../lib/storage-user-id";

export function NorthStarCard() {
  const userId = useStorageUserId();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<string | null>(null);
  const [pct, setPct] = useState(0);
  const [hasSys, setHasSys] = useState(false);

  function refresh() {
    setGoal(getSystemGoal(userId));
    setPct(allSubSystemsProgressWeek(userId).pct);
    setHasSys(getSubSystems(userId).length > 0);
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
  }, [userId]);

  return (
    <button
      type="button"
      onClick={() => navigate("/schedule")}
      className="
        group relative flex flex-col rounded-glass border border-glass-border
        bg-surface p-5 text-center shadow-card-lg transition
        active:scale-[0.99] hover:bg-surface-muted focus-ring
      "
    >
      <ArrowUpRight
        size={13}
        className="absolute right-4 top-4 text-text-muted opacity-0 transition group-hover:opacity-100"
        aria-hidden="true"
      />
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        My Plan
      </p>

      <div className="mt-3 flex justify-center">
        <div className="relative inline-flex items-center justify-center">
          <ScoreRing value={pct} size={96} />
          <span className="absolute inset-0 flex items-center justify-center">
            {goal ? (
              <span className="flex items-baseline gap-0.5">
                <span className="font-mono text-2xl font-bold leading-none text-text-primary">
                  {pct}
                </span>
                <span className="font-mono text-xs text-text-muted">%</span>
              </span>
            ) : (
              <Target size={22} className="text-text-muted" aria-hidden="true" />
            )}
          </span>
        </div>
      </div>

      {/* Clean, memorable plan title (messy goals get shortened); the full
          goal text lives on the plan page. */}
      <p className="mt-3 line-clamp-1 min-h-[1.75rem] font-display text-lg font-semibold leading-snug tracking-tight text-text-primary">
        {goal ? cleanPlanTitle(goal) : "Build my plan"}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        {hasSys ? `${pct}% this week` : "Tap to build"}
      </p>
    </button>
  );
}
