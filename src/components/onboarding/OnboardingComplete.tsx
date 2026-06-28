// The closing beat — "Your Personal AI Coach is Ready." Then into the app.

import { ArrowRight } from "lucide-react";
import { KaiCharacter } from "../KaiCharacter";
import { MagicEffect } from "../MagicEffect";
import { MagicField } from "../MagicField";

export function OnboardingComplete({
  displayName,
  onEnter,
}: {
  displayName?: string | null;
  onEnter: () => void;
}) {
  return (
    <div className="relative mx-auto flex h-[100vh] w-full max-w-md flex-col items-center justify-center overflow-hidden px-6 sm:max-w-lg">
      <MagicField />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative shrink-0">
          <KaiCharacter size={180} face gesture="reach" />
          <MagicEffect kind="heart" triggerKey={1} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold text-text-primary animate-fade-slide-up">
          {displayName ? `You're all set, ${displayName}.` : "You're all set."}
        </h1>
        <p className="mt-3 max-w-[20rem] text-base leading-relaxed text-text-secondary">
          Your coach is ready. Let's get to work.
        </p>
        <button
          type="button"
          onClick={onEnter}
          className="mt-9 flex h-14 w-full max-w-[20rem] items-center justify-center gap-2 rounded-full bg-text-primary text-lg font-semibold text-background shadow-card transition active:scale-[0.99] focus-ring"
        >
          Enter Kai
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
