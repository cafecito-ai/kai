// Daily missions card on /home (Rawz/2).
//
// Renders 3 AI-selected actions for today + a progress chip. Tap a
// mission to navigate to the relevant logging screen; the mission
// marks itself complete when the user finishes that flow (handled
// downstream when they submit).
//
// For now the explicit "Done" button on each row also marks complete —
// gives the user a way to manually tick off things like "stretch"
// or "drink water" that don't have a dedicated logger.
//
// Per D-021: incomplete missions are NEVER shamed. Completed ones
// get a soft animation. Missing them at end of day is silent.

import {
  Camera,
  Check,
  ChevronRight,
  Dumbbell,
  GlassWater,
  Heart,
  Moon,
  NotebookPen,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  completeMission,
  getTodayMissions,
  type Mission,
} from "../lib/local-missions";

const ICON_MAP: Record<Mission["icon"], LucideIcon> = {
  Heart,
  Moon,
  Dumbbell,
  Camera,
  NotebookPen,
  GlassWater,
  Sparkles,
  Zap,
};

export function MissionsCard({ className = "" }: { className?: string }) {
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setMissions(getTodayMissions());
  }, []);

  if (!missions) {
    // Skeleton so layout doesn't shift on first paint
    return <div className={`h-[200px] ${className}`} aria-hidden="true" />;
  }

  const done = missions.filter((m) => m.completed).length;
  const total = missions.length;
  const allDone = done === total;

  function go(m: Mission) {
    // Navigate; the destination's "submit" should call completeMission(id).
    // But also offer a manual tick to handle things without a dedicated
    // logger (like stretch / hydrate).
    navigate(m.to);
  }

  function tick(m: Mission, e: React.MouseEvent) {
    e.stopPropagation();
    const next = completeMission(m.id);
    setMissions(next);
  }

  return (
    <section
      className={`rounded-glass border border-glass-border bg-surface p-5 shadow-card ${className}`}
    >
      <div className="flex items-center justify-between gap-3 pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            today's three
          </p>
          <h2 className="mt-0.5 font-display text-lg font-semibold leading-tight tracking-tight">
            {allDone ? "All three done." : "Small wins for today"}
          </h2>
        </div>
        <span
          className={`
            inline-flex items-center gap-1 rounded-full px-2.5 py-1
            font-mono text-[11px] font-medium
            ${
              allDone
                ? "bg-success-soft text-success"
                : "bg-surface-muted text-text-secondary"
            }
          `}
        >
          {done}/{total}
          {allDone && <Check size={10} aria-hidden="true" />}
        </span>
      </div>

      <div className="space-y-2">
        {missions.map((m) => (
          <MissionRow
            key={m.id}
            mission={m}
            onOpen={() => go(m)}
            onTick={(e) => tick(m, e)}
          />
        ))}
      </div>

      {allDone && (
        <p className="mt-3 text-center text-xs leading-relaxed text-text-secondary">
          That's a real day. Anything more is bonus.
        </p>
      )}
    </section>
  );
}

function MissionRow({
  mission,
  onOpen,
  onTick,
}: {
  mission: Mission;
  onOpen: () => void;
  onTick: (e: React.MouseEvent) => void;
}) {
  const Icon = ICON_MAP[mission.icon];
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`
        flex w-full items-center gap-3 rounded-lg border px-3 py-2.5
        text-left shadow-card transition active:scale-[0.99] focus-ring
        ${
          mission.completed
            ? "border-glass-border bg-success-soft/40"
            : "border-glass-border bg-surface hover:bg-surface-muted"
        }
      `}
    >
      <span
        className={`
          flex h-9 w-9 shrink-0 items-center justify-center rounded-full
          ${mission.completed ? "bg-success-soft text-success" : mission.tint}
        `}
      >
        {mission.completed ? (
          <Check size={14} aria-hidden="true" />
        ) : (
          <Icon size={14} aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`
            block text-sm font-medium leading-tight
            ${mission.completed ? "text-text-secondary line-through" : "text-text-primary"}
          `}
        >
          {mission.title}
        </span>
        <span className="block text-xs text-text-secondary">
          {mission.subtitle}
        </span>
      </span>
      {mission.completed ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-success">
          done
        </span>
      ) : (
        <>
          <button
            type="button"
            onClick={onTick}
            aria-label={`Mark "${mission.title}" done`}
            className="
              flex h-7 w-7 items-center justify-center rounded-full
              border border-glass-border bg-surface text-text-secondary
              transition hover:bg-success-soft hover:text-success focus-ring
            "
          >
            <Check size={12} aria-hidden="true" />
          </button>
          <ChevronRight size={14} className="text-text-muted" aria-hidden="true" />
        </>
      )}
    </button>
  );
}
