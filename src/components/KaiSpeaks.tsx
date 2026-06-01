// KaiSpeaks — the "KAI is alive and talking to you" scene.
//
// Used for the magic moments where KAI feels like a character, not a
// tutorial pop-up. Inspired by Ticket to Read's character intro: the
// orb floats in, settles, then speaks line-by-line with paced beats so
// it feels like a presence rather than a wall of text.
//
// Features tuned for a 13-year-old reader:
//   - Slow typewriter (~12 chars/sec) — easy to read along
//   - Punctuation pauses — periods/commas get an extra breath
//   - Pulsing halo around the orb while a line is being spoken
//   - Web Speech synthesis — KAI's voice is read aloud through the
//     device's best available voice, with a mute toggle that persists
//     in localStorage
//   - Tap anywhere to skip current line / advance

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { KaiOrb } from "./KaiOrb";

type KaiSpeaksProps = {
  /** The lines KAI says, in order. Each line gets its own typewriter pass. */
  lines: string[];
  /** Fires after the last line has fully typed AND been seen briefly. */
  onDone?: () => void;
  /** Orb size during the speech. Default 120 — large enough to feel "present." */
  orbSize?: number;
  /** Subtle "tap to continue" prompt after all lines are done. Default true. */
  showTapPrompt?: boolean;
  /** Entrance animation on the orb (slide-up + scale). Default true. */
  animateEntrance?: boolean;
  /** Milliseconds per character. Default 85 — easy reading-along pace
   *  for younger users. Override to speed up specific scenes. */
  charsPerMs?: number;
  /** Milliseconds between lines (after punctuation pause). Default 800. */
  pauseBetweenLines?: number;
};

// Punctuation gives speech rhythm — sentences land, commas breathe.
const PUNCT_PAUSE_MS: Record<string, number> = {
  ".": 320,
  "!": 320,
  "?": 320,
  ",": 160,
  ";": 200,
  ":": 200,
  "—": 220,
};

const VOICE_PREF_KEY = "kai_voice_enabled_v1";

export function KaiSpeaks({
  lines,
  onDone,
  orbSize = 120,
  showTapPrompt = true,
  animateEntrance = true,
  charsPerMs = 85,
  pauseBetweenLines = 800,
}: KaiSpeaksProps) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);
  const finishedRef = useRef(false);

  // Voice: default ON. Persist user's pref across scenes/sessions.
  const [voiceOn, setVoiceOn] = useState<boolean>(() => {
    if (typeof localStorage === "undefined") return true;
    try {
      const raw = localStorage.getItem(VOICE_PREF_KEY);
      return raw === null ? true : raw === "1";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(VOICE_PREF_KEY, voiceOn ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [voiceOn]);

  const currentLine = lines[lineIdx] ?? "";
  const currentLineDone = charIdx >= currentLine.length;
  const isLastLine = lineIdx >= lines.length - 1;

  // Speak the current line aloud the moment we start typing it.
  useEffect(() => {
    if (!voiceOn) return;
    if (charIdx !== 0) return;
    if (!currentLine) return;
    speakLine(currentLine);
    return () => {
      // Stop any in-flight speech if the component re-keys or unmounts.
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [lineIdx, currentLine, voiceOn, charIdx]);

  // Typewriter with punctuation pauses.
  useEffect(() => {
    if (currentLineDone) return;
    const nextChar = currentLine[charIdx];
    const punctPause = PUNCT_PAUSE_MS[nextChar] ?? 0;
    const delay = charsPerMs + punctPause;
    const t = window.setTimeout(() => {
      setCharIdx((c) => c + 1);
    }, delay);
    return () => window.clearTimeout(t);
  }, [charIdx, currentLine, currentLineDone, charsPerMs]);

  // When a line completes, after the pause, advance to the next one.
  useEffect(() => {
    if (!currentLineDone) return;
    if (isLastLine) {
      const t = window.setTimeout(() => setDone(true), 300);
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
      // Skip typing — jump to full line.
      setCharIdx(currentLine.length);
      return;
    }
    if (!isLastLine) {
      setLineIdx((i) => i + 1);
      setCharIdx(0);
      return;
    }
    if (!finishedRef.current) {
      finishedRef.current = true;
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
      onDone?.();
    }
  }

  function toggleVoice(e: React.MouseEvent) {
    e.stopPropagation();
    setVoiceOn((v) => {
      if (v) {
        try {
          window.speechSynthesis?.cancel();
        } catch {
          /* ignore */
        }
      }
      return !v;
    });
  }

  // Halo pulses while a line is actively being typed (i.e. KAI is "speaking").
  const speaking = !currentLineDone;

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
      className="relative flex w-full cursor-pointer select-none flex-col items-center text-center focus-ring"
    >
      {/* Voice toggle — top-right corner, doesn't trigger tap-to-advance */}
      <button
        type="button"
        onClick={toggleVoice}
        aria-label={voiceOn ? "Mute KAI's voice" : "Unmute KAI's voice"}
        className="
          absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center
          rounded-full text-text-secondary
          transition hover:bg-surface-muted focus-ring
        "
      >
        {voiceOn ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
      </button>

      {/* The orb, surrounded by a pulsing halo while speaking */}
      <div
        className={`relative ${animateEntrance ? "kai-orb-enter" : ""}`}
        style={{ width: orbSize, height: orbSize }}
      >
        <div
          className={`
            pointer-events-none absolute inset-[-22%] rounded-full
            bg-accent/30 blur-2xl transition-opacity duration-500
            ${speaking ? "opacity-90 kai-halo-pulse" : "opacity-30"}
          `}
          aria-hidden="true"
        />
        <div
          className={speaking ? "kai-orb-speak" : ""}
          style={{ width: orbSize, height: orbSize }}
        >
          <KaiOrb size={orbSize} face />
        </div>
      </div>

      {/* Spoken text — typewriter area */}
      <div className="mt-7 min-h-[8rem] w-full max-w-md px-4">
        <p
          className="font-display text-2xl font-medium leading-snug tracking-tight text-text-primary sm:text-3xl"
          aria-live="polite"
        >
          {currentLine.slice(0, charIdx)}
          {!currentLineDone && (
            <span
              className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-text-primary/60 animate-pulse"
              aria-hidden="true"
            />
          )}
        </p>
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

      <style>{`
        @keyframes kai-orb-enter {
          0%   { transform: translateY(48px) scale(0.7); opacity: 0; }
          60%  { transform: translateY(-6px) scale(1.05); opacity: 1; }
          100% { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        .kai-orb-enter {
          animation: kai-orb-enter 1100ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes kai-halo-pulse {
          0%, 100% { transform: scale(1);    opacity: 0.85; }
          50%      { transform: scale(1.08); opacity: 1; }
        }
        .kai-halo-pulse {
          animation: kai-halo-pulse 1800ms ease-in-out infinite;
        }
        @keyframes kai-orb-speak {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.025); }
        }
        .kai-orb-speak {
          animation: kai-orb-speak 1800ms ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Web Speech helpers
// ─────────────────────────────────────────────────────────────────────

/** Pick the best available voice for KAI. iOS Safari has "Samantha";
 *  Android Chrome has "Google US English"; everything else falls back
 *  to the first en-US voice. Cached after first lookup. */
let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function ensureVoicesLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    if (voicesLoaded || window.speechSynthesis.getVoices().length > 0) {
      voicesLoaded = true;
      resolve();
      return;
    }
    // Voices load asynchronously on first invocation.
    const onChange = () => {
      voicesLoaded = true;
      window.speechSynthesis.removeEventListener("voiceschanged", onChange);
      resolve();
    };
    window.speechSynthesis.addEventListener("voiceschanged", onChange);
    // Fallback in case the event never fires.
    window.setTimeout(() => {
      voicesLoaded = true;
      resolve();
    }, 800);
  });
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const preferred = [
    "Samantha",            // iOS Safari default — warm female voice
    "Google US English",   // Android Chrome
    "Google UK English Female",
    "Microsoft Aria Online (Natural) - English (United States)",
    "Karen",               // Australian English on macOS
  ];
  for (const name of preferred) {
    const v = voices.find((x) => x.name === name);
    if (v) {
      cachedVoice = v;
      return v;
    }
  }
  // Fallback: any en-US voice.
  const en = voices.find((v) => v.lang === "en-US") ?? voices[0];
  cachedVoice = en;
  return en;
}

function speakLine(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    // Cancel any in-flight speech so lines don't pile up if the user
    // skips fast.
    window.speechSynthesis.cancel();
    void ensureVoicesLoaded().then(() => {
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = 0.92;   // slightly slower than default for warmth
      u.pitch = 1.0;
      u.volume = 0.9;
      try {
        window.speechSynthesis.speak(u);
      } catch {
        /* some browsers throw on rapid speak() — fine to swallow */
      }
    });
  } catch {
    /* ignore */
  }
}
