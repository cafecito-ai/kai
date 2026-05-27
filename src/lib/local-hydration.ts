// T-025 — Hydration tracker local store.
//
// Stored as a per-day counter in localStorage. Resets implicitly at local
// midnight because we key by YYYY-MM-DD — old entries are simply not read
// for the new day. Old days are kept (so the Progress tab could later
// chart hydration if we want), trimmed to last 30 days to avoid growth.
//
// Source-of-truth pattern: local-first. If/when the Worker is up we'll
// mirror via /api/score/input(source='energy_check_in') or a dedicated
// /api/hydration endpoint — for now local-only is fine; hydration is a
// daily counter, not auditable history.

const STORAGE_KEY = "kai_hydration_v1";
const DEFAULT_TARGET = 8;
const MAX_DAYS_RETAINED = 30;

export type HydrationEntry = {
  date: string;     // YYYY-MM-DD
  glasses: number;  // 0+, no upper cap
  target: number;   // user-configurable target, default 8
};

// ─────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────

function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function readAll(): HydrationEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as HydrationEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: HydrationEntry[]): void {
  if (typeof localStorage === "undefined") return;
  // Trim to last MAX_DAYS_RETAINED by date desc.
  const trimmed = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_DAYS_RETAINED);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota / unavailable — fine */
  }
}

/** Get today's hydration entry. Creates a fresh one with the default
 *  target if today hasn't been logged yet. Reads-only — does not write. */
export function getTodayHydration(now: Date = new Date()): HydrationEntry {
  const date = todayKey(now);
  const existing = readAll().find((e) => e.date === date);
  return (
    existing ?? {
      date,
      glasses: 0,
      target: DEFAULT_TARGET,
    }
  );
}

// ─────────────────────────────────────────────────────────────────────
// Writes
// ─────────────────────────────────────────────────────────────────────

/** Bump today's glass count by +1 or -1. Floors at 0; no upper cap.
 *  When the user CROSSES their daily target (e.g. 7 → 8 with target=8),
 *  fires a "hydration_goal_hit" input exactly once. That input feeds
 *  the XP system and KAI's recent-activity context, but spamming the
 *  + button after you've already hit the goal does nothing extra. */
export function bumpHydration(delta: 1 | -1, now: Date = new Date()): HydrationEntry {
  const date = todayKey(now);
  const all = readAll();
  const existing = all.find((e) => e.date === date);
  const prevGlasses = existing?.glasses ?? 0;
  const target = existing?.target ?? DEFAULT_TARGET;
  const next: HydrationEntry = existing
    ? { ...existing, glasses: Math.max(0, existing.glasses + delta) }
    : { date, glasses: Math.max(0, delta), target: DEFAULT_TARGET };
  const others = all.filter((e) => e.date !== date);
  writeAll([next, ...others]);

  // Goal-hit detection: only fires when we CROSS into "at or above target"
  // from below. Lazy-imports local-score to avoid a circular dep.
  const justCrossed = prevGlasses < target && next.glasses >= target;
  if (justCrossed) {
    void fireHydrationGoalHit(date);
  }
  // Always emit a state-changed event so any open Home/Progress page
  // re-reads the sleep sub-score (every glass now contributes partial
  // credit, not just the goal-hit).
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("kai:state-changed"));
  }
  return next;
}

/** Idempotent — fires a hydration_goal_hit input the first time the
 *  target is crossed on a given day. Subsequent calls for the same day
 *  are no-ops (so going below the target then back up doesn't double-pay). */
async function fireHydrationGoalHit(date: string): Promise<void> {
  const { appendLocalInput, readLocalInputs } = await import("./local-score");
  const already = readLocalInputs().some(
    (i) => i.date === date && i.source === "hydration_goal_hit",
  );
  if (already) return;
  appendLocalInput({ date, source: "hydration_goal_hit", value: {} });
}

/** Update today's target. */
export function setHydrationTarget(target: number, now: Date = new Date()): HydrationEntry {
  const date = todayKey(now);
  const safeTarget = Math.max(1, Math.min(20, Math.round(target)));
  const all = readAll();
  const existing = all.find((e) => e.date === date);
  const next: HydrationEntry = existing
    ? { ...existing, target: safeTarget }
    : { date, glasses: 0, target: safeTarget };
  const others = all.filter((e) => e.date !== date);
  writeAll([next, ...others]);
  return next;
}

/** Read-only access for the Progress tab to render a 7-day strip. */
export function getRecentHydration(days = 7, now: Date = new Date()): HydrationEntry[] {
  const result: HydrationEntry[] = [];
  const all = readAll();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const existing = all.find((e) => e.date === date);
    result.push(existing ?? { date, glasses: 0, target: DEFAULT_TARGET });
  }
  return result;
}
