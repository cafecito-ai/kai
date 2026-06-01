// /welcome — first-run walkthrough that fires after onboarding completes.
//
// Rebuilt around the KaiSpeaks scene component to feel like a character
// arrives and walks you through, not a tutorial. Inspired by Ticket to
// Read — the buddy who shows up, greets you, narrates the world.
//
// Flow:
//   1. Meet KAI — orb floats in, "Hey." beat "I'm KAI." beat "Welcome."
//   2. Daily Score — KAI shows the ring while narrating
//   3. Three things in — KAI walks through Mind/Sleep/Mood
//   4. Streaks — show-up, fresh-start framing
//   5. Goals — identity-based
//   6. Tell KAI about you — handoff to onboarding
//
// One-time only — once the user finishes (or skips), `kai_walkthrough_seen_v1`
// is set in localStorage and the page auto-redirects on subsequent visits.

import { Brain, Flame, Heart, Moon, Sparkles, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { KaiSpeaks } from "../components/KaiSpeaks";
import { ScoreRing } from "../components/ScoreRing";
import { useUserStore } from "../stores/userStore";

const STORAGE_KEY = "kai_walkthrough_seen_v1";

type Scene = {
  id: string;
  /** Optional visual element rendered above the speech (e.g. the
   *  score ring on slide 2, the pillar chips on slide 3). Slide 1 has
   *  no visual — KAI alone owns the screen. */
  visual?: React.ReactNode;
  /** The lines KAI speaks on this scene. One typewriter pass each, with
   *  paced beats between. */
  lines: string[];
  /** Orb size for this scene. Slide 1 is hero-size; subsequent scenes
   *  use a medium orb so the visual underneath gets room. */
  orbSize: number;
};

export function Welcome() {
  const navigate = useNavigate();
  const { onboardingCompletedAt } = useUserStore();
  const [idx, setIdx] = useState(0);

  // Fully-onboarded users skip the walkthrough.
  useEffect(() => {
    if (onboardingCompletedAt) {
      navigate("/home", { replace: true });
    }
  }, [navigate, onboardingCompletedAt]);

  const scenes = useMemo(() => buildScenes(), []);

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* no-op */
    }
    navigate(onboardingCompletedAt ? "/home" : "/onboarding", { replace: true });
  }

  function nextScene() {
    if (idx < scenes.length - 1) setIdx(idx + 1);
    else finish();
  }

  function back() {
    if (idx > 0) setIdx(idx - 1);
  }

  // Touch swipe support for mobile (kept in case user wants to skim).
  const touchStart = { x: 0 };
  function onTouchStart(e: React.TouchEvent) {
    touchStart.x = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStart.x;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) nextScene();
    else back();
  }

  const scene = scenes[idx];

  return (
    <div
      className="mx-auto flex h-[100vh] w-full max-w-md flex-col px-5 pt-3 pb-6 sm:max-w-lg"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header: skip + progress dots */}
      <header className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-1.5">
          {scenes.map((s, i) => (
            <span
              key={s.id}
              aria-hidden="true"
              className={`
                h-1.5 rounded-full transition-all duration-300
                ${i === idx ? "w-6 bg-text-primary" : i < idx ? "w-1.5 bg-text-primary/60" : "w-1.5 bg-surface-muted"}
              `}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={finish}
          className="
            text-xs font-medium text-text-secondary
            transition hover:text-text-primary focus-ring rounded
          "
        >
          Skip
        </button>
      </header>

      {/* Optional visual area — sits above KaiSpeaks. Reserve vertical
          space so layout doesn't bounce when the visual is missing. */}
      <div className="flex h-32 items-center justify-center sm:h-36">
        {scene.visual}
      </div>

      {/* The "magic moment" — KAI's entrance + paced speech. Keyed by
          scene id so React fully remounts the component each scene,
          replaying the entrance animation and resetting the typewriter. */}
      <div className="mt-4 flex flex-1 flex-col items-center justify-center">
        <KaiSpeaks
          key={scene.id}
          lines={scene.lines}
          orbSize={scene.orbSize}
          // First scene gets the full float-up entrance. Subsequent
          // scenes still scale-in (because of the key remount), just
          // less dramatically.
          animateEntrance
          onDone={nextScene}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Scenes — what KAI says + what's on screen during each beat
// ─────────────────────────────────────────────────────────────────────

function buildScenes(): Scene[] {
  return [
    {
      id: "meet",
      orbSize: 280,
      // First impression. Owned entirely by the orb + voice. No visual
      // underneath — let KAI have the room. Opens with the tagline so
      // the first thing the user hears is the mission.
      lines: [
        "Stop waiting.",
        "Start becoming.",
        "I'm KAI.",
        "I'll walk you through this — takes a minute.",
      ],
    },
    {
      id: "score",
      orbSize: 200,
      visual: (
        <div className="relative">
          <ScoreRing value={72} size={120} stroke={9} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-mono text-3xl font-bold leading-none tabular-nums text-text-primary">
              72
            </p>
          </div>
        </div>
      ),
      lines: [
        "This is your daily score.",
        "One read on how today's going. Resets every morning — fresh slate.",
      ],
    },
    {
      id: "inputs",
      orbSize: 200,
      visual: (
        <div className="flex items-center gap-3">
          <PillarChip icon={Brain} label="Mind" tint="bg-accent-cool-soft text-accent-cool" />
          <PillarChip icon={Moon} label="Sleep" tint="bg-accent-soft text-accent" />
          <PillarChip icon={Heart} label="Mood" tint="bg-accent-warm-soft text-accent-warm" />
        </div>
      ),
      lines: [
        "It builds from three things.",
        "Check-ins, sleep, and how you're feeling. Log them, the score moves.",
      ],
    },
    {
      id: "streak",
      orbSize: 200,
      visual: (
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent-warm/20 blur-2xl" aria-hidden="true" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-accent-warm-soft">
            <Flame size={42} className="text-accent-warm" aria-hidden="true" strokeWidth={1.5} />
          </div>
        </div>
      ),
      lines: [
        "Show up. That's the whole game.",
        "Miss a day, you start fresh. No penalty, no shame.",
      ],
    },
    {
      id: "goals",
      orbSize: 200,
      visual: (
        <div className="w-full max-w-xs space-y-1.5">
          <GoalCard icon={Target} text="Someone who moves daily" />
          <GoalCard icon={Sparkles} text="Someone who reads before bed" />
        </div>
      ),
      lines: [
        "And goals — but not a checklist.",
        "Pick who you want to be. I'll help you live it.",
      ],
    },
    {
      id: "go",
      orbSize: 260,
      lines: [
        "Alright.",
        "I'm gonna ask you a few quick things so I know who you are.",
        "About 90 seconds. Whenever you're ready.",
      ],
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────
// Tiny visual helpers
// ─────────────────────────────────────────────────────────────────────

function PillarChip({
  icon: Icon,
  label,
  tint,
}: {
  icon: typeof Brain;
  label: string;
  tint: string;
}) {
  return (
    <div
      className={`
        flex h-20 w-20 flex-col items-center justify-center gap-1
        rounded-glass border border-glass-border shadow-card
        ${tint}
      `}
    >
      <Icon size={22} aria-hidden="true" strokeWidth={1.5} />
      <p className="text-[11px] font-medium">{label}</p>
    </div>
  );
}

function GoalCard({
  icon: Icon,
  text,
}: {
  icon: typeof Target;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-glass-border bg-surface px-3 py-2 shadow-card">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-cool-soft">
        <Icon size={12} className="text-accent-cool" aria-hidden="true" />
      </span>
      <p className="text-xs font-medium text-text-primary">{text}</p>
    </div>
  );
}
