import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialState, reducer } from "../../lib/onboarding/conversationEngine";
import type { SpeechController } from "../../lib/useSpeech";
import { VoiceConversation } from "./VoiceConversation";

function noSpeech(overrides: Partial<SpeechController> = {}): SpeechController {
  return {
    supported: { recognition: false, synthesis: false },
    permission: "unknown",
    listening: false,
    interimTranscript: "",
    start: vi.fn(),
    stop: vi.fn(),
    speak: vi.fn(),
    cancelSpeech: vi.fn(),
    ...overrides,
  };
}

function conversingState() {
  // begin() pushes Kai's first line and sets status to awaiting-user.
  return reducer(createInitialState("voice"), { type: "begin" });
}

describe("VoiceConversation", () => {
  it("degrades to typed input when SpeechRecognition is unavailable", () => {
    const onUserUtterance = vi.fn();
    render(<VoiceConversation state={conversingState()} onUserUtterance={onUserUtterance} speech={noSpeech()} />);

    // No mic affordance when recognition isn't supported…
    expect(screen.queryByText(/tap to talk/i)).not.toBeInTheDocument();
    // …but the typed reply is available, and submitting calls back.
    const box = screen.getByLabelText(/your reply to kai/i);
    fireEvent.change(box, { target: { value: "I'm Leo" } });
    fireEvent.click(screen.getByLabelText(/send/i));
    expect(onUserUtterance).toHaveBeenCalledWith("I'm Leo");
  });

  it("carries Kai's line in an aria-live region", () => {
    const state = conversingState();
    render(<VoiceConversation state={state} onUserUtterance={vi.fn()} speech={noSpeech()} />);
    const kaiLine = state.transcript[0].text;
    expect(screen.getByText(kaiLine)).toBeInTheDocument();
  });

  it("shows the mic affordance when recognition IS supported", () => {
    const speech = noSpeech({ supported: { recognition: true, synthesis: true } });
    render(<VoiceConversation state={conversingState()} onUserUtterance={vi.fn()} speech={speech} />);
    expect(screen.getByText(/tap to talk/i)).toBeInTheDocument();
  });
});
