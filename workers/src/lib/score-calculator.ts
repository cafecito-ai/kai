// Daily Score calculator.
//
// Formula (CLAUDE.md v2 §5):
//   daily_score = mental_score * 0.4 + sleep_score * 0.3 + mood_score * 0.3
//
// Sub-score derivation:
//   mental_score : weighted from check-ins (40%) + journals (30%) +
//                  goal progress (30%)
//   sleep_score  : saturating curve over hours slept — 8h = 100, 7h = 90,
//                  6h = 75, 5h = 55, 4h = 40, 0h = 0. Diminishing returns
//                  past 8h up to a soft 100 ceiling at 9h+ before easing
//                  back (oversleep also signals something off).
//   mood_score   : self-reported mood (60%) + journal sentiment (40%).
//                  Each mapped to 0–100 from its native scale.
//
// Returns integers 0–100, or null with a `reason` field when the inputs
// for that sub-score don't exist yet. Never returns NaN.

export type SourceKind =
  | "check_in"
  | "journal"
  | "food_log"
  | "workout"
  | "sleep_log"
  | "goal_progress"
  | "energy_check_in";

export type ScoreInput = {
  source: SourceKind;
  /** JSON payload — shape varies by source; see `value` shapes below. */
  value: unknown;
};

// Input value shapes the calculator understands.
// (Sources can carry extra fields; calculator ignores anything it doesn't use.)
type CheckInValue = { mood?: number /* 1–5 */; note?: string };
type JournalValue = { sentiment?: number /* -1..+1 */; chars?: number };
type SleepValue = { hours: number; quality?: number /* 1–5 */ };
type GoalProgressValue = { delta?: number /* +1 progress unit */ };

export type SubScore = number | null;

export type DailyScoreResult = {
  mental: SubScore;
  sleep: SubScore;
  mood: SubScore;
  final: SubScore;
  band: "low" | "mid" | "high" | null;
  /** When a sub-score is null, this explains why. Useful for /score detail. */
  reasons: {
    mental?: string;
    sleep?: string;
    mood?: string;
    final?: string;
  };
};

// ─────────────────────────────────────────────────────────────────────
// Public entrypoint
// ─────────────────────────────────────────────────────────────────────

export function calculateDailyScore(inputs: ScoreInput[]): DailyScoreResult {
  const reasons: DailyScoreResult["reasons"] = {};

  const mental = mentalSubscore(inputs, reasons);
  const sleep = sleepSubscore(inputs, reasons);
  const mood = moodSubscore(inputs, reasons);

  // Final requires at least one sub-score. We re-weight the available ones
  // proportionally so a user with only a check-in (no sleep yet) still gets
  // a meaningful score, rather than being penalised for the missing data.
  const present = [
    { v: mental, w: 0.4 },
    { v: sleep, w: 0.3 },
    { v: mood, w: 0.3 },
  ].filter((x): x is { v: number; w: number } => x.v != null);

  let final: SubScore = null;
  if (present.length === 0) {
    reasons.final =
      "No score inputs yet today — start with a check-in or sleep log.";
  } else {
    const totalW = present.reduce((s, x) => s + x.w, 0);
    const weighted = present.reduce((s, x) => s + x.v * (x.w / totalW), 0);
    final = clamp01_100(Math.round(weighted));
  }

  const band = final == null ? null : bandFor(final);

  return { mental, sleep, mood, final, band, reasons };
}

// v3 §2 thresholds. Never red on the low end; soft amber.
export function bandFor(score: number): "low" | "mid" | "high" {
  if (score <= 40) return "low";
  if (score <= 70) return "mid";
  return "high";
}

// ─────────────────────────────────────────────────────────────────────
// Sub-scores
// ─────────────────────────────────────────────────────────────────────

function mentalSubscore(
  inputs: ScoreInput[],
  reasons: DailyScoreResult["reasons"],
): SubScore {
  // Mental = check-ins (35%) + journals (25%) + goal progress (15%)
  //        + workouts (15%) + energy check-in (10%)
  // Mirrors src/lib/local-score.ts — keep these two in sync.
  const checkIns = inputs.filter((i) => i.source === "check_in");
  const journals = inputs.filter((i) => i.source === "journal");
  const goals = inputs.filter((i) => i.source === "goal_progress");
  const workouts = inputs.filter((i) => i.source === "workout");
  const energy = inputs.filter((i) => i.source === "energy_check_in");

  if (
    checkIns.length + journals.length + goals.length + workouts.length + energy.length ===
    0
  ) {
    reasons.mental = "No check-ins, journals, goal progress, workouts, or energy logged today.";
    return null;
  }

  const ciScore = checkIns.length
    ? avg(checkIns.map((c) => moodToScore((c.value as CheckInValue).mood ?? 3)))
    : null;

  const jScore = journals.length
    ? avg(
        journals.map((j) =>
          sentimentToScore((j.value as JournalValue).sentiment ?? 0),
        ),
      )
    : null;

  const gScore = goals.length
    ? clamp01_100(80 + Math.min(goals.length - 1, 3) * 5)
    : null;

  // Workouts contribute ~85 mental, capped after 2/day.
  const wScore = workouts.length
    ? clamp01_100(80 + Math.min(workouts.length - 1, 1) * 5)
    : null;

  const eScore = energy.length
    ? avg(
        energy.map((e) =>
          moodToScore((e.value as { energy?: number }).energy ?? 3),
        ),
      )
    : null;

  return weightedAvg([
    { v: ciScore, w: 0.35 },
    { v: jScore, w: 0.25 },
    { v: gScore, w: 0.15 },
    { v: wScore, w: 0.15 },
    { v: eScore, w: 0.1 },
  ]);
}

function sleepSubscore(
  inputs: ScoreInput[],
  reasons: DailyScoreResult["reasons"],
): SubScore {
  // Sleep = sleep_log (80%) + hydration_goal_hit (20%)
  const logs = inputs.filter((i) => i.source === "sleep_log");
  const hyd = inputs.filter((i) => i.source === "hydration_goal_hit");
  if (logs.length === 0 && hyd.length === 0) {
    reasons.sleep = "No sleep or hydration goal logged today.";
    return null;
  }
  let logScore: SubScore = null;
  if (logs.length > 0) {
    const latest = logs[logs.length - 1].value as SleepValue;
    const hoursScore = hoursToScore(latest.hours);
    const qualityScore =
      typeof latest.quality === "number" ? qualityToScore(latest.quality) : null;
    logScore =
      qualityScore == null
        ? hoursScore
        : clamp01_100(Math.round(hoursScore * 0.75 + qualityScore * 0.25));
  }
  const hydScore = hyd.length > 0 ? 75 : null;
  return weightedAvg([
    { v: logScore, w: 0.8 },
    { v: hydScore, w: 0.2 },
  ]);
}

function moodSubscore(
  inputs: ScoreInput[],
  reasons: DailyScoreResult["reasons"],
): SubScore {
  // Mood = check-ins (40%) + journals (30%) + food (15%) + workouts (15%)
  const checkIns = inputs.filter((i) => i.source === "check_in");
  const journals = inputs.filter((i) => i.source === "journal");
  const food = inputs.filter((i) => i.source === "food_log");
  const workouts = inputs.filter((i) => i.source === "workout");
  if (checkIns.length + journals.length + food.length + workouts.length === 0) {
    reasons.mood = "No check-in, journal, food log, or workout yet today.";
    return null;
  }
  const ciScore = checkIns.length
    ? avg(checkIns.map((c) => moodToScore((c.value as CheckInValue).mood ?? 3)))
    : null;
  const jScore = journals.length
    ? avg(
        journals.map((j) =>
          sentimentToScore((j.value as JournalValue).sentiment ?? 0),
        ),
      )
    : null;
  // Food logs contribute ~70 mood (self-care signal), modest stacking bonus.
  const fScore = food.length
    ? clamp01_100(70 + Math.min(food.length - 1, 2) * 4)
    : null;
  // Workouts contribute ~75 mood (exercise → mood lift is well-documented).
  const wScore = workouts.length
    ? clamp01_100(75 + Math.min(workouts.length - 1, 1) * 4)
    : null;
  return weightedAvg([
    { v: ciScore, w: 0.4 },
    { v: jScore, w: 0.3 },
    { v: fScore, w: 0.15 },
    { v: wScore, w: 0.15 },
  ]);
}

// ─────────────────────────────────────────────────────────────────────
// Mapping helpers (all return 0–100 numbers, never NaN)
// ─────────────────────────────────────────────────────────────────────

// Self-reported mood on a 1–5 scale → 0–100. 1 → 10, 3 → 60, 5 → 95.
function moodToScore(m: number): number {
  if (!Number.isFinite(m)) return 50;
  const clamped = Math.max(1, Math.min(5, m));
  // 1=10, 2=35, 3=60, 4=80, 5=95
  return clamp01_100(Math.round(10 + (clamped - 1) * 21.25));
}

// Journal sentiment on a -1..+1 scale → 0–100. -1=10, 0=55, +1=95.
function sentimentToScore(s: number): number {
  if (!Number.isFinite(s)) return 50;
  const clamped = Math.max(-1, Math.min(1, s));
  return clamp01_100(Math.round(55 + clamped * 40));
}

// Sleep quality 1–5 → 0–100 (same curve as mood).
function qualityToScore(q: number): number {
  return moodToScore(q);
}

// Sleep-hours saturating curve. Documented in this module's header.
//   ≤0  →   0
//   4h  →  40
//   5h  →  55
//   6h  →  75
//   7h  →  90
//   8h  → 100
//   9h+ →  95   (oversleep also signals something off)
function hoursToScore(h: number): number {
  if (!Number.isFinite(h) || h <= 0) return 0;
  if (h >= 9) return 95;
  // Piecewise linear breakpoints.
  const points: Array<[number, number]> = [
    [0, 0],
    [4, 40],
    [5, 55],
    [6, 75],
    [7, 90],
    [8, 100],
    [9, 95],
  ];
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    if (h >= x0 && h <= x1) {
      const t = (h - x0) / (x1 - x0);
      return clamp01_100(Math.round(y0 + t * (y1 - y0)));
    }
  }
  return 100;
}

// ─────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────

function clamp01_100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function avg(ns: number[]): number {
  if (ns.length === 0) return 0;
  return ns.reduce((s, n) => s + n, 0) / ns.length;
}

function weightedAvg(
  parts: Array<{ v: number | null; w: number }>,
): SubScore {
  const present = parts.filter(
    (p): p is { v: number; w: number } => p.v != null,
  );
  if (present.length === 0) return null;
  const totalW = present.reduce((s, p) => s + p.w, 0);
  return clamp01_100(
    Math.round(
      present.reduce((s, p) => s + p.v * (p.w / totalW), 0),
    ),
  );
}
