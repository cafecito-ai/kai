// The guided tour (PR 3) — "Kai introduces you to your new system."
//
// Not a tutorial wall of text: each beat is one short narrated line + a stylized
// panel of the surface it describes, cross-fading as Kai talks. Minimal reading,
// maximum understanding. Tap anywhere (or wait) to advance; skip anytime. Beats
// are self-contained mockups (not the live pages) so the tour can't break when a
// screen changes — visual direction is Lev's to approve and tune.

import { useEffect, useRef, useState } from "react";
import { KaiOrb } from "../KaiOrb";
import { MagicField } from "../MagicField";

const AUTO_MS = 3200;

type Beat = { id: string; line: string; panel: JSX.Element };

function Bars({ values, highlight }: { values: number[]; highlight?: number }) {
  return (
    <div className="flex items-end justify-center gap-2" aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className={`w-5 rounded-t-md ${i === highlight ? "bg-accent" : "bg-accent/40"}`}
          style={{ height: `${v}%` }}
        />
      ))}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-44 w-full max-w-[18rem] items-center justify-center rounded-3xl border border-glass-border bg-surface/80 p-5 shadow-card backdrop-blur">
      {children}
    </div>
  );
}

const BEATS: Beat[] = [
  {
    id: "home",
    line: "This is home — your whole day, at a glance.",
    panel: (
      <Panel>
        <div className="flex items-center gap-4">
          <div className="relative grid h-20 w-20 place-items-center rounded-full border-4 border-accent/70">
            <span className="font-mono text-2xl font-bold text-text-primary">72</span>
          </div>
          <div className="space-y-1.5">
            {["Mind", "Sleep", "Mood"].map((l) => (
              <div key={l} className="flex items-center gap-2">
                <span className="w-10 text-[10px] uppercase tracking-wide text-text-muted">{l}</span>
                <span className="h-1.5 w-16 rounded-full bg-accent/40" />
              </div>
            ))}
          </div>
        </div>
      </Panel>
    ),
  },
  {
    id: "goal",
    line: "Your goal lives here. Small daily moves fill it in.",
    panel: (
      <Panel>
        <div className="w-full">
          <p className="text-[10px] uppercase tracking-wide text-text-muted">Your goal</p>
          <p className="mt-1 font-display text-lg font-semibold text-text-primary">Get genuinely stronger</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-muted/70">
            <div className="h-full w-2/5 rounded-full bg-accent" />
          </div>
        </div>
      </Panel>
    ),
  },
  {
    id: "chat",
    line: "Talk to me anytime — I remember what matters to you.",
    panel: (
      <Panel>
        <div className="w-full space-y-2">
          <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-text-primary px-3 py-2 text-xs text-background">
            rough day, didn't sleep
          </div>
          <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm border border-glass-border bg-surface px-3 py-2 text-xs text-text-primary">
            Let's keep it light today then — one easy win.
          </div>
        </div>
      </Panel>
    ),
  },
  {
    id: "progress",
    line: "And you'll watch yourself actually change over time.",
    panel: (
      <Panel>
        <Bars values={[30, 45, 40, 62, 78]} highlight={4} />
      </Panel>
    ),
  },
  {
    id: "system",
    line: "This is your system. Show up, and it gets stronger.",
    panel: (
      <Panel>
        <div className="w-full space-y-2">
          {[
            ["Mental", 70],
            ["Body", 55],
            ["Discipline", 64],
            ["Recovery", 48],
          ].map(([l, v]) => (
            <div key={l as string} className="flex items-center gap-2">
              <span className="w-16 text-[10px] uppercase tracking-wide text-text-muted">{l}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted/70">
                <div className="h-full rounded-full bg-accent" style={{ width: `${v}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    ),
  },
];

export function GuidedTour({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  function advance() {
    setIndex((i) => {
      if (i >= BEATS.length - 1) {
        onCompleteRef.current();
        return i;
      }
      return i + 1;
    });
  }

  // Auto-advance, reset each beat. Tapping advances early.
  useEffect(() => {
    const t = setTimeout(advance, AUTO_MS);
    return () => clearTimeout(t);
  }, [index]);

  const beat = BEATS[index];

  return (
    <button
      type="button"
      onClick={advance}
      aria-label="Next"
      className="relative mx-auto flex h-[100vh] w-full max-w-md cursor-pointer flex-col items-center justify-center overflow-hidden px-6 text-left sm:max-w-lg"
    >
      <MagicField />

      <div className="relative z-10 flex w-full flex-col items-center">
        <div key={`panel-${index}`} className="animate-fade-slide-up">
          {beat.panel}
        </div>

        <div className="mt-7 flex items-start gap-3">
          <KaiOrb size={40} />
          <p key={`line-${index}`} className="max-w-[16rem] text-[15px] leading-relaxed text-text-primary animate-fade-slide-up" aria-live="polite">
            {beat.line}
          </p>
        </div>

        {/* Progress dots */}
        <div className="mt-6 flex gap-1.5" aria-hidden="true">
          {BEATS.map((b, i) => (
            <span
              key={b.id}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-accent" : "w-1.5 bg-text-muted/40"}`}
            />
          ))}
        </div>
      </div>

      {/* Skip — jumps straight to the finish. */}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onComplete();
          }
        }}
        className="absolute right-5 top-5 z-20 text-xs font-medium text-text-muted hover:text-text-secondary focus-ring"
      >
        Skip
      </span>
    </button>
  );
}
