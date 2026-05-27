// /welcome — first-run walkthrough that fires after onboarding completes.
//
// 5 swipeable slides explaining the core mechanics in 60 seconds:
//   1. Meet KAI (orb intro)
//   2. Daily Score (what it is, resets every morning)
//   3. Three things in (Mind / Sleep / Mood)
//   4. Streaks (show up, fresh start on breaks — no shame)
//   5. Goals (identity-based, "who you want to be")
//   6. Let's go (CTA to /home)
//
// Per Rawz vision doc: minimal text, mostly visuals, smooth, interactive.
// Per D-021: streak slide uses "fresh start" framing not "lost."
//
// One-time only — once the user finishes (or skips), `kai_walkthrough_seen_v1`
// is set in localStorage and the page auto-redirects on subsequent visits.

import { ArrowRight, Brain, Flame, Heart, Moon, Sparkles, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { KaiMessage } from "../components/KaiMessage";
import { KaiOrb } from "../components/KaiOrb";
import { ScoreRing } from "../components/ScoreRing";

const STORAGE_KEY = "kai_walkthrough_seen_v1";

type Slide = {
  id: string;
  visual: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
};

export function Welcome() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);

  // If they've already seen it, skip to /home.
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const slides: Slide[] = useMemo(() => buildSlides(), []);

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* no-op */
    }
    navigate("/home", { replace: true });
  }

  function next() {
    if (idx < slides.length - 1) setIdx(idx + 1);
    else finish();
  }

  function back() {
    if (idx > 0) setIdx(idx - 1);
  }

  // Touch swipe support for mobile.
  const touchStart = { x: 0 };
  function onTouchStart(e: React.TouchEvent) {
    touchStart.x = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStart.x;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) next();
    else back();
  }

  const slide = slides[idx];
  const isLast = idx === slides.length - 1;

  return (
    <div
      className="mx-auto flex h-[100vh] w-full max-w-md flex-col px-5 pt-3 pb-6 sm:max-w-lg"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header: skip + progress dots */}
      <header className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
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

      {/* Slide content — big visual top, small text bottom */}
      <div
        key={slide.id /* re-render to retrigger animations */}
        className="flex flex-1 flex-col items-center justify-center text-center animate-fade-slide-up"
      >
        <div className="flex flex-1 items-center justify-center">{slide.visual}</div>

        <div className="pb-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            {slide.eyebrow}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight">
            {slide.title}
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-text-secondary">
            {slide.body}
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={next}
        className="
          flex h-12 w-full items-center justify-center gap-2 rounded-full
          bg-text-primary text-background font-medium
          shadow-card transition active:scale-[0.99] focus-ring
        "
      >
        {isLast ? "Let's go" : "Next"}
        <ArrowRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Slide visuals
// ─────────────────────────────────────────────────────────────────────

function buildSlides(): Slide[] {
  return [
    {
      id: "meet",
      eyebrow: "Welcome",
      title: "Meet KAI",
      body: "Your daily companion. Built around your life, not the other way around.",
      visual: (
        <div className="flex flex-col items-center gap-4">
          <KaiOrb size={140} />
        </div>
      ),
    },
    {
      id: "score",
      eyebrow: "Daily Score",
      title: "One read on your day",
      body: "A simple 0–100 score that builds from check-ins, sleep, and mood. Resets every morning — fresh slate.",
      visual: (
        <div className="relative flex flex-col items-center gap-4">
          <ScoreRing value={72} size={160} stroke={10} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-mono text-5xl font-bold leading-none tabular-nums text-text-primary">
              72
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              / 100
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "inputs",
      eyebrow: "Three things in",
      title: "Mind · Sleep · Mood",
      body: "Tap to check in, log your sleep, journal anything. KAI watches it all and gives you one read.",
      visual: (
        <div className="flex items-center gap-3">
          <PillarChip icon={Brain} label="Mind" tint="bg-accent-cool-soft text-accent-cool" />
          <PillarChip icon={Moon} label="Sleep" tint="bg-accent-soft text-accent" />
          <PillarChip icon={Heart} label="Mood" tint="bg-accent-warm-soft text-accent-warm" />
        </div>
      ),
    },
    {
      id: "streak",
      eyebrow: "Streaks",
      title: "Show up. That's the whole game.",
      // Per D-021 — "fresh start" not "lost it."
      body: "Every day you check in, your streak grows. Skip a day and you start fresh — no penalty, no shame.",
      visual: (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-accent-warm/20 blur-2xl" aria-hidden="true" />
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-accent-warm-soft">
              <Flame size={56} className="text-accent-warm" aria-hidden="true" strokeWidth={1.5} />
            </div>
          </div>
          <p className="font-mono text-4xl font-bold leading-none tabular-nums text-text-primary">
            12
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            day streak (example)
          </p>
        </div>
      ),
    },
    {
      id: "goals",
      eyebrow: "Goals",
      title: "Who you want to be",
      body: "Not a checklist. Pick an identity (\"someone who reads,\" \"someone who moves daily\") and KAI helps you live it.",
      visual: (
        <div className="w-full max-w-xs space-y-2">
          <GoalCard icon={Target} text="Someone who moves daily" />
          <GoalCard icon={Sparkles} text="Someone who reads before bed" />
        </div>
      ),
    },
    {
      id: "go",
      eyebrow: "You're set",
      title: "Let's go",
      body: "Tap below and KAI will meet you at home with whatever's most useful for today.",
      visual: (
        <div className="flex flex-col items-center gap-5">
          <KaiOrb size={120} />
          <div className="max-w-xs">
            <KaiMessage orbSize={28}>
              Whenever you're ready. No rush — small steps count.
            </KaiMessage>
          </div>
        </div>
      ),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────
// Reusable mini-components for the slides
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
        flex h-24 w-24 flex-col items-center justify-center gap-1.5
        rounded-glass border border-glass-border shadow-card
        ${tint}
      `}
    >
      <Icon size={28} aria-hidden="true" strokeWidth={1.5} />
      <p className="text-xs font-medium">{label}</p>
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
    <div className="flex items-center gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 shadow-card">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-cool-soft">
        <Icon size={14} className="text-accent-cool" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-text-primary">{text}</p>
    </div>
  );
}
