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
  /** What KAI says (or what shows on screen — beat 1 is the tagline). */
  line?: string;
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
      {/* Subtle atmosphere — sparkles + a soft accent glow at the
          bottom of the screen. Standard app dark background otherwise
          so the text contrasts cleanly. */}
      <AmbientGlow />

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
        {/* Tagline title (beat 1 only) — big, slow-fade-in */}
        {beat.title && (
          <div
            key={`title-${idx}`}
            className="
              absolute inset-x-0 top-[15%] flex flex-col items-center px-4 text-center
              kai-title-pop
            "
          >
            <h1 className="whitespace-pre-line font-display text-5xl font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-6xl">
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
          {/* Halo */}
          <div
            className="
              pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2
              h-[140%] w-[140%] rounded-full bg-accent/30 blur-3xl
              kai-halo-pulse
            "
            aria-hidden="true"
          />
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

        {/* Spoken line — pinned to the bottom third */}
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

        @keyframes kai-line-pop {
          0%   { transform: translateY(14px) scale(0.96); opacity: 0; filter: blur(6px); }
          100% { transform: translateY(0)    scale(1);    opacity: 1; filter: blur(0); }
        }
        .kai-line-pop { animation: kai-line-pop 700ms cubic-bezier(0.16, 1, 0.3, 1) both; }

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
// AmbientGlow — soft accent halo at the bottom of the canvas + a few
// drifting sparkles. Stays subtle so the standard app background
// (#0A0A0F) carries through and text contrast is preserved.
// ─────────────────────────────────────────────────────────────────────

function AmbientGlow() {
  const sparks = useMemo(() => {
    const out: { x: number; y: number; size: number; delay: number }[] = [];
    for (let i = 0; i < 8; i += 1) {
      out.push({
        x: ((i * 7919) % 100) / 100,
        y: 0.55 + ((i * 31) % 30) / 100,
        size: 2 + ((i * 13) % 4),
        delay: ((i * 17) % 40) / 10,
      });
    }
    return out;
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Soft accent glow rising from the bottom — gives the scene a
          sense of horizon without darkening the rest of the page. */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/5"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(123, 110, 246, 0.18) 0%, rgba(123, 110, 246, 0) 70%)",
        }}
      />
      {/* Drifting sparkles — fewer, more subtle */}
      {sparks.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-accent/60 shadow-[0_0_10px_rgba(123,110,246,0.7)]"
          style={{
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            width: s.size,
            height: s.size,
            animation: `kai-sparkle-drift 5000ms ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes kai-sparkle-drift {
          0%, 100% { transform: translateY(0)    scale(0.6); opacity: 0; }
          20%      { opacity: 0.8; }
          80%      { opacity: 0.8; }
          100%     { transform: translateY(-80px) scale(1.1); opacity: 0; }
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

    // 2. KAI flies into the foreground and waves.
    {
      line: "Hi, I'm KAI.",
      kaiOffsetX: 0, kaiTopPct: 0.42, kaiScale: 1.15, gesture: "wave",
      hint: "tap to continue",
    },

    // 3. Sets the role — clear, teen-friendly framing.
    {
      line: "Your AI buddy.",
      kaiOffsetX: 0, kaiTopPct: 0.42, kaiScale: 1.10, gesture: "talk",
      hint: "tap to continue",
    },

    // 4. Welcome them in.
    {
      line: "Welcome to your space.",
      kaiOffsetX: 0, kaiTopPct: 0.42, kaiScale: 1.10, gesture: "reach",
      hint: "tap to continue",
    },

    // 5. Transition to the tour.
    {
      line: "Let me show you around.",
      kaiOffsetX: 0, kaiTopPct: 0.42, kaiScale: 1.05, gesture: "point",
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
