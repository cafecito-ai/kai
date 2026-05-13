import { describe, expect, it } from "vitest";
import { addDays, daysBetween, localDateKey, parseLocalDate } from "./dates";

describe("localDateKey", () => {
  it("formats a Date in the local timezone as YYYY-MM-DD", () => {
    // Build a Date by passing local-time components so the result is timezone-stable.
    const d = new Date(2026, 0, 5, 18, 30, 0);
    expect(localDateKey(d)).toBe("2026-01-05");
  });

  it("pads month and day to two digits", () => {
    const d = new Date(2026, 8, 3, 0, 0, 0); // Sep 3
    expect(localDateKey(d)).toBe("2026-09-03");
  });

  it("uses local components (NOT UTC) — protects against the toISOString() bug Codex flagged", () => {
    // Late-evening local time should still report TODAY in local terms,
    // not roll forward to tomorrow as toISOString() would in west-of-UTC zones.
    const d = new Date(2026, 4, 12, 23, 45, 0); // local 11:45pm
    expect(localDateKey(d)).toBe("2026-05-12");
  });
});

describe("addDays", () => {
  it("adds whole calendar days", () => {
    const d = new Date(2026, 0, 30, 12, 0, 0);
    const next = addDays(d, 5);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(1); // Feb
    expect(next.getDate()).toBe(4);
  });

  it("subtracts when n is negative", () => {
    const d = new Date(2026, 0, 5, 12, 0, 0);
    const prev = addDays(d, -10);
    expect(prev.getFullYear()).toBe(2025);
    expect(prev.getMonth()).toBe(11); // Dec
    expect(prev.getDate()).toBe(26);
  });

  it("does not mutate the input", () => {
    const d = new Date(2026, 0, 5);
    const original = d.getTime();
    addDays(d, 5);
    expect(d.getTime()).toBe(original);
  });
});

describe("daysBetween", () => {
  it("returns positive whole days when later is after earlier", () => {
    const a = new Date(2026, 0, 1);
    const b = new Date(2026, 0, 8);
    expect(daysBetween(a, b)).toBe(7);
  });

  it("returns negative when later is before earlier", () => {
    const a = new Date(2026, 0, 10);
    const b = new Date(2026, 0, 1);
    expect(daysBetween(a, b)).toBe(-9);
  });

  it("returns 0 for same calendar day even with different times", () => {
    const a = new Date(2026, 0, 5, 8, 0, 0);
    const b = new Date(2026, 0, 5, 23, 59, 0);
    expect(daysBetween(a, b)).toBe(0);
  });
});

describe("parseLocalDate", () => {
  it("parses a valid ISO date at local midnight", () => {
    const d = parseLocalDate("2026-04-15");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(3);
    expect(d!.getDate()).toBe(15);
    expect(d!.getHours()).toBe(0);
  });

  it("returns null for malformed input", () => {
    expect(parseLocalDate("not-a-date")).toBeNull();
    expect(parseLocalDate("2026-1-5")).toBeNull();
    expect(parseLocalDate("")).toBeNull();
  });

  it("returns null for nonsense calendar dates (e.g. Feb 31)", () => {
    expect(parseLocalDate("2026-02-31")).toBeNull();
    expect(parseLocalDate("2026-13-01")).toBeNull();
  });

  it("round-trips with localDateKey", () => {
    const original = new Date(2026, 6, 4);
    const key = localDateKey(original);
    const parsed = parseLocalDate(key);
    expect(parsed).not.toBeNull();
    expect(localDateKey(parsed!)).toBe(key);
  });
});
