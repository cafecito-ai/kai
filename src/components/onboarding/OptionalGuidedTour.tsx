// SEAM ONLY (PR 1). The full "Kai walks you through the app" guided tour is an
// explicit follow-up PR. This stub keeps the onboarding flow's shape — the
// "want a quick tour?" branch and the OnboardingComplete handoff — so the tour
// PR can drop in here without touching the conversation engine or persistence.
//
// While TOUR_ENABLED is false, this immediately completes (users already learned
// what Kai does through the conversation, so skipping costs them nothing).

import { useEffect } from "react";

export const TOUR_ENABLED = false;

export function OptionalGuidedTour({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    // TODO(follow-up PR): render the "Yes, show me around" / "I'll figure it out"
    // choice and the Apple-keynote-style guided walkthrough. For now, no-op.
    onComplete();
  }, [onComplete]);

  return null;
}
