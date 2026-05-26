export type MissionPillar = "body" | "mind" | "purpose" | "people";

export const MISSION_PILLARS: Array<{ id: MissionPillar; label: string; engine: "physical" | "mental" | "superpower" }> = [
  { id: "body", label: "Body", engine: "physical" },
  { id: "mind", label: "Mind", engine: "mental" },
  { id: "purpose", label: "Purpose", engine: "superpower" },
  { id: "people", label: "People", engine: "mental" }
];

const EVENT_TO_PILLAR: Record<string, MissionPillar> = {
  food_photo: "body",
  food_photo_stub: "body",
  meal_logged: "body",
  sleep_log: "body",
  sleep_started: "body",
  workout: "body",
  body_scan: "body",
  mental_breathing: "mind",
  feelings_check_in: "mind",
  thought_reframe: "mind",
  meditation: "mind",
  strengths_discovery: "purpose",
  goal_created: "purpose",
  goal_completed: "purpose",
  goal_reframed: "purpose",
  identity_reframe: "purpose",
  social_reset: "people",
  letter_written: "people"
};

export function pillarForEvent(eventType: string, payload?: unknown): MissionPillar {
  if (eventType === "letter_written" && isRelationshipLetter(payload)) return "people";
  return EVENT_TO_PILLAR[eventType] ?? "mind";
}

function isRelationshipLetter(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const target = (payload as Record<string, unknown>).target;
  return typeof target === "string" && /friend|parent|relationship|team|person/i.test(target);
}
