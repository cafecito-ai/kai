// Silhouette overlay for body-scan framing (T-028).
//
// Per CLAUDE_v3_PATCH §3:
//   - White outline at 40% opacity
//   - No filled shapes
//   - Neutral / non-gender-specific
//   - One overlay per angle (front / side / back)
//
// Stroke-only SVG, simple proportions. Not anatomy-accurate by design —
// it's a framing guide, not a body diagram.

import type { ScanAngle } from "../../lib/scan-storage";

export function SilhouetteOverlay({
  angle,
  className = "",
}: {
  angle: ScanAngle;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 400"
      className={className}
      stroke="white"
      strokeOpacity="0.4"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {angle === "front" && <FrontPath />}
      {angle === "side" && <SidePath />}
      {angle === "back" && <BackPath />}
    </svg>
  );
}

function FrontPath() {
  return (
    <g>
      {/* Head */}
      <circle cx="100" cy="50" r="22" />
      {/* Neck */}
      <path d="M 90 72 L 90 88 L 110 88 L 110 72" />
      {/* Torso */}
      <path d="M 60 95 L 75 88 L 90 88 L 110 88 L 125 88 L 140 95 L 138 200 L 62 200 Z" />
      {/* Arms */}
      <path d="M 60 95 L 50 160 L 48 220" />
      <path d="M 140 95 L 150 160 L 152 220" />
      {/* Legs */}
      <path d="M 80 200 L 75 320 L 78 380" />
      <path d="M 120 200 L 125 320 L 122 380" />
      {/* Center vertical line for symmetry */}
      <line x1="100" y1="72" x2="100" y2="200" />
    </g>
  );
}

function SidePath() {
  return (
    <g>
      {/* Head — profile */}
      <path d="M 100 30 Q 80 30 75 50 Q 75 70 90 75 Q 95 80 95 88" />
      {/* Neck */}
      <path d="M 95 88 L 95 100" />
      {/* Torso — slight S curve to suggest profile posture */}
      <path d="M 95 100 Q 80 130 88 200 L 88 220" />
      {/* Front of torso */}
      <path d="M 95 100 Q 115 130 108 200 L 108 220" />
      {/* Arm (closer side) */}
      <path d="M 95 105 L 92 165 L 95 215" />
      {/* Leg */}
      <path d="M 98 220 L 92 320 L 96 380" />
    </g>
  );
}

function BackPath() {
  return (
    <g>
      {/* Head */}
      <circle cx="100" cy="50" r="22" />
      {/* Neck */}
      <path d="M 90 72 L 90 88 L 110 88 L 110 72" />
      {/* Shoulders + torso */}
      <path d="M 60 95 L 75 88 L 90 88 L 110 88 L 125 88 L 140 95 L 138 200 L 62 200 Z" />
      {/* Arms */}
      <path d="M 60 95 L 50 160 L 48 220" />
      <path d="M 140 95 L 150 160 L 152 220" />
      {/* Legs */}
      <path d="M 80 200 L 75 320 L 78 380" />
      <path d="M 120 200 L 125 320 L 122 380" />
      {/* Spine line (back-specific cue) */}
      <line x1="100" y1="95" x2="100" y2="195" strokeDasharray="3 6" />
    </g>
  );
}
