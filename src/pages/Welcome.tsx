// /welcome — the magical character intro to KAI.
//
// One continuous moment: KAI materializes, says hi, walks you through
// what matters in the app. Persistent character at the top stays in
// place across scenes — only the visual + spoken line below it change,
// so the experience flows rather than restarting each scene.
//
// Voice synthesis removed (testers found the device voices off-putting).
// Lines stripped down to buddy-tone for a 13-year-old — short, punchy,
// "I got you" energy.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Flame, Heart, Moon, Sparkles, Target } from "lucide-react";

import { KaiCharacter } from "../components/KaiCharacter";
import { ScoreRing } from "../components/ScoreRing";
import { useUserStore } from "../stores/userStore";

const STORAGE_KEY = "kai_walkthrough_seen_v1";

type Scene = {
  id: string;
  visual?: React.ReactNode;
  lines: string[];
};

export function Welcome() {
  const navigate = useNavigate();
  const { onboardingCompletedAt } = useUserStore();
  const [sceneIdx, setSceneIdx] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (onboardingCompletedAt) {
      navigate("/home", { replace: true });
    }
  }, [navigate, onboardingCompletedAt]);

  const scenes = useMemo(() => buildScenes(), []);
  const scene = scenes[sceneIdx];
  const line = scene.lines[lineIdx] ?? "";
  const isLastLineOfScene = lineIdx >= scene.lines.length - 1;
  const isLastScene = sceneIdx >= scenes.length - 1;
  const isLastLineEver = isLastScene && isLastLineOfScene;

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* no-op */
    }
    navigate(onboardingCompletedAt ? "/home" : "/onboarding", { replace: true });
  }

  function advance() {
    if (!isLastLineOfScene) {
      setLineIdx((i) => i + 1);
    } else if (!isLastScene) {
      setSceneIdx((i) => i + 1);
      setLineIdx(0);
    } else {
      finish();
    }
  }

  // Auto-advance after the current line has been on screen long enough
  // for the user to read + absorb. Scales with line length — short
  // lines linger ~1.6s, long lines ~3s.
  useEffect(() => {
    const words = line.trim().split(/\s+/).length;
    const ms = Math.max(1500, words * 320 + 500);
    const t = window.setTimeout(advance, ms);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIdx, lineIdx]);

  // Touch swipe — keep as escape hatch for testers/skimmers.
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
        relative mx-auto flex h-[100vh] w-full max-w-md flex-col px-5 pt-3 pb-6 sm:max-w-lg
        cursor-pointer select-none
      "
      onClick={advance}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header: progress dots + Skip */}
      <header className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-1.5">
          {scenes.map((s, i) => (
            <span
              key={s.id}
              aria-hidden="true"
              className={`
                h-1.5 rounded-full transition-all duration-500
                ${i === sceneIdx ? "w-6 bg-text-primary" : i < sceneIdx ? "w-1.5 bg-text-primary/60" : "w-1.5 bg-surface-muted"}
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

      {/* Floating sparkles — drifting magic particles around the
          character. Decorative, motion-only — no aria. */}
      <Sparkles3 />

      {/* The character — renders once, stays put for the whole flow.
          The wisp body + bobbing hands + halo glow give continuous
          magical presence across all scenes. */}
      <div className="mt-6 flex flex-shrink-0 justify-center">
        <div className="relative kai-materialize">
          <div
            className="
              pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2
              h-[140%] w-[140%] rounded-full bg-accent/25 blur-3xl
              kai-halo-pulse
            "
            aria-hidden="true"
          />
          <KaiCharacter size={240} face speaking />
        </div>
      </div>

      {/* Visual area — crossfades between scenes. Reserve vertical
          space so the line below doesn't jump. */}
      <div className="mt-2 flex h-24 items-center justify-center">
        <div
          key={`vis-${sceneIdx}`}
          className="kai-visual-pop"
        >
          {scene.visual}
        </div>
      </div>

      {/* The spoken line — pops in fresh each line. */}
      <div className="mt-4 flex flex-1 flex-col items-center px-2 text-center">
        <p
          key={`line-${sceneIdx}-${lineIdx}`}
          className="kai-line-pop font-display text-3xl font-medium leading-snug tracking-tight text-text-primary sm:text-4xl"
          aria-live="polite"
        >
          {line}
        </p>
      </div>

      {/* Soft tap hint, only briefly on the very first beat */}
      {sceneIdx === 0 && lineIdx === 0 && (
        <p
          className="
            absolute bottom-8 left-1/2 -translate-x-1/2
            font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted
            animate-pulse kai-tap-hint
          "
          aria-hidden="true"
        >
          tap anywhere
        </p>
      )}

      <style>{`
        /* Character "materializes" once on first render of the page —
           fades in from blur, scales up, lifts into place. Doesn't replay
           between scenes (parent doesn't re-key). */
        @keyframes kai-materialize {
          0%   { transform: translateY(60px) scale(0.7); opacity: 0; filter: blur(10px); }
          60%  { transform: translateY(-8px) scale(1.04); opacity: 1; filter: blur(0); }
          100% { transform: translateY(0)    scale(1);    opacity: 1; filter: blur(0); }
        }
        .kai-materialize {
          animation: kai-materialize 1400ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Halo pulse — always pulses behind KAI to feel alive. */
        @keyframes kai-halo-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1);    opacity: 0.7; }
          50%      { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
        }
        .kai-halo-pulse {
          animation: kai-halo-pulse 2600ms ease-in-out infinite;
        }

        /* Each spoken line pops in with a blur-clear + slight scale. */
        @keyframes kai-line-pop {
          0%   { transform: translateY(14px) scale(0.96); opacity: 0; filter: blur(6px); }
          100% { transform: translateY(0)    scale(1);    opacity: 1; filter: blur(0); }
        }
        .kai-line-pop {
          animation: kai-line-pop 650ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Visual area crossfades between scenes (no slide — just a
           gentle reveal). */
        @keyframes kai-visual-pop {
          0%   { transform: scale(0.9); opacity: 0; filter: blur(6px); }
          100% { transform: scale(1);   opacity: 1; filter: blur(0); }
        }
        .kai-visual-pop {
          animation: kai-visual-pop 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Tap-hint fades away after the first 4 seconds so it doesn't
           clutter once the user starts tapping or letting it autoplay. */
        @keyframes kai-tap-hint {
          0%, 70%  { opacity: 0.6; }
          100%     { opacity: 0; }
        }
        .kai-tap-hint {
          animation: kai-tap-hint 4500ms ease-out forwards;
        }

        /* Floating sparkles — six small dots drift up and fade. Each has
           its own delay so they feel random, not synchronized. */
        @keyframes kai-sparkle-rise {
          0%   { transform: translateY(0)    scale(0.6); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(-80px) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sparkles — drifting magic particles around KAI
// ─────────────────────────────────────────────────────────────────────

function Sparkles3() {
  // 6 sparkles at varied horizontal positions and start delays so the
  // motion looks organic. Each rises ~80px and fades over 4 seconds.
  const sparks = [
    { left: "18%", delay: "0s",   size: 5 },
    { left: "32%", delay: "1.2s", size: 4 },
    { left: "48%", delay: "2.4s", size: 6 },
    { left: "62%", delay: "0.6s", size: 4 },
    { left: "76%", delay: "3.0s", size: 5 },
    { left: "88%", delay: "1.8s", size: 4 },
  ];
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-32 h-72 overflow-hidden"
      aria-hidden="true"
    >
      {sparks.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-accent/60 shadow-[0_0_8px_rgba(123,110,246,0.7)]"
          style={{
            left: s.left,
            top: "60%",
            width: s.size,
            height: s.size,
            animation: `kai-sparkle-rise 4500ms ease-in-out ${s.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Scenes — buddy tone, short lines, ≤ 4 beats per scene
// ─────────────────────────────────────────────────────────────────────

function buildScenes(): Scene[] {
  return [
    {
      id: "meet",
      lines: ["Stop waiting.", "Start becoming.", "I'm KAI.", "I got you."],
    },
    {
      id: "score",
      visual: (
        <div className="relative">
          <ScoreRing value={72} size={88} stroke={8} />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-2xl font-bold leading-none tabular-nums text-text-primary">
              72
            </p>
          </div>
        </div>
      ),
      lines: ["Every day, a score.", "Resets in the morning. Fresh start."],
    },
    {
      id: "inputs",
      visual: (
        <div className="flex items-center gap-2.5">
          <PillarChip icon={Brain} tint="bg-accent-cool-soft text-accent-cool" />
          <PillarChip icon={Moon} tint="bg-accent-soft text-accent" />
          <PillarChip icon={Heart} tint="bg-accent-warm-soft text-accent-warm" />
        </div>
      ),
      lines: ["Three things feed it.", "How you feel, sleep, and move."],
    },
    {
      id: "streak",
      visual: (
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent-warm/20 blur-2xl" aria-hidden="true" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent-warm-soft">
            <Flame size={28} className="text-accent-warm" aria-hidden="true" strokeWidth={1.6} />
          </div>
        </div>
      ),
      lines: ["Show up.", "That's the whole thing.", "Miss a day? No drama."],
    },
    {
      id: "goals",
      visual: (
        <div className="flex items-center gap-3 rounded-lg border border-glass-border bg-surface px-3 py-2 shadow-card">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-cool-soft">
            <Target size={11} className="text-accent-cool" aria-hidden="true" />
          </span>
          <p className="text-xs font-medium text-text-primary">Someone who moves daily</p>
        </div>
      ),
      lines: ["Pick who you want to be.", "I'll help you live it."],
    },
    {
      id: "go",
      visual: (
        <Sparkles size={28} className="text-accent" aria-hidden="true" />
      ),
      lines: ["Quick stuff — I wanna know you.", "About a minute. Let's go."],
    },
  ];
}

function PillarChip({
  icon: Icon,
  tint,
}: {
  icon: typeof Brain;
  tint: string;
}) {
  return (
    <div
      className={`
        flex h-16 w-16 items-center justify-center
        rounded-glass border border-glass-border shadow-card
        ${tint}
      `}
    >
      <Icon size={22} aria-hidden="true" strokeWidth={1.6} />
    </div>
  );
}
