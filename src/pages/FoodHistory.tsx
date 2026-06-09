// /food/history — a photo "memories" calendar of past meals.
//
// A month grid: each day that has logged meals shows the latest meal's photo
// as the cell background with the day number on it (like a photo memories
// calendar). Tap a day to slide up that day's meals — each with its photo,
// time stamp, what KAI saw, the note, and a calorie line.
//
// Food photos aren't encrypted (unlike body scans). Calorie numbers are NOT
// stored yet — that side is owned by the backend (Ratner) — so the per-meal
// calorie line is a neutral "coming soon" placeholder for now.

import { ArrowLeft, ChevronLeft, ChevronRight, Trash2, Utensils } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  daysInMonth,
  firstWeekdayOfMonth,
  localDateKey,
  parseLocalDate,
} from "../lib/dates";
import {
  deleteFoodEntry,
  listFoodEntries,
  type FoodHistoryEntry,
} from "../lib/food-history";
import { DAY_LABELS } from "../lib/local-schedule";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Group entries by local date key, each day's meals sorted earliest→latest. */
function groupByDay(entries: FoodHistoryEntry[]): Map<string, FoodHistoryEntry[]> {
  const map = new Map<string, FoodHistoryEntry[]>();
  for (const e of entries) {
    const key = localDateKey(new Date(e.loggedAt));
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  }
  return map;
}

export function FoodHistory() {
  const [entries, setEntries] = useState(() => listFoodEntries());
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const byDay = useMemo(() => groupByDay(entries), [entries]);
  const todayKey = localDateKey(now);

  function refresh() {
    setEntries(listFoodEntries());
  }

  function stepMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const totalDays = daysInMonth(viewYear, viewMonth);
  const leadingBlanks = firstWeekdayOfMonth(viewYear, viewMonth);
  const cells: Array<number | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const selectedMeals = selectedDateKey ? byDay.get(selectedDateKey) ?? [] : [];

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-6 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/food/log"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          food history
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
        Your meals
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        A calendar of what you logged. Tap a day to look back through it.
      </p>

      {entries.length === 0 ? (
        <div className="mt-6 rounded-glass border border-glass-border bg-surface p-6 text-center shadow-card">
          <p className="text-sm text-text-secondary">No meals logged yet.</p>
          <Link
            to="/food/log"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-text-primary px-4 text-sm font-medium text-background shadow-card focus-ring"
          >
            Log your first
          </Link>
        </div>
      ) : (
        <>
          {/* Month nav */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => stepMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <p className="font-display text-lg font-semibold tracking-tight text-text-primary">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => stepMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {DAY_LABELS.map((d) => (
              <p
                key={d}
                className="text-center font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted"
              >
                {d}
              </p>
            ))}
          </div>

          {/* Day grid */}
          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} aria-hidden="true" />;
              const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const meals = byDay.get(key) ?? [];
              return (
                <DayCell
                  key={key}
                  day={day}
                  meals={meals}
                  isToday={key === todayKey}
                  onOpen={() => setSelectedDateKey(key)}
                />
              );
            })}
          </div>
        </>
      )}

      {selectedDateKey && (
        <DaySheet
          dateKey={selectedDateKey}
          meals={selectedMeals}
          onClose={() => setSelectedDateKey(null)}
          onDelete={(id) => {
            deleteFoodEntry(id);
            const remaining = (byDay.get(selectedDateKey) ?? []).filter((m) => m.id !== id);
            refresh();
            if (remaining.length === 0) setSelectedDateKey(null);
          }}
        />
      )}
    </div>
  );
}

function DayCell({
  day,
  meals,
  isToday,
  onOpen,
}: {
  day: number;
  meals: FoodHistoryEntry[];
  isToday: boolean;
  onOpen: () => void;
}) {
  const hasMeals = meals.length > 0;
  // Most-recent meal with a photo becomes the cell thumbnail.
  const photo = [...meals].reverse().find((m) => m.photoDataUrl)?.photoDataUrl;
  const ring = isToday ? "ring-2 ring-text-primary/25" : "";

  if (!hasMeals) {
    return (
      <div
        className={`flex aspect-square items-center justify-center rounded-[14px] border border-glass-border/60 ${ring}`}
      >
        <span className="text-xs text-text-muted">{day}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${meals.length} meal${meals.length > 1 ? "s" : ""} on day ${day}`}
      className={`relative aspect-square overflow-hidden rounded-[14px] border border-glass-border bg-surface-muted transition active:scale-[0.97] focus-ring ${ring}`}
    >
      {photo ? (
        <>
          <img src={photo} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
          <span className="absolute bottom-1 left-1.5 text-sm font-semibold text-white drop-shadow">
            {day}
          </span>
        </>
      ) : (
        // No photo (described meal) — a solid dark tile, same format as a photo.
        <>
          <span className="absolute inset-0 bg-text-primary" aria-hidden="true" />
          <span className="absolute bottom-1 left-1.5 text-sm font-semibold text-white drop-shadow">
            {day}
          </span>
        </>
      )}
      {meals.length > 1 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-background/80 px-1 text-[9px] font-bold text-text-primary backdrop-blur">
          {meals.length}
        </span>
      )}
    </button>
  );
}

function DaySheet({
  dateKey,
  meals,
  onClose,
  onDelete,
}: {
  dateKey: string;
  meals: FoodHistoryEntry[];
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const date = parseLocalDate(dateKey);
  const heading = date
    ? date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : dateKey;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-glass border border-glass-border bg-surface shadow-card-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-glass-border p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
            {meals.length} meal{meals.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 font-display text-xl font-semibold tracking-tight text-text-primary">
            {heading}
          </p>
        </div>

        <div className="space-y-3 overflow-y-auto p-5">
          {meals.map((meal) => (
            <MealDetail key={meal.id} meal={meal} onDelete={() => onDelete(meal.id)} />
          ))}
        </div>

        <div className="border-t border-glass-border p-5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-full items-center justify-center rounded-full bg-text-primary text-sm font-medium text-background transition active:scale-[0.99] focus-ring"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function MealDetail({
  meal,
  onDelete,
}: {
  meal: FoodHistoryEntry;
  onDelete: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-glass-border bg-background shadow-card">
      <div className="relative aspect-video w-full bg-surface-muted">
        {meal.photoDataUrl ? (
          <img
            src={meal.photoDataUrl}
            alt="Logged meal"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-muted">
            <Utensils size={24} aria-hidden="true" />
          </div>
        )}
        <button
          type="button"
          aria-label="Delete meal"
          onClick={onDelete}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-text-secondary backdrop-blur transition hover:bg-background focus-ring"
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>

      <div className="p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          {formatTime(meal.loggedAt)}
        </p>
        {meal.items.length > 0 ? (
          <p className="mt-1 text-sm font-medium text-text-primary">
            {meal.items.join(", ")}
          </p>
        ) : (
          <p className="mt-1 text-sm italic text-text-muted">Meal logged</p>
        )}
        {meal.note && (
          <p className="mt-1 text-xs text-text-secondary">{meal.note}</p>
        )}
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
          Calories · coming soon
        </p>
      </div>
    </section>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
