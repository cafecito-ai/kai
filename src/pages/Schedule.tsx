// /schedule — the teen's custom routine, built by KAI.
//
// View today's plan + the full week. Build/extend it by describing what you want
// ("a running and ab schedule every day") — KAI generates it. Add or change it
// any time by just talking to KAI in chat ("add gym every Monday at 6").

import { ArrowLeft, CalendarDays, Dumbbell, BookOpen, Brain, Sparkles, Trash2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import {
  DAY_LABELS_FULL,
  formatTime,
  getSchedule,
  itemsForDay,
  removeScheduleItem,
  setSchedule,
  addToSchedule,
  type ScheduleCategory,
  type ScheduleItem,
} from "../lib/local-schedule";

const CAT_ICON: Record<ScheduleCategory, typeof Dumbbell> = {
  fitness: Dumbbell,
  study: BookOpen,
  mind: Brain,
  routine: Sparkles,
  other: Sparkles,
};
const CAT_TINT: Record<ScheduleCategory, string> = {
  fitness: "bg-accent-warm-soft text-accent-warm",
  study: "bg-accent-cool-soft text-accent-cool",
  mind: "bg-accent-soft text-accent",
  routine: "bg-success-soft text-success",
  other: "bg-surface-muted text-text-secondary",
};

export function Schedule() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const todayIdx = new Date().getDay();

  function refresh() {
    setItems(getSchedule());
  }
  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("kai:state-changed", on);
    return () => window.removeEventListener("kai:state-changed", on);
  }, []);

  async function build(replace: boolean) {
    const req = draft.trim();
    if (!req || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.scheduleGenerate(req);
      if (res.items.length === 0) {
        setError("Couldn't build that one — try describing it a bit more, like \"a running and ab routine every day.\"");
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

  const empty = items.length === 0;
  const todayItems = itemsForDay(todayIdx);

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
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">schedule</p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <div>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          Your schedule
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Built around what you told KAI. Add or change it any time — just tell KAI
          in chat, like "add gym every Monday at 6."
        </p>
      </div>

      {/* Build / extend with KAI */}
      <div className="rounded-glass border border-glass-border bg-surface p-4 shadow-card">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          {empty ? "Tell KAI what you want" : "Add to your schedule"}
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 200))}
          rows={2}
          placeholder='e.g. "Make me a full running and ab schedule every day"'
          className="mt-2 w-full resize-none rounded-lg border border-glass-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus-ring"
        />
        {error && <p className="mt-2 text-xs text-warning">{error}</p>}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => build(empty)}
            disabled={!draft.trim() || busy}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-text-primary text-sm font-medium text-background transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-text-soft focus-ring"
          >
            {busy ? "Building…" : empty ? "Build my schedule" : (<><Plus size={15} /> Add to schedule</>)}
          </button>
          {!empty && (
            <button
              type="button"
              onClick={() => build(true)}
              disabled={!draft.trim() || busy}
              className="flex h-10 items-center justify-center rounded-full border border-glass-border bg-surface px-4 text-sm font-medium text-text-primary transition hover:bg-surface-muted disabled:opacity-50 focus-ring"
            >
              Rebuild
            </button>
          )}
        </div>
      </div>

      {empty ? (
        <div className="rounded-glass border border-dashed border-glass-border bg-surface/60 p-8 text-center">
          <CalendarDays size={28} className="mx-auto text-text-muted" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-text-primary">No schedule yet</p>
          <p className="mt-1 text-xs text-text-secondary">
            Describe the routine you want above, or tell KAI in chat.
          </p>
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Talk to KAI
          </button>
        </div>
      ) : (
        <>
          {/* Today */}
          <section>
            <p className="px-1 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
              Today · {DAY_LABELS_FULL[todayIdx]}
            </p>
            <div className="mt-2 space-y-2">
              {todayItems.length === 0 ? (
                <p className="rounded-glass border border-glass-border bg-surface px-4 py-4 text-sm text-text-secondary shadow-card">
                  Nothing scheduled today — rest up or add something.
                </p>
              ) : (
                todayItems.map((it) => <ItemRow key={it.id} item={it} onRemove={() => { removeScheduleItem(it.id); refresh(); }} />)
              )}
            </div>
          </section>

          {/* Full week */}
          <section>
            <p className="px-1 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
              This week
            </p>
            <div className="mt-2 space-y-4">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const dayItems = itemsForDay(d);
                if (dayItems.length === 0) return null;
                return (
                  <div key={d}>
                    <p className={`mb-1.5 text-xs font-semibold ${d === todayIdx ? "text-accent" : "text-text-secondary"}`}>
                      {DAY_LABELS_FULL[d]}{d === todayIdx ? " · today" : ""}
                    </p>
                    <div className="space-y-2">
                      {dayItems.map((it) => (
                        <ItemRow key={`${d}-${it.id}`} item={it} onRemove={() => { removeScheduleItem(it.id); refresh(); }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ItemRow({ item, onRemove }: { item: ScheduleItem; onRemove: () => void }) {
  const Icon = CAT_ICON[item.category];
  const time = formatTime(item.time);
  return (
    <div className="group flex items-center gap-3 rounded-glass border border-glass-border bg-surface px-4 py-3 shadow-card">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${CAT_TINT[item.category]}`}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
        {time && <p className="font-mono text-[11px] text-text-muted">{time}</p>}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted opacity-0 transition hover:bg-surface-muted hover:text-danger group-hover:opacity-100 focus-ring"
      >
        <Trash2 size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
