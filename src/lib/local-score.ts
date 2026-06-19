// Local-only score store — lets the app feel "real" before the Worker is
// deployed. Stores score inputs in localStorage, computes the score in the
// browser using the same formula the Worker uses (CLAUDE.md v2 §5).
//
// When the Worker is live, /home + /check-in prefer the API. This module
// is a graceful fallback so users see their own data flowing locally even
// in dev / offline / first-launch states.

const STORAGE_KEY = "kai_local_inputs_v1";

export type LocalSource =
  | "check_in"
  | "journal"
  | "food_log"
  | "workout"
  | "sleep_log"
  | "goal_progress"
  | "energy_check_in"
  // Fires once per day when the user crosses their hydration target.
  // Hydration glasses on their own don't earn XP — only hitting the
  // goal for that day does. This keeps the incentive on the daily win
  // rather than spamming the + button.
  | "hydration_goal_hit";

export type LocalInput = {
  id: string;
  date: string;             // YYYY-MM-DD
  source: LocalSource;
  value: unknown;
  createdAt: string;        // ISO timestamp
};

export type LocalScore = {
  mental: number | null;
  sleep: number | null;
  mood: number | null;
  final: number | null;
  band: "low" | "mid" | "high" | null;
  streak: number;
};

// ─────────────────────────────────────────────────────────────────────
// Reads / writes
// ─────────────────────────────────────────────────────────────────────

export function readLocalInputs(): LocalInput[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LocalInput[]) : [];
  } catch {
    return [];
  }
}

/** Days since the user's most recent logged activity of ANY kind. Returns
 *  null when they've never logged anything (so we don't show a brand-new user
 *  a "welcome back" comeback screen). Returns 0 when they logged today. */
export function daysSinceAnyActivity(now: Date = new Date()): number | null {
  const inputs = readLocalInputs();
  if (inputs.length === 0) return null;
  let latest = inputs[0].date;
  for (const i of inputs) {
    if (i.date > latest) latest = i.date;
  }
  const latestMs = new Date(latest).getTime();
  const todayMs = new Date(now.toISOString().slice(0, 10)).getTime();
  return Math.max(0, Math.floor((todayMs - latestMs) / (24 * 60 * 60 * 1000)));
}

/** Test helper — wipe all logged inputs. Also useful from dev tools. */
export function clearLocalInputs(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function appendLocalInput(input: Omit<LocalInput, "id" | "createdAt">): LocalInput {
  const all = readLocalInputs();
  const next: LocalInput = {
    ...input,
    id: `li_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    createdAt: new Date().toISOString(),
  };
  all.push(next);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* quota / unavailable — fine */
  }
  // Broadcast for the +XP toast. The toast lives in AppShell and
  // listens for this event. Decoupled from every individual call site
  // so adding a new input type doesn't require touching the toast UI.
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("kai:input-appended", { detail: { source: next.source } }),
    );
  }
  return next;
}

// ─────────────────────────────────────────────────────────────────────
// Score calculation (mirrors workers/src/lib/score-calculator.ts)
// Kept in sync via the v2 §5 formula. If the worker version changes,
// update both.
// ─────────────────────────────────────────────────────────────────────

export function computeLocalScore(inputs: LocalInput[]): LocalScore {
  return computeLocalScoreFor(inputs, new Date().toISOString().slice(0, 10));
}

/** Same as computeLocalScore but for any specific date — used by the
 *  Progress page to build a 7-day series. */
export function computeLocalScoreFor(
  inputs: LocalInput[],
  date: string,
): LocalScore {
  const dayInputs = inputs.filter((i) => i.date === date);
  // Only TODAY gets live hydration partial credit (every glass nudges
  // the sleep score). Historical days only get hydration credit if a
  // hydration_goal_hit was actually logged that day. Without this
  // guard, today's water progress bleeds backwards into every prior
  // day on the Progress chart (was showing fake 90/100 sleep all week).
  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;

  const mental = mentalSubscore(dayInputs);
  const sleep = sleepSubscore(dayInputs, isToday);
  const mood = moodSubscore(dayInputs, isToday);

  const present = [
    { v: mental, w: 0.4 },
    { v: sleep, w: 0.3 },
    { v: mood, w: 0.3 },
  ].filter((p): p is { v: number; w: number } => p.v != null);

  let final: number | null = null;
  if (present.length > 0) {
    const totalW = present.reduce((s, p) => s + p.w, 0);
    final = clamp(
      Math.round(
        present.reduce((s, p) => s + p.v * (p.w / totalW), 0),
      ),
    );
  }

  const band: LocalScore["band"] =
    final == null
      ? null
      : final <= 40
        ? "low"
        : final <= 70
          ? "mid"
          : "high";

  return { mental, sleep, mood, final, band, streak: computeStreak(inputs) };
}

function mentalSubscore(inputs: LocalInput[]): number | null {
  // Mental = check-ins (35%) + journals (25%) + goal progress (15%)
  //        + workouts (15%) + energy check-in (10%)
  // Rationale: exercise → mental energy is well-documented; the
  // self-reported energy check-in IS literally a mental-state signal.
  const ci = inputs.filter((i) => i.source === "check_in");
  const j = inputs.filter((i) => i.source === "journal");
  const g = inputs.filter((i) => i.source === "goal_progress");
  const w = inputs.filter((i) => i.source === "workout");
  const e = inputs.filter((i) => i.source === "energy_check_in");
  if (ci.length + j.length + g.length + w.length + e.length === 0) return null;
  const ciScore = ci.length
    ? avg(
        ci.map((c) =>
          moodToScore((c.value as { mood?: number }).mood ?? 3),
        ),
      )
    : null;
  const jScore = j.length
    ? avg(
        j.map((x) =>
          sentimentToScore(
            (x.value as { sentiment?: number }).sentiment ?? 0,
          ),
        ),
      )
    : null;
  const gScore = g.length ? clamp(80 + Math.min(g.length - 1, 3) * 5) : null;
  // Workouts each contribute ~85 mental, capped after 2/day to keep a
  // single grinding day from spiking the bar artificially.
  const wScore = w.length ? clamp(80 + Math.min(w.length - 1, 1) * 5) : null;
  // Energy check-in maps 1-5 → 0-100 the same way mood does.
  const eScore = e.length
    ? avg(
        e.map((x) =>
          moodToScore((x.value as { energy?: number }).energy ?? 3),
        ),
      )
    : null;
  return weighted([
    { v: ciScore, w: 0.35 },
    { v: jScore, w: 0.25 },
    { v: gScore, w: 0.15 },
    { v: wScore, w: 0.15 },
    { v: eScore, w: 0.1 },
  ]);
}

function sleepSubscore(inputs: LocalInput[], _isToday: boolean): number | null {
  // Sleep = sleep_log only. Sleep is literally about how much you slept.
  // (Hydration moved to mood — see moodSubscore.)
  const logs = inputs.filter((i) => i.source === "sleep_log");
  if (logs.length === 0) return null;
  const latest = logs[logs.length - 1].value as {
    hours: number;
    quality?: number;
  };
  const hScore = hoursToScore(latest.hours);
  if (typeof latest.quality === "number") {
    return clamp(Math.round(hScore * 0.75 + moodToScore(latest.quality) * 0.25));
  }
  return hScore;
}

/** Reads today's hydration progress fraction (0..1) from the hydration
 *  store, or null if hydration storage is unavailable / unreadable.
 *  Used by sleepSubscore so every glass moves the score (not just
 *  hitting the goal). */
function readTodayHydrationProgress(): number | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem("kai_hydration_v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Array<{
      date: string;
      glasses: number;
      target: number;
    }>;
    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = parsed.find((e) => e.date === today);
    if (!todayEntry || todayEntry.target <= 0) return null;
    return Math.max(0, Math.min(1, todayEntry.glasses / todayEntry.target));
  } catch {
    return null;
  }
}

function moodSubscore(inputs: LocalInput[], isToday: boolean): number | null {
  // Mood = check-ins (35%) + journals (25%) + food (15%) + workouts (10%)
  //      + hydration (15%)
  // Rationale: regular eating, movement, AND hydration all lift mood —
  // dehydration causes irritability/brain fog. Mood is the right home
  // for hydration ("I drank water, I feel less crappy") — not sleep.
  const ci = inputs.filter((i) => i.source === "check_in");
  const j = inputs.filter((i) => i.source === "journal");
  const f = inputs.filter((i) => i.source === "food_log");
  const w = inputs.filter((i) => i.source === "workout");
  const hydProgress = isToday ? readTodayHydrationProgress() : null;
  if (ci.length + j.length + f.length + w.length === 0 && hydProgress == null)
    return null;
  const ciScore = ci.length
    ? avg(
        ci.map((c) =>
          moodToScore((c.value as { mood?: number }).mood ?? 3),
        ),
      )
    : null;
  const jScore = j.length
    ? avg(
        j.map((x) =>
          sentimentToScore(
            (x.value as { sentiment?: number }).sentiment ?? 0,
          ),
        ),
      )
    : null;
  // Food log contribution: ~70 baseline (eating regularly = self-care);
  // more logs in a day don't pile up beyond a small bonus.
  const fScore = f.length ? clamp(70 + Math.min(f.length - 1, 2) * 4) : null;
  // Workouts contribute ~75 to mood (exercise → mood is well-documented).
  const wScore = w.length ? clamp(75 + Math.min(w.length - 1, 1) * 4) : null;
  // Hydration → mood: 0% goal → 0, 100% goal → 90. Linear.
  const hydScore =
    hydProgress == null ? null : clamp(Math.round(hydProgress * 90));
  return weighted([
    { v: ciScore, w: 0.35 },
    { v: jScore, w: 0.25 },
    { v: fScore, w: 0.15 },
    { v: wScore, w: 0.1 },
    { v: hydScore, w: 0.15 },
  ]);
}

function computeStreak(inputs: LocalInput[]): number {
  // Days (YYYY-MM-DD) where the user logged at least one input. Counts
  // consecutive days back from today.
  const dates = new Set(inputs.map((i) => i.date));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 60; i += 1) {
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) streak += 1;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// helpers
function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
function avg(ns: number[]): number {
  return ns.length === 0 ? 0 : ns.reduce((s, n) => s + n, 0) / ns.length;
}
function weighted(
  parts: Array<{ v: number | null; w: number }>,
): number | null {
  const present = parts.filter(
    (p): p is { v: number; w: number } => p.v != null,
  );
  if (present.length === 0) return null;
  const totalW = present.reduce((s, p) => s + p.w, 0);
  return clamp(
    Math.round(present.reduce((s, p) => s + p.v * (p.w / totalW), 0)),
  );
}
function moodToScore(m: number): number {
  if (!Number.isFinite(m)) return 50;
  return clamp(10 + (Math.max(1, Math.min(5, m)) - 1) * 21.25);
}
function sentimentToScore(s: number): number {
  if (!Number.isFinite(s)) return 50;
  return clamp(55 + Math.max(-1, Math.min(1, s)) * 40);
}
function hoursToScore(h: number): number {
  if (!Number.isFinite(h) || h <= 0) return 0;
  if (h >= 9) return 95;
  const pts: Array<[number, number]> = [
    [0, 0], [4, 40], [5, 55], [6, 75], [7, 90], [8, 100], [9, 95],
  ];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (h >= x0 && h <= x1) {
      const t = (h - x0) / (x1 - x0);
      return clamp(y0 + t * (y1 - y0));
    }
  }
  return 100;
}

// ─────────────────────────────────────────────────────────────────────
// Smart-ish fallback reflections, keyed off mood
// ─────────────────────────────────────────────────────────────────────

export function offlineReflection(
  mood: number,
  mind: string,
  better: string,
): string {
  const m = Math.max(1, Math.min(5, mood));
  if (m === 1) {
    if (mind) {
      return `That's a lot to be carrying. Don't try to fix it all today — just name one thing you can put down for an hour. ${
        better ? `If "${shorten(better)}" is in reach, that's a real anchor.` : ""
      }`.trim();
    }
    return "Hard day. You don't owe anyone a fix right now — just notice what you need most, even if it's smaller than you'd admit out loud.";
  }
  if (m === 2) {
    return `Off-day energy is information, not a verdict. ${
      mind ? `What you described — that's worth coming back to when you have more space.` : "What's one small thing you'd want different by tonight?"
    }`;
  }
  if (m === 3) {
    return `Okay is honest, and honest is a fine place to be. ${
      better
        ? `"${shorten(better)}" is a clean next move — let's see how it lands.`
        : "If it stays okay all day, that's also fine."
    }`;
  }
  if (m === 4) {
    return `Pretty good is real. Notice what's working today so you can find it again tomorrow. ${
      mind ? `Sounds like you've got some clarity on what's going on.` : ""
    }`.trim();
  }
  return `Love that. Days like this deserve to be marked — and the move is just to enjoy it. ${
    better ? `If "${shorten(better)}" happens too, that's icing.` : ""
  }`.trim();
}

function shorten(s: string, max = 60): string {
  if (s.length <= max) return s;
  return s.slice(0, max).trimEnd() + "…";
}
