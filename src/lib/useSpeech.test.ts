import { describe, expect, it } from "vitest";
import { pickPreferredVoice } from "./useSpeech";

// Minimal stand-in for SpeechSynthesisVoice.
function v(name: string, lang = "en-US", extra: Partial<SpeechSynthesisVoice> = {}): SpeechSynthesisVoice {
  return { name, lang, default: false, localService: true, voiceURI: name, ...extra } as SpeechSynthesisVoice;
}

describe("pickPreferredVoice", () => {
  it("prefers a natural/neural voice over the robotic default", () => {
    const voices = [
      v("eSpeak", "en-US", { default: true }),
      v("Microsoft Aria Online (Natural)"),
      v("Google US English"),
    ];
    expect(pickPreferredVoice(voices)?.name).toBe("Microsoft Aria Online (Natural)");
  });

  it("picks Google US English when that's the best available", () => {
    const voices = [v("Albert"), v("Google US English"), v("Fred")];
    expect(pickPreferredVoice(voices)?.name).toBe("Google US English");
  });

  it("skips blocklisted novelty voices", () => {
    const picked = pickPreferredVoice([v("Zarvox"), v("Bahh"), v("Samantha")]);
    expect(picked?.name).toBe("Samantha");
  });

  it("restricts to English and prefers en-US", () => {
    const picked = pickPreferredVoice([v("Google Deutsch", "de-DE"), v("Daniel", "en-GB"), v("Samantha", "en-US")]);
    expect(picked?.lang.toLowerCase()).toMatch(/^en[-_]us/);
  });

  it("falls back gracefully when no English voice exists", () => {
    expect(pickPreferredVoice([v("Google Deutsch", "de-DE")])?.name).toBe("Google Deutsch");
    expect(pickPreferredVoice([])).toBeNull();
  });
});
