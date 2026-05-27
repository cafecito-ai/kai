// FlowerProgressBar — a horizontal flower that grows with progress.
//
// The bar IS the flower: as progress climbs from 0 → 1, a stem grows
// from the left edge to the right, and a flower head at the leading
// edge starts as a small bud and blooms into a full open flower at
// 100%. Designed for the challenges page (Rawz/6) but reusable.
//
// Why an SVG rather than a CSS-only bar: we want the flower head to
// scale + rotate its petals as progress changes, which is awkward to
// pull off with just a div. SVG lets the whole composition share one
// coordinate space.
//
// Accessibility: rendered with proper progressbar ARIA so screen
// readers announce "Day 4 of 7" or whatever the caller passes.

type FlowerProgressBarProps = {
  /** Current value (e.g. days hit). */
  value: number;
  /** Target value (e.g. days needed to complete). */
  target: number;
  /** True if the challenge is complete — paints the full bloom. */
  completed?: boolean;
  /** Optional readable label for screen readers, e.g. "Day 4 of 7". */
  ariaLabel?: string;
  className?: string;
};

// SVG viewBox dimensions. Wide-and-short so the flower head sits nicely
// next to the stem without dominating.
const VB_WIDTH = 240;
const VB_HEIGHT = 32;
// Stem runs horizontally at the vertical center.
const STEM_Y = VB_HEIGHT / 2;
// Reserve room at the right for the flower head so it doesn't clip.
const FLOWER_MARGIN_RIGHT = 18;
const STEM_X_START = 6;
const STEM_X_END = VB_WIDTH - FLOWER_MARGIN_RIGHT;
const STEM_LENGTH = STEM_X_END - STEM_X_START;

export function FlowerProgressBar({
  value,
  target,
  completed,
  ariaLabel,
  className = "",
}: FlowerProgressBarProps) {
  const safeTarget = Math.max(1, target);
  const fraction = Math.max(0, Math.min(1, value / safeTarget));
  const isDone = completed ?? fraction >= 1;

  // Where the stem's leading edge currently sits.
  const headX = STEM_X_START + STEM_LENGTH * fraction;

  // Flower head transitions:
  //   fraction = 0       → invisible (no bud yet — bar is empty)
  //   0 < fraction < 1   → small closed bud, scales up as we go
  //   fraction = 1       → full bloom with petals
  // Bud size grows 2.5 → 4.5 across the run; bloom is bigger.
  const budRadius = 2.5 + 2.0 * fraction;
  const bloomScale = isDone ? 1 : 0;
  // Petals fade in slightly before completion so the bloom doesn't pop.
  const petalOpacity = isDone ? 1 : Math.max(0, fraction - 0.85) * 6.667;

  // Stem color: warm green normally, soft success-green when complete.
  const stemColor = isDone ? "var(--flower-stem-done, #5EBF8A)" : "var(--flower-stem, #68B58F)";
  const budColor = isDone ? "var(--flower-bloom, #F0A868)" : "var(--flower-bud, #F4B9D5)";

  return (
    <svg
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={target}
      aria-label={ariaLabel ?? `${value} of ${target}`}
      viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
      preserveAspectRatio="none"
      className={`block h-7 w-full ${className}`}
    >
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

      {/* The growing stem. Animated via CSS transition on the x2 attr's
          effective length — since we can't transition x2 directly across
          all browsers, we use stroke-dasharray + dashoffset. */}
      <line
        x1={STEM_X_START}
        y1={STEM_Y}
        x2={STEM_X_END}
        y2={STEM_Y}
        stroke={stemColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={STEM_LENGTH}
        strokeDashoffset={STEM_LENGTH * (1 - fraction)}
        style={{ transition: "stroke-dashoffset 500ms ease-out" }}
        aria-hidden="true"
      />

      {/* Bud / flower head at the leading edge of the stem. Two small
          leaves only show once we're at least 1/3 of the way — keeps
          the early bar uncluttered. */}
      {fraction >= 0.33 && (
        <Leaf
          x={STEM_X_START + STEM_LENGTH * 0.32}
          y={STEM_Y}
          flip={false}
          color={stemColor}
        />
      )}
      {fraction >= 0.66 && (
        <Leaf
          x={STEM_X_START + STEM_LENGTH * 0.62}
          y={STEM_Y}
          flip={true}
          color={stemColor}
        />
      )}

      {/* The bud — a single circle at the head of the stem. */}
      {fraction > 0 && (
        <circle
          cx={headX}
          cy={STEM_Y}
          r={budRadius}
          fill={budColor}
          style={{ transition: "r 500ms ease-out, cx 500ms ease-out, fill 400ms ease-out" }}
          aria-hidden="true"
        />
      )}

      {/* The full bloom — 5 petals around the bud. Opacity fades in over
          the last 15% so completion feels earned, not instant. */}
      <g
        transform={`translate(${headX}, ${STEM_Y}) scale(${Math.max(bloomScale, petalOpacity)})`}
        style={{ transition: "transform 600ms ease-out, opacity 400ms ease-out" }}
        opacity={petalOpacity}
        aria-hidden="true"
      >
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse
            key={angle}
            cx="0"
            cy="-6"
            rx="3.2"
            ry="5"
            fill={budColor}
            transform={`rotate(${angle})`}
          />
        ))}
        {/* Inner dot covers the petal joint so it reads as one flower. */}
        <circle cx="0" cy="0" r="2.4" fill="var(--flower-center, #FFE7A8)" />
      </g>
    </svg>
  );
}

/** A tiny leaf attached to the stem. Two short curves making a teardrop. */
function Leaf({
  x,
  y,
  flip,
  color,
}: {
  x: number;
  y: number;
  flip: boolean;
  color: string;
}) {
  // Leaf points up if flip=false (above the stem), down if flip=true.
  const dy = flip ? 6 : -6;
  return (
    <path
      d={`M ${x} ${y} Q ${x + 4} ${y + dy / 2} ${x + 1} ${y + dy} Q ${x - 3} ${y + dy / 2} ${x} ${y}`}
      fill={color}
      opacity="0.85"
      aria-hidden="true"
      style={{ transition: "opacity 400ms ease-out" }}
    />
  );
}
