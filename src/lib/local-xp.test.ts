// Rawz/3 — XP + levels tests.
//
// Critical invariants per D-021:
//   - XP only ACCUMULATES (no subtraction even for negative inputs)
//   - Level monotonic in XP — more XP never demotes
//   - Level-up detection fires exactly once per crossing
//   - Level labels stay positive/neutral — no "beast" / "crusher"

import { beforeEach, describe, expect, it } from "vitest";
import {
  checkAndConsumeLevelUp,
  getCurrentLevel,
  labelForLevel,
  levelFromXp,
  levelInfoFromXp,
  levelUpMessage,
  resetLevelUpCache,
  thresholdForLevel,
  totalXpFor,
} from "./local-xp";
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

describe("XP computation", () => {
  it("empty inputs → 0 XP", () => {
    expect(totalXpFor([])).toBe(0);
  });

  it("sums XP per source — check-in 10 + workout 15 = 25", () => {
    const inputs = [
      { id: "a", date: "2026-05-27", source: "check_in" as const, value: {}, createdAt: "" },
      { id: "b", date: "2026-05-27", source: "workout" as const, value: {}, createdAt: "" },
    ];
    expect(totalXpFor(inputs)).toBe(25);
  });

  it("unrecognized sources contribute 0", () => {
    const inputs = [
      { id: "x", date: "2026-05-27", source: "unknown" as never, value: {}, createdAt: "" },
    ];
    expect(totalXpFor(inputs)).toBe(0);
  });
});

describe("Level math", () => {
  it("0 XP = level 1", () => {
    expect(levelFromXp(0)).toBe(1);
  });

  it("50 XP = level 2 exactly", () => {
    expect(levelFromXp(50)).toBe(2);
  });

  it("XP between thresholds = lower level", () => {
    expect(levelFromXp(49)).toBe(1);
    expect(levelFromXp(149)).toBe(2);
    expect(levelFromXp(2249)).toBe(9);
    expect(levelFromXp(2250)).toBe(10);
  });

  it("monotonic — more XP never decreases level", () => {
    let prev = levelFromXp(0);
    for (let xp = 0; xp < 5000; xp += 25) {
      const l = levelFromXp(xp);
      expect(l).toBeGreaterThanOrEqual(prev);
      prev = l;
    }
  });

  it("post-10 progression — each +600 XP = +1 level", () => {
    expect(levelFromXp(2250)).toBe(10);
    expect(levelFromXp(2850)).toBe(11);
    expect(levelFromXp(3450)).toBe(12);
  });

  it("thresholdForLevel is the inverse — level reached AT threshold", () => {
    for (let l = 1; l <= 15; l++) {
      const t = thresholdForLevel(l);
      expect(levelFromXp(t)).toBe(l);
    }
  });
});

describe("levelInfoFromXp", () => {
  it("returns clean info at level 1 / 0 XP", () => {
    const info = levelInfoFromXp(0);
    expect(info.level).toBe(1);
    expect(info.label).toBe("Starting");
    expect(info.totalXp).toBe(0);
    expect(info.xpInLevel).toBe(0);
    expect(info.xpToNext).toBe(50);
    expect(info.progress).toBe(0);
  });

  it("progress is 0..1 within a level", () => {
    const info = levelInfoFromXp(25); // halfway from level 1 (0) to level 2 (50)
    expect(info.level).toBe(1);
    expect(info.progress).toBeCloseTo(0.5);
  });

  it("at exact threshold, progress for new level is 0", () => {
    const info = levelInfoFromXp(50); // exactly level 2
    expect(info.level).toBe(2);
    expect(info.progress).toBe(0);
  });
});

describe("Level labels — safety voice check (D-021)", () => {
  // Word-boundary check — "showing" contains "win" as a substring, etc.
  const FORBIDDEN = ["beast", "crush", "ripped", "shredded", "elite", "champ", "winner", "dominate", "alpha"];
  function containsAny(text: string, words: string[]): string | null {
    for (const w of words) {
      const re = new RegExp(`\\b${w}\\b`, "i");
      if (re.test(text)) return w;
    }
    return null;
  }

  it("uses positive/consistency language, never aggressive", () => {
    for (let l = 1; l <= 15; l++) {
      const label = labelForLevel(l);
      const hit = containsAny(label, FORBIDDEN);
      expect(hit, `level ${l} label "${label}" contains "${hit}"`).toBeNull();
    }
  });

  it("level-up messages avoid shame / competitive language", () => {
    const shameWords = ["lazy", "excuse", "beat", "compete", "rank", "crushing"];
    for (let l = 2; l <= 12; l++) {
      const msg = levelUpMessage(l);
      const hit = containsAny(msg, shameWords);
      expect(hit, `level ${l} msg "${msg}" contains "${hit}"`).toBeNull();
    }
  });
});

describe("Level-up detection", () => {
  it("first call after crossing returns leveledUp=true exactly once", () => {
    // Push 50 XP of inputs to reach level 2
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    // 5 * 10 = 50 XP = exactly level 2
    expect(getCurrentLevel().level).toBe(2);

    const first = checkAndConsumeLevelUp();
    expect(first.leveledUp).toBe(true);
    expect(first.newLevel).toBe(2);

    const second = checkAndConsumeLevelUp();
    expect(second.leveledUp).toBe(false);
  });

  it("returns leveledUp=false when no level change", () => {
    expect(checkAndConsumeLevelUp().leveledUp).toBe(false);
  });

  it("resetLevelUpCache lets the next call re-fire", () => {
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    appendLocalInput({ date: "2026-05-27", source: "check_in", value: {} });
    checkAndConsumeLevelUp(); // consume
    expect(checkAndConsumeLevelUp().leveledUp).toBe(false);
    resetLevelUpCache();
    expect(checkAndConsumeLevelUp().leveledUp).toBe(true);
  });
});
