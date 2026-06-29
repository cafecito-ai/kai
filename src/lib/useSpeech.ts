// Browser-native speech layer for the voice-first onboarding.
//
// Wraps SpeechRecognition (speech -> text) and SpeechSynthesis (Kai speaks).
// Only the final transcript TEXT is handed to the caller (and from there to the
// backend) — we never upload audio ourselves. Note: some browsers (e.g. Chrome)
// implement SpeechRecognition with a server-side engine, so the browser itself
// may send audio to its own speech service; that's outside this code's control,
// which is why the UI copy promises only "Kai receives the words", not on-device
// audio. How the voice *sounds* is explicitly low-priority; the typed fallback
// is a first-class path, not an afterthought,
// so onboarding works fully even where SpeechRecognition is missing
// (notably iOS Safari) or the mic is denied.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RecognitionPermission = "unknown" | "granted" | "denied";

export interface SpeechController {
  supported: { recognition: boolean; synthesis: boolean };
  permission: RecognitionPermission;
  listening: boolean;
  interimTranscript: string;
  /** Begin push-to-talk capture. */
  start: () => void;
  /** Finalize the current utterance. */
  stop: () => void;
  /** Speak a line (no-op if synthesis unavailable). */
  speak: (text: string, opts?: { onEnd?: () => void }) => void;
  cancelSpeech: () => void;
}

// Minimal structural typings for the Web Speech API (not in lib.dom for all TS
// targets, and prefixed webkit on Chrome/Safari).
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function synthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// The browser's DEFAULT speech voice is usually the most robotic one available;
// modern devices ship a far more natural voice that we just have to select.
// Higher score = more natural. (Scored on the voice NAME, restricted to English.)
const VOICE_PREFERENCES: Array<{ match: RegExp; score: number }> = [
  { match: /natural/i, score: 100 }, // Microsoft "… (Natural)" online voices
  { match: /\bgoogle\b/i, score: 92 }, // Chrome "Google US English"
  { match: /siri/i, score: 90 },
  { match: /enhanced|premium/i, score: 86 }, // Apple enhanced/premium voices
  { match: /aria|jenny|guy|libby|sonia|emma|ryan/i, score: 82 }, // MS neural names
  { match: /\b(samantha|ava|allison|aaron|nicky|zoe|evan|joelle)\b/i, score: 80 }, // Apple natural-ish
];

// Novelty / low-quality engines to avoid (eSpeak on Linux, Apple's joke voices).
const VOICE_BLOCKLIST =
  /espeak|e-speak|albert|zarvox|bad news|good news|bells|bahh|trinoids|whisper|wobble|cellos|organ|boing|jester|superstar|bubbles|deranged|hysterical|pipe organ|fred|junior|ralph|kathy/i;

/** Pick the most natural-sounding English voice the device offers. Exported for
 *  testing. */
export function pickPreferredVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((v) => /^en(-|_|$)/i.test(v.lang) && !VOICE_BLOCKLIST.test(v.name));
  const pool = english.length ? english : voices;
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -1;
  for (const v of pool) {
    let score = 0;
    for (const p of VOICE_PREFERENCES) if (p.match.test(v.name)) score = Math.max(score, p.score);
    if (/^en[-_]us/i.test(v.lang)) score += 5; // prefer US English
    if (v.localService) score += 2; // offline = reliable + low latency
    if (v.default) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best;
}

export function useSpeech(opts: { onFinalTranscript: (text: string) => void }): SpeechController {
  const { onFinalTranscript } = opts;
  const recognitionCtor = useMemo(getRecognitionCtor, []);
  const supported = useMemo(
    () => ({ recognition: !!recognitionCtor, synthesis: synthesisSupported() }),
    [recognitionCtor],
  );

  const [permission, setPermission] = useState<RecognitionPermission>("unknown");
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;

  // The preferred (most natural) voice. Voices load asynchronously in some
  // browsers (getVoices() is empty until "voiceschanged"), so we (re)select
  // whenever the list changes.
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (!synthesisSupported()) return;
    const load = () => {
      const v = pickPreferredVoice(window.speechSynthesis.getVoices());
      if (v) voiceRef.current = v;
    };
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);

  // Lazily construct one recognition instance.
  const ensureRecognition = useCallback((): SpeechRecognitionLike | null => {
    if (!recognitionCtor) return null;
    if (recognitionRef.current) return recognitionRef.current;
    const rec = new recognitionCtor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInterimTranscript(interim);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setPermission("denied");
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      const text = finalRef.current.trim();
      finalRef.current = "";
      setInterimTranscript("");
      if (text) onFinalRef.current(text);
    };
    recognitionRef.current = rec;
    return rec;
  }, [recognitionCtor]);

  const cancelSpeech = useCallback(() => {
    if (synthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const start = useCallback(() => {
    const rec = ensureRecognition();
    if (!rec) return;
    // Don't let Kai's TTS bleed into the mic.
    cancelSpeech();
    finalRef.current = "";
    setInterimTranscript("");
    try {
      rec.start();
      setListening(true);
      setPermission((p) => (p === "denied" ? p : "granted"));
    } catch {
      // start() throws if already running — ignore.
    }
  }, [ensureRecognition, cancelSpeech]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const speak = useCallback((text: string, speakOpts?: { onEnd?: () => void }) => {
    if (!synthesisSupported() || !text.trim()) {
      speakOpts?.onEnd?.();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const voice = voiceRef.current;
      if (voice) u.voice = voice;
      u.lang = voice?.lang || "en-US";
      // Slightly slower + a touch higher reads warmer and less clipped than the
      // robotic default; this is the "older sibling talking to you" cadence.
      u.rate = 0.96;
      u.pitch = 1.05;
      if (speakOpts?.onEnd) u.onend = () => speakOpts.onEnd?.();
      window.speechSynthesis.speak(u);
    } catch {
      speakOpts?.onEnd?.();
    }
  }, []);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
      cancelSpeech();
    };
  }, [cancelSpeech]);

  return { supported, permission, listening, interimTranscript, start, stop, speak, cancelSpeech };
}
