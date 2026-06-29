// Sub-systems — the component sub-skills a MAIN GOAL breaks into.
//
// e.g. "Make the soccer team (attacker)" → Endurance · Footwork & Passing ·
// Finishing · Strength. Each sub-system holds a few weekly habits. You swipe
// between them under the one pinned main goal; each has its own weekly fill
// meter. No clock.
//
// ISOLATED from the legacy kai_schedule_v1 on purpose: that store feeds Home's
// ring (systemHealth), goalProgress, and itemsForToday, so we do NOT pollute it.
// The ONLY thing we share is the check-off store (kai_system_done_v1), which is
// keyed purely by item id and is shape-agnostic — so sub-system habits MUST
// carry STABLE ids (minted once here, never re-minted on read), or their
// check-offs would orphan.

import { clearKey, loadJSON, saveJSON } from "./local-storage";
import type { ScheduleItem, SystemSection } from "./local-schedule";
import { weeklyDoneCount, weeklyTarget } from "./local-systems";

export type SubSystem = {
  id: string;
  name: string;
  blurb?: string;
  goal: string; // normalized main goal this set was generated for
  items: ScheduleItem[];
  createdAt: string;
};

// Loose shapes for incoming data (AI parse, templates, chat stubs) — ids and
// createdAt are minted by the normalizer, section may be any string.
export type SubHabitInput = {
  id?: string;
  section?: string;
  title: string;
  detail?: string;
  days?: number[];
  time?: string | null;
  createdAt?: string;
};
export type SubSystemInput = {
  id?: string;
  name: string;
  blurb?: string;
  goal?: string;
  items: SubHabitInput[];
  createdAt?: string;
};

type Store = { goal: string; systems: SubSystem[] };

const KEY = "kai_subsystems_v1";
const MAX_SYSTEMS = 6;
const MAX_HABITS = 6;
const VALID_SECTIONS: SystemSection[] = ["daily", "training", "sleep", "routine", "mindset", "avoid"];

export function normGoal(goal: string | null | undefined): string {
  return (goal ?? "").trim().toLowerCase().slice(0, 80);
}

function uid(prefix: string): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  } catch {
    /* fall through */
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function coerceSection(v: unknown): SystemSection {
  return typeof v === "string" && (VALID_SECTIONS as string[]).includes(v) ? (v as SystemSection) : "daily";
}

function coerceDays(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v.map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
}

/** Normalize a raw habit into a ScheduleItem with a STABLE id (kept if present). */
function normItem(raw: SubHabitInput): ScheduleItem {
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : uid("subhabit"),
    section: coerceSection(raw.section),
    title: String(raw.title ?? "").slice(0, 60).trim(),
    detail: typeof raw.detail === "string" ? raw.detail.slice(0, 100) : "",
    days: coerceDays(raw.days),
    time: typeof raw.time === "string" ? raw.time : null,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
  };
}

function normSystem(raw: SubSystemInput, goal: string): SubSystem | null {
  const name = String(raw.name ?? "").slice(0, 40).trim();
  if (!name) return null;
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .map(normItem)
    .filter((i) => i.title.length > 0)
    .slice(0, MAX_HABITS);
  if (items.length === 0) return null;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : uid("subsys"),
    name,
    blurb: typeof raw.blurb === "string" && raw.blurb.trim() ? raw.blurb.slice(0, 80).trim() : undefined,
    goal: normGoal(goal),
    items,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
  };
}

function read(userId?: string | null): Store {
  const s = loadJSON<Store>(KEY, userId, { goal: "", systems: [] });
  if (!s || !Array.isArray(s.systems)) return { goal: "", systems: [] };
  return { goal: typeof s.goal === "string" ? s.goal : "", systems: s.systems };
}

function write(store: Store, userId?: string | null): void {
  saveJSON(KEY, userId, store);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("kai:state-changed"));
}

export function getSubSystems(userId?: string | null): SubSystem[] {
  return read(userId).systems;
}

export function getSubSystemsGoal(userId?: string | null): string {
  return read(userId).goal;
}

/** True when we already have sub-systems generated for this exact goal. */
export function hasSubSystemsForGoal(goal: string | null | undefined, userId?: string | null): boolean {
  const store = read(userId);
  return store.systems.length > 0 && store.goal === normGoal(goal);
}

/** Replace the whole set for a goal. Mints stable ids on any raw input. */
export function setSubSystems(goal: string, systems: SubSystemInput[], userId?: string | null): void {
  const g = normGoal(goal);
  const norm = systems
    .map((s) => normSystem(s, g))
    .filter((s): s is SubSystem => s !== null)
    .slice(0, MAX_SYSTEMS);
  write({ goal: g, systems: norm }, userId);
}

export function clearSubSystems(userId?: string | null): void {
  clearKey(KEY, userId);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("kai:state-changed"));
}

/** Append one sub-system (from chat). Dedupes by name; caps the total. */
export function addSubSystem(sys: SubSystemInput, userId?: string | null): boolean {
  const store = read(userId);
  const norm = normSystem(sys, store.goal || normGoal(sys.goal));
  if (!norm) return false;
  if (store.systems.some((s) => s.name.toLowerCase() === norm.name.toLowerCase())) return false;
  store.systems = [...store.systems, norm].slice(0, MAX_SYSTEMS);
  write(store, userId);
  return true;
}

/** Remove sub-systems by fuzzy name match. Returns how many were removed. */
export function removeSubSystemByName(name: string, userId?: string | null): number {
  const store = read(userId);
  const q = name.trim().toLowerCase();
  if (!q) return 0;
  const before = store.systems.length;
  store.systems = store.systems.filter((s) => {
    const n = s.name.toLowerCase();
    const hit = n === q || (q.length >= 3 && n.includes(q)) || (n.length >= 3 && q.includes(n));
    return !hit;
  });
  const removed = before - store.systems.length;
  if (removed > 0) write(store, userId);
  return removed;
}

/** Weekly fill for ONE sub-system — same engine as systemProgressWeek, scoped
 *  to this sub-system's non-avoid items. Resets weekly automatically because
 *  weeklyDoneCount only counts the current week. */
export function subSystemProgressWeek(
  sys: SubSystem,
  userId?: string | null,
): { done: number; total: number; pct: number } {
  const items = sys.items.filter((i) => i.section !== "avoid");
  let done = 0;
  let total = 0;
  for (const it of items) {
    const n = weeklyTarget(it);
    total += n;
    done += Math.min(weeklyDoneCount(it.id, userId), n);
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/** Overall weekly completion across ALL sub-systems — the single number shown on
 *  the System page and mirrored by the Home "My Plan" ring, so the two agree. */
export function allSubSystemsProgressWeek(userId?: string | null): { done: number; total: number; pct: number } {
  let done = 0;
  let total = 0;
  for (const sys of getSubSystems(userId)) {
    const p = subSystemProgressWeek(sys, userId);
    done += p.done;
    total += p.total;
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
