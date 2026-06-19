// MagicField — the ambient "KAI's mindscape" backdrop: an aurora-style
// rotating glow, a sparse sparkle field with varied sizes + bokeh blur for
// depth, and a soft horizon halo. Text contrast stays clean because every
// magical layer sits below ~30% opacity.
//
// Lifted out of Welcome.tsx so the merged onboarding flow can share the
// same backdrop. Zero props, pointer-events-none, aria-hidden.

import { useMemo } from "react";

export function MagicField() {
  // 12 sparkles with deterministic positions, varied size, blur level
  // (some are bokeh — soft and large, some are sharp — small and bright),
  // and varied drift directions.
  const sparks = useMemo(() => {
    const out: {
      x: number;
      y: number;
      size: number;
      delay: number;
      blur: boolean;
      tint: "violet" | "teal" | "warm";
      drift: number;
    }[] = [];
    for (let i = 0; i < 12; i += 1) {
      const tintIdx = (i * 7) % 3;
      out.push({
        x: ((i * 7919) % 100) / 100,
        y: ((i * 4253) % 100) / 100,
        size: 2 + ((i * 13) % 6) * 1.2, // 2 → 8 px
        delay: ((i * 17) % 50) / 10,
        blur: i % 3 === 0,
        tint: tintIdx === 0 ? "violet" : tintIdx === 1 ? "teal" : "warm",
        drift: ((i * 11) % 5) - 2, // -2 → 2 (horizontal drift while rising)
      });
    }
    return out;
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Aurora rays — soft rotating conic gradient. */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 kai-aurora"
        style={{
          width: "180%",
          height: "180%",
          background:
            "conic-gradient(from 0deg at 50% 50%, rgba(123,110,246,0) 0deg, rgba(123,110,246,0.10) 40deg, rgba(155,138,240,0) 80deg, rgba(104,197,184,0.08) 140deg, rgba(123,110,246,0) 200deg, rgba(240,168,104,0.06) 260deg, rgba(123,110,246,0) 320deg, rgba(123,110,246,0) 360deg)",
          filter: "blur(50px)",
        }}
      />

      {/* Horizon halo — soft pool of accent light at the bottom. */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/5"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(123, 110, 246, 0.22) 0%, rgba(123, 110, 246, 0) 70%)",
        }}
      />

      {/* Sparkle field — each drifts upward with a slight horizontal wander. */}
      {sparks.map((s, i) => {
        const color =
          s.tint === "violet"
            ? "rgba(123,110,246,0.85)"
            : s.tint === "teal"
              ? "rgba(104,197,184,0.85)"
              : "rgba(240,168,104,0.85)";
        const glow =
          s.tint === "violet"
            ? "0 0 12px rgba(123,110,246,0.8)"
            : s.tint === "teal"
              ? "0 0 12px rgba(104,197,184,0.8)"
              : "0 0 12px rgba(240,168,104,0.8)";
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.x * 100}%`,
              top: `${s.y * 100}%`,
              width: s.size,
              height: s.size,
              background: color,
              boxShadow: glow,
              filter: s.blur ? "blur(2px)" : undefined,
              ["--drift" as string]: `${s.drift * 10}px`,
              animation: `kai-magic-drift 7000ms ease-in-out ${s.delay}s infinite`,
            }}
          />
        );
      })}

      <style>{`
        @keyframes kai-aurora {
          0%   { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .kai-aurora {
          animation: kai-aurora 60s linear infinite;
        }
        @keyframes kai-magic-drift {
          0%        { transform: translate(0, 0)               scale(0.4); opacity: 0; }
          20%       { opacity: 1; }
          80%       { opacity: 1; }
          100%      { transform: translate(var(--drift), -120px) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
