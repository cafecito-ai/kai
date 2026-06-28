// Feature flag for the v2 voice-first onboarding.
//
// v2 lives on its own route (/onboarding-v2) and stays OFF by default so the
// existing onboarding remains the live experience. It's layered so Lev/QA can
// flip it on staging WITHOUT a redeploy:
//   1. Build-time:  VITE_ONBOARDING_V2 === "1"   (set per-environment; on for staging)
//   2. Runtime:     localStorage "kai_onboarding_v2" === "1"
//                   or a ?v2=1 URL param (which persists the localStorage key)
//
// Until Lev approves on staging, prod ships with the flag off and v2 is only
// reachable by explicitly visiting /onboarding-v2?v2=1.

const LS_KEY = "kai_onboarding_v2";

export function isOnboardingV2Enabled(): boolean {
  // Build-time default (per-environment).
  if (import.meta.env.VITE_ONBOARDING_V2 === "1") return true;

  if (typeof window === "undefined") return false;

  // ?v2=1 / ?v2=0 toggles and persists, so Lev can share/bookmark a link.
  try {
    const param = new URLSearchParams(window.location.search).get("v2");
    if (param === "1") {
      localStorage.setItem(LS_KEY, "1");
      return true;
    }
    if (param === "0") {
      localStorage.removeItem(LS_KEY);
      return false;
    }
  } catch {
    /* URL/localStorage unavailable — fall through to the stored value. */
  }

  try {
    return localStorage.getItem(LS_KEY) === "1";
  } catch {
    return false;
  }
}
