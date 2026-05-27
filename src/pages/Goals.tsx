// /goals — identity-based goal setting (T-019 + T-020).
//
// Surface for: create, view, mark progress, pause/complete/abandon.
// Max 3 active per CLAUDE.md v2 §5 ("too many causes paralysis").
// Identity-based reframes per AGENT_PLAN T-020 at 7 / 14 / 30 days.

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Flame,
  PauseCircle,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import {
  createLocalGoal,
  goalStreak,
  identityMilestone,
  markGoalProgressToday,
  markedToday,
  MAX_ACTIVE,
  readLocalGoals,
  updateGoalStatus,
  type LocalGoal,
} from "../lib/local-goals";

type Phase = "list" | "create";

const CATEGORIES: Array<{
  id: LocalGoal["category"];
  label: string;
  blurb: string;
}> = [
  { id: "mind", label: "Mind", blurb: "Calm, clarity, confidence." },
  { id: "body", label: "Body", blurb: "Movement, sleep, food." },
  {
    id: "growth",
    label: "Growth",
    blurb: "Skill, craft, identity, purpose.",
  },
];

export function Goals() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("list");
  const [goals, setGoals] = useState<LocalGoal[]>(() => readLocalGoals());

  function refresh() {
    setGoals(readLocalGoals());
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col px-5 pt-2 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/home"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          goals
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {phase === "create" ? (
        <CreateForm
          onCreated={() => {
            refresh();
            setPhase("list");
          }}
          onCancel={() => setPhase("list")}
        />
      ) : (
        <List
          goals={goals}
          onChange={refresh}
          onAddNew={() => setPhase("create")}
          onClose={() => navigate("/home")}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// List
// ─────────────────────────────────────────────────────────────────────

function List({
  goals,
  onChange,
  onAddNew,
  onClose: _onClose,
}: {
  goals: LocalGoal[];
  onChange: () => void;
  onAddNew: () => void;
  onClose: () => void;
}) {
  const active = goals.filter((g) => g.status === "active");
  const other = goals.filter((g) => g.status !== "active");
  const atCap = active.length >= MAX_ACTIVE;

  return (
    <div className="flex flex-1 flex-col gap-6 pb-8">
      <div>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          What are you becoming?
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Identity-based, not task-based. Max {MAX_ACTIVE} active — small
          things stack into who you are.
        </p>
      </div>

      {active.length === 0 ? (
        <div className="rounded-glass border border-glass-border bg-surface p-6 text-center shadow-card">
          <p className="text-sm text-text-secondary">
            No active goals yet. What's one thing you'd want to be different
            about you 30 days from now?
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((g) => (
            <GoalCard key={g.id} goal={g} onChange={onChange} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onAddNew}
        disabled={atCap}
        className={`
          flex items-center justify-center gap-2 rounded-lg border
          px-4 py-3 text-sm font-medium transition
          ${
            atCap
              ? "border-glass-border bg-surface text-text-muted cursor-not-allowed"
              : "border-glass-border bg-surface text-text-primary shadow-card hover:bg-surface-muted active:scale-[0.99]"
          }
        `}
      >
        <Plus size={16} aria-hidden="true" />
        {atCap ? `${MAX_ACTIVE}/${MAX_ACTIVE} active — finish one first` : "New goal"}
      </button>

      {other.length > 0 ? (
        <details className="rounded-lg border border-glass-border bg-surface shadow-card">
          <summary className="cursor-pointer px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
            {other.length} archived
          </summary>
          <div className="space-y-2 border-t border-border-line p-3">
            {other.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-text-secondary line-through">{g.title}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  {g.status}
                </span>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function GoalCard({
  goal,
  onChange,
}: {
  goal: LocalGoal;
  onChange: () => void;
}) {
  const streak = goalStreak(goal.id);
  const done = markedToday(goal.id);
  const milestone = identityMilestone(streak);

  function mark() {
    markGoalProgressToday(goal.id);
    onChange();
  }

  function pause() {
    if (confirm("Pause this goal? You can resume anytime.")) {
      updateGoalStatus(goal.id, "paused");
      onChange();
    }
  }

  function complete() {
    if (confirm("Mark this goal complete?")) {
      updateGoalStatus(goal.id, "completed");
      // Rawz/7 — fan out to the user's groups so friends see the win in
      // their activity feed. Fire-and-forget; no groups → no-op server
      // side. UNIQUE(group_id, actor, kind, ref_key) protects against
      // duplicate posts if they complete-then-uncomplete-then-complete.
      api
        .postGroupActivity({
          kind: "goal_completed",
          refKey: goal.id,
          hint: goal.title,
        })
        .catch(() => {});
      onChange();
    }
  }

  return (
    <div className="rounded-glass border border-glass-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
            {goal.category}
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight">
            {goal.title}
          </h2>
          <p className="mt-1 text-xs italic text-text-secondary">
            {goal.identityFrame}
          </p>
        </div>
        <button
          type="button"
          onClick={pause}
          aria-label="Pause goal"
          title="Pause goal"
          className="rounded-full p-1.5 text-text-muted transition hover:bg-surface-muted"
        >
          <PauseCircle size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs">
          <Flame size={12} className="text-accent-warm" aria-hidden="true" />
          <span className="font-medium text-text-primary">
            {streak}-day streak
          </span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={complete}
            aria-label="Mark complete"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-glass-border text-text-secondary transition hover:bg-surface-muted active:scale-95 focus-ring"
            title="Mark complete"
          >
            <CheckCircle2 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={mark}
            disabled={done}
            className={`
              inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5
              text-xs font-medium transition active:scale-95
              ${
                done
                  ? "bg-success-soft text-success cursor-default"
                  : "bg-text-primary text-background shadow-card"
              }
            `}
          >
            {done ? (
              <>
                <Check size={14} aria-hidden="true" /> Done today
              </>
            ) : (
              "Mark today"
            )}
          </button>
        </div>
      </div>

      {milestone ? (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
          <Sparkles size={12} aria-hidden="true" />
          {milestone}
        </p>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────────────────────────────

function CreateForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<LocalGoal["category"]>("growth");
  const [error, setError] = useState("");

  function save() {
    setError("");
    if (!title.trim()) {
      setError("Give it a name — even a rough one.");
      return;
    }
    const result = createLocalGoal({ title, category });
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onCreated();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pb-8">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1 self-start text-sm font-medium text-text-secondary transition hover:text-text-primary"
      >
        <X size={14} aria-hidden="true" /> Cancel
      </button>

      <div>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          New goal.
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          What's one thing you want to be different about you in a month?
        </p>
      </div>

      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          The goal
        </p>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Read 30 pages a day"
          maxLength={80}
          className="
            w-full rounded-lg border border-glass-border bg-surface
            px-4 py-3.5 text-base text-text-primary
            placeholder:text-text-muted shadow-card focus-ring
          "
        />
      </div>

      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          Category
        </p>
        <div className="space-y-2">
          {CATEGORIES.map((c) => {
            const selected = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`
                  w-full rounded-lg border p-4 text-left transition active:scale-[0.99]
                  ${
                    selected
                      ? "border-text-primary bg-text-primary text-background shadow-card-lg"
                      : "border-glass-border bg-surface text-text-primary shadow-card hover:bg-surface-muted"
                  }
                `}
              >
                <p className="font-display text-lg font-semibold">{c.label}</p>
                <p
                  className={`mt-0.5 text-xs ${
                    selected ? "text-background/75" : "text-text-secondary"
                  }`}
                >
                  {c.blurb}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm font-medium text-warning">
          {error}
        </p>
      ) : null}

      <div className="mt-auto pb-2">
        <button
          type="button"
          onClick={save}
          className="flex h-12 w-full items-center justify-center rounded-full bg-text-primary text-background font-medium shadow-card transition active:scale-[0.99] focus-ring"
        >
          Create
        </button>
      </div>
    </div>
  );
}
