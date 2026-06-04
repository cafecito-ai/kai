// North Star goal + goal-aligned moves (client design, 2026-06-04).
//
// THE big goal shown next to the Daily Score. Its ring fills ONLY from actions
// that actually move you toward THIS goal — concrete "moves" KAI generates for
// the specific goal — not from generic logging (water, sleep). Progress is
// earned by goal-aligned action; the alignment is guaranteed because the moves
// are generated for that exact goal. (Per client: "progress is only earned when
// your daily actions have a clear connection to the larger goal.")

const GOAL_KEY = "kai_northstar_v1";
const MOVES_KEY = "kai_northstar_moves_v1";
const PROGRESS_KEY = "kai_northstar_progress_v1";

// Completed goal-aligned moves to fill the ring — a weeks-to-months arc.
export const NORTH_STAR_TARGET_MOVES = 30;

export type NorthStar = {
  goal: string;
  source: "derived" | "custom";
  createdAt: string;
};

export type GoalMoves = {
  goal: string;
  date: string; // YYYY-MM-DD the moves were generated for
  moves: string[];
  done: number[]; // indices completed today
};

// Focus area → a long-term goal phrased as something to become / build.
const GOAL_BY_FOCUS: Record<string, string> = {
  getting_stronger: "Get genuinely stronger",
  eating_better: "Build eating habits that actually last",
  better_sleep: "Fix my sleep for good",
  energy: "Have real energy every day",
  body_image: "Feel at home in my body",
  confidence: "Build real, steady confidence",
  anxiety: "Get a handle on my anxiety",
  managing_stress: "Keep stress from running me",
  mood: "Feel steadier day to day",
  mental_clarity: "Think clearer, feel lighter",
  motivation: "Find drive that sticks",
  focus: "Lock in my focus",
  finding_purpose: "Figure out what I'm really about",
  school_pressure: "Stay on top of school without burning out",
  social_life: "Build a social life that fills me up",
  friendships: "Grow friendships that matter",
  family_stuff: "Find more peace at home",
};

const FOCUS_PRIORITY: string[] = [
  "getting_stronger", "finding_purpose", "confidence", "school_pressure",
  "anxiety", "better_sleep", "eating_better", "energy", "friendships",
  "social_life", "motivation", "focus", "mood", "managing_stress",
  "mental_clarity", "body_image", "family_stuff",
];

export function deriveNorthStar(focusAreas: string[]): string {
  for (const id of FOCUS_PRIORITY) {
    if (focusAreas.includes(id) && GOAL_BY_FOCUS[id]) return GOAL_BY_FOCUS[id];
  }
  for (const id of focusAreas) if (GOAL_BY_FOCUS[id]) return GOAL_BY_FOCUS[id];
  return "Become who I'm working toward";
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function read<T>(key: string): T | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("kai:state-changed"));
  } catch {
    /* ignore */
  }
}

// ── Goal ────────────────────────────────────────────────────────────

export function getNorthStar(): NorthStar | null {
  const parsed = read<Partial<NorthStar>>(GOAL_KEY);
  if (!parsed || typeof parsed.goal !== "string" || !parsed.goal.trim()) return null;
  return {
    goal: parsed.goal.trim().slice(0, 80),
    source: parsed.source === "custom" ? "custom" : "derived",
    createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
  };
}

export function setNorthStar(goal: string, source: NorthStar["source"]): void {
  const clean = goal.trim().slice(0, 80);
  if (!clean) return;
  const prev = getNorthStar();
  write(GOAL_KEY, { goal: clean, source, createdAt: new Date().toISOString() });
  // Changing the goal starts a fresh journey — clear moves + progress so the
  // ring reflects progress toward THIS goal, not the old one.
  if (!prev || prev.goal !== clean) {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(MOVES_KEY);
        localStorage.removeItem(PROGRESS_KEY);
      } catch {
        /* ignore */
      }
    }
  }
}

export function seedNorthStarFromFocus(focusAreas: string[]): void {
  const existing = getNorthStar();
  if (existing && existing.source === "custom") return;
  setNorthStar(deriveNorthStar(focusAreas), "derived");
}

// ── Moves ───────────────────────────────────────────────────────────

/** Today's goal-aligned moves, if they exist for the current goal + date. */
export function getMovesForToday(): GoalMoves | null {
  const ns = getNorthStar();
  if (!ns) return null;
  const stored = read<GoalMoves>(MOVES_KEY);
  if (!stored || stored.goal !== ns.goal || stored.date !== todayKey()) return null;
  if (!Array.isArray(stored.moves) || stored.moves.length === 0) return null;
  return { ...stored, done: Array.isArray(stored.done) ? stored.done : [] };
}

/** Store a freshly generated set of moves for today's goal. */
export function setMovesForToday(moves: string[]): void {
  const ns = getNorthStar();
  if (!ns) return;
  const clean = moves.map((m) => m.trim().slice(0, 80)).filter(Boolean).slice(0, 3);
  if (clean.length === 0) return;
  write(MOVES_KEY, { goal: ns.goal, date: todayKey(), moves: clean, done: [] });
}

/** Mark a move done (once). Increments cumulative progress toward this goal. */
export function completeMove(index: number): void {
  const stored = getMovesForToday();
  if (!stored) return;
  if (stored.done.includes(index)) return;
  const done = [...stored.done, index];
  write(MOVES_KEY, { goal: stored.goal, date: stored.date, moves: stored.moves, done });
  // Cumulative count toward this goal (only grows; resets when the goal changes).
  const prog = read<{ goal: string; count: number }>(PROGRESS_KEY);
  const count = prog && prog.goal === stored.goal ? prog.count + 1 : 1;
  write(PROGRESS_KEY, { goal: stored.goal, count });
}

// ── Progress ────────────────────────────────────────────────────────

/** Ring fill 0–100, earned ONLY from completed goal-aligned moves. */
export function northStarProgress(): { pct: number; count: number; target: number } {
  const ns = getNorthStar();
  const prog = read<{ goal: string; count: number }>(PROGRESS_KEY);
  const count = ns && prog && prog.goal === ns.goal ? Math.max(0, prog.count) : 0;
  const pct = Math.max(0, Math.min(100, Math.round((count / NORTH_STAR_TARGET_MOVES) * 100)));
  return { pct, count, target: NORTH_STAR_TARGET_MOVES };
}
