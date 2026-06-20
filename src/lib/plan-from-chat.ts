// plan-from-chat — decide when a KAI chat reply is an actionable PLAN the user
// could push into "My Plan" (workout / run / sleep / meal routines).
//
// We only surface "Add to My Plan" when the reply genuinely lays out a plan:
// it has a real list (≥2 items — KAI's formatting for steps/options) AND reads
// like a routine (workout/run/sleep/meal language). Plain advice or a single
// suggestion shouldn't get the button. Grocery lists are excluded — those are a
// shopping list, not plan items (Bucket 5 owns grocery, in chat only).

import { formatKaiReply } from "./format-kai-reply";

const PLAN_KEYWORDS =
  /\b(workout|exercise|reps?|sets?|warm[- ]?up|cool[- ]?down|routine|plan|run|jog|mile|stretch|mobility|sleep|bed ?time|wind[- ]?down|meal|breakfast|lunch|dinner|snack)\b/i;

const GROCERY_MARKERS = /\b(grocery|groceries|shopping list)\b/i;

export function looksLikePlan(text: string): boolean {
  if (!text) return false;
  if (GROCERY_MARKERS.test(text)) return false;
  const listItems = formatKaiReply(text)
    .filter((b): b is Extract<typeof b, { type: "list" }> => b.type === "list")
    .reduce((n, b) => n + b.items.length, 0);
  if (listItems < 2) return false;
  return PLAN_KEYWORDS.test(text);
}
