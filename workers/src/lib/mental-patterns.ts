// Mental Health pattern recognition (T-021).
//
// Pure detector that turns a window of score_inputs into a small set of
// abstracted observation strings that get injected into the Mind agent's
// system prompt as `recentPatterns`.
//
// HARD GUARDRAIL from CLAUDE.md / AGENT_PLAN T-021:
//   "Patterns never include specific journal content in summary; only
//    abstracted observations."
//
// So patterns look like:
//   "mood trending up over the last 4 days"
//   "sleep dipped below 6 hours for 3 nights in a row"
//   "journaling consistently this week"
//
// NOT like:
//   "you wrote about a fight with Sarah"
//   "your math test note mentioned anxiety"
//
// The detector takes the last 14 days of score_inputs (already abstracted —
// just mood numbers, sleep hours, journal sentiment scalars, no text). The
// caller is responsible for never passing raw journal `note` text in.

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

/** One day's worth of derived signals. The detector works on these — never
 *  on raw text. The pattern engine is the only place that loops over
 *  multi-day data, so it's the one place where journal *content* would be
 *  visible. Excluding it at this boundary is the guardrail. */
export type DaySignal = {
  /** YYYY-MM-DD, user-local date. */
  date: string;
  /** Self-reported mood 1–5 from check-ins, averaged if multiple. null if no check-in. */
  mood: number | null;
  /** Sleep hours from sleep_log. null if no sleep log that day. */
  sleepHours: number | null;
  /** Journal sentiment scalar -1..+1, averaged if multiple. null if no journal. */
  journalSentiment: number | null;
  /** How many journal entries that day. */
  journalCount: number;
  /** Final daily score 0–100 if computed, null otherwise. */
  finalScore: number | null;
};

/** A single abstracted observation. One sentence, no specifics, ≤ ~80 chars. */
export type Pattern = string;

// ─────────────────────────────────────────────────────────────────────
// Public entrypoint
// ─────────────────────────────────────────────────────────────────────

/**
 * Detect patterns from the last 14 days of day signals.
 *
 * Returns at most ~5 strings — we don't want to spam the agent context.
 * Each string is safe to drop directly into the Mind prompt.
 *
 * `today` lets tests pin "now"; defaults to current date.
 */
export function detectPatterns(
  days: DaySignal[],
  today: Date = new Date(),
): Pattern[] {
  // Sort oldest → newest so windowed checks make sense.
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  // Trim to last 14 days (defensive — caller should already do this).
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recent = sorted.filter((d) => d.date >= cutoffStr);

  const out: Pattern[] = [];

  pushIfPresent(out, detectMoodTrend(recent));
  pushIfPresent(out, detectMoodSwing(recent));
  pushIfPresent(out, detectSleepStreak(recent));
  pushIfPresent(out, detectSleepInconsistency(recent));
  pushIfPresent(out, detectJournalingHabit(recent));
  pushIfPresent(out, detectScoreLift(recent));

  // Cap at 5 to keep the prompt focused.
  return out.slice(0, 5);
}

function pushIfPresent(out: Pattern[], p: Pattern | null) {
  if (p) out.push(p);
}

// ─────────────────────────────────────────────────────────────────────
// Individual detectors
// ─────────────────────────────────────────────────────────────────────

/** 3+ consecutive days where mood moves monotonically up or down. */
function detectMoodTrend(days: DaySignal[]): Pattern | null {
  const moodDays = days.filter(
    (d): d is DaySignal & { mood: number } => d.mood != null,
  );
  if (moodDays.length < 3) return null;

  // Look at the LAST run of monotonic change.
  let run = 1;
  let direction: "up" | "down" | null = null;
  for (let i = moodDays.length - 1; i > 0; i--) {
    const cur = moodDays[i].mood;
    const prev = moodDays[i - 1].mood;
    if (cur > prev) {
      if (direction === "down") break;
      direction = "up";
      run += 1;
    } else if (cur < prev) {
      if (direction === "up") break;
      direction = "down";
      run += 1;
    } else {
      break; // flat ends the run
    }
  }

  if (run < 3 || direction === null) return null;

  return direction === "up"
    ? `mood has been trending up for ${run} days`
    : `mood has been trending down for ${run} days`;
}

/** Big absolute change in mood over a 5-day window (≥1.5 points on the 1–5 scale,
 *  which is roughly 30+ points on a 0–100 normalised scale). */
function detectMoodSwing(days: DaySignal[]): Pattern | null {
  const moodDays = days.filter(
    (d): d is DaySignal & { mood: number } => d.mood != null,
  );
  if (moodDays.length < 5) return null;

  // Compare the latest 2 days' average to the 2 days at the start of the
  // window (5 days back). Averages smooth single-day noise.
  const recent = moodDays.slice(-2);
  const past = moodDays.slice(-5, -3);
  if (recent.length < 2 || past.length < 2) return null;

  const recentAvg = avg(recent.map((d) => d.mood));
  const pastAvg = avg(past.map((d) => d.mood));
  const delta = recentAvg - pastAvg;

  if (delta >= 1.5) return "mood has lifted noticeably over the last 5 days";
  if (delta <= -1.5) return "mood has dipped noticeably over the last 5 days";
  return null;
}

/** 3+ consecutive nights with sleep below 6 hours (a red flag at any age,
 *  especially for teens). */
function detectSleepStreak(days: DaySignal[]): Pattern | null {
  const sleepDays = days.filter(
    (d): d is DaySignal & { sleepHours: number } => d.sleepHours != null,
  );
  if (sleepDays.length < 3) return null;

  // Count trailing run of <6h.
  let run = 0;
  for (let i = sleepDays.length - 1; i >= 0; i--) {
    if (sleepDays[i].sleepHours < 6) run += 1;
    else break;
  }
  if (run >= 3) {
    return `sleep has been under 6 hours for ${run} nights in a row`;
  }

  // Also flag 5+ short nights in the last 7 days, even if not consecutive.
  const last7 = sleepDays.slice(-7);
  const shortNights = last7.filter((d) => d.sleepHours < 6).length;
  if (last7.length >= 5 && shortNights >= 5) {
    return "sleep has been short most nights this past week";
  }

  return null;
}

/** High variance in sleep timing over the last 7 days (>2.5h std deviation). */
function detectSleepInconsistency(days: DaySignal[]): Pattern | null {
  const sleepDays = days
    .filter(
      (d): d is DaySignal & { sleepHours: number } => d.sleepHours != null,
    )
    .slice(-7);
  if (sleepDays.length < 5) return null;

  const hours = sleepDays.map((d) => d.sleepHours);
  const mean = avg(hours);
  const variance =
    hours.reduce((acc, h) => acc + (h - mean) ** 2, 0) / hours.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev > 2.5) {
    return "sleep schedule has been all over the place this past week";
  }
  return null;
}

/** Journaling 4+ of the last 7 days = an emerging habit worth noting (positively). */
function detectJournalingHabit(days: DaySignal[]): Pattern | null {
  const last7 = days.slice(-7);
  if (last7.length === 0) return null;
  const journalingDays = last7.filter((d) => d.journalCount > 0).length;

  if (journalingDays >= 6) {
    return "journaling nearly every day this past week";
  }
  if (journalingDays >= 4) {
    return "journaling has been consistent this past week";
  }

  // The opposite: was journaling a habit, then dropped off?
  const olderWeek = days.slice(-14, -7);
  const olderJournalDays = olderWeek.filter((d) => d.journalCount > 0).length;
  if (olderJournalDays >= 4 && journalingDays <= 1) {
    return "journaling habit has dropped off this past week";
  }

  return null;
}

/** Overall daily score lifted by 10+ points week-over-week. */
function detectScoreLift(days: DaySignal[]): Pattern | null {
  const scoreDays = days.filter(
    (d): d is DaySignal & { finalScore: number } => d.finalScore != null,
  );
  if (scoreDays.length < 8) return null;

  const last7 = scoreDays.slice(-7);
  const prev7 = scoreDays.slice(-14, -7);
  if (last7.length < 4 || prev7.length < 4) return null;

  const lastAvg = avg(last7.map((d) => d.finalScore));
  const prevAvg = avg(prev7.map((d) => d.finalScore));
  const delta = lastAvg - prevAvg;

  if (delta >= 10) {
    return "overall daily score has lifted week-over-week";
  }
  if (delta <= -10) {
    return "overall daily score has dipped week-over-week";
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─────────────────────────────────────────────────────────────────────
// Aggregator — turn raw score_inputs rows into DaySignal[]
// ─────────────────────────────────────────────────────────────────────

/** Shape that matches score_inputs.value after JSON.parse, loose by design. */
type AnyValue = Record<string, unknown> | null;

export type RawInput = {
  date: string; // YYYY-MM-DD
  source: string;
  value: AnyValue;
};

/** Optional per-day score rows (joined from daily_scores) so the detector
 *  can read finalScore without recomputing. */
export type ScoreRow = {
  date: string;
  final: number | null;
};

/**
 * Aggregate raw inputs + daily_scores rows into one DaySignal per day in
 * the window. Days with no inputs are NOT included — the detectors don't
 * need filler rows.
 */
export function aggregateDaySignals(
  inputs: RawInput[],
  scoreRows: ScoreRow[] = [],
): DaySignal[] {
  const byDate = new Map<string, DaySignal>();

  function bucket(date: string): DaySignal {
    let d = byDate.get(date);
    if (!d) {
      d = {
        date,
        mood: null,
        sleepHours: null,
        journalSentiment: null,
        journalCount: 0,
        finalScore: null,
      };
      byDate.set(date, d);
    }
    return d;
  }

  // Track running averages for sources where we expect multiple entries.
  const moodAccum = new Map<string, number[]>();
  const sleepAccum = new Map<string, number[]>();
  const sentimentAccum = new Map<string, number[]>();

  for (const row of inputs) {
    const d = bucket(row.date);
    const v = (row.value ?? {}) as Record<string, unknown>;

    if (row.source === "check_in" && typeof v.mood === "number") {
      const arr = moodAccum.get(row.date) ?? [];
      arr.push(v.mood);
      moodAccum.set(row.date, arr);
    } else if (row.source === "sleep_log" && typeof v.hours === "number") {
      const arr = sleepAccum.get(row.date) ?? [];
      arr.push(v.hours);
      sleepAccum.set(row.date, arr);
    } else if (row.source === "journal") {
      d.journalCount += 1;
      if (typeof v.sentiment === "number") {
        const arr = sentimentAccum.get(row.date) ?? [];
        arr.push(v.sentiment);
        sentimentAccum.set(row.date, arr);
      }
    }
  }

  for (const [date, arr] of moodAccum) bucket(date).mood = avg(arr);
  for (const [date, arr] of sleepAccum) bucket(date).sleepHours = avg(arr);
  for (const [date, arr] of sentimentAccum)
    bucket(date).journalSentiment = avg(arr);

  for (const row of scoreRows) {
    bucket(row.date).finalScore = row.final;
  }

  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
