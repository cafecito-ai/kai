// /welcome — the magical intro to KAI.
//
// Inspired by Ticket to Read's character world — you step INTO a
// place, the character greets you, walks you through their space.
// No auto-advance. User taps to move through each beat at their pace.
//
// Structure:
//   1. Tagline screen     — "Stop waiting. Start becoming." Small KAI
//                            visible in the distance. Tap KAI / anywhere
//                            to meet them.
//   2. KAI arrives        — flies in big, waves
//   3-4. Introduction     — "Hi, I'm KAI." → "Your AI buddy."
//   5. Welcome            — "Welcome to your space. Let me show you around."
//   6-9. Tour             — score, pillars, streak, goals (KAI gestures
//                            at each visual element)
//   10. Handoff           — "Now let me get to know you a little."
//                            Big explicit "Start" button → onboarding
//
// Background: a cosmic gradient + starfield + horizon glow so KAI feels
// like they're floating in their own mindscape, not on a blank page.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, Flame, Heart, Moon, Target } from "lucide-react";

import { KaiCharacter } from "../components/KaiCharacter";
import { ScoreRing } from "../components/ScoreRing";
import { useUserStore } from "../stores/userStore";

const STORAGE_KEY = "kai_walkthrough_seen_v1";

type Gesture = "wave" | "point" | "reach" | "idle" | "talk";

type Beat = {
  /** Single line. Mutually exclusive with `lines`. */
  line?: string;
  /** Multi-line beat — each line stagger-fades in one after the other
   *  and stays visible. Use for the combined "Hi I'm KAI / your buddy /
   *  this is your space / let me show you around" intro. */
  lines?: string[];
  /** Larger title shown above the line. Used for the opening tagline. */
  title?: string;
  /** Where KAI is on the canvas this beat (px offset from center). */
  kaiOffsetX: number;
  /** Vertical position as % of canvas. */
  kaiTopPct: number;
  /** Character scale. */
  kaiScale: number;
  /** KAI's hand gesture this beat. */
  gesture: Gesture;
  /** Optional small visual element next to KAI. */
  visual?: React.ReactNode;
  visualOffsetX?: number;
  visualTopPct?: number;
  /** Hint shown at the bottom of the screen on this beat. */
  hint?: string;
};

export function Welcome() {
  const navigate = useNavigate();
  const { onboardingCompletedAt } = useUserStore();
  const [idx, setIdx] = useState(0);

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
    if (!isLast) setIdx((i) => i + 1);
    else finish();
  }

  // Touch swipe — fast forward.
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
      onClick={isLast ? undefined : advance}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Magic environment — aurora rays + dense sparkle field + soft
          accent halo at the horizon. Text stays high-contrast because
          everything magical sits at low opacity. */}
      <MagicField />

      {/* Header: progress dots + Skip */}
      <header className="relative z-20 flex items-center justify-between pb-3">
        <div className="flex items-center gap-1.5">
          {beats.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`
                h-1.5 rounded-full transition-all duration-500
                ${i === idx ? "w-5 bg-text-primary" : i < idx ? "w-1.5 bg-text-primary/60" : "w-1.5 bg-surface-muted/70"}
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

      {/* THE STAGE — where KAI flies around */}
      <div className="relative flex-1">
        {/* Tagline title (beat 1 only) — big, slow-fade-in, with a
            shimmer pass that runs once after the title lands. */}
        {beat.title && (
          <div
            key={`title-${idx}`}
            className="
              absolute inset-x-0 top-[15%] flex flex-col items-center px-4 text-center
              kai-title-pop
            "
          >
            <h1
              className="
                whitespace-pre-line font-display text-5xl font-semibold leading-[1.05]
                tracking-tight sm:text-6xl
                kai-tagline-shimmer bg-clip-text text-transparent
              "
            >
              {beat.title}
            </h1>
          </div>
        )}

        {/* Visual element next to KAI */}
        {beat.visual && (
          <div
            key={`visual-${idx}`}
            className="kai-visual-pop absolute z-[5]"
            style={{
              left: "50%",
              top: `${(beat.visualTopPct ?? 0.40) * 100}%`,
              transform: `translate(calc(-50% + ${beat.visualOffsetX ?? 0}px), -50%)`,
            }}
          >
            {beat.visual}
          </div>
        )}

        {/* KAI — persistent across all beats. The character translates
            and scales smoothly between beats without remounting. */}
        <div
          className="absolute z-10 kai-fly-in"
          style={{
            left: "50%",
            top: `${beat.kaiTopPct * 100}%`,
            transform: `translate(calc(-50% + ${beat.kaiOffsetX}px), -50%) scale(${beat.kaiScale})`,
            transition: "transform 1300ms cubic-bezier(0.16, 1, 0.3, 1), top 1300ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Halo — color-cycles slowly between accent / cool / warm
              so it always feels alive. */}
          <div
            className="
              pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2
              h-[160%] w-[160%] rounded-full blur-3xl
              kai-halo-cycle kai-halo-pulse
            "
            aria-hidden="true"
          />
          {/* Orbiting particles — three small glow dots that circle
              KAI's head at different radii + speeds. Reads as a small
              magical aura around the character. */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <span className="kai-orbit-1 absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
              <span className="block h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(123,110,246,0.9)]" />
            </span>
            <span className="kai-orbit-2 absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
              <span className="block h-1.5 w-1.5 rounded-full bg-accent-cool shadow-[0_0_10px_rgba(104,197,184,0.9)]" />
            </span>
            <span className="kai-orbit-3 absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
              <span className="block h-1.5 w-1.5 rounded-full bg-accent-warm shadow-[0_0_10px_rgba(240,168,104,0.9)]" />
            </span>
          </div>
          <KaiCharacter size={220} face speaking gesture={beat.gesture} />

          {/* On beat 1 only — a "tap me" pulse ring around KAI so
              the user knows to interact. */}
          {idx === 0 && (
            <div
              className="
                pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                h-[100%] w-[100%] rounded-full border-2 border-accent/70
                kai-tap-ring
              "
              aria-hidden="true"
            />
          )}
        </div>

        {/* Spoken line(s) — pinned to the bottom third. Single line for
            most beats; multi-line for the combined intro so each line
            staggers in one after the other and stays visible. */}
        {beat.line && (
          <div className="absolute inset-x-0 bottom-[24%] flex justify-center px-4">
            <p
              key={`line-${idx}`}
              className="kai-line-pop max-w-xs text-center font-display text-3xl font-medium leading-snug tracking-tight text-text-primary sm:max-w-md sm:text-4xl"
              aria-live="polite"
            >
              {beat.line}
            </p>
          </div>
        )}
        {beat.lines && (
          <div className="absolute inset-x-0 bottom-[18%] flex flex-col items-center gap-2 px-4 text-center">
            {beat.lines.map((l, i) => (
              <p
                key={`line-${idx}-${i}`}
                className="
                  kai-stagger-pop max-w-xs font-display text-2xl font-medium
                  leading-snug tracking-tight text-text-primary sm:max-w-md sm:text-3xl
                "
                style={{ animationDelay: `${i * 450}ms` }}
                aria-live="polite"
              >
                {l}
              </p>
            ))}
          </div>
        )}

        {/* Last beat — explicit Start CTA */}
        {isLast && (
          <div className="absolute inset-x-0 bottom-8 flex justify-center px-5 kai-line-pop">
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
              Start
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Tap hint — always show, fades after a few seconds */}
        {!isLast && beat.hint && (
          <p
            key={`hint-${idx}`}
            className="
              absolute bottom-6 left-1/2 -translate-x-1/2
              font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted
              kai-hint-pulse
            "
            aria-hidden="true"
          >
            {beat.hint}
          </p>
        )}
      </div>

      <style>{`
        /* KAI fly-in on first render */
        @keyframes kai-fly-in {
          0%   { opacity: 0; transform: translate(calc(-50% + 60px), calc(-50% - 200px)) scale(0.5) rotate(-12deg); filter: blur(8px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { /* handoff to live position via inline style */ }
        }
        .kai-fly-in { animation: kai-fly-in 1600ms cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes kai-halo-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1);    opacity: 0.7; }
          50%      { transform: translate(-50%, -50%) scale(1.18); opacity: 1; }
        }
        .kai-halo-pulse { animation: kai-halo-pulse 2600ms ease-in-out infinite; }

        /* Halo color cycle — violet → cool → warm → back. Slow enough
           (8s) that it's a felt change, not a flicker. */
        @keyframes kai-halo-cycle {
          0%, 100% { background: radial-gradient(circle, rgba(123,110,246,0.45) 0%, rgba(123,110,246,0) 70%); }
          33%      { background: radial-gradient(circle, rgba(104,197,184,0.40) 0%, rgba(104,197,184,0) 70%); }
          66%      { background: radial-gradient(circle, rgba(240,168,104,0.40) 0%, rgba(240,168,104,0) 70%); }
        }
        .kai-halo-cycle { animation: kai-halo-cycle 8000ms ease-in-out infinite; }

        /* Three orbiting particles around KAI's head, different radii
           and speeds so they look like they have their own physics. */
        @keyframes kai-orbit-1 {
          0%   { transform: translate(-50%, -50%) rotate(0deg)   translateX(85px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(85px) rotate(-360deg); }
        }
        .kai-orbit-1 { animation: kai-orbit-1 9000ms linear infinite; }
        @keyframes kai-orbit-2 {
          0%   { transform: translate(-50%, -50%) rotate(120deg) translateX(105px) rotate(-120deg); }
          100% { transform: translate(-50%, -50%) rotate(480deg) translateX(105px) rotate(-480deg); }
        }
        .kai-orbit-2 { animation: kai-orbit-2 14000ms linear infinite; }
        @keyframes kai-orbit-3 {
          0%   { transform: translate(-50%, -50%) rotate(240deg) translateX(70px) rotate(-240deg); }
          100% { transform: translate(-50%, -50%) rotate(-120deg) translateX(70px) rotate(120deg); }
        }
        .kai-orbit-3 { animation: kai-orbit-3 11000ms linear infinite; }

        /* Pulsing ring on beat 1 — "tap me" affordance */
        @keyframes kai-tap-ring {
          0%   { transform: translate(-50%, -50%) scale(0.95); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(1.35); opacity: 0; }
        }
        .kai-tap-ring { animation: kai-tap-ring 1800ms ease-out infinite; }

        /* Title pop — bigger, slower than line pop because it's the
           tagline moment. */
        @keyframes kai-title-pop {
          0%   { transform: translateY(20px) scale(0.95); opacity: 0; filter: blur(8px); }
          100% { transform: translateY(0)    scale(1);    opacity: 1; filter: blur(0); }
        }
        .kai-title-pop { animation: kai-title-pop 1100ms cubic-bezier(0.16, 1, 0.3, 1) both; }

        /* Tagline shimmer — a moving gradient sweeps across the text
           so the words feel alive. Three-color gradient (white →
           accent → white) repeats slowly. */
        @keyframes kai-tagline-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .kai-tagline-shimmer {
          background-image: linear-gradient(
            90deg,
            #F0F0F5 0%,
            #F0F0F5 35%,
            #C9BCFF 50%,
            #F0F0F5 65%,
            #F0F0F5 100%
          );
          background-size: 200% auto;
          animation: kai-tagline-shimmer 6000ms linear infinite;
        }

        @keyframes kai-line-pop {
          0%   { transform: translateY(14px) scale(0.96); opacity: 0; filter: blur(6px); }
          100% { transform: translateY(0)    scale(1);    opacity: 1; filter: blur(0); }
        }
        .kai-line-pop { animation: kai-line-pop 700ms cubic-bezier(0.16, 1, 0.3, 1) both; }

        /* Staggered version — same keyframes, per-line animation-delay
           controls the cascade so each line lands ~450ms after the last. */
        .kai-stagger-pop { animation: kai-line-pop 700ms cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes kai-visual-pop {
          0%   { transform: translate(calc(-50% + var(--vx, 0)), -50%) scale(0.7); opacity: 0; filter: blur(6px); }
          100% { transform: translate(calc(-50% + var(--vx, 0)), -50%) scale(1);   opacity: 1; filter: blur(0); }
        }
        .kai-visual-pop { animation: kai-visual-pop 800ms cubic-bezier(0.16, 1, 0.3, 1) both; }

        /* Hint pulses gently */
        @keyframes kai-hint-pulse {
          0%, 100% { opacity: 0.45; }
          50%      { opacity: 0.8;  }
        }
        .kai-hint-pulse { animation: kai-hint-pulse 1800ms ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MagicField — aurora-style rotating glow, dense sparkle field with
// varied sizes + bokeh blur for depth, soft horizon halo. Text contrast
// stays clean because every magical layer is below ~30% opacity.
// ─────────────────────────────────────────────────────────────────────

function MagicField() {
  // 32 sparkles with deterministic positions, varied size, blur level
  // (some are bokeh — soft and large, some are sharp — small and bright),
  // and varied drift directions. Looks like a magical particle field.
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
    for (let i = 0; i < 32; i += 1) {
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
      {/* Aurora rays — a soft conic gradient that slowly rotates behind
          everything, giving the scene a moving sense of light. */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 kai-aurora"
        style={{
          width: "180%",
          height: "180%",
          background:
            "conic-gradient(from 0deg at 50% 50%, rgba(123,110,246,0) 0deg, rgba(123,110,246,0.18) 40deg, rgba(155,138,240,0) 80deg, rgba(104,197,184,0.14) 140deg, rgba(123,110,246,0) 200deg, rgba(240,168,104,0.10) 260deg, rgba(123,110,246,0) 320deg, rgba(123,110,246,0) 360deg)",
          filter: "blur(40px)",
        }}
      />

      {/* Horizon halo — soft pool of accent light pooling at the bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/5"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(123, 110, 246, 0.22) 0%, rgba(123, 110, 246, 0) 70%)",
        }}
      />

      {/* Sparkle field — 32 particles. Each drifts upward with a slight
          horizontal wander, fades in and out on its own clock. Some are
          blurred (bokeh, large) for depth. */}
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

// ─────────────────────────────────────────────────────────────────────
// The story — beat by beat. All tap-to-advance.
// ─────────────────────────────────────────────────────────────────────

function buildBeats(): Beat[] {
  return [
    // 1. Tagline screen — KAI small in the distance, big tagline up top.
    //    User taps to "meet" KAI.
    {
      title: "Stop waiting.\nStart becoming.",
      kaiOffsetX: 0, kaiTopPct: 0.65, kaiScale: 0.75, gesture: "idle",
      hint: "tap to meet KAI",
    },

    // 2. WHO — the introduction. KAI greets the user, sets the role.
    {
      lines: ["Hi, I'm KAI.", "Your AI buddy."],
      kaiOffsetX: 0, kaiTopPct: 0.32, kaiScale: 1.10, gesture: "wave",
      hint: "tap to continue",
    },

    // 3. WHY — the purpose. This is what makes KAI feel different from
    //    a generic chatbot without saying so out loud. Everyday presence
    //    + helps you find who you really are.
    {
      lines: [
        "I'm here every day.",
        "For the real stuff in your head.",
        "Helping you find who you really are.",
      ],
      kaiOffsetX: 0, kaiTopPct: 0.30, kaiScale: 1.05, gesture: "reach",
      hint: "tap to continue",
    },

    // 4. WELCOME — into their space, into the tour.
    {
      lines: ["This is your space.", "Let me show you around."],
      kaiOffsetX: 0, kaiTopPct: 0.32, kaiScale: 1.10, gesture: "point",
      hint: "tap to start the tour",
    },

    // ── TOUR ─────────────────────────────────────────────────────
    // 6. Daily score — KAI moves left, ring appears on right.
    {
      line: "Every day you open this, a score.",
      kaiOffsetX: -80, kaiTopPct: 0.45, kaiScale: 0.9, gesture: "point",
      visual: <ScoreVisual />, visualOffsetX: 80, visualTopPct: 0.40,
      hint: "tap",
    },

    // 7. Three pillars.
    {
      line: "Three things feed it: how you feel, sleep, and move.",
      kaiOffsetX: 0, kaiTopPct: 0.60, kaiScale: 0.85, gesture: "talk",
      visual: <PillarsVisual />, visualOffsetX: 0, visualTopPct: 0.28,
      hint: "tap",
    },

    // 8. Streak.
    {
      line: "Show up. Miss a day? Fresh start.",
      kaiOffsetX: 70, kaiTopPct: 0.42, kaiScale: 0.95, gesture: "talk",
      visual: <FlameVisual />, visualOffsetX: -70, visualTopPct: 0.42,
      hint: "tap",
    },

    // 9. Goals — identity-based.
    {
      line: "Pick who you wanna be. I'll help you live it.",
      kaiOffsetX: -70, kaiTopPct: 0.42, kaiScale: 0.9, gesture: "reach",
      visual: <GoalVisual />, visualOffsetX: 70, visualTopPct: 0.42,
      hint: "tap",
    },

    // 10. Handoff — big "Start" CTA appears.
    {
      line: "Now let me get to know you a little.",
      kaiOffsetX: 0, kaiTopPct: 0.38, kaiScale: 1.20, gesture: "reach",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────
// Tour visuals
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
