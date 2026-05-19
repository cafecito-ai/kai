// KaiOrb — KAI's visible "face" across the app.
//
// A breathing radial gradient (cool → violet → warm) with a soft inner
// highlight. Used at three sizes: chat avatar (28px), home / reflection
// card (44–56px), and voice mode hero (180–240px). Same component,
// scales cleanly because it's SVG.
//
// Animation: tailwind's `animate-breathe` (4s ease-in-out loop, defined
// in tailwind.config.js).

import { useId } from "react";

type KaiOrbProps = {
  /** Pixel size of the rendered orb. Defaults to 44. */
  size?: number;
  /** Set false to render a still orb (e.g., for screenshots or low-motion). */
  animate?: boolean;
  /** Optional aria-label. KAI's voice presence is decorative by default. */
  label?: string;
  className?: string;
};

export function KaiOrb({
  size = 44,
  animate = true,
  label,
  className = "",
}: KaiOrbProps) {
  // Each orb instance needs its own gradient id so multiple orbs on the page
  // don't share the same <defs> by accident. React's useId gives us a stable
  // id across renders and SSR.
  const reactId = useId();
  const gradientId = `kai-orb-${reactId}-body`;
  const highlightId = `kai-orb-${reactId}-highlight`;
  const glowId = `kai-orb-${reactId}-glow`;

  return (
    <span
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block ${animate ? "animate-breathe" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={gradientId} cx="35%" cy="32%" r="80%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="22%" stopColor="#A6E6DC" />
            <stop offset="55%" stopColor="#68C5B8" />
            <stop offset="78%" stopColor="#7B6EF6" />
            <stop offset="100%" stopColor="#F0A868" />
          </radialGradient>
          <radialGradient id={highlightId} cx="30%" cy="25%" r="35%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#7B6EF6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#7B6EF6" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Outer soft glow */}
        <circle cx="50" cy="50" r="50" fill={`url(#${glowId})`} />
        {/* Body */}
        <circle cx="50" cy="50" r="42" fill={`url(#${gradientId})`} />
        {/* Specular highlight */}
        <circle cx="50" cy="50" r="42" fill={`url(#${highlightId})`} />
        {/* Hairline border for crisp edge on light backgrounds */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="rgba(10,10,10,0.04)"
          strokeWidth="1"
        />
      </svg>
    </span>
  );
}

