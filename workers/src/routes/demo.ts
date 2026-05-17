import { Hono } from "hono";
import { callClaude } from "../lib/claude";
import { classifySafetyFull } from "../lib/safety";
import type { AppVariables, Env } from "../types";

const DEMO_MAX_TURNS = 6;
const DEMO_MAX_MESSAGE_CHARS = 600;
const DEMO_ALLOWED_VIBES = new Set([
  "tired","hyped","stuck","curious","hungry","locked-in","anxious","bored",
  "funny","quiet","plotting","moving","wired","slow","fired-up","numb"
]);

const VALID_UI = new Set(["Calm Coach", "Quest Mode", "Lifestyle Feed"]);
const VALID_HABIT = new Set(["Food Camera", "Emotional Check-in", "Streaks + Belts", "Home-screen Character"]);
const VALID_ONBOARDING = new Set(["Fast Start", "Personality Setup", "Goal Setup"]);
const VALID_PARENT = new Set(["Safety-only", "Weekly Summary", "Shared Wins"]);

type DemoChoices = {
  ui: string;
  habit: string;
  onboarding: string;
  parent: string;
};

type DemoFeedbackMeta = {
  stepId: string | null;
  stepIndex: number | null;
  source: "auto" | "manual";
};

export const demoRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

demoRoutes.post("/demo-feedback", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = parseDemoFeedback(body);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);

  const id = crypto.randomUUID();
  await ensureDemoFeedbackTable(c.env.DB);
  await c.env.DB.prepare(
    `INSERT INTO demo_feedback (id, user_id, session_id, choices_json, summary, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      null,
      parsed.sessionId,
      JSON.stringify({ ...parsed.choices, meta: parsed.meta }),
      parsed.summary,
      c.req.header("user-agent") ?? null
    )
    .run();

  return c.json({ ok: true, id });
});

// Live Kai chat for the public /demo flow. No auth, no DB writes, no history persisted.
// Hard cap of 6 turns. Safety classifier always runs first.
demoRoutes.post("/demo-kai", async (c) => {
  const body = await c.req.json().catch(() => null) as null | {
    message?: unknown;
    history?: unknown;
    vibes?: unknown;
    kaiName?: unknown;
    kaiTone?: unknown;
    firstName?: unknown;
  };
  if (!body) return c.json({ error: "Invalid payload" }, 400);

  const message = typeof body.message === "string" ? body.message.trim().slice(0, DEMO_MAX_MESSAGE_CHARS) : "";
  if (!message) return c.json({ error: "Missing message" }, 400);

  // History clamp — last 5 exchanges max, both roles
  const rawHistory = Array.isArray(body.history) ? body.history : [];
  const history = rawHistory
    .filter((m): m is { role: string; content: string } =>
      !!m && typeof m === "object" &&
      ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant") &&
      typeof (m as { content?: unknown }).content === "string"
    )
    .slice(-DEMO_MAX_TURNS * 2)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, DEMO_MAX_MESSAGE_CHARS) }));

  const userTurns = history.filter((m) => m.role === "user").length;
  if (userTurns >= DEMO_MAX_TURNS) {
    return c.json({
      reply: "Cool — that's where the demo wraps. Sign up to keep going for real.",
      capped: true
    });
  }

  // Safety always runs first
  const safety = await classifySafetyFull(c.env, message);
  if (!safety.safe) {
    return c.json({
      reply: safety.response ?? "Hey. What you're carrying is bigger than this demo. 988 (call or text) is real people, real fast. I'm still right here.",
      safetyEvent: { category: safety.category, severity: safety.severity }
    });
  }

  const vibes = Array.isArray(body.vibes)
    ? body.vibes.filter((v): v is string => typeof v === "string").map((v) => v.toLowerCase().trim()).filter((v) => DEMO_ALLOWED_VIBES.has(v)).slice(0, 4)
    : [];
  const kaiName = typeof body.kaiName === "string" ? body.kaiName.trim().slice(0, 24).replace(/[^A-Za-z0-9 _.-]/g, "") || "Kai" : "Kai";
  const kaiTone = body.kaiTone === "warm" || body.kaiTone === "direct" ? body.kaiTone : "balanced";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 24).replace(/[^A-Za-z0-9 _.-]/g, "") : "";

  const system = buildDemoKaiSystemPrompt({ vibes, kaiName, kaiTone, firstName });
  const reply = (await callClaude(c.env, system, [...history, { role: "user", content: message }])) || "I'm here. What's the smallest next move?";

  return c.json({ reply, turnsRemaining: DEMO_MAX_TURNS - userTurns - 1 });
});

function buildDemoKaiSystemPrompt(opts: { vibes: string[]; kaiName: string; kaiTone: "warm" | "balanced" | "direct"; firstName: string }) {
  const toneLine =
    opts.kaiTone === "warm"
      ? "Lean warm — gentle, reflective, leave room for feeling."
      : opts.kaiTone === "direct"
      ? "Lean direct — short, practical, get to the option fast."
      : "Balanced — ask, reflect, offer one option.";
  const vibesLine = opts.vibes.length ? `They just said their vibe today is: ${opts.vibes.join(", ")}.` : "";
  const nameLine = opts.firstName ? `Their name is ${opts.firstName}.` : "";
  return `You are ${opts.kaiName}, an AI mentor for a teenager. This is a 90-second product DEMO — keep replies under 60 words, no lists.

${nameLine}
${vibesLine}

VOICE
- Warm, real, slightly irreverent. Cool older sibling, not a guidance counselor.
- Short sentences. Active voice. Plain words. No emoji unless they used one first.
- No corporate words ("leverage", "synergy", "journey", "transform").
- Never preachy. Never tell them what they should feel.
- ${toneLine}

NEVER
- Diagnose anything.
- Recommend drugs, supplements, dosages.
- Claim to be human. If asked, say: "I'm an AI named ${opts.kaiName}."
- Agree with self-harm, suicide, eating-disorder behavior, substance abuse, or violence.

DEMO MODE RULES
- Reference their vibes if relevant, naturally — not like a quiz.
- After 2 of their messages, you'll be hit with a final wrap from the UI. Don't force a goodbye yourself.
- If they ask "what is this app" — give a one-sentence honest answer: "A coach you can text when teen life is loud."
- Don't list features. Make one specific observation about what they wrote and one small offer.`;
}

demoRoutes.post("/scope-feedback", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = parseScopeFeedback(body);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);

  const id = crypto.randomUUID();
  await ensureScopeFeedbackTable(c.env.DB);
  await c.env.DB.prepare(
    `INSERT INTO scope_feedback (id, session_id, answers_json, completed_missions, summary, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      parsed.sessionId,
      JSON.stringify(parsed.answers),
      parsed.completedMissions,
      parsed.summary,
      c.req.header("user-agent") ?? null
    )
    .run();

  return c.json({ ok: true, id });
});

export async function ensureDemoFeedbackTable(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS demo_feedback (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        session_id TEXT NOT NULL,
        choices_json TEXT NOT NULL,
        summary TEXT NOT NULL,
        user_agent TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_demo_feedback_created_at ON demo_feedback(created_at)").run();
}

export async function ensureScopeFeedbackTable(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS scope_feedback (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        answers_json TEXT NOT NULL,
        completed_missions INTEGER NOT NULL DEFAULT 0,
        summary TEXT NOT NULL,
        user_agent TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_scope_feedback_created_at ON scope_feedback(created_at)").run();
}

export function parseDemoFeedback(body: unknown):
  | { ok: true; sessionId: string; choices: DemoChoices; summary: string; meta: DemoFeedbackMeta }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid payload" };
  const input = body as Record<string, unknown>;
  const sessionId = cleanText(input.sessionId, 120);
  const summary = cleanText(input.summary, 1000);
  const choices = input.choices;
  if (!sessionId) return { ok: false, error: "Missing sessionId" };
  if (!summary) return { ok: false, error: "Missing summary" };
  if (!choices || typeof choices !== "object") return { ok: false, error: "Missing choices" };

  const rawChoices = choices as Record<string, unknown>;
  const parsedChoices = {
    ui: cleanText(rawChoices.ui, 80),
    habit: cleanText(rawChoices.habit, 80),
    onboarding: cleanText(rawChoices.onboarding, 80),
    parent: cleanText(rawChoices.parent, 80)
  };

  if (!VALID_UI.has(parsedChoices.ui)) return { ok: false, error: "Invalid ui choice" };
  if (!VALID_HABIT.has(parsedChoices.habit)) return { ok: false, error: "Invalid habit choice" };
  if (!VALID_ONBOARDING.has(parsedChoices.onboarding)) return { ok: false, error: "Invalid onboarding choice" };
  if (!VALID_PARENT.has(parsedChoices.parent)) return { ok: false, error: "Invalid parent choice" };

  return {
    ok: true,
    sessionId,
    choices: parsedChoices,
    summary,
    meta: {
      stepId: cleanText(input.stepId, 40) || null,
      stepIndex: typeof input.stepIndex === "number" && Number.isFinite(input.stepIndex) ? Math.max(0, Math.min(20, Math.floor(input.stepIndex))) : null,
      source: input.source === "auto" ? "auto" : "manual"
    }
  };
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function parseScopeFeedback(body: unknown):
  | { ok: true; sessionId: string; answers: Record<string, string>; completedMissions: number; summary: string }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid payload" };
  const input = body as Record<string, unknown>;
  const sessionId = cleanText(input.sessionId, 120);
  const summary = cleanText(input.summary, 1200);
  if (!sessionId) return { ok: false, error: "Missing sessionId" };
  if (!summary) return { ok: false, error: "Missing summary" };
  if (!input.answers || typeof input.answers !== "object") return { ok: false, error: "Missing answers" };

  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.answers as Record<string, unknown>)) {
    const cleanKey = cleanText(key, 80);
    const cleanValue = cleanText(value, 600);
    if (cleanKey && cleanValue) answers[cleanKey] = cleanValue;
  }
  if (Object.keys(answers).length === 0) return { ok: false, error: "Missing answers" };

  const completedMissions =
    typeof input.completedMissions === "number" && Number.isFinite(input.completedMissions)
      ? Math.max(0, Math.min(20, Math.floor(input.completedMissions)))
      : Object.keys(answers).length;

  return { ok: true, sessionId, answers, completedMissions, summary };
}
