// Schedule generation + chat-intent extraction (client feature, 2026-06-08).
//
// KAI turns a free-text request ("make me a full running and ab schedule every
// day for the next month") into a structured weekly schedule the teen can follow
// daily. And in normal chat, "add gym every Monday at 6" / "make me a
// productivity routine" updates that schedule automatically.

import { callClaude, MODEL_FAST } from "./claude";
import type { Env } from "../types";

export type ScheduleItem = {
  title: string;
  /** 0=Sunday … 6=Saturday. All seven = every day. */
  days: number[];
  /** "HH:MM" 24-hour, or null for no specific time. */
  time: string | null;
  category: "fitness" | "study" | "mind" | "routine" | "other";
};

const CATEGORIES = new Set(["fitness", "study", "mind", "routine", "other"]);

const ITEM_SHAPE =
  '{"title":"<=42 chars, concrete activity>","days":[0-6 where 0=Sunday..6=Saturday; all 7 = every day],"time":"HH:MM" 24h or null,"category":"fitness"|"study"|"mind"|"routine"|"other"}';

const GEN_SYSTEM = [
  "You turn a teenager's request into a structured weekly schedule they can actually follow daily. Return ONLY a JSON array — no prose, no markdown.",
  "",
  `Each item: ${ITEM_SHAPE}`,
  "",
  "Rules:",
  "- Build a realistic, healthy routine for a teen. Don't overload — a few focused items per day beats a packed calendar.",
  "- 'every day' → days [0,1,2,3,4,5,6]. 'weekdays' → [1,2,3,4,5]. A specific day → just that day.",
  "- For fitness, spread intensity sensibly (lighter/rest days; never train the same muscles hard back-to-back).",
  "- Short, actionable titles: 'Run — 20 min', 'Ab circuit', 'Study: math 30 min', 'Read 10 pages'.",
  "- If a time is given use it; otherwise null. Max 24 items.",
  "- Keep it safe and age-appropriate. No extreme dieting, no overtraining.",
  "Return [] if the request is not actually a schedule.",
].join("\n");

const INTENT_SYSTEM = [
  "A teenager sent a chat message. Decide if they're asking to ADD to or CREATE/CHANGE their daily schedule or routine.",
  "Return ONLY JSON (no prose): {\"action\":\"add\"|\"replace\"|\"none\",\"items\":[…],\"summary\":\"<=60 char confirmation>\"}",
  "- \"add\": add specific item(s) to the existing schedule ('add gym every Monday at 6').",
  "- \"replace\": they want a whole new routine ('make me a productivity routine', 'build me a running schedule').",
  "- \"none\": not a schedule request — return items [].",
  "",
  `Each item uses: ${ITEM_SHAPE}`,
  "Max 24 items. Keep titles short and the routine realistic + safe for a teen.",
].join("\n");

/** Cheap pre-filter so we only spend an LLM call on plausibly-schedule messages. */
export function looksLikeScheduleRequest(message: string): boolean {
  const t = message.toLowerCase();
  return (
    /\b(schedule|routine|plan)\b/.test(t) ||
    (/\b(add|set up|make me|build me|create|put)\b/.test(t) &&
      /\b(gym|workout|run|running|study|practice|every|daily|monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekday|morning|night|am|pm|\d\s*(am|pm|:\d))\b/.test(t))
  );
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
    const title = typeof o.title === "string" ? o.title.trim().slice(0, 42) : "";
    if (!title) continue;
    const days = Array.isArray(o.days)
      ? Array.from(new Set(o.days.filter((d): d is number => typeof d === "number" && d >= 0 && d <= 6)))
      : [];
    const category = typeof o.category === "string" && CATEGORIES.has(o.category)
      ? (o.category as ScheduleItem["category"])
      : "other";
    let time: string | null = null;
    if (typeof o.time === "string" && /^\d{1,2}:\d{2}$/.test(o.time.trim())) {
      const [h, m] = o.time.trim().split(":").map(Number);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    out.push({ title, days: days.length ? days : [0, 1, 2, 3, 4, 5, 6], time, category });
    if (out.length >= 24) break;
  }
  return out;
}

/** Generate a full schedule from a free-text request. */
export async function generateSchedule(env: Env, request: string): Promise<ScheduleItem[]> {
  const raw = await callClaude(
    env,
    GEN_SYSTEM,
    [{ role: "user", content: `Request: ${request.slice(0, 400)}\n\nReturn the schedule as a JSON array.` }],
    { model: MODEL_FAST, maxTokens: 900, timeoutMs: 15_000 },
  );
  return parseItems(raw);
}

export type ScheduleIntent = {
  action: "add" | "replace" | "none";
  items: ScheduleItem[];
  summary: string;
};

/** Extract a schedule add/replace intent from a chat message (null if none). */
export async function extractScheduleIntent(env: Env, message: string): Promise<ScheduleIntent | null> {
  try {
    const raw = await callClaude(
      env,
      INTENT_SYSTEM,
      [{ role: "user", content: message.slice(0, 400) }],
      { model: MODEL_FAST, maxTokens: 700, timeoutMs: 12_000 },
    );
    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    if (s < 0 || e <= s) return null;
    const obj = JSON.parse(raw.slice(s, e + 1)) as Record<string, unknown>;
    const action = obj.action === "add" || obj.action === "replace" ? obj.action : "none";
    if (action === "none") return null;
    const items = parseItems(JSON.stringify(obj.items ?? []));
    if (items.length === 0) return null;
    const summary = typeof obj.summary === "string" ? obj.summary.trim().slice(0, 60) : "Updated your schedule";
    return { action, items, summary };
  } catch {
    return null;
  }
}
