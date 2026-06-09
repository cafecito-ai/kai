// Schedule (client feature, 2026-06-08).
//
// A custom routine KAI builds for the teen, stored locally (like goals / north
// star / missions). Created during onboarding ("make me a running + ab schedule
// every day") or any time by talking to KAI in chat ("add gym every Monday at
// 6"). Shown in its own Schedule section they can follow daily.

const KEY = "kai_schedule_v1";

export type ScheduleCategory = "fitness" | "study" | "mind" | "routine" | "other";

export type ScheduleItem = {
  id: string;
  title: string;
  /** 0=Sunday … 6=Saturday. All seven = every day. */
  days: number[];
  /** "HH:MM" 24-hour, or null for no specific time. */
  time: string | null;
  category: ScheduleCategory;
  createdAt: string;
};

/** Shape the worker returns (no id/createdAt yet). */
export type GeneratedItem = {
  title: string;
  days: number[];
  time: string | null;
  category: ScheduleCategory;
};

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_LABELS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function read(): ScheduleItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ScheduleItem[];
    return Array.isArray(arr) ? arr.filter((i) => i && typeof i.title === "string") : [];
  } catch {
    return [];
  }
}

function write(items: ScheduleItem[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, 60)));
    window.dispatchEvent(new Event("kai:state-changed"));
  } catch {
    /* ignore */
  }
}

function newId(): string {
  return `sch_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function normalize(g: GeneratedItem): ScheduleItem {
  return {
    id: newId(),
    title: String(g.title).slice(0, 60),
    days: Array.isArray(g.days)
      ? Array.from(new Set(g.days.filter((d) => typeof d === "number" && d >= 0 && d <= 6)))
      : [0, 1, 2, 3, 4, 5, 6],
    time: typeof g.time === "string" && /^\d{1,2}:\d{2}$/.test(g.time) ? g.time : null,
    category: (["fitness", "study", "mind", "routine", "other"] as const).includes(g.category)
      ? g.category
      : "other",
    createdAt: new Date().toISOString(),
  };
}

export function getSchedule(): ScheduleItem[] {
  return read();
}

export function hasSchedule(): boolean {
  return read().length > 0;
}

/** Replace the whole schedule with a fresh generated set. */
export function setSchedule(items: GeneratedItem[]): void {
  write(items.slice(0, 40).map(normalize));
}

/** Append items (skipping exact title+time+days dupes). */
export function addToSchedule(items: GeneratedItem[]): void {
  const existing = read();
  const sig = (i: { title: string; time: string | null; days: number[] }) =>
    `${i.title.toLowerCase()}|${i.time ?? ""}|${[...i.days].sort().join(",")}`;
  const seen = new Set(existing.map(sig));
  const additions = items.map(normalize).filter((i) => !seen.has(sig(i)));
  write([...existing, ...additions]);
}

/** Apply a chat scheduleUpdate ({action, items}) from the worker. */
export function applyScheduleUpdate(update: { action?: string; items?: GeneratedItem[] } | null | undefined): void {
  if (!update || !Array.isArray(update.items) || update.items.length === 0) return;
  if (update.action === "replace") setSchedule(update.items);
  else addToSchedule(update.items);
}

export function removeScheduleItem(id: string): void {
  write(read().filter((i) => i.id !== id));
}

export function clearSchedule(): void {
  write([]);
}

/** Items for a given weekday (0=Sun..6=Sat), sorted by time (timed first). */
export function itemsForDay(day: number): ScheduleItem[] {
  return read()
    .filter((i) => i.days.includes(day))
    .sort((a, b) => {
      if (a.time && b.time) return a.time < b.time ? -1 : 1;
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
}

/** Pretty time, "06:00" -> "6:00 AM". */
export function formatTime(time: string | null): string | null {
  if (!time) return null;
  const [hStr, m] = time.split(":");
  const h = Number(hStr);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}
