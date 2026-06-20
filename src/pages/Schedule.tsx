// /schedule — the teen's lifestyle SYSTEM, built by KAI around their goal.
//
// A reference + daily checklist: daily habits, workouts, sleep, routines,
// mindset, and things to avoid, all tied to the goal. Check items off as you
// do them (resets daily) and a per-category progress meter fills at the top.
// Save the current system and swipe between saved ones; "Make main" picks the
// one the tab shows. Fully editable here or by telling KAI in chat.

import {
  ArrowLeft, Ban, Brain, CheckCircle2, Circle, Dumbbell, ListChecks, Moon, Plus, Save, Sparkles, Star, Sunrise, Trash2, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import { cleanPlanTitle } from "../lib/local-northstar";
import {
  SECTION_META,
  addManualItem,
  daysLabel,
  formatTime,
  getScheduleBySection,
  hasSchedule,
  removeScheduleItem,
  setSchedule,
  type ScheduleItem,
  type SystemSection,
} from "../lib/local-schedule";
import {
  deleteSystem,
  getSystemGoal,
  isDoneToday,
  isMainSystem,
  listSystems,
  makeMain,
  saveCurrentAsSystem,
  setSystemGoal,
  systemProgressWeek,
  toggleDoneToday,
  weeklyDoneCount,
  weeklyTarget,
  type SavedSystem,
} from "../lib/local-systems";
import { useStorageUserId } from "../lib/storage-user-id";

const SECTION_ICON: Record<SystemSection, typeof Dumbbell> = {
  daily: ListChecks,
  training: Dumbbell,
  sleep: Moon,
  routine: Sunrise,
  mindset: Brain,
  avoid: Ban,
};
const SECTION_TINT: Record<SystemSection, string> = {
  daily: "bg-success-soft text-success",
  training: "bg-accent-warm-soft text-accent-warm",
  sleep: "bg-accent-soft text-accent",
  routine: "bg-accent-cool-soft text-accent-cool",
  mindset: "bg-accent-soft text-accent",
  avoid: "bg-danger-soft text-danger",
};

export function Schedule() {
  const userId = useStorageUserId();
  const navigate = useNavigate();
  const [bump, setBump] = useState(0);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => setBump((b) => b + 1);
  useEffect(() => {
    const on = () => refresh();
    window.addEventListener("kai:state-changed", on);
    return () => window.removeEventListener("kai:state-changed", on);
  }, []);

  const goal = getSystemGoal(userId);
  const sections = getScheduleBySection();
  const systems = listSystems(userId);
  const empty = !hasSchedule();
  void bump;

  // Building from the box makes a fresh MAIN system, titled by what you typed.
  // (Save the current one first if you want to keep it.)
  async function build() {
    if (busy) return;
    const prompt = draft.trim();
    setBusy(true);
    setError(null);
    try {
      const res = await api.scheduleGenerate(prompt, (prompt || goal) ?? undefined);
      if (res.items.length === 0) {
        setError("Couldn't build that. Try describing it a bit more, or set a goal first.");
      } else {
        setSchedule(res.items);
        if (prompt) setSystemGoal(prompt, userId);
        setDraft("");
        refresh();
      }
    } catch {
      setError("Couldn't reach KAI just now. Try again in a sec.");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (saveCurrentAsSystem(userId)) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      refresh();
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-5 pt-2 pb-28 sm:max-w-lg">
      <header className="flex items-center justify-between pb-1">
        <Link to="/home" aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring">
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">my plan</p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <div>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          {goal ? cleanPlanTitle(goal) : "My Plan"}
        </h1>
        {goal && cleanPlanTitle(goal).toLowerCase() !== goal.trim().toLowerCase() && (
          <p className="mt-1 text-sm italic text-text-secondary">“{goal}”</p>
        )}
        <p className="mt-2 text-sm text-text-secondary">
          Your blueprint: habits, training, sleep, routines, mindset, and what to avoid —
          each piece here for a reason. Check things off as you go. Change anything any time,
          here or just by telling KAI.
        </p>
      </div>

      {/* Today's progress (check-offs, resets daily) */}
      {!empty && <ProgressMeter userId={userId} />}

      {/* Build / extend / save */}
      <div className="rounded-glass border border-glass-border bg-surface p-4 shadow-card">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          {empty ? "Build your system" : "Build a new system"}
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 200))}
          rows={2}
          placeholder={empty ? 'e.g. "be happier" or "get stronger"' : 'e.g. "Sunday meal prep" or "get stronger"'}
          className="mt-2 w-full resize-none rounded-lg border border-glass-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus-ring"
        />
        {error && <p className="mt-2 text-xs text-warning">{error}</p>}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={build}
            disabled={busy || (!draft.trim() && !goal && empty)}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-text-primary text-sm font-medium text-background transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-text-soft focus-ring"
          >
            {busy ? "Building…" : empty ? (<><Sparkles size={15} /> Build my system</>) : (<><Sparkles size={15} /> New system</>)}
          </button>
          {!empty && (
            <button type="button" onClick={save} className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-glass-border bg-surface px-4 text-sm font-medium text-text-primary transition hover:bg-surface-muted focus-ring">
              {saved ? <><CheckCircle2 size={15} className="text-success" /> Saved</> : <><Save size={15} /> Save</>}
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {empty
            ? (goal ? "Build the whole system around your goal, or type a different focus." : "Type a focus, or set a goal on Home first.")
            : "Building makes a new main system. Save the current one first to keep it."}
        </p>
      </div>

      {/* Saved systems — swipe through, make one main */}
      {systems.length > 0 && <SavedSystemsRow systems={systems} userId={userId} onChange={refresh} />}

      {empty ? (
        <div className="rounded-glass border border-dashed border-glass-border bg-surface/60 p-8 text-center">
          <Sparkles size={26} className="mx-auto text-text-muted" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-text-primary">No system yet</p>
          <p className="mt-1 text-xs text-text-secondary">Build one above, or tell KAI in chat what you're going for.</p>
          <button type="button" onClick={() => navigate("/chat")} className="mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline">Talk to KAI</button>
        </div>
      ) : (
        <>
          {sections.map(({ section, items }) => (
            <SectionBlock key={section} section={section} items={items} userId={userId} onChange={refresh} />
          ))}
        </>
      )}
    </div>
  );
}

// Per-category weekly progress, driven by check-offs. Avoid is excluded.
function ProgressMeter({ userId }: { userId?: string | null }) {
  const { overall, byCategory } = systemProgressWeek(userId);
  return (
    <div className="rounded-glass border border-glass-border bg-surface p-4 shadow-card">
      <div className="flex items-end justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">This week</p>
        <p className="font-mono text-sm font-bold text-text-primary">
          {overall.done}<span className="text-text-muted">/{overall.total}</span>
        </p>
      </div>
      <div className="mt-3 space-y-2">
        {byCategory.map((c) => {
          const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
          return (
            <div key={c.section} className="flex items-center gap-3">
              <p className="w-24 shrink-0 truncate text-xs text-text-secondary">{SECTION_META[c.section].label}</p>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full bg-text-primary transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
              <p className="w-8 shrink-0 text-right font-mono text-[10px] text-text-muted">{c.done}/{c.total}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SavedSystemsRow({ systems, userId, onChange }: { systems: SavedSystem[]; userId?: string | null; onChange: () => void }) {
  return (
    <section>
      <p className="px-1 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">Saved systems</p>
      <div className="mt-2 flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {systems.map((sys) => {
          const main = isMainSystem(sys);
          return (
            <div key={sys.id} className="w-56 shrink-0 snap-start rounded-glass border border-glass-border bg-surface p-3 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-text-primary">{sys.goal}</p>
                <div className="flex shrink-0 items-center gap-1">
                  {main && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">
                      <Star size={9} /> Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => { deleteSystem(sys.id, userId); onChange(); }}
                    aria-label={`Delete saved system "${sys.goal}"`}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted hover:text-danger focus-ring"
                  >
                    <Trash2 size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-text-muted">{sys.items.length} items</p>
              <button
                type="button"
                disabled={main}
                onClick={() => { makeMain(sys.id, userId); onChange(); }}
                className="mt-3 flex h-8 w-full items-center justify-center rounded-full bg-text-primary text-xs font-medium text-background transition active:scale-[0.99] disabled:cursor-default disabled:bg-surface-muted disabled:text-text-muted focus-ring"
              >
                {main ? "Current" : "Make main"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SectionBlock({ section, items, userId, onChange }: { section: SystemSection; items: ScheduleItem[]; userId?: string | null; onChange: () => void }) {
  const Icon = SECTION_ICON[section];
  const meta = SECTION_META[section];
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  return (
    <section>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full ${SECTION_TINT[section]}`}>
            <Icon size={14} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-text-primary">{meta.label}</p>
            {/* Explain what this part of the plan is for. */}
            <p className="text-[11px] leading-tight text-text-muted">{meta.blurb}</p>
          </div>
        </div>
        <button type="button" onClick={() => setAdding((a) => !a)} aria-label={`Add to ${meta.label}`} className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted hover:text-text-primary focus-ring">
          {adding ? <X size={14} /> : <Plus size={15} />}
        </button>
      </div>
      {adding && (
        <div className="mt-2 flex gap-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 60))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && text.trim()) { addManualItem({ section, title: text.trim() }); setText(""); setAdding(false); onChange(); }
            }}
            placeholder={section === "avoid" ? "Something to avoid…" : "Add an item…"}
            className="h-10 flex-1 rounded-lg border border-glass-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-ring"
          />
          <button type="button" onClick={() => { if (text.trim()) { addManualItem({ section, title: text.trim() }); setText(""); setAdding(false); onChange(); } }} className="rounded-full bg-text-primary px-4 text-sm font-medium text-background focus-ring">Add</button>
        </div>
      )}
      <div className="mt-2 space-y-2">
        {items.map((it) => (
          <Row
            key={it.id}
            item={it}
            userId={userId}
            done={isDoneToday(it.id, userId)}
            onToggle={() => { toggleDoneToday(it.id, userId); onChange(); }}
            onRemove={() => { removeScheduleItem(it.id); onChange(); }}
          />
        ))}
      </div>
    </section>
  );
}

function Row({ item, userId, done, onToggle, onRemove }: { item: ScheduleItem; userId?: string | null; done: boolean; onToggle: () => void; onRemove: () => void }) {
  const time = formatTime(item.time);
  const days = daysLabel(item.days);
  const meta = [time, days].filter(Boolean).join(" · ");
  const avoid = item.section === "avoid";
  const target = avoid ? 0 : weeklyTarget(item);
  const weekDone = avoid ? 0 : Math.min(weeklyDoneCount(item.id, userId), target);
  const complete = !avoid && weekDone >= target;

  return (
    <div className={`group flex items-start gap-2.5 rounded-2xl border bg-surface px-3.5 py-2.5 shadow-card transition ${avoid ? "border-danger-soft" : "border-glass-border"} ${complete ? "opacity-60" : ""}`}>
      {avoid && <Ban size={15} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${complete ? "text-text-muted line-through" : "text-text-primary"}`}>{item.title}</p>
        {item.detail && <p className="mt-0.5 text-xs leading-snug text-text-secondary">{item.detail}</p>}
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
          {meta}
          {meta && !avoid ? " · " : ""}
          {!avoid && (
            <span className={complete ? "font-bold text-success" : "font-bold text-text-secondary"}>
              {weekDone}/{target} this week
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={onRemove} aria-label="Remove" className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted opacity-0 transition hover:bg-surface-muted hover:text-danger group-hover:opacity-100 focus-ring">
          <Trash2 size={13} aria-hidden="true" />
        </button>
        {!avoid && (
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={done}
            aria-label={done ? `Mark "${item.title}" not done today` : `Mark "${item.title}" done today`}
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-surface-muted active:scale-95 focus-ring"
          >
            {done
              ? <CheckCircle2 size={22} className="text-success" aria-hidden="true" />
              : <Circle size={22} className="text-text-muted" aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}
