import type { EngineId, Env } from "../types";

export type KaiTone = "warm" | "balanced" | "direct";

export type KaiContext = {
  userId: string;
  displayName: string;
  age: number | null;
  kaiName: string;
  kaiTone: KaiTone;
  primaryEngine: EngineId;
  intakeSummary: string | null;
  intakeDetails: string | null;
  recentPhysicalContext: string | null;
  recentMentalContext: string | null;
  recentGoalContext: string | null;
  streakOverall: number;
};

const FALLBACK_CONTEXT: Omit<KaiContext, "userId"> = {
  displayName: "friend",
  age: null,
  kaiName: "Kai",
  kaiTone: "balanced",
  primaryEngine: "physical",
  intakeSummary: null,
  intakeDetails: null,
  recentPhysicalContext: null,
  recentMentalContext: null,
  recentGoalContext: null,
  streakOverall: 0
};

function normaliseTone(value: unknown): KaiTone {
  if (value === "warm" || value === "balanced" || value === "direct") return value;
  return "balanced";
}

function normaliseEngine(value: unknown): EngineId {
  if (value === "physical" || value === "potential" || value === "mental") return value;
  return "physical";
}

/**
 * Build the Kai context for a chat turn: user record from D1, intake summary
 * (KV cache first, D1 fallback), and overall streak from KV. All reads fail
 * open — a missing user record returns a sensible default so chat keeps
 * working through the no-AI-no-data path used in dev.
 */
export async function buildKaiContext(env: Env, userId: string): Promise<KaiContext> {
  const user = await env.DB
    .prepare("SELECT display_name, age, kai_name, kai_tone, primary_engine FROM users WHERE id = ?")
    .bind(userId)
    .first<{
      display_name: string | null;
      age: number | null;
      kai_name: string | null;
      kai_tone: string | null;
      primary_engine: string | null;
    }>()
    .catch(() => null);

  // Intake summary: try KV first (cheap), then D1 (authoritative). D1 also
  // carries structured onboarding answers that make Kai's replies less generic.
  let intakeSummary: string | null = null;
  let intakeDetails: string | null = null;
  if (env.SESSIONS_KV) {
    try {
      intakeSummary = await env.SESSIONS_KV.get(`intake:${userId}`);
    } catch {
      // ignore
    }
  }
  const intakeRow = await env.DB
    .prepare("SELECT summary, raw_responses FROM user_intake WHERE user_id = ?")
    .bind(userId)
    .first<{ summary: string | null; raw_responses: string | null }>()
    .catch(() => null);
  intakeSummary = intakeSummary || intakeRow?.summary || null;
  intakeDetails = formatIntakeDetails(intakeRow?.raw_responses);
  const recentPhysicalContext = await loadRecentEngineContext(env, userId, "physical");
  const recentMentalContext = await loadRecentEngineContext(env, userId, "mental");
  const recentGoalContext = await loadRecentGoalContext(env, userId);

  let streakOverall = 0;
  if (env.PROGRESS_KV) {
    try {
      const raw = await env.PROGRESS_KV.get(`streak:${userId}:overall`);
      if (raw) streakOverall = Number.parseInt(raw, 10) || 0;
    } catch {
      // ignore
    }
  }

  return {
    userId,
    displayName: user?.display_name?.trim() || FALLBACK_CONTEXT.displayName,
    age: typeof user?.age === "number" ? user.age : FALLBACK_CONTEXT.age,
    kaiName: user?.kai_name?.trim() || FALLBACK_CONTEXT.kaiName,
    kaiTone: normaliseTone(user?.kai_tone),
    primaryEngine: normaliseEngine(user?.primary_engine),
    intakeSummary,
    intakeDetails,
    recentPhysicalContext,
    recentMentalContext,
    recentGoalContext,
    streakOverall
  };
}

async function loadRecentEngineContext(env: Env, userId: string, engine: EngineId) {
  const rows = await env.DB
    .prepare(
      `SELECT entry_type, title, payload, completed_at, created_at
       FROM engine_entries
       WHERE user_id = ? AND engine = ?
       ORDER BY COALESCE(completed_at, created_at) DESC
       LIMIT 6`
    )
    .bind(userId, engine)
    .all<{
      entry_type: string | null;
      title: string | null;
      payload: string | null;
      completed_at: string | null;
      created_at: string | null;
    }>()
    .catch(() => ({ results: [] }));

  const lines = (rows.results ?? [])
    .map((row) => formatEngineEntry(engine, row))
    .filter(Boolean)
    .slice(0, 6);
  return lines.join("\n").slice(0, 1600) || null;
}

async function loadRecentGoalContext(env: Env, userId: string) {
  const goalRows = await env.DB
    .prepare(
      `SELECT title, status, category, why_it_matters, next_action, updated_at, created_at
       FROM goals
       WHERE user_id = ?
       ORDER BY COALESCE(updated_at, created_at) DESC
       LIMIT 5`
    )
    .bind(userId)
    .all<{
      title: string | null;
      status: string | null;
      category: string | null;
      why_it_matters: string | null;
      next_action: string | null;
      updated_at: string | null;
      created_at: string | null;
    }>()
    .catch(() => ({ results: [] }));

  const goalLines = (goalRows.results ?? [])
    .map(formatGoalRow)
    .filter(Boolean)
    .slice(0, 5);
  const potentialContext = await loadRecentEngineContext(env, userId, "potential");
  return [...goalLines, potentialContext].filter(Boolean).join("\n").slice(0, 1800) || null;
}

function formatEngineEntry(engine: EngineId, row: { entry_type: string | null; title: string | null; payload: string | null; completed_at: string | null; created_at: string | null }) {
  const payload = parsePayload(row.payload);
  const entryType = row.entry_type ?? engine;
  const title = normaliseText(row.title) || labelForEntry(entryType);
  const when = formatDate(row.completed_at || row.created_at);
  const detail = engine === "mental" ? mentalDetail(entryType, payload) : engine === "potential" ? goalEntryDetail(entryType, payload) : physicalDetail(entryType, payload);
  return [when, title, detail].filter(Boolean).join(" — ");
}

function formatGoalRow(row: { title: string | null; status: string | null; category: string | null; why_it_matters: string | null; next_action: string | null; updated_at: string | null; created_at: string | null }) {
  const when = formatDate(row.updated_at || row.created_at);
  const title = normaliseText(row.title) || "Goal";
  const status = normaliseText(row.status) || "active";
  const category = normaliseText(row.category);
  const nextAction = normaliseText(row.next_action);
  const why = normaliseText(row.why_it_matters);
  const detail = [category, status, nextAction ? `next: ${nextAction}` : "", why ? `why: ${why}` : ""].filter(Boolean).join("; ");
  return [when, title, detail].filter(Boolean).join(" — ");
}

function physicalDetail(entryType: string, payload: Record<string, unknown>) {
  const insight = normaliseText(payload.insight);
  if (insight) return insight;

  if (entryType.includes("meal") || entryType.includes("food")) {
    const items = readFoodItems(payload);
    const context = typeof payload.mealContext === "string" ? payload.mealContext.replace(/_/g, " ") : "";
    if (items.length > 0) return `fuel: ${items.join(", ")}${context ? ` (${context})` : ""}`;
    const meal = normaliseText(payload.meal);
    if (meal) return `fuel: ${meal}`;
    return "fuel logged without scoring";
  }
  if (entryType.includes("scan")) {
    const analysis = parseRecord(payload.analysis);
    const summary = normaliseText(analysis.summary);
    return summary || "private posture/recovery scan saved";
  }
  if (entryType.includes("movement")) {
    const minutes = typeof payload.minutes === "number" ? payload.minutes : null;
    const focus = normaliseText(payload.focus) || "mobility";
    return minutes ? `${minutes} minutes for ${focus}` : `movement for ${focus}`;
  }
  if (entryType.includes("sleep")) {
    const hours = typeof payload.hours === "number" ? payload.hours : null;
    const quality = normaliseText(payload.quality);
    return hours ? `${hours} hours${quality ? `, ${quality}` : ""}` : "sleep logged";
  }
  if (entryType.includes("recovery")) return "recovery reset logged";
  return "physical rep saved";
}

function mentalDetail(entryType: string, payload: Record<string, unknown>) {
  const summary = normaliseText(payload.summary);
  if (summary) return summary;

  if (entryType.includes("feelings") || entryType.includes("check_in")) {
    const loudest = loudestEmotion(payload);
    const bodyArea = typeof payload.bodyArea === "string" ? payload.bodyArea.replace(/_/g, " ") : "";
    if (loudest) return `${loudest} was loudest${bodyArea ? `, mostly in ${bodyArea}` : ""}`;
    const note = normaliseText(payload.note);
    return note || "emotional check-in saved";
  }
  if (entryType.includes("reframe")) {
    const reframe = normaliseText(payload.reframe);
    const thought = normaliseText(payload.thought);
    return reframe || (thought ? `caught thought: ${thought}` : "reframe saved");
  }
  if (entryType.includes("social")) {
    const boundary = normaliseText(payload.boundary);
    const replacement = normaliseText(payload.replacement);
    return [boundary ? `boundary: ${boundary}` : "", replacement ? `instead: ${replacement}` : ""].filter(Boolean).join("; ") || "social reset saved";
  }
  if (entryType.includes("breathing") || entryType.includes("meditation")) {
    const seconds = typeof payload.seconds === "number" ? payload.seconds : typeof payload.elapsedSeconds === "number" ? payload.elapsedSeconds : null;
    const pattern = normaliseText(payload.patternId) || "reset";
    return seconds ? `${pattern.replace(/_/g, " ")} for ${Math.round(seconds / 60)} min` : "body reset saved";
  }
  if (entryType.includes("letter") || entryType.includes("strengths")) {
    const body = normaliseText(payload.body);
    return body || "identity evidence saved";
  }
  if (entryType.includes("goal")) return goalEntryDetail(entryType, payload);
  return "mind rep saved";
}

function goalEntryDetail(entryType: string, payload: Record<string, unknown>) {
  const nextStep = normaliseText(payload.nextStep) || normaliseText(payload.nextAction);
  const title = normaliseText(payload.title);
  const reframe = normaliseText(payload.reframe);
  const summary = normaliseText(payload.summary);
  if (nextStep) return `next move: ${nextStep}`;
  if (reframe) return `reframe: ${reframe}`;
  if (summary) return summary;
  if (title) return `goal: ${title}`;
  if (entryType.includes("strengths")) return "strengths context saved";
  return "goal rep saved";
}

function loudestEmotion(payload: Record<string, unknown>) {
  const emotions = parseRecord(payload.emotions);
  let best: { label: string; value: number } | null = null;
  for (const [key, value] of Object.entries(emotions)) {
    if (typeof value !== "number") continue;
    if (!best || value > best.value) best = { label: key.replace(/_/g, " "), value };
  }
  return best && best.value > 0 ? best.label : "";
}

function readFoodItems(payload: Record<string, unknown>) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  return items
    .map((item) => (parseRecord(item).name ? normaliseText(parseRecord(item).name) : ""))
    .filter(Boolean)
    .slice(0, 4);
}

function parsePayload(value: string | null) {
  if (!value) return {};
  try {
    return parseRecord(JSON.parse(value));
  } catch {
    return {};
  }
}

function parseRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normaliseText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 220) : "";
}

function labelForEntry(entryType: string) {
  return entryType.replace(/_/g, " ");
}

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatIntakeDetails(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return Object.entries(parsed as Record<string, unknown>)
      .filter(([, value]) => typeof value === "string" && value.trim())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}: ${String(value).trim().replace(/\s+/g, " ").slice(0, 420)}`)
      .join("\n")
      .slice(0, 1800) || null;
  } catch {
    return null;
  }
}
