// Saved systems + daily check-offs (client feature).
//
// The LIVE/main system stays in local-schedule.ts (`kai_schedule_v1`) so chat
// edits and the tab keep working. This module adds:
//   - Saved systems: snapshots you can swipe through and promote to "main".
//   - Daily check-offs: which live-system items you've done TODAY (resets each
//     day), plus a per-category progress tally shown on the System page.
//
// The system progress score is intentionally separate from the Daily Score —
// it's just "how much of your system did you do today".

import { addDays, localDateKey } from "./dates";
import { getNorthStar } from "./local-northstar";
import {
  getSchedule,
  setScheduleItems,
  type ScheduleItem,
  type SystemSection,
} from "./local-schedule";

// ─────────────────────────────────────────────────────────────────────
// Live system goal/title — decoupled from the Home North Star goal.
// The page title reads this; building a new system sets it. The Home goal
// (local-northstar) is left untouched on purpose.
// ─────────────────────────────────────────────────────────────────────

const SYSTEM_GOAL_KEY = "kai_system_goal_v1";

/** The current (main/live) system's title. Falls back to the North Star goal
 *  so the very first system still reads "be happier", then null. */
export function getSystemGoal(): string | null {
  if (typeof localStorage !== "undefined") {
    const v = localStorage.getItem(SYSTEM_GOAL_KEY);
    if (v && v.trim()) return v;
  }
  return getNorthStar()?.goal ?? null;
}

export function setSystemGoal(goal: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SYSTEM_GOAL_KEY, goal.trim().slice(0, 80));
    window.dispatchEvent(new Event("kai:state-changed"));
  } catch {
    /* ignore */
  }
}

// ─────────────────────────────────────────────────────────────────────
// Saved systems
// ─────────────────────────────────────────────────────────────────────

export type SavedSystem = {
  id: string;
  goal: string;
  items: ScheduleItem[];
  createdAt: string;
};

const SYSTEMS_KEY = "kai_systems_v1";

function readSystems(): SavedSystem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(SYSTEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SavedSystem[]) : [];
  } catch {
    return [];
  }
}

function writeSystems(systems: SavedSystem[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SYSTEMS_KEY, JSON.stringify(systems.slice(0, 20)));
    window.dispatchEvent(new Event("kai:state-changed"));
  } catch {
    /* ignore */
  }
}

export function listSystems(): SavedSystem[] {
  return [...readSystems()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Snapshot the current live system (its items + the current goal) as a saved
 *  system. If a saved system already has the same goal, it's replaced so Save
 *  acts like "save the latest version of this system". */
export function saveCurrentAsSystem(): SavedSystem | null {
  const items = getSchedule();
  if (items.length === 0) return null;
  const goal = getSystemGoal()?.trim() || "My system";
  const entry: SavedSystem = {
    id: `sys_save_${crypto.randomUUID()}`,
    goal,
    items,
    createdAt: new Date().toISOString(),
  };
  const existing = readSystems().filter(
    (s) => s.goal.toLowerCase() !== goal.toLowerCase(),
  );
  writeSystems([entry, ...existing]);
  return entry;
}

export function deleteSystem(id: string): void {
  writeSystems(readSystems().filter((s) => s.id !== id));
}

/** Promote a saved system to "main": load its items into the live store and
 *  restore its goal, so the System tab now shows it. */
export function makeMain(id: string): void {
  const sys = readSystems().find((s) => s.id === id);
  if (!sys) return;
  // Preserve item ids so this system's check-off progress (keyed by id in
  // kai_system_done_v1) survives the switch instead of getting wiped.
  setScheduleItems(sys.items);
  // Update the system title only — the Home North Star goal stays separate.
  if (sys.goal && sys.goal !== "My system") setSystemGoal(sys.goal);
}

/** Is this saved system the one currently loaded as the live/main system?
 *  Matched loosely by goal + identical item titles (snapshots have new ids). */
export function isMainSystem(sys: SavedSystem): boolean {
  const live = getSchedule();
  if (live.length !== sys.items.length) return false;
  const liveTitles = live.map((i) => i.title).sort().join("|");
  const sysTitles = sys.items.map((i) => i.title).sort().join("|");
  return liveTitles === sysTitles;
}

// ─────────────────────────────────────────────────────────────────────
// Daily check-offs (live system) — resets each day
// ─────────────────────────────────────────────────────────────────────

const DONE_KEY = "kai_system_done_v1";
type DoneMap = Record<string, string[]>; // localDateKey -> item ids done that day

function readDone(): DoneMap {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(DONE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as DoneMap) : {};
  } catch {
    return {};
  }
}

function writeDone(map: DoneMap): void {
  if (typeof localStorage === "undefined") return;
  const keys = Object.keys(map).sort();
  while (keys.length > 14) {
    const oldest = keys.shift();
    if (oldest) delete map[oldest];
  }
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event("kai:state-changed"));
  } catch {
    /* ignore */
  }
}

export function doneIdsToday(): string[] {
  return readDone()[localDateKey()] ?? [];
}

export function isDoneToday(id: string): boolean {
  return doneIdsToday().includes(id);
}

export function toggleDoneToday(id: string): void {
  const map = readDone();
  const key = localDateKey();
  const set = new Set(map[key] ?? []);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  map[key] = Array.from(set);
  writeDone(map);
}

// ─────────────────────────────────────────────────────────────────────
// Weekly targets (non-avoid items only)
//
// Each item is a weekly quota: N = number of scheduled days (MON/WED/FRI → 3),
// or 7 for a standing/daily item. Any day's check counts toward N; the count
// resets each week because we only tally days within the current week.
// ─────────────────────────────────────────────────────────────────────

/** YYYY-MM-DD keys for the current local week, Sunday→Saturday. */
function currentWeekKeys(now = new Date()): string[] {
  const sunday = addDays(now, -now.getDay());
  return Array.from({ length: 7 }, (_, i) => localDateKey(addDays(sunday, i)));
}

/** Weekly target for an item: its scheduled-day count, or 7 if standing/daily. */
export function weeklyTarget(item: ScheduleItem): number {
  return item.days.length > 0 ? item.days.length : 7;
}

/** How many distinct days THIS WEEK the item was checked off. */
export function weeklyDoneCount(itemId: string): number {
  const map = readDone();
  return currentWeekKeys().reduce(
    (n, k) => n + ((map[k] ?? []).includes(itemId) ? 1 : 0),
    0,
  );
}

export type CategoryProgress = { section: SystemSection; done: number; total: number };
export type SystemProgress = {
  overall: { done: number; total: number; pct: number };
  byCategory: CategoryProgress[];
};

export function systemProgressWeek(): SystemProgress {
  const items = getSchedule().filter((i) => i.section !== "avoid");
  const weekKeys = currentWeekKeys();
  const map = readDone();
  const weekCount = (id: string) =>
    weekKeys.reduce((n, k) => n + ((map[k] ?? []).includes(id) ? 1 : 0), 0);

  const bySection = new Map<SystemSection, CategoryProgress>();
  let doneTotal = 0;
  let targetTotal = 0;
  for (const it of items) {
    const n = weeklyTarget(it);
    const x = Math.min(weekCount(it.id), n);
    targetTotal += n;
    doneTotal += x;
    const row = bySection.get(it.section) ?? { section: it.section, done: 0, total: 0 };
    row.total += n;
    row.done += x;
    bySection.set(it.section, row);
  }
  return {
    overall: {
      done: doneTotal,
      total: targetTotal,
      pct: targetTotal ? Math.round((doneTotal / targetTotal) * 100) : 0,
    },
    byCategory: Array.from(bySection.values()),
  };
}
