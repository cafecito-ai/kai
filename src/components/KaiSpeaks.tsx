// KaiSpeaks — the "KAI is alive and talking to you" scene.
//
// Used for the magic moments where KAI feels like a character, not a
// tutorial pop-up. Inspired by Ticket to Read's character intro: the
// orb floats in, settles, then speaks line-by-line with paced beats so
// it feels like a presence rather than a wall of text.
//
// Each line types out character-by-character. Between lines: a short
// pause so the moment can breathe. Tap anywhere to skip the current
// line (instant-complete) or to advance past the final line.

import { useEffect, useRef, useState } from "react";

import { KaiOrb } from "./KaiOrb";

type KaiSpeaksProps = {
  /** The lines KAI says, in order. Each line gets its own typewriter pass. */
  lines: string[];
  /** Fires after the last line has fully typed AND been seen for ~1s. */
  onDone?: () => void;
  /** Orb size during the speech. Default 120 — large enough to feel
   *  "present." For inline mentions, use a much smaller size. */
  orbSize?: number;
  /** Subtle "tap to continue" prompt after all lines are done. Default true. */
  showTapPrompt?: boolean;
  /** Entrance animation on the orb (slide-up + scale). Default true.
   *  Set false when the orb is already on screen (e.g. between slides). */
  animateEntrance?: boolean;
  /** Milliseconds between characters in the typewriter. Default 38 —
   *  slow enough to read along, fast enough not to drag. */
  charsPerMs?: number;
  /** Milliseconds between lines. Default 600 — gives the moment room. */
  pauseBetweenLines?: number;
};

export function KaiSpeaks({
  lines,
  onDone,
  orbSize = 120,
  showTapPrompt = true,
  animateEntrance = true,
  charsPerMs = 38,
  pauseBetweenLines = 600,
}: KaiSpeaksProps) {
  // Current line index — which line we're typing.
  const [lineIdx, setLineIdx] = useState(0);
  // How many characters of the current line are visible.
  const [charIdx, setCharIdx] = useState(0);
  // Whether everything's done (waiting for the user tap).
  const [done, setDone] = useState(false);
  // Has the user already triggered done callback once?
  const finishedRef = useRef(false);

  const currentLine = lines[lineIdx] ?? "";
  const currentLineDone = charIdx >= currentLine.length;
  const isLastLine = lineIdx >= lines.length - 1;

  // Typewriter: advance one character at a time on a timer.
  useEffect(() => {
    if (currentLineDone) return;
    const t = window.setTimeout(() => {
      setCharIdx((c) => c + 1);
    }, charsPerMs);
    return () => window.clearTimeout(t);
  }, [charIdx, currentLine, currentLineDone, charsPerMs]);

  // When a line completes, after the pause, advance to the next one.
  useEffect(() => {
    if (!currentLineDone) return;
    if (isLastLine) {
      // Whole sequence finished — let the moment breathe before showing
      // the tap prompt. We don't auto-fire onDone; user gesture only.
      const t = window.setTimeout(() => setDone(true), 200);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      setLineIdx((i) => i + 1);
      setCharIdx(0);
    }, pauseBetweenLines);
    return () => window.clearTimeout(t);
  }, [currentLineDone, isLastLine, pauseBetweenLines]);

  // Tap to skip / advance.
  function handleTap() {
    if (!currentLineDone) {
      // Skip the current line — jump to full.
      setCharIdx(currentLine.length);
      return;
    }
    if (!isLastLine) {
      // Jump to next line immediately.
      setLineIdx((i) => i + 1);
      setCharIdx(0);
      return;
    }
    // All done — fire onDone (once).
    if (!finishedRef.current) {
      finishedRef.current = true;
      onDone?.();
    }
  }

  return (
    <div
      onClick={handleTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleTap();
        }
      }}
      className="flex w-full cursor-pointer select-none flex-col items-center text-center focus-ring"
    >
      <div className={animateEntrance ? "kai-orb-enter" : ""}>
        <KaiOrb size={orbSize} face />
      </div>
      {/* The typewriter line area. Reserve vertical space so the layout
          doesn't bounce as lines come and go. */}
      <div className="mt-7 min-h-[6rem] w-full max-w-md px-4">
        <p
          className="font-display text-2xl font-medium leading-snug tracking-tight text-text-primary sm:text-3xl"
          aria-live="polite"
        >
          {currentLine.slice(0, charIdx)}
          {!currentLineDone && (
            <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-text-primary/60 animate-pulse" aria-hidden="true" />
          )}
        </p>
        {/* Previous-line ghosts: dim, smaller, stacked above so the user
            can re-read what was said. Caps at 2 ghosts to keep tidy. */}
        {lineIdx > 0 && (
          <div className="mt-3 space-y-1.5">
            {lines.slice(Math.max(0, lineIdx - 2), lineIdx).map((l, i) => (
              <p
                key={`${i}-${l}`}
                className="text-sm leading-snug text-text-muted"
                aria-hidden="true"
              >
                {l}
              </p>
            ))}
          </div>
        )}
      </div>

      {showTapPrompt && done && (
        <p
          className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted animate-pulse"
          aria-hidden="true"
        >
          tap to continue
        </p>
      )}

      {/* One-off CSS for the orb's entrance — a soft float-up + scale.
          Tailwind doesn't ship this preset; kept inline so it's owned
          by this component. */}
      <style>{`
        @keyframes kai-orb-enter {
          0%   { transform: translateY(40px) scale(0.7); opacity: 0; }
          60%  { transform: translateY(-4px) scale(1.04); opacity: 1; }
          100% { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        .kai-orb-enter {
          animation: kai-orb-enter 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </div>
  );
}
