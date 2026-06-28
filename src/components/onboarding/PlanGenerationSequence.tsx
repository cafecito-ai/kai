// "Kai is building something for you." Persists the profile (same mapping the
// live onboarding uses) and generates the system/schedule, behind a sequence of
// smoothly-transitioning status lines.
//
// SEAM: the `variant` prop isolates the visual treatment. PR 1 ships "simple";
// the follow-up PR swaps in the premium cinematic sequence as "cinematic"
// WITHOUT touching the persistence/data flow below.

import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { setSchedule } from "../../lib/local-schedule";
import { persistProfile, realDeps } from "../../lib/onboarding/profileBuilder";
import type { ProfileDraft } from "../../lib/onboarding/types";
import { useUserStore } from "../../stores/userStore";
import { KaiOrb } from "../KaiOrb";
import { MagicEffect } from "../MagicEffect";
import { MagicField } from "../MagicField";

const STEPS = [
  "Understanding you…",
  "Learning what drives you…",
  "Building your personalized system…",
  "Designing your daily plan…",
  "Personalizing Kai…",
];

const STEP_MS = 1100;

export function PlanGenerationSequence({
  draft,
  userId,
  onDone,
  variant = "simple",
}: {
  draft: ProfileDraft;
  userId?: string | null;
  onDone: () => void;
  variant?: "simple" | "cinematic";
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const kaiName = useUserStore((s) => s.kaiName);
  const setDisplayName = useUserStore((s) => s.setDisplayName);
  const setKai = useUserStore((s) => s.setKai);
  const ranRef = useRef(false);

  useEffect(() => {
    // Cycle the status lines.
    const timer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, STEP_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const startedAt = Date.now();
    const deps = realDeps(
      { setDisplayName, setKaiTone: (tone) => setKai(kaiName, tone ?? "balanced") },
      userId,
    );

    (async () => {
      try {
        const { goal } = await persistProfile(draft, deps);
        if (goal) {
          const res = await api.scheduleGenerate(goal, goal).catch(() => null);
          if (res && res.items.length > 0) setSchedule(res.items);
        }
      } catch {
        // Onboarding must always complete — fall through to onDone regardless.
      } finally {
        // Hold the sequence for at least its full run so it never flickers past.
        const minMs = STEPS.length * STEP_MS;
        const wait = Math.max(0, minMs - (Date.now() - startedAt));
        setTimeout(onDone, wait);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative mx-auto flex h-[100vh] w-full max-w-md flex-col items-center justify-center overflow-hidden px-6 sm:max-w-lg">
      <MagicField />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative">
          <KaiOrb size={132} animate />
          {variant === "cinematic" && <MagicEffect kind="converge" triggerKey={stepIndex} />}
        </div>
        <p
          key={stepIndex}
          className="mt-8 min-h-[1.5rem] text-base font-medium text-text-secondary animate-fade-slide-up"
          aria-live="polite"
        >
          {STEPS[stepIndex]}
        </p>
      </div>
    </div>
  );
}
