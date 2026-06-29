// /schedule — your SYSTEM, built by KAI around your main goal.
//
// One main goal pinned at the top. KAI breaks it into 2-4 named SUB-SYSTEMS
// (component skills), each with concrete how-to habits and its own weekly fill
// meter. Swipe between them with the side arrows. The "This week" score (X of Y
// done) is the one clear System number and mirrors the Home "My Plan" ring. No
// clock.
//
// You don't add sub-systems here: change your main goal in Settings (regenerates
// the set), or ask KAI in chat to add or drop one.

import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Circle, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { KaiOrb } from "../components/KaiOrb";
import { cleanPlanTitle } from "../lib/local-northstar";
import { daysLabel, formatTime, type ScheduleItem } from "../lib/local-schedule";
import { getSystemGoal, isDoneToday, toggleDoneToday } from "../lib/local-systems";
import {
  allSubSystemsProgressWeek,
  getSubSystems,
  hasSubSystemsForGoal,
  normGoal,
  setSubSystems,
  subSystemProgressWeek,
  type SubSystem,
} from "../lib/local-subsystems";
import { generateSubSystemsAI, templateSubSystems } from "../lib/subsystem-gen";
import { useStorageUserId } from "../lib/storage-user-id";

export function Schedule() {
  const userId = useStorageUserId();
  const navigate = useNavigate();
  const [bump, setBump] = useState(0);
  const [active, setActive] = useState(0);
  const [building, setBuilding] = useState(false);
  const [logged, setLogged] = useState(false);
  const genFor = useRef<string | null>(null);
  const touchX = useRef(0);
  const refresh = () => setBump((b) => b + 1);
  void bump;

  const goal = getSystemGoal(userId);
  const systems = getSubSystems(userId);
  const week = allSubSystemsProgressWeek(userId);

  // Build sub-systems when we have a goal but none for it yet. We show a
  // "KAI is making your system" loading state the whole time and NEVER flash a
  // generic placeholder: try the live AI first (bounded), and only when it fails
  // fall back to the goal-matched template. Runs lazily on mount and again when
  // the goal changes (mismatch makes hasSubSystemsForGoal false).
  useEffect(() => {
    if (!goal) return;
    if (hasSubSystemsForGoal(goal, userId)) return;
    if (genFor.current === normGoal(goal)) return;
    genFor.current = normGoal(goal);
    setBuilding(true);
    generateSubSystemsAI(goal)
      .then((ai) => {
        if (genFor.current !== normGoal(goal)) return;
        const result = ai && ai.length >= 2 ? ai : templateSubSystems(goal);
        setSubSystems(goal, result, userId);
        setActive(0);
      })
      .catch(() => {
        if (genFor.current === normGoal(goal)) {
          setSubSystems(goal, templateSubSystems(goal), userId);
          setActive(0);
        }
      })
      .finally(() => setBuilding(false));
  }, [goal, userId]);

  useEffect(() => {
    const on = () => refresh();
    window.addEventListener("kai:state-changed", on);
    return () => window.removeEventListener("kai:state-changed", on);
  }, []);

  useEffect(() => {
    if (!logged) return;
    const t = setTimeout(() => setLogged(false), 1200);
    return () => clearTimeout(t);
  }, [logged]);

  const safeActive = Math.min(active, Math.max(0, systems.length - 1));

  function handleToggle(item: ScheduleItem) {
    const wasDone = isDoneToday(item.id, userId);
    toggleDoneToday(item.id, userId);
    if (!wasDone) setLogged(true);
    refresh();
  }

  function go(dir: -1 | 1) {
    setActive((a) => Math.max(0, Math.min(systems.length - 1, a + dir)));
  }

  const title = goal ? cleanPlanTitle(goal) : "Your system";
  const showRaw = goal && cleanPlanTitle(goal).toLowerCase() !== goal.trim().toLowerCase();

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-28 sm:max-w-lg">
      <header className="flex items-center justify-between pb-1">
        <Link
          to="/home"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">my system</p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {/* MAIN GOAL — pinned at the top while you swipe through sub-systems. */}
      <div className="sticky top-0 z-10 -mx-5 border-b border-glass-border/60 bg-background/85 px-5 pb-3 pt-2 backdrop-blur">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">Your goal</p>
        <h1 className="mt-0.5 font-display text-3xl font-semibold leading-tight tracking-tight">{title}</h1>
        {showRaw && <p className="mt-0.5 text-sm italic text-text-secondary">“{goal}”</p>}
      </div>

      {/* THIS WEEK — the one clear System score. Same number as the "My Plan"
          ring on Home. Resets each week. */}
      <div className="mt-4 rounded-glass border border-glass-border bg-surface px-4 py-3 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">This week</p>
            <p className="text-xs text-text-secondary">
              {week.total > 0 ? `${week.done} of ${week.total} done` : "Check off habits to fill your week"}
            </p>
          </div>
          <p className="font-mono text-3xl font-bold leading-none text-text-primary">{week.pct}%</p>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${week.pct}%` }}
          />
        </div>
      </div>

      {/* SUB-SYSTEMS */}
      <div className="mt-5">
        {!goal ? (
          <EmptyNoGoal onTalk={() => navigate("/chat")} />
        ) : building || systems.length === 0 ? (
          <BuildingState />
        ) : (
          <section
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (dx < -40) go(1);
              if (dx > 40) go(-1);
            }}
          >
            <div className="flex items-stretch gap-2">
              <ArrowBtn dir="left" disabled={safeActive === 0} onClick={() => go(-1)} />
              <div className="min-w-0 flex-1">
                <SubSystemCard
                  sys={systems[safeActive]}
                  index={safeActive}
                  total={systems.length}
                  userId={userId}
                  onToggle={handleToggle}
                />
              </div>
              <ArrowBtn dir="right" disabled={safeActive === systems.length - 1} onClick={() => go(1)} />
            </div>
            {systems.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {systems.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Go to ${s.name}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === safeActive ? "w-5 bg-text-primary" : "w-1.5 bg-surface-muted"
                    }`}
                  />
                ))}
              </div>
            )}
            <p className="mt-3 text-center text-xs text-text-muted">
              Swipe between your systems. Ask KAI to add or drop one.
            </p>
          </section>
        )}
      </div>

      {logged && <LoggedPill />}
    </div>
  );
}

function ArrowBtn({ dir, disabled, onClick }: { dir: "left" | "right"; disabled: boolean; onClick: () => void }) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "left" ? "Previous system" : "Next system"}
      className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full border border-glass-border bg-surface text-text-secondary shadow-card transition hover:bg-surface-muted disabled:opacity-30 focus-ring"
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}

function SubSystemCard({
  sys,
  index,
  total,
  userId,
  onToggle,
}: {
  sys: SubSystem;
  index: number;
  total: number;
  userId?: string | null;
  onToggle: (item: ScheduleItem) => void;
}) {
  const prog = subSystemProgressWeek(sys, userId);
  return (
    <div className="rounded-glass border border-glass-border bg-surface p-5 shadow-card-lg">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          System {index + 1} of {total}
        </p>
        <p className="font-mono text-[11px] font-bold text-accent">
          {prog.done}/{prog.total} this week
        </p>
      </div>
      <h2 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight text-text-primary">
        {sys.name}
      </h2>
      {sys.blurb && <p className="mt-1 text-sm text-text-secondary">{sys.blurb}</p>}

      {/* This sub-system's own weekly fill meter. */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${prog.pct}%` }}
        />
      </div>

      <div className="mt-4 space-y-2">
        {sys.items.map((it) => (
          <HabitRow key={it.id} item={it} done={isDoneToday(it.id, userId)} onToggle={() => onToggle(it)} />
        ))}
      </div>
    </div>
  );
}

function HabitRow({ item, done, onToggle }: { item: ScheduleItem; done: boolean; onToggle: () => void }) {
  const meta = [formatTime(item.time), daysLabel(item.days)].filter(Boolean).join(" · ");
  return (
    <div
      className={`flex items-start gap-2.5 rounded-2xl border border-glass-border bg-background px-3.5 py-2.5 transition ${
        done ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${done ? "text-text-muted line-through" : "text-text-primary"}`}>
          {item.title}
        </p>
        {item.detail && (
          <p className={`mt-0.5 text-xs leading-snug ${done ? "text-text-muted" : "text-text-secondary"}`}>
            {item.detail}
          </p>
        )}
        {meta && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{meta}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={done ? `Mark "${item.title}" not done` : `Mark "${item.title}" done`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-surface-muted active:scale-95 focus-ring"
      >
        {done ? (
          <CheckCircle2 size={22} className="text-success" aria-hidden="true" />
        ) : (
          <Circle size={22} className="text-text-muted" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

// Shown the whole time KAI is generating — no generic systems ever flash. A
// KAI orb + three bouncing dots so it reads as "working on it".
function BuildingState() {
  return (
    <div className="rounded-glass border border-glass-border bg-surface p-10 text-center shadow-card">
      <div className="flex justify-center">
        <KaiOrb size={56} />
      </div>
      <p className="mt-4 text-sm font-medium text-text-primary">KAI is making your system</p>
      <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden="true">
        <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted" />
      </div>
      <p className="mt-3 text-xs text-text-secondary">Breaking your goal into the skills that get you there.</p>
    </div>
  );
}

function EmptyNoGoal({ onTalk }: { onTalk: () => void }) {
  return (
    <div className="rounded-glass border border-dashed border-glass-border bg-surface/60 p-8 text-center">
      <Sparkles size={26} className="mx-auto text-text-muted" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-text-primary">Set your main goal first</p>
      <p className="mt-1 text-xs text-text-secondary">
        Add it in Settings, or tell KAI what you're going for and they'll build your systems.
      </p>
      <button
        type="button"
        onClick={onTalk}
        className="mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        Talk to KAI
      </button>
    </div>
  );
}

function LoggedPill() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-6">
      <div className="animate-fade-slide-up rounded-full border border-glass-border bg-surface px-4 py-2 font-mono text-xs font-medium text-text-primary shadow-card-lg">
        Logged ✓
      </div>
    </div>
  );
}
