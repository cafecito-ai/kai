// /welcome — the cinematic intro to KAI.
//
// This is the moment that has to land: KAI swoops in, says hi, walks
// you through what matters, and tells you they're here for you. It's a
// short movie, not a tutorial. ~40 seconds end-to-end, auto-advances,
// tap to skip ahead.
//
// Each scene has:
//   - a position (KAI floats to a different spot on the canvas)
//   - a gesture (wave / point / reach / talk / idle)
//   - a visual element that fades in alongside
//   - a single line that the user reads while KAI gestures
//
// The character is one persistent instance — it MOVES between scenes
// with smooth transforms, never remounts. Story flows continuous.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  Flame,
  Heart,
  Moon,
  Sparkles,
  Target,
} from "lucide-react";

import { KaiCharacter } from "../components/KaiCharacter";
import { ScoreRing } from "../components/ScoreRing";
import { useUserStore } from "../stores/userStore";

const STORAGE_KEY = "kai_walkthrough_seen_v1";

type Gesture = "wave" | "point" | "reach" | "idle" | "talk";

type Beat = {
  /** Line KAI says on this beat. Multiple beats can share a scene. */
  line: string;
  /** Where the character sits on the canvas this beat. Pixels of
   *  horizontal offset from center; positive = right. */
  kaiOffsetX: number;
  /** Vertical position as a % of canvas. 0.4 = upper-middle, 0.5 = middle. */
  kaiTopPct: number;
  /** Character scale. 1.0 = default, 1.15 = hero, 0.85 = small. */
  kaiScale: number;
  /** Gesture for KAI's hands during this beat. */
  gesture: Gesture;
  /** Optional visual element that fades in next to KAI. */
  visual?: React.ReactNode;
  /** Horizontal offset for the visual element (px from center). */
  visualOffsetX?: number;
  /** Vertical position for the visual element (% of canvas). */
  visualTopPct?: number;
  /** How long this beat stays on screen before auto-advancing (ms). */
  holdMs: number;
};

export function Welcome() {
  const navigate = useNavigate();
  const { onboardingCompletedAt } = useUserStore();
  const [idx, setIdx] = useState(0);
  const [showFinishCta, setShowFinishCta] = useState(false);

  useEffect(() => {
    if (onboardingCompletedAt) {
      navigate("/home", { replace: true });
    }
  }, [navigate, onboardingCompletedAt]);

  const beats = useMemo(() => buildBeats(), []);
  const beat = beats[idx];
  const isLast = idx >= beats.length - 1;

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* no-op */
    }
    navigate(onboardingCompletedAt ? "/home" : "/onboarding", { replace: true });
  }

  function advance() {
    if (!isLast) {
      setIdx((i) => i + 1);
    } else {
      // On the final beat, the "Let's go" button takes over — we don't
      // auto-finish from a tap-on-canvas because the user should commit
      // by pressing the explicit CTA.
      setShowFinishCta(true);
    }
  }

  // Auto-advance through beats. Final beat: hold, then show the
  // explicit "Let's go" CTA instead of auto-navigating.
  useEffect(() => {
    if (!beat) return;
    const t = window.setTimeout(() => {
      if (isLast) {
        setShowFinishCta(true);
      } else {
        setIdx((i) => i + 1);
      }
    }, beat.holdMs);
    return () => window.clearTimeout(t);
  }, [idx, beat, isLast]);

  // Touch swipe — fast forward through scenes.
  const touchStart = { x: 0 };
  function onTouchStart(e: React.TouchEvent) {
    touchStart.x = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStart.x;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) advance();
  }

  return (
    <div
      className="
        relative mx-auto flex h-[100vh] w-full max-w-md flex-col px-5 pt-3 pb-6
        sm:max-w-lg cursor-pointer select-none overflow-hidden
      "
      onClick={advance}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header: progress dots + Skip */}
      <header className="relative z-20 flex items-center justify-between pb-3">
        <div className="flex items-center gap-1.5">
          {beats.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`
                h-1.5 rounded-full transition-all duration-500
                ${i === idx ? "w-5 bg-text-primary" : i < idx ? "w-1.5 bg-text-primary/60" : "w-1.5 bg-surface-muted"}
              `}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            finish();
          }}
          className="
            text-xs font-medium text-text-secondary
            transition hover:text-text-primary focus-ring rounded
          "
        >
          Skip
        </button>
      </header>

      {/* THE STAGE — canvas where KAI flies around. Everything inside is
          absolutely positioned and transitions between beats. */}
      <div className="relative flex-1">
        {/* Floating sparkles drift the whole flow */}
        <Sparkles6 />

        {/* The visual element for the current beat — appears next to
            KAI and fades when scene changes. */}
        {beat.visual && (
          <div
            key={`visual-${idx}`}
            className="kai-visual-pop absolute"
            style={{
              left: "50%",
              top: `${(beat.visualTopPct ?? 0.35) * 100}%`,
              transform: `translate(calc(-50% + ${beat.visualOffsetX ?? 0}px), -50%)`,
            }}
          >
            {beat.visual}
          </div>
        )}

        {/* KAI — persistent across all beats. Position + scale animate
            smoothly via CSS transitions. The character itself never
            unmounts. */}
        <div
          className="absolute z-10 kai-fly-in"
          style={{
            left: "50%",
            top: `${beat.kaiTopPct * 100}%`,
            transform: `translate(calc(-50% + ${beat.kaiOffsetX}px), -50%) scale(${beat.kaiScale})`,
            transition: "transform 1500ms cubic-bezier(0.16, 1, 0.3, 1), top 1500ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Halo behind KAI */}
          <div
            className="
              pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2
              h-[140%] w-[140%] rounded-full bg-accent/25 blur-3xl
              kai-halo-pulse
            "
            aria-hidden="true"
          />
          <KaiCharacter size={220} face speaking gesture={beat.gesture} />
        </div>

        {/* The line — pinned to the bottom third, fade-pops per beat */}
        <div className="absolute inset-x-0 bottom-[18%] flex justify-center px-2">
          <p
            key={`line-${idx}`}
            className="kai-line-pop max-w-xs text-center font-display text-3xl font-medium leading-snug tracking-tight text-text-primary sm:max-w-md sm:text-4xl"
            aria-live="polite"
          >
            {beat.line}
          </p>
        </div>

        {/* Final-beat CTA — explicit commitment to start onboarding */}
        {showFinishCta && (
          <div className="absolute inset-x-0 bottom-6 flex justify-center px-5 kai-line-pop">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                finish();
              }}
              className="
                flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-full
                bg-text-primary text-background text-lg font-semibold
                shadow-card transition active:scale-[0.99] focus-ring
              "
            >
              Let's go
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* First-beat hint */}
        {idx === 0 && !showFinishCta && (
          <p
            className="
              absolute bottom-4 left-1/2 -translate-x-1/2
              font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted
              animate-pulse kai-tap-hint
            "
            aria-hidden="true"
          >
            tap anywhere to advance
          </p>
        )}
      </div>

      <style>{`
        /* KAI flies in from above on first render — a real entrance,
           not a fade. Only happens once because the character never
           remounts. */
        @keyframes kai-fly-in {
          0%   { opacity: 0; transform: translate(calc(-50% + 60px), calc(-50% - 200px)) scale(0.5) rotate(-12deg); filter: blur(8px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { /* transform managed by parent style — handoff to live position */ }
        }
        .kai-fly-in {
          animation: kai-fly-in 1600ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes kai-halo-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1);    opacity: 0.7; }
          50%      { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
        }
        .kai-halo-pulse {
          animation: kai-halo-pulse 2600ms ease-in-out infinite;
        }

        @keyframes kai-line-pop {
          0%   { transform: translateY(14px) scale(0.96); opacity: 0; filter: blur(6px); }
          100% { transform: translateY(0)    scale(1);    opacity: 1; filter: blur(0); }
        }
        .kai-line-pop {
          animation: kai-line-pop 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes kai-visual-pop {
          0%   { transform: translate(calc(-50% + var(--vx, 0)), -50%) scale(0.7); opacity: 0; filter: blur(6px); }
          100% { transform: translate(calc(-50% + var(--vx, 0)), -50%) scale(1);   opacity: 1; filter: blur(0); }
        }
        .kai-visual-pop {
          animation: kai-visual-pop 800ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes kai-tap-hint {
          0%, 70%  { opacity: 0.6; }
          100%     { opacity: 0; }
        }
        .kai-tap-hint {
          animation: kai-tap-hint 5500ms ease-out forwards;
        }

        @keyframes kai-sparkle-rise {
          0%   { transform: translateY(0)     scale(0.6); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(-100px) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// The story — beat by beat
// ─────────────────────────────────────────────────────────────────────

function buildBeats(): Beat[] {
  return [
    // ── ACT 1 — The arrival + the tagline ─────────────────────────
    { line: "Stop waiting.",        kaiOffsetX: 0,   kaiTopPct: 0.38, kaiScale: 1.15, gesture: "wave",  holdMs: 2400 },
    { line: "Start becoming.",      kaiOffsetX: 0,   kaiTopPct: 0.38, kaiScale: 1.15, gesture: "wave",  holdMs: 2600 },
    { line: "I'm KAI.",             kaiOffsetX: 0,   kaiTopPct: 0.40, kaiScale: 1.10, gesture: "talk",  holdMs: 2200 },
    { line: "We're doing this together.", kaiOffsetX: 0, kaiTopPct: 0.40, kaiScale: 1.10, gesture: "reach", holdMs: 2800 },

    // ── ACT 2 — The score ─────────────────────────────────────────
    {
      line: "Every day, you get a score.",
      kaiOffsetX: -80, kaiTopPct: 0.42, kaiScale: 0.9, gesture: "point",
      visual: <ScoreVisual />, visualOffsetX: 80, visualTopPct: 0.38,
      holdMs: 2800,
    },
    {
      line: "How today's going. Resets in the morning.",
      kaiOffsetX: -80, kaiTopPct: 0.42, kaiScale: 0.9, gesture: "point",
      visual: <ScoreVisual />, visualOffsetX: 80, visualTopPct: 0.38,
      holdMs: 3200,
    },

    // ── ACT 3 — The pillars ───────────────────────────────────────
    {
      line: "Three things feed it.",
      kaiOffsetX: 0, kaiTopPct: 0.55, kaiScale: 0.85, gesture: "talk",
      visual: <PillarsVisual />, visualOffsetX: 0, visualTopPct: 0.25,
      holdMs: 2400,
    },
    {
      line: "How you feel, sleep, and move.",
      kaiOffsetX: 0, kaiTopPct: 0.55, kaiScale: 0.85, gesture: "talk",
      visual: <PillarsVisual />, visualOffsetX: 0, visualTopPct: 0.25,
      holdMs: 3000,
    },

    // ── ACT 4 — Show up. No drama. ───────────────────────────────
    {
      line: "Show up.",
      kaiOffsetX: 70, kaiTopPct: 0.40, kaiScale: 0.95, gesture: "talk",
      visual: <FlameVisual />, visualOffsetX: -70, visualTopPct: 0.40,
      holdMs: 1800,
    },
    {
      line: "That's the whole thing.",
      kaiOffsetX: 70, kaiTopPct: 0.40, kaiScale: 0.95, gesture: "talk",
      visual: <FlameVisual />, visualOffsetX: -70, visualTopPct: 0.40,
      holdMs: 2200,
    },
    {
      line: "Miss a day? Fresh start, no drama.",
      kaiOffsetX: 70, kaiTopPct: 0.40, kaiScale: 0.95, gesture: "reach",
      visual: <FlameVisual />, visualOffsetX: -70, visualTopPct: 0.40,
      holdMs: 3000,
    },

    // ── ACT 5 — Become someone ──────────────────────────────────
    {
      line: "Pick who you wanna be.",
      kaiOffsetX: -70, kaiTopPct: 0.42, kaiScale: 0.9, gesture: "point",
      visual: <GoalVisual />, visualOffsetX: 70, visualTopPct: 0.42,
      holdMs: 2800,
    },
    {
      line: "I'll help you live it.",
      kaiOffsetX: -70, kaiTopPct: 0.42, kaiScale: 0.9, gesture: "reach",
      visual: <GoalVisual />, visualOffsetX: 70, visualTopPct: 0.42,
      holdMs: 2800,
    },

    // ── ACT 6 — Climax: this is our thing ───────────────────────
    { line: "This is our thing now.",  kaiOffsetX: 0, kaiTopPct: 0.40, kaiScale: 1.15, gesture: "reach", holdMs: 2800 },
    { line: "I'm here for you.",       kaiOffsetX: 0, kaiTopPct: 0.40, kaiScale: 1.20, gesture: "reach", holdMs: 2800 },
    { line: "Whenever it gets loud.",  kaiOffsetX: 0, kaiTopPct: 0.40, kaiScale: 1.20, gesture: "reach", holdMs: 2800 },
    { line: "Let's go.",               kaiOffsetX: 0, kaiTopPct: 0.40, kaiScale: 1.20, gesture: "wave",  holdMs: 3000 },
  ];
}

// ─────────────────────────────────────────────────────────────────────
// Visual elements (small floating cards / chips KAI gestures toward)
// ─────────────────────────────────────────────────────────────────────

function ScoreVisual() {
  return (
    <div className="relative">
      <ScoreRing value={72} size={82} stroke={7} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <p className="font-mono text-2xl font-bold leading-none tabular-nums text-text-primary">
          72
        </p>
      </div>
    </div>
  );
}

function PillarsVisual() {
  return (
    <div className="flex items-center gap-2">
      <Pillar icon={Brain} tint="bg-accent-cool-soft text-accent-cool" />
      <Pillar icon={Moon} tint="bg-accent-soft text-accent" />
      <Pillar icon={Heart} tint="bg-accent-warm-soft text-accent-warm" />
    </div>
  );
}

function FlameVisual() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-accent-warm/30 blur-2xl" aria-hidden="true" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent-warm-soft">
        <Flame size={28} className="text-accent-warm" aria-hidden="true" strokeWidth={1.6} />
      </div>
    </div>
  );
}

function GoalVisual() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-glass-border bg-surface px-3 py-2 shadow-card">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-cool-soft">
        <Target size={11} className="text-accent-cool" aria-hidden="true" />
      </span>
      <p className="text-xs font-medium text-text-primary">Someone who moves daily</p>
    </div>
  );
}

function Pillar({ icon: Icon, tint }: { icon: typeof Brain; tint: string }) {
  return (
    <div
      className={`
        flex h-14 w-14 items-center justify-center
        rounded-glass border border-glass-border shadow-card
        ${tint}
      `}
    >
      <Icon size={20} aria-hidden="true" strokeWidth={1.6} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sparkles
// ─────────────────────────────────────────────────────────────────────

function Sparkles6() {
  const sparks = [
    { left: "10%", delay: "0s",   size: 5 },
    { left: "28%", delay: "1.2s", size: 4 },
    { left: "44%", delay: "2.4s", size: 6 },
    { left: "60%", delay: "0.6s", size: 4 },
    { left: "78%", delay: "3.0s", size: 5 },
    { left: "92%", delay: "1.8s", size: 4 },
  ];
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {sparks.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-accent/60 shadow-[0_0_8px_rgba(123,110,246,0.7)]"
          style={{
            left: s.left,
            top: "75%",
            width: s.size,
            height: s.size,
            animation: `kai-sparkle-rise 4500ms ease-in-out ${s.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Used inline above when generating the Sparkle particles' Sparkles
// icon for the final "magic" beat-on-tap moment.
export const _decoSparkles = Sparkles;
