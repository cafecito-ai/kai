// Lifestyle system (client feature, evolved 2026-06-08).
//
// Not a rigid schedule — a full system built around the teen's goal: daily
// habits, workouts, sleep, routines, mindset/discipline, and things to avoid,
// all connected. Built by KAI (onboarding or chat) and fully editable any time —
// add / edit / swap / remove parts from the Schedule page or just by talking to
// KAI ("add gym every Monday at 6", "drop the morning run"). Stored locally.

const KEY = "kai_schedule_v1";

export type SystemSection = "daily" | "training" | "sleep" | "routine" | "mindset" | "avoid";

export type ScheduleItem = {
  id: string;
  section: SystemSection;
  title: string;
  detail: string;
  /** 0=Sunday … 6=Saturday. [] = a standing/daily item. */
  days: number[];
  /** "HH:MM" 24-hour, or null. */
  time: string | null;
  createdAt: string;
};

/** Shape the worker returns (no id/createdAt yet). */
export type GeneratedItem = {
  section?: string;
  title: string;
  detail?: string;
  days: number[];
  time: string | null;
  /** legacy field from the first schedule version */
  category?: string;
};

export const SECTIONS: SystemSection[] = ["daily", "training", "sleep", "routine", "mindset", "avoid"];

export const SECTION_META: Record<SystemSection, { label: string; blurb: string }> = {
  daily: { label: "Daily habits", blurb: "Small wins that compound" },
  training: { label: "Workouts", blurb: "Your training" },
  sleep: { label: "Sleep & recovery", blurb: "Rest that fuels it" },
  routine: { label: "Routines", blurb: "Morning & evening anchors" },
  mindset: { label: "Mindset & discipline", blurb: "How you think + stay on track" },
  avoid: { label: "Avoid", blurb: "What holds you back" },
};

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_LABELS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const LEGACY_CATEGORY: Record<string, SystemSection> = {
  fitness: "training",
  study: "daily",
  mind: "mindset",
  routine: "routine",
  other: "daily",
};

function coerceSection(v: unknown): SystemSection {
  if (typeof v === "string" && (SECTIONS as string[]).includes(v)) return v as SystemSection;
  if (typeof v === "string" && LEGACY_CATEGORY[v]) return LEGACY_CATEGORY[v];
  return "daily";
}

function read(): ScheduleItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown[];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((i): i is Record<string, unknown> => !!i && typeof i === "object" && typeof (i as { title?: unknown }).title === "string")
      .map((i) => migrate(i));
  } catch {
    return [];
  }
}

/** Migrate any stored item (incl. the first schedule version) into the system shape. */
function migrate(i: Record<string, unknown>): ScheduleItem {
  return {
    id: typeof i.id === "string" ? i.id : newId(),
    section: coerceSection(i.section ?? i.category),
    title: String(i.title).slice(0, 60),
    detail: typeof i.detail === "string" ? i.detail.slice(0, 100) : "",
    days: Array.isArray(i.days) ? i.days.filter((d): d is number => typeof d === "number" && d >= 0 && d <= 6) : [],
    time: typeof i.time === "string" && /^\d{1,2}:\d{2}$/.test(i.time) ? i.time : null,
    createdAt: typeof i.createdAt === "string" ? i.createdAt : new Date().toISOString(),
  };
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
  return `sys_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function normalize(g: GeneratedItem): ScheduleItem {
  return {
    id: newId(),
    section: coerceSection(g.section ?? g.category),
    title: String(g.title).slice(0, 60),
    detail: typeof g.detail === "string" ? g.detail.slice(0, 100) : "",
    days: Array.isArray(g.days) ? Array.from(new Set(g.days.filter((d) => typeof d === "number" && d >= 0 && d <= 6))) : [],
    time: typeof g.time === "string" && /^\d{1,2}:\d{2}$/.test(g.time) ? g.time : null,
    createdAt: new Date().toISOString(),
  };
}

export function getSchedule(): ScheduleItem[] {
  return read();
}

export function hasSchedule(): boolean {
  return read().length > 0;
}

/** Replace the whole system with a fresh generated set. */
export function setSchedule(items: GeneratedItem[]): void {
  write(items.slice(0, 40).map(normalize));
}

/** Append items (skipping exact dupes). */
export function addToSchedule(items: GeneratedItem[]): void {
  const existing = read();
  const sig = (i: { title: string; time: string | null; days: number[] }) =>
    `${i.title.toLowerCase()}|${i.time ?? ""}|${[...i.days].sort().join(",")}`;
  const seen = new Set(existing.map(sig));
  const additions = items.map(normalize).filter((i) => !seen.has(sig(i)));
  write([...existing, ...additions]);
}

/** Remove items whose title loosely matches a query (for chat "drop the X"). */
export function removeMatching(query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const terms = q.split(/\s+/).filter((w) => w.length >= 3);
  const existing = read();
  const kept = existing.filter((i) => {
    const t = i.title.toLowerCase();
    return !(t.includes(q) || terms.some((w) => t.includes(w)));
  });
  if (kept.length !== existing.length) write(kept);
  return existing.length - kept.length;
}

/** Apply a chat scheduleUpdate ({action, items, removeQuery}) from the worker. */
export function applyScheduleUpdate(
  update: { action?: string; items?: GeneratedItem[]; removeQuery?: string } | null | undefined,
): void {
  if (!update) return;
  if (update.action === "remove" && update.removeQuery) {
    removeMatching(update.removeQuery);
    return;
  }
  if (!Array.isArray(update.items) || update.items.length === 0) return;
  if (update.action === "replace") setSchedule(update.items);
  else addToSchedule(update.items);
}

export function removeScheduleItem(id: string): void {
  write(read().filter((i) => i.id !== id));
}

/** Add a single manual item. */
export function addManualItem(item: { section: SystemSection; title: string; days?: number[]; time?: string | null }): void {
  addToSchedule([{ section: item.section, title: item.title, detail: "", days: item.days ?? [], time: item.time ?? null }]);
}

export function clearSchedule(): void {
  write([]);
}

/** Items grouped by section, in canonical section order. */
export function getScheduleBySection(): Array<{ section: SystemSection; items: ScheduleItem[] }> {
  const all = read();
  return SECTIONS.map((section) => ({
    section,
    items: all
      .filter((i) => i.section === section)
      .sort((a, b) => (a.time && b.time ? (a.time < b.time ? -1 : 1) : a.time ? -1 : b.time ? 1 : 0)),
  })).filter((g) => g.items.length > 0);
}

/** What to do TODAY: anything scheduled for today + standing daily habits. */
export function itemsForToday(day = new Date().getDay()): ScheduleItem[] {
  return read()
    .filter((i) => i.section !== "avoid" && (i.days.includes(day) || (i.days.length === 0 && i.section === "daily")))
    .sort((a, b) => (a.time && b.time ? (a.time < b.time ? -1 : 1) : a.time ? -1 : b.time ? 1 : 0));
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

/** Compact day badge: "Daily" / "Mon, Wed, Fri" / "" (standing). */
export function daysLabel(days: number[]): string {
  if (days.length === 0) return "";
  if (days.length === 7) return "Daily";
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return "Weekdays";
  return [...days].sort().map((d) => DAY_LABELS[d]).join(", ");
}
