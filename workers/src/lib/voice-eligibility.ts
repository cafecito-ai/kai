// T-035 — Voice mode eligibility.
//
// Per CLAUDE.md v2 §5 + AGENT_PLAN T-035:
//   "Under-16 users blocked between 11pm-6am"
//
// The user's age comes from their profile. The hour comes from a local
// time we trust (passed in by the caller — the server takes the user's
// local hour from the client, since the Worker has no idea what TZ the
// user is in). Defensive: an unknown age (null) is treated as 16+ to
// avoid locking out users who haven't shared their age, but the
// caller should always supply age when available.
//
// The check intentionally does NOT consider the user's account creation
// timestamp or any other date — only the current local hour + age.

export type VoiceEligibility =
  | { allowed: true }
  | { allowed: false; reason: "night_under_16"; message: string };

const NIGHT_START_HOUR_INCLUSIVE = 23; // 11 PM
const NIGHT_END_HOUR_EXCLUSIVE = 6; // 6 AM

const UNDER_AGE_THRESHOLD = 16;

const NIGHT_BLOCK_MESSAGE =
  "Voice mode is off between 11 PM and 6 AM for users under 16. Try a check-in or journal in the app — I'm still here.";

/**
 * Pure check. Pass the user's age (from profile) and the user's CURRENT
 * LOCAL hour (0-23). The caller is responsible for computing the local
 * hour correctly (`new Date().getHours()` on the client).
 */
export function checkVoiceEligibility(args: {
  age: number | null;
  localHour: number;
}): VoiceEligibility {
  // 16+ is always allowed.
  if (args.age === null || args.age >= UNDER_AGE_THRESHOLD) {
    return { allowed: true };
  }
  // Under 16 — gate by hour.
  if (isNightHour(args.localHour)) {
    return {
      allowed: false,
      reason: "night_under_16",
      message: NIGHT_BLOCK_MESSAGE,
    };
  }
  return { allowed: true };
}

/** [23, 24) ∪ [0, 6). Edge cases: hour 23 is night; hour 6 is allowed. */
export function isNightHour(localHour: number): boolean {
  if (!Number.isFinite(localHour)) return false;
  const h = Math.floor(localHour);
  if (h >= NIGHT_START_HOUR_INCLUSIVE) return true;
  if (h < NIGHT_END_HOUR_EXCLUSIVE) return true;
  return false;
}
