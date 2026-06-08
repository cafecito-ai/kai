// agent-prompts — turns a KaiContext into the right system prompt for whichever
// agent the router picked. Adapts the existing buildKaiContext output into the
// shapes the pre-written Mind/Body prompt builders expect.
//
// AGENT_PLAN T-007 wires Mind, T-008 wires Body. Both prompt builders are
// already authored in workers/src/lib/prompts/{mental-health,physical-health}-
// prompt.ts and are NOT to be rewritten — see KICKOFF.md step 3.

import { buildMentalHealthPrompt } from "./prompts/mental-health-prompt";
import { buildPhysicalHealthPrompt } from "./prompts/physical-health-prompt";
import type { AgentDecision } from "./agent-router";
import type { KaiContext } from "./context";

function timeOfDayFromHour(h: number): "morning" | "afternoon" | "evening" | "night" {
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

/** Time of day for the user. PREFER the user's local hour (sent via
 *  clientContext) — the worker runs in UTC, so a US afternoon would otherwise
 *  read as evening/night and KAI would say "tonight" at 3pm. */
function timeOfDay(context?: KaiContext): "morning" | "afternoon" | "evening" | "night" {
  const localHour = context?.clientContext?.localHour;
  if (typeof localHour === "number") return timeOfDayFromHour(localHour);
  return timeOfDayFromHour(new Date().getHours());
}

function dayOfWeek(date = new Date()): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

/**
 * Build the Mind agent system prompt from a KaiContext. The
 * data slots without v1 sources yet (recentMoodScores, recentPatterns,
 * activeGoals, conversationHistory) are passed empty — they get populated
 * by Phase B/C tasks as those features ship.
 */
export function renderMindPrompt(context: KaiContext): string {
  return buildMentalHealthPrompt({
    userName: context.displayName,
    kaiName: context.kaiName,
    age: context.age ?? 16,
    tonePreference: context.kaiTone,
    focusAreas: [],
    recentMoodScores: [],
    // T-021 — abstracted observations from the pattern engine.
    // Already filtered to safe wording by mental-patterns.ts.
    recentPatterns: context.recentPatterns ?? [],
    activeGoals: [],
    conversationHistory: [],
    timeOfDay: timeOfDay(context),
    dayOfWeek: dayOfWeek(),
  });
}

/**
 * Build the Body agent system prompt from a KaiContext.
 */
export function renderBodyPrompt(context: KaiContext): string {
  return buildPhysicalHealthPrompt({
    userName: context.displayName,
    kaiName: context.kaiName,
    age: context.age ?? 16,
    tonePreference: context.kaiTone,
    fitnessGoals: [],
    equipmentAccess: "none",
    recentWorkouts: [],
    recentSleepHours: [],
    hydrationToday: 0,
    hydrationTarget: 8,
    recentFoodLogs: [],
    lastBodyScanSummary: null,
    energyTrend: [],
    timeOfDay: timeOfDay(context),
    dayOfWeek: dayOfWeek(),
  });
}

/**
 * One-stop dispatch: given the router's decision and a context, return the
 * right system prompt string. chat.ts calls this on every safe message.
 */
export function renderAgentPrompt(
  decision: AgentDecision,
  context: KaiContext,
): string {
  return decision === "physical"
    ? renderBodyPrompt(context)
    : renderMindPrompt(context);
}
