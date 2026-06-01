// MagicEffect — per-slide magical moments that play when the Welcome
// scene changes. Particles burst, converge, form shapes, summon visuals
// — different kind per beat so every slide feels like its own moment.
//
// Effects:
//   - burst        : 10 particles radiate out from KAI's hand position
//   - converge     : 10 particles fly IN from the edges toward KAI
//   - heart        : 16 particles arrange in a heart shape around KAI
//   - summon-right : 8 particles flow from KAI to a target on the right
//   - summon-left  : 8 particles flow from KAI to a target on the left
//   - starBurst    : 8 particles explode in a star pattern around KAI

import { useMemo } from "react";

export type MagicKind =
  | "burst"
  | "converge"
  | "heart"
  | "summon-right"
  | "summon-left"
  | "starBurst";

type MagicEffectProps = {
  kind: MagicKind;
  /** A re-key signal so the effect replays when the beat advances even
   *  if the kind is the same. Pass the beat index. */
  triggerKey: number;
};

const TINTS = ["violet", "teal", "warm"] as const;
type Tint = (typeof TINTS)[number];

function colorFor(tint: Tint): { fill: string; glow: string } {
  if (tint === "violet")
    return { fill: "rgba(123,110,246,0.95)", glow: "0 0 14px rgba(123,110,246,0.95)" };
  if (tint === "teal")
    return { fill: "rgba(104,197,184,0.95)", glow: "0 0 14px rgba(104,197,184,0.95)" };
  return { fill: "rgba(240,168,104,0.95)", glow: "0 0 14px rgba(240,168,104,0.95)" };
}

export function MagicEffect({ kind, triggerKey }: MagicEffectProps) {
  const particles = useMemo(() => buildParticles(kind), [kind]);
  return (
    <div
      key={triggerKey}
      className="pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden="true"
    >
      {particles.map((p, i) => {
        const c = colorFor(p.tint);
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: "50%",
              top: "50%",
              width: p.size,
              height: p.size,
              background: c.fill,
              boxShadow: c.glow,
              transform: "translate(-50%, -50%)",
              animationName: p.anim,
              animationDuration: `${p.duration}ms`,
              animationDelay: `${p.delay}ms`,
              animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              animationFillMode: "both",
              // CSS variables consumed by the @keyframes below.
              ["--tx" as string]: `${p.tx}px`,
              ["--ty" as string]: `${p.ty}px`,
              ["--fx" as string]: `${p.fx ?? -p.tx}px`,
              ["--fy" as string]: `${p.fy ?? -p.ty}px`,
            }}
          />
        );
      })}

      <style>{`
        /* BURST — particles fly outward from center and fade. */
        @keyframes magic-burst {
          0%   { transform: translate(-50%, -50%)                       scale(0.3); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.6); opacity: 0; }
        }
        /* CONVERGE — particles fly IN from edges toward center. */
        @keyframes magic-converge {
          0%   { transform: translate(calc(-50% + var(--fx)), calc(-50% + var(--fy))) scale(0.6); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: translate(-50%, -50%)                       scale(0.3); opacity: 0; }
        }
        /* HEART — each particle flies to a fixed point on a heart-shape,
           holds, then fades out softly. */
        @keyframes magic-heart {
          0%   { transform: translate(-50%, -50%)                       scale(0.2); opacity: 0; }
          25%  { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.1); opacity: 1; }
          70%  { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1);   opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.4); opacity: 0; }
        }
        /* SUMMON — particles flow OUT from center to a target point and
           settle there briefly, then fade. */
        @keyframes magic-summon {
          0%   { transform: translate(-50%, -50%)                       scale(0.4); opacity: 0; }
          20%  { opacity: 1; }
          80%  { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1);   opacity: 0.9; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

type Particle = {
  size: number;
  /** Final x offset from center, in px. */
  tx: number;
  ty: number;
  /** Start position for converge effects (defaults to inverse of tx/ty). */
  fx?: number;
  fy?: number;
  anim: string;
  duration: number;
  delay: number;
  tint: Tint;
};

function buildParticles(kind: MagicKind): Particle[] {
  switch (kind) {
    case "burst":
    case "starBurst":
      return Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const dist = kind === "starBurst" && i % 2 ? 90 : 140;
        return {
          size: 4 + (i % 3) * 2,
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist,
          anim: "magic-burst",
          duration: 1600,
          delay: (i % 4) * 60,
          tint: TINTS[i % 3] as Tint,
        };
      });
    case "converge":
      return Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const dist = 160;
        return {
          size: 4 + (i % 3) * 2,
          tx: 0,
          ty: 0,
          fx: Math.cos(angle) * dist,
          fy: Math.sin(angle) * dist,
          anim: "magic-converge",
          duration: 1800,
          delay: (i % 5) * 80,
          tint: TINTS[i % 3] as Tint,
        };
      });
    case "heart":
      return HEART_POINTS.map((pt, i) => ({
        size: 5 + (i % 3),
        tx: pt.x,
        ty: pt.y,
        anim: "magic-heart",
        duration: 2400,
        delay: i * 50,
        // The center of the heart is always warm; outer particles vary.
        tint: i % 3 === 0 ? "warm" : i % 3 === 1 ? "violet" : "teal",
      }));
    case "summon-right":
      return Array.from({ length: 8 }).map((_, i) => ({
        size: 4 + (i % 3) * 2,
        tx: 120 + ((i * 7) % 30),
        ty: -10 + ((i * 11) % 30) - 15,
        anim: "magic-summon",
        duration: 1500,
        delay: i * 70,
        tint: TINTS[i % 3] as Tint,
      }));
    case "summon-left":
      return Array.from({ length: 8 }).map((_, i) => ({
        size: 4 + (i % 3) * 2,
        tx: -120 - ((i * 7) % 30),
        ty: -10 + ((i * 11) % 30) - 15,
        anim: "magic-summon",
        duration: 1500,
        delay: i * 70,
        tint: TINTS[i % 3] as Tint,
      }));
  }
}

// 16 points arranged in a heart shape, centered around (0, 0).
// Derived from the classic parametric heart curve, hand-tuned for
// readability at this scale.
const HEART_POINTS: { x: number; y: number }[] = [
  // Top-left lobe arc
  { x: -38, y: -55 },
  { x: -58, y: -62 },
  { x: -72, y: -50 },
  { x: -78, y: -30 },
  { x: -68, y: -10 },
  // Left side dropping into the point
  { x: -48, y: 18 },
  { x: -24, y: 44 },
  // Bottom point
  { x: 0,   y: 60 },
  // Right side rising
  { x: 24,  y: 44 },
  { x: 48,  y: 18 },
  // Top-right lobe arc
  { x: 68,  y: -10 },
  { x: 78,  y: -30 },
  { x: 72,  y: -50 },
  { x: 58,  y: -62 },
  { x: 38,  y: -55 },
  // Top-middle dip
  { x: 0,   y: -38 },
];
