// "Want a quick tour?" — the post-onboarding offer (PR 3).
//
// Per the brief: the primary "Yes, show me around" is the obvious choice
// (filled accent, subtle pulse + glow, scale-on-press), while "I'll figure it
// out" stays available but lower-emphasis. The decision is fully optional —
// because the conversation already taught the user what Kai does, skipping
// costs them nothing.

import { Sparkles } from "lucide-react";
import { KaiCharacter } from "../KaiCharacter";
import { MagicField } from "../MagicField";

export function TourChoice({
  onYes,
  onSkip,
}: {
  onYes: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="relative mx-auto flex h-[100vh] w-full max-w-md flex-col items-center justify-center overflow-hidden px-6 sm:max-w-lg">
      <MagicField />

      <div className="relative z-10 flex flex-col items-center text-center">
        <KaiCharacter size={150} face gesture="point" />
        <h1 className="mt-5 font-display text-2xl font-semibold text-text-primary">
          Want me to show you around?
        </h1>
        <p className="mt-2 max-w-[20rem] text-sm leading-relaxed text-text-secondary">
          About 30 seconds — I'll walk you through how to get the most out of this.
        </p>

        <div className="mt-8 flex w-full max-w-[20rem] flex-col items-stretch gap-3">
          <button
            type="button"
            onClick={onYes}
            className="kai-tour-cta relative flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-accent text-lg font-semibold text-white shadow-card transition active:scale-[0.97] focus-ring"
          >
            <Sparkles size={19} aria-hidden="true" />
            Yes, show me around
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex h-11 w-full items-center justify-center rounded-full border border-glass-border bg-transparent text-sm font-medium text-text-secondary transition hover:bg-surface/50 focus-ring"
          >
            I'll figure it out
          </button>
        </div>
      </div>

      <style>{`
        @keyframes kai-tour-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(123,110,246,0.55), 0 8px 24px rgba(10,10,15,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(123,110,246,0), 0 8px 28px rgba(123,110,246,0.35); }
        }
        .kai-tour-cta { animation: kai-tour-pulse 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .kai-tour-cta { animation: none; } }
      `}</style>
    </div>
  );
}
