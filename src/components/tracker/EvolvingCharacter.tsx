import { avatarTraitsForLevel } from "../../lib/avatar";

type Props = {
  level: number;
  /** When true, the level number + description are rendered as a caption. */
  showCaption?: boolean;
};

/**
 * Procedural placeholder for the Section 9.2 evolving character. Real art
 * is commissioned after plan decision D1 (visual direction) lands; until
 * then, every trait is computed from the level and rendered as inline SVG
 * so we never need a network round-trip for the avatar.
 *
 * Subtle pulse motion is gated on (level >= 7) AND not prefers-reduced-motion.
 * The reduced-motion check happens in CSS via the media-query rule below.
 */
export function EvolvingCharacter({ level, showCaption = false }: Props) {
  const traits = avatarTraitsForLevel(level);
  const radius = traits.size / 2 - 4;
  const eyeRadius = 2 + traits.eyeBrightness * 2.5;
  const mouthY = traits.size / 2 + 8;
  const mouthQ = traits.mouthCurve * 8;

  return (
    <div
      className="inline-flex flex-col items-center gap-2"
      aria-label={`Character level ${traits.level} — ${traits.description}`}
      role="img"
    >
      <svg
        width={traits.size + 24}
        height={traits.size + 24}
        viewBox={`0 0 ${traits.size + 24} ${traits.size + 24}`}
        className={traits.hasMotion ? "evolving-character--pulse motion-safe:animate-pulse" : ""}
      >
        {traits.hasAura && (
          <circle
            cx={(traits.size + 24) / 2}
            cy={(traits.size + 24) / 2}
            r={radius + 8}
            fill="none"
            stroke={traits.accentColor}
            strokeOpacity={0.25}
            strokeWidth={4}
          />
        )}
        {traits.hasBackground && (
          <g>
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const cx = (traits.size + 24) / 2 + Math.cos(angle) * (radius + 4);
              const cy = (traits.size + 24) / 2 + Math.sin(angle) * (radius + 4);
              return <circle key={i} cx={cx} cy={cy} r={1.5} fill={traits.accentColor} opacity={0.4} />;
            })}
          </g>
        )}
        <circle
          cx={(traits.size + 24) / 2}
          cy={(traits.size + 24) / 2}
          r={radius}
          fill={traits.bodyColor}
          stroke={traits.accentColor}
          strokeOpacity={0.5}
          strokeWidth={2}
        />
        {/* Eyes */}
        <circle
          cx={(traits.size + 24) / 2 - 8}
          cy={(traits.size + 24) / 2 - 4}
          r={eyeRadius}
          fill={traits.accentColor}
        />
        <circle
          cx={(traits.size + 24) / 2 + 8}
          cy={(traits.size + 24) / 2 - 4}
          r={eyeRadius}
          fill={traits.accentColor}
        />
        {/* Mouth */}
        {traits.mouthCurve === 0 ? (
          <line
            x1={(traits.size + 24) / 2 - 6}
            y1={mouthY}
            x2={(traits.size + 24) / 2 + 6}
            y2={mouthY}
            stroke={traits.accentColor}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        ) : (
          <path
            d={`M ${(traits.size + 24) / 2 - 6} ${mouthY} Q ${(traits.size + 24) / 2} ${mouthY + mouthQ} ${(traits.size + 24) / 2 + 6} ${mouthY}`}
            stroke={traits.accentColor}
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />
        )}
        {traits.hasAccessory && (
          <g transform={`translate(${(traits.size + 24) / 2 - 4} ${(traits.size + 24) / 2 - radius - 6})`}>
            <path d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3 Z" fill={traits.accentColor} />
          </g>
        )}
      </svg>
      {showCaption && (
        <div className="text-center">
          <p className="font-display text-sm font-black text-ink">Level {traits.level}</p>
          <p className="text-xs text-muted">{traits.description}</p>
        </div>
      )}
    </div>
  );
}
