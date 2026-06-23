// local-system-health — the "System Health" model (the LOCK-IN SYSTEM redesign).
//
// Instead of "14 tasks remaining / X% this week", the System is framed as four
// attributes you strengthen by showing up:
//   Mental · Body · Discipline · Recovery
// Each action belongs to an attribute and is worth points (a satisfying "+8
// Body" on completion). Each attribute's HEALTH (0–100) is your recent
// CONSISTENCY — how much of what your system expected over the last N days you
// actually did. It builds as you show up and gently decays if you stop (a new
// empty day rolls into the window and an old completed day rolls out).
//
// Attribute + points come from a fixed section map (deterministic, no AI). The
// window is equal-weighted so an incomplete "today" can't tank the number, and
// a day only counts as "expected" once the item actually existed (createdAt),
// so a brand-new system starts clean and climbs.

import { addDays, localDateKey } from "./dates";
import { getSchedule, type ScheduleItem, type SystemSection } from "./local-schedule";
import { doneIdsOn } from "./local-systems";

export type AttributeKey = "mental" | "body" | "discipline" | "recovery";

export const ATTRIBUTES: { key: AttributeKey; label: string; tint: string }[] = [
  { key: "mental", label: "Mental", tint: "text-mental" },
  { key: "body", label: "Body", tint: "text-physical" },
  { key: "discipline", label: "Discipline", tint: "text-goal" },
  { key: "recovery", label: "Recovery", tint: "text-sleep" },
];

const ATTRIBUTE_LABEL: Record<AttributeKey, string> = {
  mental: "Mental",
  body: "Body",
  discipline: "Discipline",
  recovery: "Recovery",
};

// Fixed section → attribute map (the six existing sections onto four pillars).
const ATTRIBUTE_BY_SECTION: Record<SystemSection, AttributeKey> = {
  mindset: "mental",
  training: "body",
  sleep: "recovery",
  daily: "discipline",
  routine: "discipline",
  avoid: "discipline",
};

// Per-completion points (effort proxy; tuned to the client's examples:
// mindset +4 Mental, training +8 Body, sleep +7 Recovery, avoid +6 Discipline).
const POINTS_BY_SECTION: Record<SystemSection, number> = {
  mindset: 4,
  training: 8,
  sleep: 7,
  daily: 5,
  routine: 4,
  avoid: 6,
};

/** Trailing window for the consistency calculation. Tunable. */
export const HEALTH_WINDOW_DAYS = 14;

export function attributeForItem(item: ScheduleItem): AttributeKey {
  return ATTRIBUTE_BY_SECTION[item.section];
}

export function pointsForItem(item: ScheduleItem): number {
  return POINTS_BY_SECTION[item.section];
}

export function attributeLabel(key: AttributeKey): string {
  return ATTRIBUTE_LABEL[key];
}

export type AttributeHealth = {
  key: AttributeKey;
  label: string;
  value: number; // 0–100 recent consistency
  hasItems: boolean; // false when the system has nothing for this pillar yet
};

export type SystemHealth = {
  overall: number;
  attributes: AttributeHealth[];
};

/** Was this item "expected" on the given weekday? Standing items (no specific
 *  days) are expected every day; otherwise only on their scheduled weekdays. */
function expectedOnWeekday(item: ScheduleItem, weekday: number): boolean {
  return item.days.length === 0 || item.days.includes(weekday);
}

// A createdAt we can trust as a real "existed from" date. Legacy items stored
// before the field get epoch from the migration (see local-schedule), which we
// treat as "always existed" rather than "created today" — otherwise an existing
// user's health would reset daily until their next schedule write.
function existedOn(item: ScheduleItem, dayKey: string): boolean {
  if (!item.createdAt) return true;
  return localDateKey(new Date(item.createdAt)) <= dayKey;
}

/**
 * Compute System Health. Each attribute = (expected actions completed) /
 * (expected actions) across the trailing window, counting a day only from when
 * the item existed. A completion logged on an OFF day (e.g. a Monday item
 * checked on Tuesday) still counts — the day becomes expected + done — so the
 * reward never lies. `hasItems` tracks whether the pillar contains any items at
 * all (independent of the window), so a pillar whose only action is scheduled
 * for a future day still counts toward `overall` instead of showing "—".
 * `avoid` items aren't completable check-offs, so they don't feed health.
 */
export function systemHealth(userId?: string | null, now: Date = new Date()): SystemHealth {
  const items = getSchedule().filter((i) => i.section !== "avoid");

  const acc: Record<AttributeKey, { done: number; expected: number }> = {
    mental: { done: 0, expected: 0 },
    body: { done: 0, expected: 0 },
    discipline: { done: 0, expected: 0 },
    recovery: { done: 0, expected: 0 },
  };
  const present: Record<AttributeKey, boolean> = {
    mental: false,
    body: false,
    discipline: false,
    recovery: false,
  };
  for (const item of items) present[attributeForItem(item)] = true;

  for (let d = 0; d < HEALTH_WINDOW_DAYS; d += 1) {
    const date = addDays(now, -d);
    const key = localDateKey(date);
    const weekday = date.getDay();
    const doneSet = new Set(doneIdsOn(key, userId));
    for (const item of items) {
      if (!existedOn(item, key)) continue;
      const did = doneSet.has(item.id);
      // A day counts as "expected" if the item was scheduled that weekday OR it
      // was actually completed that day (an off-day rep is credited, not lost).
      if (!expectedOnWeekday(item, weekday) && !did) continue;
      const attr = attributeForItem(item);
      acc[attr].expected += 1;
      if (did) acc[attr].done += 1;
    }
  }

  const attributes: AttributeHealth[] = ATTRIBUTES.map(({ key, label }) => {
    const { done, expected } = acc[key];
    return {
      key,
      label,
      hasItems: present[key],
      value: expected > 0 ? Math.round((done / expected) * 100) : 0,
    };
  });

  const active = attributes.filter((a) => a.hasItems);
  const overall = active.length
    ? Math.round(active.reduce((n, a) => n + a.value, 0) / active.length)
    : 0;

  return { overall, attributes };
}
