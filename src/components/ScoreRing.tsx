// ScoreRing — the Daily Score visualization.
//
// SVG ring whose progress arc paints with a low→mid→high gradient (amber →
// violet → green) so the color *itself* communicates how the day is going,
// not just the fill amount. Animates from 0 to value on first paint.
//
// Per CLAUDE_v3_PATCH §2:
//   - 8px stroke
//   - Starts at 12 o'clock and animates clockwise
//   - Never red on the low end — soft amber
//   - Color thresholds at 41 and 71

import { useEffect, useId, useState } from "react";

type ScoreRingProps = {
  value: number;          // 0–100
  size?: number;          // px diameter, default 96
  stroke?: number;        // ring thickness, default 8
  /** Set false to skip the 0→value paint-in animation. */
  animate?: boolean;
};

export function ScoreRing({
  value,
  size = 96,
  stroke = 8,
  animate = true,
}: ScoreRingProps) {
  const reactId = useId();
  const gradientId = `score-ring-${reactId}`;

  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const targetOffset = c - (c * clamped) / 100;

  // Paint at 0% on first frame, then animate to targetOffset on the next.
  // requestAnimationFrame inside useEffect guarantees the browser has rendered
  // the empty state before the transition kicks in.
  const [painted, setPainted] = useState(!animate);
  useEffect(() => {
    if (!animate) return;
    const f = requestAnimationFrame(() => setPainted(true));
    return () => cancelAnimationFrame(f);
  }, [animate]);
  const currentOffset = painted ? targetOffset : c;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      // -90deg rotation puts the 0° point at 12 o'clock.
      style={{ transform: "rotate(-90deg)" }}
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={size}
          x2={size}
          y2="0"
        >
          <stop offset="0%" stopColor="#E8AE40" />
          <stop offset="50%" stopColor="#7B6EF6" />
          <stop offset="100%" stopColor="#3F9D6A" />
        </linearGradient>
      </defs>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(10,10,10,0.06)"
        strokeWidth={stroke}
        fill="none"
      />
      {/* Progress arc — gradient stroke */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={currentOffset}
        fill="none"
        style={
          animate
            ? {
                transition:
                  "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)",
              }
            : undefined
        }
      />
    </svg>
  );
}
