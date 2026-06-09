// /schedule — the teen's lifestyle SYSTEM, built by KAI around their goal.
//
// Not a rigid schedule: daily habits, workouts, sleep, routines, mindset, and
// things to avoid — all connected to the goal. Fully editable: add / remove
// parts here, or just tell KAI in chat ("add gym every Monday at 6", "drop the
// morning run").

import {
  ArrowLeft, Ban, Brain, CheckCircle2, Dumbbell, ListChecks, Moon, Plus, Sparkles, Sunrise, Trash2, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import { getNorthStar } from "../lib/local-northstar";
import {
  SECTION_META,
  addManualItem,
  daysLabel,
  formatTime,
  getScheduleBySection,
  hasSchedule,
  itemsForToday,
  removeScheduleItem,
  setSchedule,
  addToSchedule,
  type ScheduleItem,
  type SystemSection,
} from "../lib/local-schedule";

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
  avoid: "bg-warning-soft text-warning",
};

export function Schedule() {
  const navigate = useNavigate();
  const [bump, setBump] = useState(0);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => setBump((b) => b + 1);
  useEffect(() => {
    const on = () => refresh();
    window.addEventListener("kai:state-changed", on);
    return () => window.removeEventListener("kai:state-changed", on);
  }, []);

  const goal = getNorthStar()?.goal ?? null;
  const sections = getScheduleBySection();
  const today = itemsForToday();
  const empty = !hasSchedule();
  void bump;

  async function build(replace: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.scheduleGenerate(draft.trim(), goal ?? undefined);
      if (res.items.length === 0) {
        setError("Couldn't build that — try describing it a bit more, or set a goal first.");
      } else {
        if (replace) setSchedule(res.items);
        else addToSchedule(res.items);
        setDraft("");
        refresh();
      }
    } catch {
      setError("Couldn't reach KAI just now — try again in a sec.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-5 pt-2 pb-28 sm:max-w-lg">
      <header className="flex items-center justify-between pb-1">
        <Link to="/home" aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring">
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">your system</p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <div>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">Your system</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {goal ? <>A full system built around <span className="font-medium text-text-primary">{goal}</span> — habits, training, sleep, routines, mindset, and what to avoid. </> : "Your habits, training, sleep, routines, mindset, and what to avoid — all connected. "}
          Change anything any time, here or just by telling KAI.
        </p>
      </div>

      {/* Build / extend */}
      <div className="rounded-glass border border-glass-border bg-surface p-4 shadow-card">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          {empty ? "Build your system" : "Add to your system"}
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 200))}
          rows={2}
          placeholder={empty ? 'e.g. "Build my whole system around getting stronger"' : 'e.g. "add a Sunday meal-prep habit"'}
          className="mt-2 w-full resize-none rounded-lg border border-glass-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus-ring"
        />
        {error && <p className="mt-2 text-xs text-warning">{error}</p>}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => build(empty)}
            disabled={busy || (!draft.trim() && !goal && empty)}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-text-primary text-sm font-medium text-background transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-text-soft focus-ring"
          >
            {busy ? "Building…" : empty ? (<><Sparkles size={15} /> Build my system</>) : (<><Plus size={15} /> Add</>)}
          </button>
          {!empty && (
            <button type="button" onClick={() => build(true)} disabled={busy} className="flex h-10 items-center justify-center rounded-full border border-glass-border bg-surface px-4 text-sm font-medium text-text-primary transition hover:bg-surface-muted disabled:opacity-50 focus-ring">
              Rebuild
            </button>
          )}
        </div>
        {empty && !goal && (
          <p className="mt-2 text-xs text-text-muted">Tip: set a goal on Home first, then KAI builds the whole system around it.</p>
        )}
      </div>

      {empty ? (
        <div className="rounded-glass border border-dashed border-glass-border bg-surface/60 p-8 text-center">
          <Sparkles size={26} className="mx-auto text-text-muted" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-text-primary">No system yet</p>
          <p className="mt-1 text-xs text-text-secondary">Build one above, or tell KAI in chat what you're going for.</p>
          <button type="button" onClick={() => navigate("/chat")} className="mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline">Talk to KAI</button>
        </div>
      ) : (
        <>
          {/* Today */}
          {today.length > 0 && (
            <section>
              <p className="px-1 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">Today</p>
              <div className="mt-2 space-y-2">
                {today.map((it) => <Row key={`t-${it.id}`} item={it} onRemove={() => { removeScheduleItem(it.id); refresh(); }} />)}
              </div>
            </section>
          )}

          {/* Full system by section */}
          {sections.map(({ section, items }) => (
            <SectionBlock key={section} section={section} items={items} onChange={refresh} />
          ))}
        </>
      )}
    </div>
  );
}

function SectionBlock({ section, items, onChange }: { section: SystemSection; items: ScheduleItem[]; onChange: () => void }) {
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
          <p className="text-sm font-semibold text-text-primary">{meta.label}</p>
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
        {items.map((it) => <Row key={it.id} item={it} onRemove={() => { removeScheduleItem(it.id); onChange(); }} />)}
      </div>
    </section>
  );
}

function Row({ item, onRemove }: { item: ScheduleItem; onRemove: () => void }) {
  const time = formatTime(item.time);
  const days = daysLabel(item.days);
  const meta = [time, days].filter(Boolean).join(" · ");
  const avoid = item.section === "avoid";
  const Icon = avoid ? Ban : CheckCircle2;
  return (
    <div className="group flex items-start gap-3 rounded-glass border border-glass-border bg-surface px-4 py-3 shadow-card">
      <Icon size={16} className={`mt-0.5 shrink-0 ${avoid ? "text-warning" : "text-text-muted"}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{item.title}</p>
        {item.detail && <p className="mt-0.5 text-xs leading-snug text-text-secondary">{item.detail}</p>}
        {meta && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{meta}</p>}
      </div>
      <button type="button" onClick={onRemove} aria-label="Remove" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted opacity-0 transition hover:bg-surface-muted hover:text-danger group-hover:opacity-100 focus-ring">
        <Trash2 size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
