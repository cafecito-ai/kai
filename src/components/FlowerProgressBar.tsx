// FlowerProgressBar — a horizontal flower that grows with progress.
//
// The bar IS the flower: as progress climbs from 0 → 1, a stem grows
// from the left edge to the right, and a flower head at the leading
// edge starts as a small bud (same color as the eventual bloom) and
// opens into an 8-petal flower at 100%.
//
// Per-challenge colors:
//   The bloom palette is keyed off the challenge category (morning /
//   evening / body / mind / anchor) — each gets a distinct hue family
//   so the page reads at a glance which is which. Bud color matches
//   the bloom exactly — what you see growing is what you get.
//
// Realism touches:
//   - 8 teardrop petals (not flat ellipses) — feels like a daisy, not a
//     vector emoji
//   - Subtle radial gradient on each petal: lighter tip, darker base
//   - Center stamen with three pollen dots
//   - Two side leaves with a center vein line
//   - Drop shadow on the bloom to lift it off the stem

import { useId } from "react";

export type FlowerCategory = "morning" | "evening" | "body" | "mind" | "anchor";

type FlowerProgressBarProps = {
  /** Current value (e.g. days hit). */
  value: number;
  /** Target value (e.g. days needed to complete). */
  target: number;
  /** True if the challenge is complete — paints the full bloom. */
  completed?: boolean;
  /** Picks the flower color palette. Defaults to "anchor" (green-rooted). */
  category?: FlowerCategory;
  /** Optional readable label for screen readers, e.g. "Day 4 of 7". */
  ariaLabel?: string;
  className?: string;
};

// SVG viewBox dimensions. Wide-and-short so the flower head sits nicely
// next to the stem without dominating.
const VB_WIDTH = 240;
const VB_HEIGHT = 36;
// Stem runs horizontally at the vertical center.
const STEM_Y = VB_HEIGHT / 2;
// Reserve room at the right for the flower head so it doesn't clip.
const FLOWER_MARGIN_RIGHT = 22;
const STEM_X_START = 6;
const STEM_X_END = VB_WIDTH - FLOWER_MARGIN_RIGHT;
const STEM_LENGTH = STEM_X_END - STEM_X_START;

// Each palette: bloom color (the petals, the bud, the leading dot),
// stem color (slightly desaturated green tuned per category to harmonize
// with the bloom), and a deeper "shade" color for petal base shading.
const PALETTES: Record<FlowerCategory, { bloom: string; bloomShade: string; stem: string }> = {
  morning: { bloom: "#F0A868", bloomShade: "#C97E3F", stem: "#6FA86F" },  // marigold
  evening: { bloom: "#9B8AF0", bloomShade: "#6E5DC9", stem: "#6E8AA8" },  // violet
  body:    { bloom: "#E07B7B", bloomShade: "#B25151", stem: "#6FA88A" },  // rose
  mind:    { bloom: "#68C5B8", bloomShade: "#3F9890", stem: "#5AA0A8" },  // forget-me-not (teal)
  anchor:  { bloom: "#7BC58A", bloomShade: "#4D9763", stem: "#3D8556" },  // clover
};

// Pollen-yellow at the very center of the flower — same warm yellow for
// every palette so the bloom always has a sunny middle.
const CENTER_COLOR = "#FFE7A8";

export function FlowerProgressBar({
  value,
  target,
  completed,
  category = "anchor",
  ariaLabel,
  className = "",
}: FlowerProgressBarProps) {
  const safeTarget = Math.max(1, target);
  const fraction = Math.max(0, Math.min(1, value / safeTarget));
  const isDone = completed ?? fraction >= 1;
  const palette = PALETTES[category];

  // Per-instance ids so two flowers on the same page never collide on
  // their gradient defs.
  const reactId = useId();
  const petalGradId = `flower-${reactId}-petal`;
  const shadowFilterId = `flower-${reactId}-shadow`;

  // Where the stem's leading edge currently sits.
  const headX = STEM_X_START + STEM_LENGTH * fraction;

  // Bud grows 2.6 → 4.6 across the run; bloom scales up to 1.0 at done.
  const budRadius = 2.6 + 2.0 * fraction;
  const bloomScale = isDone ? 1 : 0;
  // Petals fade in slightly before completion so the bloom doesn't pop.
  const petalOpacity = isDone ? 1 : Math.max(0, fraction - 0.85) * 6.667;

  return (
    <svg
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={target}
      aria-label={ariaLabel ?? `${value} of ${target}`}
      viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
      preserveAspectRatio="none"
      className={`block h-8 w-full ${className}`}
    >
      <defs>
        {/* Petal gradient — light at the tip, deeper at the base. Gives
            each petal a sense of volume without being painterly. */}
        <radialGradient id={petalGradId} cx="50%" cy="100%" r="120%">
          <stop offset="0%" stopColor={palette.bloomShade} />
          <stop offset="55%" stopColor={palette.bloom} />
          <stop offset="100%" stopColor={palette.bloom} stopOpacity="0.92" />
        </radialGradient>
        {/* Soft drop shadow under the bloom — lifts it off the stem so
            it doesn't read as flat geometry. */}
        <filter id={shadowFilterId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.6" />
          <feOffset dx="0" dy="0.5" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.35" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Faint background track — same line the stem will fill. Keeps
          the bar from looking empty / broken at 0%. */}
      <line
        x1={STEM_X_START}
        y1={STEM_Y}
        x2={STEM_X_END}
        y2={STEM_Y}
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      />

      {/* The growing stem. Animated via stroke-dashoffset. */}
      <line
        x1={STEM_X_START}
        y1={STEM_Y}
        x2={STEM_X_END}
        y2={STEM_Y}
        stroke={palette.stem}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={STEM_LENGTH}
        strokeDashoffset={STEM_LENGTH * (1 - fraction)}
        style={{ transition: "stroke-dashoffset 500ms ease-out" }}
        aria-hidden="true"
      />

      {/* Two leaves with a center vein, only past 1/3 and 2/3. Keeps
          the early bar uncluttered. */}
      {fraction >= 0.33 && (
        <Leaf
          x={STEM_X_START + STEM_LENGTH * 0.32}
          y={STEM_Y}
          flip={false}
          color={palette.stem}
          shade={palette.bloomShade}
        />
      )}
      {fraction >= 0.66 && (
        <Leaf
          x={STEM_X_START + STEM_LENGTH * 0.62}
          y={STEM_Y}
          flip={true}
          color={palette.stem}
          shade={palette.bloomShade}
        />
      )}

      {/* The bud — same color as the bloom so what's growing matches
          what blooms. Hidden at exactly 0 (clean empty state). */}
      {fraction > 0 && (
        <circle
          cx={headX}
          cy={STEM_Y}
          r={budRadius}
          fill={palette.bloom}
          stroke={palette.bloomShade}
          strokeWidth="0.4"
          style={{ transition: "r 500ms ease-out, cx 500ms ease-out" }}
          aria-hidden="true"
        />
      )}

      {/* Full bloom — 8 teardrop petals + center stamen + pollen dots.
          Scales in from 0 → 1 with a slight delay (controlled by
          petalOpacity) so the moment feels earned. */}
      <g
        transform={`translate(${headX}, ${STEM_Y}) scale(${Math.max(bloomScale, petalOpacity)})`}
        style={{ transition: "transform 600ms ease-out, opacity 400ms ease-out" }}
        opacity={petalOpacity}
        filter={`url(#${shadowFilterId})`}
        aria-hidden="true"
      >
        {/* 8 petals at 45° intervals. Each petal is a teardrop drawn
            with quadratic curves — wider in the middle, pointed at the
            tip, anchored at the center. */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <path
            key={angle}
            d="M 0 0 Q 3 -4 1.8 -9 Q 0 -10.5 -1.8 -9 Q -3 -4 0 0 Z"
            fill={`url(#${petalGradId})`}
            transform={`rotate(${angle})`}
          />
        ))}
        {/* Center disc — pollen yellow. */}
        <circle cx="0" cy="0" r="2.6" fill={CENTER_COLOR} />
        {/* Pollen dots — three tiny dots scattered on the disc to
            suggest texture without looking dirty. */}
        <circle cx="0" cy="-0.5" r="0.45" fill={palette.bloomShade} opacity="0.55" />
        <circle cx="1.1" cy="0.6" r="0.4" fill={palette.bloomShade} opacity="0.45" />
        <circle cx="-1.1" cy="0.6" r="0.4" fill={palette.bloomShade} opacity="0.45" />
      </g>
    </svg>
  );
}

/** Side leaf with a center vein. Pointed teardrop, anchored to the stem. */
function Leaf({
  x,
  y,
  flip,
  color,
  shade,
}: {
  x: number;
  y: number;
  flip: boolean;
  color: string;
  shade: string;
}) {
  const dy = flip ? 8 : -8;
  // Leaf body — teardrop curving away from the stem.
  const body = `M ${x} ${y} Q ${x + 5} ${y + dy * 0.4} ${x + 2} ${y + dy} Q ${x - 4} ${y + dy * 0.5} ${x} ${y} Z`;
  // Vein — a single line down the middle of the leaf for realism.
  const vein = `M ${x} ${y} Q ${x + 0.5} ${y + dy * 0.5} ${x + 2} ${y + dy}`;
  return (
    <g aria-hidden="true" style={{ transition: "opacity 400ms ease-out" }}>
      <path d={body} fill={color} opacity="0.92" />
      <path d={vein} fill="none" stroke={shade} strokeWidth="0.35" opacity="0.55" />
    </g>
  );
}
