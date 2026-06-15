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
import { loadJSON, namespacedKey, saveJSON } from "./local-storage";

// ─────────────────────────────────────────────────────────────────────
// Live system goal/title — decoupled from the Home North Star goal.
// The page title reads this; building a new system sets it. The Home goal
// (local-northstar) is left untouched on purpose.
// ─────────────────────────────────────────────────────────────────────

const SYSTEM_GOAL_KEY = "kai_system_goal_v1";

/** The current (main/live) system's title. Falls back to the North Star goal
 *  so the very first system still reads "be happier", then null. */
export function getSystemGoal(userId?: string | null): string | null {
  if (typeof localStorage !== "undefined") {
    const v = loadJSON<string | null>(SYSTEM_GOAL_KEY, userId, null);
    if (v && v.trim()) return v;
    const legacy = localStorage.getItem(namespacedKey(SYSTEM_GOAL_KEY, userId));
    if (legacy && legacy.trim()) return legacy;
  }
  return getNorthStar()?.goal ?? null;
}

export function setSystemGoal(goal: string, userId?: string | null): void {
  if (typeof localStorage === "undefined") return;
  try {
    saveJSON(SYSTEM_GOAL_KEY, userId, goal.trim().slice(0, 80));
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

function readSystems(userId?: string | null): SavedSystem[] {
  return loadJSON<SavedSystem[]>(SYSTEMS_KEY, userId, []);
}

function writeSystems(systems: SavedSystem[], userId?: string | null): void {
  if (typeof localStorage === "undefined") return;
  try {
    saveJSON(SYSTEMS_KEY, userId, systems.slice(0, 20));
    window.dispatchEvent(new Event("kai:state-changed"));
  } catch {
    /* ignore */
  }
}

export function listSystems(userId?: string | null): SavedSystem[] {
  return [...readSystems(userId)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Snapshot the current live system (its items + the current goal) as a saved
 *  system. If a saved system already has the same goal, it's replaced so Save
 *  acts like "save the latest version of this system". */
export function saveCurrentAsSystem(userId?: string | null): SavedSystem | null {
  const items = getSchedule();
  if (items.length === 0) return null;
  const goal = getSystemGoal(userId)?.trim() || "My system";
  const entry: SavedSystem = {
    id: `sys_save_${crypto.randomUUID()}`,
    goal,
    items,
    createdAt: new Date().toISOString(),
  };
  const existing = readSystems(userId).filter(
    (s) => s.goal.toLowerCase() !== goal.toLowerCase(),
  );
  writeSystems([entry, ...existing], userId);
  return entry;
}

export function deleteSystem(id: string, userId?: string | null): void {
  writeSystems(readSystems(userId).filter((s) => s.id !== id), userId);
}

/** Promote a saved system to "main": load its items into the live store and
 *  restore its goal, so the System tab now shows it. */
export function makeMain(id: string, userId?: string | null): void {
  const sys = readSystems(userId).find((s) => s.id === id);
  if (!sys) return;
  // Preserve item ids so this system's check-off progress (keyed by id in
  // kai_system_done_v1) survives the switch instead of getting wiped.
  setScheduleItems(sys.items);
  // Update the system title only — the Home North Star goal stays separate.
  if (sys.goal && sys.goal !== "My system") setSystemGoal(sys.goal, userId);
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

function readDone(userId?: string | null): DoneMap {
  return loadJSON<DoneMap>(DONE_KEY, userId, {});
}

function writeDone(map: DoneMap, userId?: string | null): void {
  if (typeof localStorage === "undefined") return;
  const keys = Object.keys(map).sort();
  while (keys.length > 14) {
    const oldest = keys.shift();
    if (oldest) delete map[oldest];
  }
  try {
    saveJSON(DONE_KEY, userId, map);
    window.dispatchEvent(new Event("kai:state-changed"));
  } catch {
    /* ignore */
  }
}

export function doneIdsToday(userId?: string | null): string[] {
  return readDone(userId)[localDateKey()] ?? [];
}

export function isDoneToday(id: string, userId?: string | null): boolean {
  return doneIdsToday(userId).includes(id);
}

export function toggleDoneToday(id: string, userId?: string | null): void {
  const map = readDone(userId);
  const key = localDateKey();
  const set = new Set(map[key] ?? []);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  map[key] = Array.from(set);
  writeDone(map, userId);
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
export function weeklyDoneCount(itemId: string, userId?: string | null): number {
  const map = readDone(userId);
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

export function systemProgressWeek(userId?: string | null): SystemProgress {
  const items = getSchedule().filter((i) => i.section !== "avoid");
  const weekKeys = currentWeekKeys();
  const map = readDone(userId);
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
