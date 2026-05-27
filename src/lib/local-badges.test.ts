// Rawz/4 — badges tests.
//
// Critical invariants per D-021:
//   - Every badge is milestone-based, never comparative
//   - Locked badge criteria never use shame language ("not yet" / "you haven't")
//   - Earning happens deterministically based on input log
//   - "Seen" detection fires exactly once per badge

import { beforeEach, describe, expect, it } from "vitest";
import {
  BADGE_CATALOG,
  badgeSummary,
  checkAndConsumeNewBadges,
  getBadgeProgress,
} from "./local-badges";
import { appendLocalInput } from "./local-score";

const memory = new Map<string, string>();
beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => { memory.set(k, v); },
    removeItem: (k: string) => { memory.delete(k); },
    clear: () => memory.clear(),
    key: (i: number) => Array.from(memory.keys())[i] ?? null,
    get length() { return memory.size; },
  } as unknown as Storage;
});

describe("Badge catalog", () => {
  it("has at least 15 badges across 6 categories", () => {
    expect(BADGE_CATALOG.length).toBeGreaterThanOrEqual(15);
    const categories = new Set(BADGE_CATALOG.map((b) => b.category));
    expect(categories.size).toBeGreaterThanOrEqual(6);
  });

  it("no badge ID is duplicated", () => {
    const ids = BADGE_CATALOG.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("no badge criterion uses shame language (D-021)", () => {
    const FORBIDDEN = ["lazy", "you haven't", "you failed", "missed", "behind"];
    function contains(text: string): string | null {
      const lower = text.toLowerCase();
      for (const w of FORBIDDEN) {
        if (lower.includes(w)) return w;
      }
      return null;
    }
    for (const b of BADGE_CATALOG) {
      const hit = contains(b.criterion);
      expect(hit, `badge "${b.id}" criterion uses forbidden "${hit}": ${b.criterion}`).toBeNull();
    }
  });

  it("no badge title or description is comparative", () => {
    const FORBIDDEN = ["top", "percent", "ranked", "better than", "above average"];
    for (const b of BADGE_CATALOG) {
      const blob = `${b.title} ${b.description}`.toLowerCase();
      for (const w of FORBIDDEN) {
        expect(blob.includes(w), `badge "${b.id}" uses comparative word "${w}"`).toBe(false);
      }
    }
  });
});

describe("Earning badges from input log", () => {
  it("first check-in earns 'first-checkin' badge", () => {
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: { mood: 4 } });
    const progress = getBadgeProgress();
    const first = progress.find((p) => p.badge.id === "first-checkin");
    expect(first?.earnedAt).not.toBeNull();
    expect(first?.progress).toBe(1);
  });

  it("seven check-ins earns 'week-strong' badge", () => {
    for (let i = 0; i < 7; i++) {
      appendLocalInput({ date: "2026-05-27", source: "check_in", value: { mood: 4 } });
    }
    const progress = getBadgeProgress();
    const week = progress.find((p) => p.badge.id === "week-strong");
    expect(week?.earnedAt).not.toBeNull();
  });

  it("locked badges show progress fraction", () => {
    for (let i = 0; i < 3; i++) {
      appendLocalInput({ date: "2026-05-27", source: "check_in", value: { mood: 4 } });
    }
    const progress = getBadgeProgress();
    const month = progress.find((p) => p.badge.id === "month-in");
    expect(month?.earnedAt).toBeNull();
    expect(month?.current).toBe(3);
    expect(month?.target).toBe(30);
    expect(month?.progress).toBeCloseTo(0.1);
  });

  it("workouts earn workout badges", () => {
    appendLocalInput({ date: "2026-05-27", source: "workout", value: {} });
    const progress = getBadgeProgress();
    expect(progress.find((p) => p.badge.id === "first-workout")?.earnedAt).not.toBeNull();
  });
});

describe("New-badge detection", () => {
  it("returns newly-earned badges on first call, empty on second", () => {
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    const first = checkAndConsumeNewBadges();
    expect(first.length).toBeGreaterThanOrEqual(1);
    expect(first.some((b) => b.badge.id === "first-checkin")).toBe(true);

    const second = checkAndConsumeNewBadges();
    expect(second).toEqual([]);
  });

  it("new badge fires when a new threshold is crossed", () => {
    // Earn first-checkin
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    checkAndConsumeNewBadges(); // consume

    // Earn 6 more = week-strong
    for (let i = 0; i < 6; i++) {
      appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    }
    const next = checkAndConsumeNewBadges();
    expect(next.some((b) => b.badge.id === "week-strong")).toBe(true);
  });
});

describe("badgeSummary", () => {
  it("starts at 0 of (catalog length)", () => {
    const s = badgeSummary();
    expect(s.earned).toBe(0);
    expect(s.total).toBe(BADGE_CATALOG.length);
  });

  it("increments as badges are earned", () => {
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    const s = badgeSummary();
    expect(s.earned).toBeGreaterThanOrEqual(1);
  });
});
