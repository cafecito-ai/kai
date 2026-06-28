// The optional guided tour (PR 3). Offers the tour, then runs it — or, if the
// user skips (or the flag is off), completes immediately. Because the
// conversation already taught them what Kai does, skipping is a first-class,
// no-cost choice.

import { useEffect, useState } from "react";
import { GuidedTour } from "./GuidedTour";
import { TourChoice } from "./TourChoice";

export const TOUR_ENABLED = true;

export function OptionalGuidedTour({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<"choice" | "touring">("choice");

  // When disabled, behave like the old stub seam — straight through.
  useEffect(() => {
    if (!TOUR_ENABLED) onComplete();
  }, [onComplete]);

  if (!TOUR_ENABLED) return null;

  if (stage === "choice") {
    return <TourChoice onYes={() => setStage("touring")} onSkip={onComplete} />;
  }
  return <GuidedTour onComplete={onComplete} />;
}
