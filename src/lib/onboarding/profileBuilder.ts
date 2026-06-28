// UserProfileBuilder + MemoryExtraction mapping.
//
// Two pure-ish pieces:
//   mergeDelta()    — accumulate per-turn extraction into the running draft
//                     (last non-empty wins; never clobber a real value with null).
//   persistProfile()— map the finished draft onto the SAME persistence the live
//                     onboarding uses (local-identity / local-northstar /
//                     local-systems / intake / userStore-via-api), so the rest of
//                     the app can't tell which onboarding ran.
//
// persistProfile takes its dependencies via an injectable `deps` object so it's
// unit-testable with mocks; the defaults wire up the real modules.

import { api } from "../api";
import { getOriginStory, setIdentityStatement, setOriginStory } from "../local-identity";
import { getNorthStar, seedNorthStarFromFocus, setNorthStar } from "../local-northstar";
import { setSystemGoal } from "../local-systems";
import { flushPendingOnboardingIntake, queueOnboardingIntake } from "../pending-onboarding-intake";
import { EMPTY_DRAFT, type ProfileDelta, type ProfileDraft } from "./types";

/** Accumulate one extraction delta into the running draft. Last non-empty value
 *  wins; a null/empty field never overwrites something we already captured.
 *  focusAreas accumulate as a de-duped union. */
export function mergeDelta(draft: ProfileDraft, delta: ProfileDelta | null | undefined): ProfileDraft {
  if (!delta) return draft;
  const next: ProfileDraft = { ...draft, focusAreas: [...draft.focusAreas] };

  const strFields = [
    "firstName",
    "primaryGoal",
    "motivation",
    "emotionalMotivation",
    "timeframe",
    "blocker",
    "identityStatement",
    "originStory",
  ] as const;
  for (const f of strFields) {
    const v = delta[f];
    if (typeof v === "string" && v.trim()) next[f] = v.trim();
  }
  if (delta.tone) next.tone = delta.tone;
  if (Array.isArray(delta.focusAreas)) {
    for (const a of delta.focusAreas) {
      const clean = (a ?? "").trim();
      if (clean && !next.focusAreas.includes(clean)) next.focusAreas.push(clean);
    }
  }
  return next;
}

export interface PersistDeps {
  userId?: string | null;
  setDisplayName: (name: string | null) => void;
  setKaiTone: (tone: ProfileDraft["tone"]) => void;
  setNorthStar: typeof setNorthStar;
  seedNorthStarFromFocus: typeof seedNorthStarFromFocus;
  getNorthStar: typeof getNorthStar;
  setSystemGoal: typeof setSystemGoal;
  setIdentityStatement: typeof setIdentityStatement;
  setOriginStory: typeof setOriginStory;
  getOriginStory: typeof getOriginStory;
  queueOnboardingIntake: typeof queueOnboardingIntake;
  flushPendingOnboardingIntake: typeof flushPendingOnboardingIntake;
  updateUser: typeof api.updateUser;
}

function realDeps(
  store: { setDisplayName: (n: string | null) => void; setKaiTone: (t: ProfileDraft["tone"]) => void },
  userId?: string | null,
): PersistDeps {
  return {
    userId,
    setDisplayName: store.setDisplayName,
    setKaiTone: store.setKaiTone,
    setNorthStar,
    seedNorthStarFromFocus,
    getNorthStar,
    setSystemGoal,
    setIdentityStatement,
    setOriginStory,
    getOriginStory,
    queueOnboardingIntake,
    flushPendingOnboardingIntake,
    updateUser: api.updateUser,
  };
}

/** Map the finished draft onto persistence. Returns the resolved goal text so the
 *  caller (PlanGenerationSequence) can generate the system/schedule from it.
 *  Mirrors Onboarding.tsx finish() exactly, including the write-once origin
 *  story and the retry-safe intake queue. */
export async function persistProfile(draft: ProfileDraft, deps: PersistDeps): Promise<{ goal: string }> {
  const tone = draft.tone ?? "balanced";
  const keyed: Record<string, string> = {};

  if (draft.firstName) {
    deps.setDisplayName(draft.firstName);
    keyed.first_name = draft.firstName;
  }
  if (draft.focusAreas.length) keyed.focus_areas = draft.focusAreas.join(",");

  // Resolve the goal: a free-text goal is "custom"; otherwise derive from focus.
  let goal = draft.primaryGoal.trim();
  if (goal) {
    deps.setNorthStar(goal, "custom");
  } else if (draft.focusAreas.length) {
    deps.seedNorthStarFromFocus(draft.focusAreas);
    goal = deps.getNorthStar()?.goal ?? "";
  }
  if (goal) deps.setSystemGoal(goal, deps.userId ?? undefined);

  if (draft.identityStatement) {
    deps.setIdentityStatement(draft.identityStatement);
    keyed.identity_statement = draft.identityStatement;
  }
  if (draft.originStory && !deps.getOriginStory()) {
    deps.setOriginStory(draft.originStory); // write-once
    keyed.origin_story = draft.originStory;
  }
  if (draft.blocker) keyed.biggest_blocker = draft.blocker;
  if (draft.motivation) keyed.motivation = draft.motivation;
  if (draft.emotionalMotivation) keyed.emotional_motivation = draft.emotionalMotivation;
  if (draft.timeframe) keyed.timeframe = draft.timeframe;

  deps.setKaiTone(tone);

  try {
    await deps.updateUser({
      displayName: draft.firstName || undefined,
      kaiTone: tone,
      onboardingCompleted: true,
    });
  } catch {
    // Onboarding must complete even if this call fails — the intake queue retries
    // and the caller still navigates into the app.
  }

  // Retry-safe intake (matches the app's intake-retry behavior).
  deps.queueOnboardingIntake(keyed);
  void deps.flushPendingOnboardingIntake();

  return { goal };
}

export { EMPTY_DRAFT, realDeps };
