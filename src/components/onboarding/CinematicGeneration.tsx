// The premium "Kai is building something for you" sequence (PR 2).
//
// Pure visual — the persistence/generation work lives in PlanGenerationSequence,
// which drives this via `stepIndex`. Soft particles, a shimmer sweep, depth on
// the status lines (they cross-fade with translate + blur), and a building glow
// that intensifies as the system comes together. Self-contained styles (inline
// <style>) so this drops in without touching the global Tailwind config.

import { KaiOrb } from "../KaiOrb";
import { MagicField } from "../MagicField";

const STYLE = `
@keyframes kai-gen-shimmer {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
}
@keyframes kai-gen-line-in {
  0% { opacity: 0; transform: translateY(10px); filter: blur(6px); }
  100% { opacity: 1; transform: translateY(0); filter: blur(0); }
}
@keyframes kai-gen-drift {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translateY(-64px) scale(1.3); opacity: 0; }
}
.kai-gen-line { animation: kai-gen-line-in 620ms cubic-bezier(0.16,1,0.3,1) both; }
.kai-gen-shimmer { animation: kai-gen-shimmer 1.8s ease-in-out infinite; }
`;

// Deterministic soft particles (no Math.random — stable across renders/SSR).
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 7) * 0.5}s`,
  dur: `${4 + (i % 5)}s`,
  size: 3 + (i % 3),
}));

export function CinematicGeneration({
  stepIndex,
  steps,
}: {
  stepIndex: number;
  steps: string[];
}) {
  const total = steps.length;
  const progress = Math.min(100, Math.round(((stepIndex + 1) / total) * 100));
  // Glow intensifies as the system comes together.
  const glow = 28 + (stepIndex / Math.max(1, total - 1)) * 70;

  return (
    <div className="relative mx-auto flex h-[100vh] w-full max-w-md flex-col items-center justify-center overflow-hidden px-6 sm:max-w-lg">
      <MagicField />

      {/* Drifting particle layer for depth. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute bottom-1/3 rounded-full bg-accent/70"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              boxShadow: "0 0 10px rgba(123,110,246,0.8)",
              animation: `kai-gen-drift ${p.dur} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div
          className="relative"
          style={{ filter: `drop-shadow(0 0 ${glow}px rgba(123,110,246,0.55))`, transition: "filter 900ms ease-out" }}
        >
          <KaiOrb size={136} animate />
        </div>

        {/* Status line — cross-fades with depth on each step. */}
        <p
          key={stepIndex}
          className="kai-gen-line mt-9 min-h-[1.5rem] text-lg font-medium text-text-primary"
          aria-live="polite"
        >
          {steps[Math.min(stepIndex, total - 1)]}
        </p>

        {/* Building progress bar with a shimmer sweep. */}
        <div className="mt-6 h-1 w-56 overflow-hidden rounded-full bg-surface-muted/70">
          <div
            className="relative h-full rounded-full bg-accent transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          >
            <span className="kai-gen-shimmer absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        </div>
      </div>

      <style>{STYLE}</style>
    </div>
  );
}
