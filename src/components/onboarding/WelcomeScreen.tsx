// First impression — Kai introduces himself and offers to start by talking
// (voice) or typing. No form, no fields. Pure presentation + two callbacks.

import { Keyboard, Mic } from "lucide-react";
import { KaiCharacter } from "../KaiCharacter";
import { MagicEffect } from "../MagicEffect";
import { MagicField } from "../MagicField";

export function WelcomeScreen({
  onBegin,
  voiceSupported,
}: {
  onBegin: (mode: "voice" | "typed") => void;
  voiceSupported: boolean;
}) {
  return (
    <div className="relative mx-auto flex h-[100vh] w-full max-w-md flex-col items-center justify-center overflow-hidden px-6 sm:max-w-lg">
      <MagicField />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative shrink-0">
          <KaiCharacter size={180} face gesture="wave" />
          <MagicEffect kind="summon-right" triggerKey={1} />
        </div>

        <h1 className="mt-6 font-display text-3xl font-semibold text-text-primary">
          Hey — I'm Kai.
        </h1>
        <p className="mt-3 max-w-[20rem] text-base leading-relaxed text-text-secondary animate-fade-slide-up">
          I'm here to help you become the person you want to be — and actually get there.
          Let's get to know each other. It's just a conversation.
        </p>

        <div className="mt-9 flex w-full max-w-[20rem] flex-col gap-3">
          {voiceSupported ? (
            <>
              <button
                type="button"
                onClick={() => onBegin("voice")}
                className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-text-primary text-lg font-semibold text-background shadow-card transition active:scale-[0.99] focus-ring"
              >
                <Mic size={19} aria-hidden="true" />
                Let's talk
              </button>
              <button
                type="button"
                onClick={() => onBegin("typed")}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-glass-border bg-surface/60 text-sm font-semibold text-text-secondary backdrop-blur transition hover:bg-surface focus-ring"
              >
                <Keyboard size={16} aria-hidden="true" />
                I'd rather type
              </button>
              <p className="px-4 text-xs leading-relaxed text-text-muted">
                Talking uses your mic — your voice stays on your device, only the words come through.
              </p>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onBegin("typed")}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-text-primary text-lg font-semibold text-background shadow-card transition active:scale-[0.99] focus-ring"
            >
              <Keyboard size={18} aria-hidden="true" />
              Start the conversation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
