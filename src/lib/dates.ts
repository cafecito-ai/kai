/**
 * Local-date helpers.
 *
 * Codex review flagged across the trackers (#36 cycle, #44 screen-time,
 * #46 mood-log) that each had its own `todayKey()` implementation,
 * sometimes using `.toISOString()` which is UTC-based and rolls over at
 * different local times. The cycle tracker specifically had the day-of-
 * cycle increment after 5pm Pacific because UTC midnight had passed.
 *
 * Single shared implementation: format the date using the user's LOCAL
 * timezone, regardless of how the Date object was constructed.
 */

/** ISO date string `YYYY-MM-DD` using the user's local timezone. */
export function localDateKey(asOf: Date = new Date()): string {
  const y = asOf.getFullYear();
  const m = String(asOf.getMonth() + 1).padStart(2, "0");
  const d = String(asOf.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns a new Date offset by n calendar days from the input. */
export function addDays(date: Date, n: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + n);
  return next;
}

/**
 * Number of whole calendar days between two dates, using LOCAL midnight
 * boundaries. Positive when `later` is after `earlier`. Useful for
 * "days since last period" / "days since last log" math.
 */
export function daysBetween(earlier: Date, later: Date): number {
  const a = new Date(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  const b = new Date(later.getFullYear(), later.getMonth(), later.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** How many days are in the given month (monthIndex is 0=Jan .. 11=Dec). */
export function daysInMonth(year: number, monthIndex: number): number {
  // Day 0 of the next month is the last day of this month.
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Weekday index (0=Sun .. 6=Sat) that the 1st of the month falls on. */
export function firstWeekdayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex, 1).getDay();
}

/** Parses a `YYYY-MM-DD` string as a Date at LOCAL midnight (not UTC). */
export function parseLocalDate(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (Number.isNaN(date.getTime())) return null;
  // Sanity-check that the constructed date matches the input parts
  // (rejects e.g. "2026-02-31").
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}
