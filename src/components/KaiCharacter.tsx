// KaiCharacter — KAI with a body, not just a floating head.
//
// Wraps the existing KaiOrb (head) with an ethereal wisp-body below and
// two floating hand-orbs at the sides. The whole composite reads as a
// glowing spirit guide rather than a disembodied avatar.
//
// All sizes scale off a single `size` prop = the total head-to-toe
// height in pixels. The body wisp tapers to a translucent point at the
// bottom; the hands bob gently and react when KAI is "speaking."

import { useId } from "react";

import { KaiOrb } from "./KaiOrb";

type KaiCharacterProps = {
  /** Total height of the character (head + body) in pixels. */
  size?: number;
  /** Show the smile/eyes on the head. Defaults to true at size ≥ 80
   *  (matches KaiOrb's own threshold). */
  face?: boolean;
  /** When true, hands gesture more actively + the body pulses with
   *  the rhythm of speech. */
  speaking?: boolean;
  /** Pass-through to KaiOrb — disable the breathing animation if
   *  rendering in a static context (screenshot, accessibility-low-motion). */
  animate?: boolean;
  className?: string;
};

export function KaiCharacter({
  size = 220,
  face,
  speaking = false,
  animate = true,
  className = "",
}: KaiCharacterProps) {
  // The head takes ~55% of the character's vertical extent; the body
  // wisp takes the remaining ~70% (overlap with the head for natural blend).
  const headSize = Math.round(size * 0.55);
  const containerHeight = Math.round(size * 1.05);
  const reactId = useId();
  const bodyGradId = `kai-body-${reactId}`;
  const handGradId = `kai-hand-${reactId}`;

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: containerHeight }}
      aria-hidden="true"
    >
      {/* BODY — a wisp/robe that flows down from the head, tapering
          to translucency. Drawn behind everything else. */}
      <svg
        viewBox="0 0 200 280"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-x-0 pointer-events-none"
        style={{
          top: headSize * 0.55,
          width: "100%",
          height: containerHeight - headSize * 0.55,
        }}
      >
        <defs>
          <linearGradient id={bodyGradId} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#7B6EF6" stopOpacity="0.55" />
            <stop offset="40%" stopColor="#9B8AF0" stopOpacity="0.35" />
            <stop offset="80%" stopColor="#68C5B8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#68C5B8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={handGradId} cx="35%" cy="32%" r="80%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#A6E6DC" />
            <stop offset="70%" stopColor="#7B6EF6" />
            <stop offset="100%" stopColor="#F0A868" stopOpacity="0.8" />
          </radialGradient>
        </defs>
        {/* The robe — a flowing teardrop shape. Drawn with quadratic
            curves so the silhouette feels organic, not geometric. */}
        <path
          d="
            M 100 0
            Q 60 30 55 90
            Q 50 160 70 220
            Q 85 260 100 270
            Q 115 260 130 220
            Q 150 160 145 90
            Q 140 30 100 0 Z
          "
          fill={`url(#${bodyGradId})`}
          className={animate ? "kai-body-sway" : ""}
        />
        {/* Two soft sleeve trails — hints of arms hanging at the sides */}
        <path
          d="M 65 70 Q 35 110 55 170 Q 70 180 70 130 Q 70 95 65 70 Z"
          fill={`url(#${bodyGradId})`}
          opacity="0.7"
        />
        <path
          d="M 135 70 Q 165 110 145 170 Q 130 180 130 130 Q 130 95 135 70 Z"
          fill={`url(#${bodyGradId})`}
          opacity="0.7"
        />
      </svg>

      {/* HANDS — two small floating orbs, one on each side, at the
          natural arm-end position relative to the body. Bob in place;
          gesture more actively when speaking. */}
      <div
        className={`absolute pointer-events-none ${animate ? (speaking ? "kai-hand-gesture-l" : "kai-hand-idle-l") : ""}`}
        style={{
          left: size * 0.04,
          top: size * 0.78,
          width: size * 0.16,
          height: size * 0.16,
        }}
      >
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <circle cx="20" cy="20" r="18" fill={`url(#${handGradId})`} />
          <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(10,10,10,0.04)" strokeWidth="1" />
        </svg>
      </div>
      <div
        className={`absolute pointer-events-none ${animate ? (speaking ? "kai-hand-gesture-r" : "kai-hand-idle-r") : ""}`}
        style={{
          right: size * 0.04,
          top: size * 0.78,
          width: size * 0.16,
          height: size * 0.16,
        }}
      >
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <circle cx="20" cy="20" r="18" fill={`url(#${handGradId})`} />
          <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(10,10,10,0.04)" strokeWidth="1" />
        </svg>
      </div>

      {/* HEAD — the existing KaiOrb, anchored at the top center. */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: 0 }}
      >
        <KaiOrb size={headSize} face={face} animate={animate} />
      </div>

      <style>{`
        @keyframes kai-body-sway {
          0%, 100% { transform: translateY(0)   rotate(-1.5deg); transform-origin: 50% 0%; }
          50%      { transform: translateY(-2px) rotate(1.5deg);  transform-origin: 50% 0%; }
        }
        .kai-body-sway {
          animation: kai-body-sway 5200ms ease-in-out infinite;
          transform-box: fill-box;
        }
        /* Hands idle — slow vertical bob with a slight horizontal drift,
           opposite phase between left/right so the character feels alive. */
        @keyframes kai-hand-idle-l {
          0%, 100% { transform: translate(0,    0); }
          50%      { transform: translate(-2px, -8px); }
        }
        @keyframes kai-hand-idle-r {
          0%, 100% { transform: translate(0,   0); }
          50%      { transform: translate(2px, -8px); }
        }
        .kai-hand-idle-l { animation: kai-hand-idle-l 3600ms ease-in-out infinite; }
        .kai-hand-idle-r { animation: kai-hand-idle-r 3600ms ease-in-out infinite; }
        /* Hands gesture — more active sweep when speaking, slight rotation
           so it reads as "talking with my hands." */
        @keyframes kai-hand-gesture-l {
          0%, 100% { transform: translate(-2px,  -2px) rotate(-4deg); }
          50%      { transform: translate(-10px, -16px) rotate(6deg); }
        }
        @keyframes kai-hand-gesture-r {
          0%, 100% { transform: translate(2px,  -2px) rotate(4deg); }
          50%      { transform: translate(10px, -16px) rotate(-6deg); }
        }
        .kai-hand-gesture-l { animation: kai-hand-gesture-l 2200ms ease-in-out infinite; }
        .kai-hand-gesture-r { animation: kai-hand-gesture-r 2200ms ease-in-out infinite; }
      `}</style>
    </div>
  );
}
