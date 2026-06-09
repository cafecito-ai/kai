// Lifestyle-system generation + chat-intent extraction (client feature,
// 2026-06-08, evolved to a full system 2026-06-XX).
//
// KAI turns the teen's GOAL (and any free-text request) into a complete, realistic
// lifestyle SYSTEM — daily habits, workouts, sleep, routines, mindset/discipline,
// and things to avoid, all connected and serving the goal. Not a rigid schedule:
// fully editable, and editable just by talking to KAI in chat ("add gym every
// Monday at 6", "make me a productivity routine", "drop the morning run").

import { callClaude, MODEL_FAST } from "./claude";
import type { Env } from "../types";

export type SystemSection = "daily" | "training" | "sleep" | "routine" | "mindset" | "avoid";

export type ScheduleItem = {
  section: SystemSection;
  title: string;
  /** Short why/how — makes the system feel realistic + motivating. */
  detail: string;
  /** 0=Sunday … 6=Saturday. [] or all seven = a standing/daily item. */
  days: number[];
  /** "HH:MM" 24-hour, or null for no specific time (a time = a reminder). */
  time: string | null;
};

const SECTIONS = new Set<SystemSection>(["daily", "training", "sleep", "routine", "mindset", "avoid"]);

const ITEM_SHAPE =
  '{"section":"daily"|"training"|"sleep"|"routine"|"mindset"|"avoid","title":"<=50 chars","detail":"<=90 chars, the why or how","days":[0-6, 0=Sunday; [] for a standing/daily item],"time":"HH:MM" 24h or null}';

const SECTION_GUIDE = [
  "- daily: everyday habits / small wins that compound toward the goal",
  "- training: workouts (spread intensity; never hammer the same muscles back-to-back)",
  "- sleep: sleep target + recovery (wind-down, rest days)",
  "- routine: morning + evening anchors",
  "- mindset: mindset + discipline (how they think and stay on track)",
  "- avoid: things to cut out that hold them back (title = the thing to avoid)",
].join("\n");

const SYSTEM_GEN = [
  "Build a complete, realistic LIFESTYLE SYSTEM for a teenager, built entirely around their GOAL.",
  "It is NOT a rigid schedule — it's a connected system of habits, training, sleep, routines, mindset, and things to avoid, all serving the goal so it feels realistic and motivating.",
  "",
  `Return ONLY a JSON array. Each item: ${ITEM_SHAPE}`,
  "",
  "Sections:",
  SECTION_GUIDE,
  "",
  "Rules:",
  "- 2-4 items per section, total <= 22. EVERY item must clearly serve the goal.",
  "- Realistic + safe for a teen. No extreme dieting, no overtraining, nothing risky.",
  "- Short, concrete titles ('Run — 20 min', 'Phone out of room by 10:30', 'No doomscrolling at night').",
  "- detail is one short motivating line on why/how it helps the goal.",
  "- Use days for scheduled things (workouts, routines); [] for standing habits/rules/avoid items. time only when a specific time genuinely helps.",
].join("\n");

const INTENT_SYSTEM = [
  "A teenager sent a chat message. Decide if they want to change their lifestyle system (habits/workouts/sleep/routines/mindset/avoid).",
  'Return ONLY JSON: {"action":"add"|"replace"|"remove"|"none","items":[…],"removeIds":["id",…],"removeQuery":"<fallback words>","summary":"<=60 chars"}',
  "- \"add\": add specific item(s) ('add gym every Monday at 6'). For a SWAP ('swap my morning run for a bike ride'), also put the old item's id in removeIds.",
  "- \"replace\": they want a whole new system/routine ('make me a productivity routine', 'rebuild my plan').",
  "- \"remove\": they want to drop something. When CURRENT ITEMS are provided below, pick the EXACT matching id(s) and return them in removeIds (this is precise — prefer it). Only fall back to removeQuery (loose words) if no item clearly matches.",
  "- \"none\": not a system change — items [], removeIds [].",
  "",
  "BULK/SECTION removal — treat these as action 'remove' and put EVERY id from that section into removeIds (sections are shown in the CURRENT ITEMS list):",
  "  'clear all my workouts' / 'remove my workouts' -> every Workouts id.",
  "  'drop everything in mindset' -> every Mindset & discipline id.",
  "  'remove my sleep stuff' -> every Sleep & recovery id.",
  "  'wipe my whole system' / 'clear everything' -> every id.",
  "Always act when they clearly ask to remove something that exists; only return 'none' if nothing matches.",
  "",
  `Item shape (for add/replace): ${ITEM_SHAPE}`,
  "Max 22 items. Keep it realistic + safe for a teen.",
].join("\n");

/** Cheap pre-filter so we only spend an LLM call on plausible system messages. */
export function looksLikeScheduleRequest(message: string): boolean {
  const t = message.toLowerCase();
  if (/\b(schedule|routine|plan|system|habit|remind|reminder)\b/.test(t)) return true;
  const hasEditVerb = /\b(add|set up|make me|build me|create|put|drop|remove|delete|clear|wipe|cancel|get rid|take out|swap|change|replace)\b/.test(t);
  // NOTE: leading \b only (no trailing) so stems match plurals — "workout"
  // matches "workouts", "run" matches "runs", etc.
  const hasSystemNoun = /\b(gym|workout|run|lift|study|practice|stretch|mobility|sleep|wake|bed|mindset|discipline|recovery|morning|night|evening|every|daily|weekday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|am|pm|\d\s*(am|pm|:\d)|everything|all of)/.test(t);
  return hasEditVerb && hasSystemNoun;
}

function parseItems(raw: string): ScheduleItem[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start < 0 || end <= start) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const out: ScheduleItem[] = [];
  for (const it of arr) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const title = typeof o.title === "string" ? o.title.trim().slice(0, 50) : "";
    if (!title) continue;
    const section: SystemSection =
      typeof o.section === "string" && SECTIONS.has(o.section as SystemSection)
        ? (o.section as SystemSection)
        : "daily";
    const detail = typeof o.detail === "string" ? o.detail.trim().slice(0, 90) : "";
    const days = Array.isArray(o.days)
      ? Array.from(new Set(o.days.filter((d): d is number => typeof d === "number" && d >= 0 && d <= 6)))
      : [];
    let time: string | null = null;
    if (typeof o.time === "string" && /^\d{1,2}:\d{2}$/.test(o.time.trim())) {
      const [h, m] = o.time.trim().split(":").map(Number);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    out.push({ section, title, detail, days, time });
    if (out.length >= 22) break;
  }
  return out;
}

/** Generate a full lifestyle system from a request + the teen's goal. */
export async function generateSchedule(env: Env, request: string, goal?: string): Promise<ScheduleItem[]> {
  const user = [
    goal ? `Their goal: ${goal.slice(0, 120)}` : "",
    request ? `What they asked for: ${request.slice(0, 400)}` : "Build the full system around their goal.",
    "",
    "Return the system as a JSON array.",
  ]
    .filter(Boolean)
    .join("\n");
  const raw = await callClaude(env, SYSTEM_GEN, [{ role: "user", content: user }], {
    model: MODEL_FAST,
    maxTokens: 1400,
    timeoutMs: 18_000,
  });
  return parseItems(raw);
}

export type ScheduleIntent = {
  action: "add" | "replace" | "remove" | "none";
  items: ScheduleItem[];
  /** Exact ids to remove — precise, chosen from the user's real item list. */
  removeIds?: string[];
  /** Fallback fuzzy match when no exact id was identified. */
  removeQuery?: string;
  summary: string;
};

/** Compact current-items list sent from the client so removal is exact, not
 *  inferred. Keeps the chat Worker from guessing at the user's local contents. */
export type CurrentItem = { id: string; title: string; section?: string };

/** Extract a system add/replace/remove intent from a chat message (null if none).
 *  When `currentItems` are provided, removal is resolved to EXACT ids (precise)
 *  instead of an inferred fuzzy phrase. */
export async function extractScheduleIntent(
  env: Env,
  message: string,
  goal?: string,
  currentItems?: CurrentItem[],
): Promise<ScheduleIntent | null> {
  try {
    const sectionLabel: Record<string, string> = {
      daily: "Daily habits",
      training: "Workouts",
      sleep: "Sleep & recovery",
      routine: "Routines",
      mindset: "Mindset & discipline",
      avoid: "Avoid",
    };
    const list =
      currentItems && currentItems.length
        ? `\nCURRENT ITEMS (id | section | title):\n${currentItems
            .slice(0, 30)
            .map((i) => `${i.id} | ${sectionLabel[i.section ?? ""] ?? i.section ?? "?"} | ${i.title}`)
            .join("\n")}`
        : "";
    const raw = await callClaude(
      env,
      INTENT_SYSTEM,
      [{ role: "user", content: `${goal ? `Goal: ${goal.slice(0, 120)}\n` : ""}Message: ${message.slice(0, 400)}${list}` }],
      { model: MODEL_FAST, maxTokens: 900, timeoutMs: 12_000 },
    );
    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    if (s < 0 || e <= s) return null;
    const obj = JSON.parse(raw.slice(s, e + 1)) as Record<string, unknown>;
    const action = obj.action === "add" || obj.action === "replace" || obj.action === "remove" ? obj.action : "none";
    if (action === "none") return null;
    const summary = typeof obj.summary === "string" ? obj.summary.trim().slice(0, 60) : "Updated your system";

    // Only keep ids that actually exist in the user's current list.
    const validIds = new Set((currentItems ?? []).map((i) => i.id));
    const removeIds = Array.isArray(obj.removeIds)
      ? obj.removeIds.filter((id): id is string => typeof id === "string" && validIds.has(id)).slice(0, 30)
      : [];
    const removeQuery = typeof obj.removeQuery === "string" ? obj.removeQuery.trim().slice(0, 60) : "";
    const items = parseItems(JSON.stringify(obj.items ?? []));

    if (action === "remove") {
      // Need at least an exact id or a fallback query to act on.
      if (removeIds.length === 0 && !removeQuery) return null;
      return { action, items: [], removeIds, removeQuery: removeQuery || undefined, summary };
    }
    // add / replace (a swap = add + removeIds).
    if (items.length === 0 && removeIds.length === 0) return null;
    return { action, items, removeIds: removeIds.length ? removeIds : undefined, summary };
  } catch {
    return null;
  }
}
