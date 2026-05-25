import type { Goal, GoalCategory, GoalStatus } from "./types";

export type GoalDraft = {
  title: string;
  description: string;
  category: GoalCategory;
  whyItMatters: string;
  nextAction: string;
};

const GOAL_CATEGORIES: GoalCategory[] = [
  "school",
  "sport",
  "fitness",
  "nutrition",
  "sleep",
  "mental",
  "creative",
  "music",
  "business",
  "charity",
  "social",
  "custom"
];

const GOAL_STATUSES: GoalStatus[] = ["active", "paused", "achieved", "released"];

const UNSAFE_PATTERNS = [
  /\b(kill myself|suicide|end my life|hurt myself|cut myself|self[-\s]?harm)\b/i,
  /\b(disappear forever|want to disappear|don't want to be here|do not want to be here)\b/i,
  /\b(starve myself|stop eating|purge|throw up my food|not eat|blackout drunk)\b/i,
  /\b(revenge|hurt someone|hurt somebody|make them pay|bring a weapon)\b/i,
  /\b(overdose|drugs every day|get high every day|abuse pills)\b/i
];

export function normalizeGoalCategory(value: unknown): GoalCategory {
  if (typeof value !== "string") return "custom";
  const normalized = value.trim().toLowerCase();
  if (normalized === "instrument") return "music";
  if (GOAL_CATEGORIES.includes(normalized as GoalCategory)) return normalized as GoalCategory;
  return "custom";
}

export function normalizeGoalStatus(value: unknown): GoalStatus {
  if (typeof value !== "string") return "active";
  const normalized = value.trim().toLowerCase();
  if (GOAL_STATUSES.includes(normalized as GoalStatus)) return normalized as GoalStatus;
  return "active";
}

export function normalizeGoal(value: unknown): Goal | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const id = stringValue(obj.id);
  const title = stringValue(obj.title);
  if (!id || !title) return null;
  const description = stringValue(obj.description) || "";
  return {
    id,
    userId: stringValue(obj.userId) || stringValue(obj.user_id) || undefined,
    category: normalizeGoalCategory(obj.category),
    title,
    description,
    whyItMatters: stringValue(obj.whyItMatters) || stringValue(obj.why_it_matters) || undefined,
    targetDate: nullableString(obj.targetDate ?? obj.target_date),
    status: normalizeGoalStatus(obj.status),
    nextAction: nullableString(obj.nextAction ?? obj.next_action),
    confidence: numberOrNull(obj.confidence),
    createdAt: stringValue(obj.createdAt) || stringValue(obj.created_at) || undefined,
    updatedAt: stringValue(obj.updatedAt) || stringValue(obj.updated_at) || undefined,
    achievedAt: nullableString(obj.achievedAt ?? obj.achieved_at)
  };
}

export function normalizeGoals(value: unknown): Goal[] {
  const raw = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as Record<string, unknown>).goals)
      ? ((value as Record<string, unknown>).goals as unknown[])
      : [];
  return raw.map(normalizeGoal).filter((goal): goal is Goal => Boolean(goal));
}

export function createGoalDraftFromText(text: string): GoalDraft {
  const title = text.trim().replace(/\s+/g, " ").slice(0, 90);
  const category = deriveGoalCategory(title);
  const nextAction = deriveStarterAction(title, category);
  return {
    title: title || "One tiny thing",
    description: title ? `I want to get better at ${title.toLowerCase()}.` : "",
    category,
    whyItMatters: "It matters because I want to feel proud of keeping one promise to myself.",
    nextAction
  };
}

export function deriveGoalCategory(text: string): GoalCategory {
  const value = text.toLowerCase();
  if (/\b(basketball|soccer|tennis|golf|team)\b/.test(value)) return "sport";
  if (/\b(stronger|lift|run|workout|pushup|push-up)\b/.test(value)) return "fitness";
  if (/\b(test|homework|grades|math|school)\b/.test(value)) return "school";
  if (/\b(sleep|tired|bed)\b/.test(value)) return "sleep";
  if (/\b(anxious|stress|confidence|mental)\b/.test(value)) return "mental";
  if (/\b(song|music|guitar|piano)\b/.test(value)) return "music";
  if (/\b(business|sell|startup)\b/.test(value)) return "business";
  if (/\b(food|eat better|protein|nutrition)\b/.test(value)) return "nutrition";
  if (/\b(draw|write|creative|art)\b/.test(value)) return "creative";
  return "custom";
}

export function deriveStarterAction(_text: string, category: GoalCategory): string {
  if (category === "fitness") return "Do 10 minutes after school. Stop while it still feels doable.";
  if (category === "sport") return "Do one 12-minute practice block today.";
  if (category === "school") return "Work for 10 minutes before opening your phone.";
  if (category === "sleep") return "Put your phone across the room 20 minutes before bed.";
  if (category === "mental") return "Write one honest sentence about what is actually bothering you.";
  if (category === "music") return "Practice one small section for 10 minutes.";
  if (category === "nutrition") return "Add one steady food choice today without making it a rule.";
  return "Do one tiny version of this for 10 minutes.";
}

export function formatGoalStatus(status: GoalStatus): string {
  if (status === "active") return "Active";
  if (status === "paused") return "Paused";
  if (status === "achieved") return "Achieved";
  return "Released";
}

export function isUnsafeGoalText(text: string): boolean {
  const value = text.trim();
  if (!value) return false;
  return UNSAFE_PATTERNS.some((pattern) => pattern.test(value));
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value: unknown): string | null {
  if (value == null) return null;
  const normalized = stringValue(value);
  return normalized || null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}
