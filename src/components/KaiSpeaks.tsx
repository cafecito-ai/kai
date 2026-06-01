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

import { KaiCharacter } from "./KaiCharacter";

type KaiSpeaksProps = {
  /** The lines KAI says, in order. Each line gets a fade-in pop. */
  lines: string[];
  /** Fires after the last line has finished speaking + a short pause. */
  onDone?: () => void;
  /** Total character height (head + body) in pixels. Default 240. */
  orbSize?: number;
  /** Subtle "tap to continue" prompt after all lines are done. Default true. */
  showTapPrompt?: boolean;
  /** Entrance animation on the character (slide-up + scale). Default true. */
  animateEntrance?: boolean;
  /** How long each line stays on screen before the next one fades in.
   *  Default scales with line length — roughly the time KAI needs to
   *  say it out loud (~280ms/word). Override per scene if needed. */
  msPerLine?: (line: string) => number;
};

/** Default: roughly enough time for the device voice to finish speaking.
 *  Tuned so a short line lingers ~1.6s and a long line ~3.5s. */
function defaultMsPerLine(line: string): number {
  const words = line.trim().split(/\s+/).length;
  return Math.max(1400, words * 280 + 600);
}

const VOICE_PREF_KEY = "kai_voice_enabled_v1";

export function KaiSpeaks({
  lines,
  onDone,
  orbSize = 240,
  showTapPrompt = true,
  animateEntrance = true,
  msPerLine = defaultMsPerLine,
}: KaiSpeaksProps) {
  const [lineIdx, setLineIdx] = useState(0);
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
  const isLastLine = lineIdx >= lines.length - 1;

  // Speak the current line aloud the moment it appears, then advance
  // after a duration scaled to the line length (roughly how long the
  // device voice takes to read it).
  useEffect(() => {
    if (!currentLine) return;
    if (voiceOn) speakLine(currentLine);
    const hold = msPerLine(currentLine);
    const t = window.setTimeout(() => {
      if (isLastLine) {
        setDone(true);
      } else {
        setLineIdx((i) => i + 1);
      }
    }, hold);
    return () => {
      window.clearTimeout(t);
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [lineIdx, currentLine, voiceOn, isLastLine, msPerLine]);

  // Tap to skip / advance.
  function handleTap() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
    if (!isLastLine) {
      setLineIdx((i) => i + 1);
      return;
    }
    if (!finishedRef.current) {
      finishedRef.current = true;
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

  // KAI is "speaking" the whole time the line is on screen.
  const speaking = true;

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
      {/* Voice toggle — top-right, doesn't trigger tap-to-advance */}
      <button
        type="button"
        onClick={toggleVoice}
        aria-label={voiceOn ? "Mute KAI's voice" : "Unmute KAI's voice"}
        className="
          absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center
          rounded-full text-text-secondary
          transition hover:bg-surface-muted focus-ring z-10
        "
      >
        {voiceOn ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
      </button>

      {/* The character — orb head + wisp body + hand orbs. Halo glow
          behind it pulses while speaking. */}
      <div
        className={`relative ${animateEntrance ? "kai-character-enter" : ""}`}
      >
        <div
          className="
            pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2
            h-[120%] w-[120%] rounded-full bg-accent/25 blur-3xl
            kai-halo-pulse
          "
          aria-hidden="true"
        />
        <KaiCharacter size={orbSize} face speaking={speaking} />
      </div>

      {/* Spoken text — full line fade-pops in. No reading-along.
          Keyed on line index so each new line replays the animation. */}
      <div className="mt-6 min-h-[5rem] w-full max-w-md px-4">
        <p
          key={lineIdx}
          className="kai-line-pop font-display text-3xl font-medium leading-snug tracking-tight text-text-primary sm:text-4xl"
          aria-live="polite"
        >
          {currentLine}
        </p>
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
        @keyframes kai-character-enter {
          0%   { transform: translateY(60px) scale(0.7); opacity: 0; filter: blur(8px); }
          60%  { transform: translateY(-8px) scale(1.04); opacity: 1; filter: blur(0); }
          100% { transform: translateY(0)    scale(1);    opacity: 1; filter: blur(0); }
        }
        .kai-character-enter {
          animation: kai-character-enter 1300ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes kai-halo-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1);    opacity: 0.7; }
          50%      { transform: translate(-50%, -50%) scale(1.12); opacity: 1; }
        }
        .kai-halo-pulse {
          animation: kai-halo-pulse 2400ms ease-in-out infinite;
        }
        /* Each line fades up + scales in slightly — no reading-along
           typewriter feel, just a moment of words appearing as KAI
           speaks them. */
        @keyframes kai-line-pop {
          0%   { transform: translateY(12px) scale(0.96); opacity: 0; filter: blur(4px); }
          100% { transform: translateY(0)    scale(1);    opacity: 1; filter: blur(0); }
        }
        .kai-line-pop {
          animation: kai-line-pop 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
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
