// The live conversation surface. Kai sits center and speaks his current line
// through a bubble; the teen replies by voice (push-to-talk) or by typing — the
// typed input is always present, never a second-class path. An aria-live region
// mirrors Kai's line so screen readers get parity regardless of TTS.

import { useEffect, useRef } from "react";
import { Mic, Square } from "lucide-react";
import type { ConversationState } from "../../lib/onboarding/conversationEngine";
import type { SpeechController } from "../../lib/useSpeech";
import { KaiCharacter } from "../KaiCharacter";
import { MagicField } from "../MagicField";
import { TypedFallback } from "./TypedFallback";

export function VoiceConversation({
  state,
  onUserUtterance,
  speech,
}: {
  state: ConversationState;
  onUserUtterance: (text: string) => void;
  speech: SpeechController;
}) {
  const lastKai = [...state.transcript].reverse().find((t) => t.role === "kai");
  const kaiLine = lastKai?.text ?? "";
  const thinking = state.status === "kai-thinking";
  const safetyHold = state.status === "safety-hold";
  const voiceMode = state.inputMode === "voice" && speech.supported.recognition && !safetyHold;

  // Speak each new Kai line aloud in voice mode. Keyed on the turn timestamp so
  // we don't re-speak on unrelated re-renders.
  const spokenTs = useRef<number | null>(null);
  useEffect(() => {
    if (state.inputMode !== "voice" || !speech.supported.synthesis) return;
    if (!lastKai || spokenTs.current === lastKai.ts) return;
    spokenTs.current = lastKai.ts;
    speech.speak(lastKai.text);
  }, [lastKai, state.inputMode, speech]);

  function toggleMic() {
    if (speech.listening) speech.stop();
    else speech.start();
  }

  return (
    <div className="relative mx-auto flex h-[100vh] w-full max-w-md flex-col overflow-hidden px-6 pb-6 pt-6 sm:max-w-lg">
      <MagicField />

      {/* Stage */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <KaiCharacter size={170} face speaking={!thinking} gesture={thinking ? "idle" : "talk"} />

        <div className="relative mt-2 max-w-[19rem] rounded-3xl border border-glass-border bg-surface px-5 py-4 text-center shadow-card sm:max-w-sm">
          <p className="text-[15px] leading-relaxed text-text-primary" aria-live="polite">
            {thinking ? <span className="text-text-muted">…</span> : kaiLine}
          </p>
        </div>

        {speech.permission === "denied" && (
          <p className="mt-3 px-6 text-center text-xs leading-relaxed text-text-muted">
            No mic access — no problem. Just type your reply below.
          </p>
        )}
      </div>

      {/* Reply controls */}
      <div className="relative z-10 mt-2 flex flex-col gap-3">
        {voiceMode && (
          <div className="flex flex-col items-center gap-2">
            {speech.listening && (
              <p className="min-h-[1.25rem] max-w-[20rem] text-center text-sm text-text-secondary">
                {speech.interimTranscript || "Listening…"}
              </p>
            )}
            <button
              type="button"
              onClick={toggleMic}
              disabled={thinking}
              aria-label={speech.listening ? "Stop and send" : "Hold the mic and talk"}
              className={`flex h-16 w-16 items-center justify-center rounded-full shadow-card transition active:scale-95 focus-ring disabled:opacity-50 ${
                speech.listening
                  ? "bg-accent text-white animate-breathe"
                  : "bg-text-primary text-background"
              }`}
            >
              {speech.listening ? <Square size={22} aria-hidden="true" /> : <Mic size={24} aria-hidden="true" />}
            </button>
            <p className="text-xs text-text-muted">{speech.listening ? "Tap to send" : "Tap to talk"}</p>
          </div>
        )}

        {!safetyHold && (
          <TypedFallback
            onSubmit={onUserUtterance}
            disabled={thinking}
            placeholder={voiceMode ? "…or type instead" : "Say it however you want…"}
          />
        )}

        {safetyHold && (
          <a
            href="/crisis"
            className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-card focus-ring"
          >
            Get support now
          </a>
        )}
      </div>
    </div>
  );
}
