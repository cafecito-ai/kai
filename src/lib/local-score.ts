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
  | "energy_check_in";

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
  return next;
}

// ─────────────────────────────────────────────────────────────────────
// Score calculation (mirrors workers/src/lib/score-calculator.ts)
// Kept in sync via the v2 §5 formula. If the worker version changes,
// update both.
// ─────────────────────────────────────────────────────────────────────

export function computeLocalScore(inputs: LocalInput[]): LocalScore {
  const today = new Date().toISOString().slice(0, 10);
  const todays = inputs.filter((i) => i.date === today);

  const mental = mentalSubscore(todays);
  const sleep = sleepSubscore(todays);
  const mood = moodSubscore(todays);

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
  const ci = inputs.filter((i) => i.source === "check_in");
  const j = inputs.filter((i) => i.source === "journal");
  const g = inputs.filter((i) => i.source === "goal_progress");
  if (ci.length + j.length + g.length === 0) return null;
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
  return weighted([
    { v: ciScore, w: 0.4 },
    { v: jScore, w: 0.3 },
    { v: gScore, w: 0.3 },
  ]);
}

function sleepSubscore(inputs: LocalInput[]): number | null {
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

function moodSubscore(inputs: LocalInput[]): number | null {
  const ci = inputs.filter((i) => i.source === "check_in");
  const j = inputs.filter((i) => i.source === "journal");
  if (ci.length + j.length === 0) return null;
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
  return weighted([
    { v: ciScore, w: 0.6 },
    { v: jScore, w: 0.4 },
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
