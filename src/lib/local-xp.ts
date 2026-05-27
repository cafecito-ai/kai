// XP + levels system (Rawz/3).
//
// Per D-021 — the soft gamification policy:
//   - XP ONLY accumulates. Missed days do NOT subtract. Ever.
//   - Levels are derived deterministically from total XP.
//   - Level names are neutral/positive — never aggressive ("Beast",
//     "Crusher", etc) — KAI's voice stays "show up / build / grow."
//   - Level-up moment is a soft notification, not a popup interruption.
//
// Implementation note: XP is COMPUTED from the local input log, not
// stored as a counter. That means no drift, no migration headaches,
// and deleting an input correctly reduces XP. The "last level seen"
// is the only thing we cache in localStorage (to detect level-ups
// on first observation).

import { readLocalInputs, type LocalInput, type LocalSource } from "./local-score";

// ─────────────────────────────────────────────────────────────────────
// XP per input source
// ─────────────────────────────────────────────────────────────────────

/** XP awarded per input source. Bigger = harder activity. Tuned so a
 *  daily-engaged user reaches Level 2 in 2-3 days, Level 10 in roughly
 *  2-3 months. */
const XP_BY_SOURCE: Record<LocalSource, number> = {
  check_in: 10,
  journal: 10,
  food_log: 5,
  workout: 15,
  sleep_log: 10,
  goal_progress: 15,
  energy_check_in: 5,
};

// ─────────────────────────────────────────────────────────────────────
// Level definitions
// ─────────────────────────────────────────────────────────────────────

/** Thresholds — total XP needed to REACH this level. Index = level - 1. */
const LEVEL_THRESHOLDS = [
  0,    // Level 1 — start
  50,   // Level 2
  150,  // Level 3
  300,  // Level 4
  500,  // Level 5
  750,  // Level 6
  1050, // Level 7
  1400, // Level 8
  1800, // Level 9
  2250, // Level 10
];
const LEVELS_AFTER_10_GAP = 600; // every +600 XP past Level 10 = +1 level

/** Soft, positive labels for each level. Per D-021 — no "beast" /
 *  "crusher" / "elite" language. The vibe is consistency, not dominance. */
const LEVEL_LABELS: Record<number, string> = {
  1: "Starting",
  2: "Building",
  3: "Showing up",
  4: "Steady",
  5: "Consistent",
  6: "Rooted",
  7: "Grounded",
  8: "Established",
  9: "Anchor",
  10: "Long game",
  // 11+ uses a generic "Long game · N" pattern computed below
};

export type LevelInfo = {
  level: number;
  /** Display name e.g. "Building" or "Long game · 12". */
  label: string;
  /** Total XP accumulated across all time. */
  totalXp: number;
  /** XP at the start of this level — i.e. the threshold needed to reach it. */
  levelStartXp: number;
  /** XP needed to reach the next level (or null if level cap effectively
   *  uncapped — we always return a next threshold using LEVELS_AFTER_10_GAP). */
  nextLevelXp: number;
  /** XP earned within the current level. */
  xpInLevel: number;
  /** XP needed within current level to advance. */
  xpToNext: number;
  /** Progress 0..1 through the current level. */
  progress: number;
};

// ─────────────────────────────────────────────────────────────────────
// Pure math
// ─────────────────────────────────────────────────────────────────────

/** Sum XP across the input log. */
export function totalXpFor(inputs: LocalInput[]): number {
  let xp = 0;
  for (const i of inputs) {
    const v = XP_BY_SOURCE[i.source];
    if (typeof v === "number") xp += v;
  }
  return xp;
}

/** Map a total XP number to its Level number (1+). */
export function levelFromXp(totalXp: number): number {
  // Walk the explicit thresholds first
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      // We're at least Level (i+1). If we're beyond the explicit table,
      // compute the additional levels via the post-10 gap.
      if (i === LEVEL_THRESHOLDS.length - 1) {
        const beyond = totalXp - LEVEL_THRESHOLDS[i];
        return 10 + Math.floor(beyond / LEVELS_AFTER_10_GAP);
      }
      return i + 1;
    }
  }
  return 1;
}

/** XP threshold to reach a given level. */
export function thresholdForLevel(level: number): number {
  if (level <= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[level - 1];
  return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] +
    (level - LEVEL_THRESHOLDS.length) * LEVELS_AFTER_10_GAP;
}

/** Friendly label for a level. */
export function labelForLevel(level: number): string {
  if (level in LEVEL_LABELS) return LEVEL_LABELS[level];
  // Beyond level 10 — keep extending the "long game" theme.
  return `Long game · ${level}`;
}

/** Build the full LevelInfo from an XP total. */
export function levelInfoFromXp(totalXp: number): LevelInfo {
  const level = levelFromXp(totalXp);
  const levelStartXp = thresholdForLevel(level);
  const nextLevelXp = thresholdForLevel(level + 1);
  const xpInLevel = totalXp - levelStartXp;
  const xpToNext = nextLevelXp - totalXp;
  const span = nextLevelXp - levelStartXp;
  const progress = span > 0 ? Math.max(0, Math.min(1, xpInLevel / span)) : 0;
  return {
    level,
    label: labelForLevel(level),
    totalXp,
    levelStartXp,
    nextLevelXp,
    xpInLevel,
    xpToNext,
    progress,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Public API — reads from the live input log
// ─────────────────────────────────────────────────────────────────────

/** Get the user's current level info, derived from all logged inputs. */
export function getCurrentLevel(): LevelInfo {
  return levelInfoFromXp(totalXpFor(readLocalInputs()));
}

// ─────────────────────────────────────────────────────────────────────
// Level-up detection — cache "last level seen" to detect crossings
// ─────────────────────────────────────────────────────────────────────

const LAST_LEVEL_KEY = "kai_last_level_seen_v1";

/** Returns true exactly once when the user crosses into a new level.
 *  Subsequent calls return false until they level up again. */
export function checkAndConsumeLevelUp(): { leveledUp: boolean; newLevel: number } {
  const current = getCurrentLevel();
  if (typeof localStorage === "undefined") {
    return { leveledUp: false, newLevel: current.level };
  }
  let lastSeen = 1;
  try {
    const raw = localStorage.getItem(LAST_LEVEL_KEY);
    if (raw) lastSeen = Math.max(1, parseInt(raw, 10) || 1);
  } catch {
    /* ignore */
  }
  if (current.level > lastSeen) {
    try {
      localStorage.setItem(LAST_LEVEL_KEY, String(current.level));
    } catch {
      /* ignore */
    }
    return { leveledUp: true, newLevel: current.level };
  }
  return { leveledUp: false, newLevel: current.level };
}

/** Reset the level-up cache. Used in tests; harmless in production. */
export function resetLevelUpCache(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(LAST_LEVEL_KEY);
  } catch {
    /* ignore */
  }
}

// ─────────────────────────────────────────────────────────────────────
// Level-up flavor text (soft, never aggressive)
// ─────────────────────────────────────────────────────────────────────

/** A short KaiMessage-style sentence shown when the user levels up.
 *  Tuned per D-021: celebrate consistency, never push. */
export function levelUpMessage(level: number): string {
  switch (level) {
    case 2:
      return "Level 2. You've been showing up — that's the whole thing.";
    case 3:
      return "Level 3. The boring days are doing real work.";
    case 4:
      return "Level 4. Steady is harder than loud — you're doing it.";
    case 5:
      return "Level 5. This is when it starts to feel like you, not a goal.";
    case 6:
      return "Level 6. Roots, not branches. Keep them deep.";
    case 7:
      return "Level 7. People who do this once are easy. You're the other kind.";
    case 8:
      return "Level 8. The version of you that started would be impressed.";
    case 9:
      return "Level 9. Almost double-digits — that's a real practice now.";
    case 10:
      return "Level 10. You're playing the long game. The hard part is letting it stay normal.";
    default:
      return `Level ${level}. Still showing up. That's the whole game.`;
  }
}
