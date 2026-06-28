// Browser-native speech layer for the voice-first onboarding.
//
// Wraps SpeechRecognition (speech -> text) and SpeechSynthesis (Kai speaks).
// AUDIO STAYS ON THE DEVICE — only the final transcript text is handed to the
// caller (and from there to the backend). How the voice *sounds* is explicitly
// low-priority; the typed fallback is a first-class path, not an afterthought,
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
      u.rate = 1.0;
      u.pitch = 1.0;
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
