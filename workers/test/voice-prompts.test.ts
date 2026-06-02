// T-033 — voice prompts tests.
//
// Critical invariants:
//   - Voice opening line matches CLAUDE_v3_PATCH §7 exactly
//   - Voice prompts include the response-length cap rule
//   - Voice prompts include the 988 crisis handoff line
//   - Body voice prompt includes forbidden-language rules
//   - Under-16 body voice gets the no-weights rule
//   - Routing heuristic picks reasonably for common opening lines

import { describe, expect, it } from "vitest";
import type { KaiContext } from "../src/lib/context";
import {
  pickVoiceAgent,
  renderBodyVoicePrompt,
  renderMindVoicePrompt,
  VOICE_OPENING_LINE,
} from "../src/lib/voice-prompts";

function ctx(overrides: Partial<KaiContext> = {}): KaiContext {
  return {
    userId: "u1",
    displayName: "Lev",
    age: 16,
    kaiName: "KAI",
    kaiTone: "balanced",
    primaryEngine: "mental",
    intakeSummary: null,
    streakOverall: 0,
    recentPatterns: [],
    ...overrides,
  };
}

describe("VOICE_OPENING_LINE", () => {
  it("matches CLAUDE_v3_PATCH §7 verbatim", () => {
    expect(VOICE_OPENING_LINE).toBe(
      "Hey, this is KAI. Mental or physical today — or just want to talk?",
    );
  });
});

describe("renderMindVoicePrompt", () => {
  it("includes the 8-15 second response rule", () => {
    const p = renderMindVoicePrompt(ctx());
    expect(p).toMatch(/8-15 seconds/);
  });

  it("includes the 988 crisis handoff phrase", () => {
    const p = renderMindVoicePrompt(ctx());
    expect(p).toMatch(/988/);
    expect(p).toMatch(/I want to make sure you're okay/);
  });

  it("forbids lists and headers (voice = no list-y output)", () => {
    const p = renderMindVoicePrompt(ctx());
    expect(p).toMatch(/No bulleted lists/i);
    expect(p).toMatch(/No headers/i);
  });

  it("includes the user's name", () => {
    const p = renderMindVoicePrompt(ctx({ displayName: "Sam" }));
    expect(p).toContain("Sam");
  });

  it("forbids namedropping researchers (voice ≠ chat)", () => {
    const p = renderMindVoicePrompt(ctx());
    expect(p).toMatch(/Never read philosophy quotes|never namedrop/i);
  });
});

describe("renderBodyVoicePrompt", () => {
  it("includes the forbidden body-language rule", () => {
    const p = renderBodyVoicePrompt(ctx());
    expect(p).toMatch(/Never use words like fat, skinny/i);
  });

  it("includes the no-supplements rule", () => {
    const p = renderBodyVoicePrompt(ctx());
    expect(p).toMatch(/Never recommend supplements/i);
  });

  it("includes the no-pain rule", () => {
    const p = renderBodyVoicePrompt(ctx());
    expect(p).toMatch(/Never push training through pain/i);
  });

  it("injects the under-16 bodyweight default for age 14", () => {
    const p = renderBodyVoicePrompt(ctx({ age: 14 }));
    expect(p).toMatch(/under 16/i);
    expect(p).toMatch(/NEVER recommend specific weights/);
    expect(p).toMatch(/bodyweight/i);
  });

  it("does NOT inject the under-16 rule for 16+", () => {
    const p = renderBodyVoicePrompt(ctx({ age: 17 }));
    expect(p).not.toMatch(/under 16/i);
  });

  it("includes the 988 handoff for eating-disorder / acute crisis", () => {
    const p = renderBodyVoicePrompt(ctx());
    expect(p).toMatch(/988/);
  });
});

describe("pickVoiceAgent", () => {
  it("routes workout / training / lift to physical", () => {
    expect(pickVoiceAgent("Physical today")).toBe("physical");
    expect(pickVoiceAgent("I want to talk about my workout")).toBe("physical");
    expect(pickVoiceAgent("Training feedback")).toBe("physical");
    expect(pickVoiceAgent("Sleep was bad")).toBe("physical");
    expect(pickVoiceAgent("I'm tired all day")).toBe("physical");
  });

  it("routes feelings / school / stress to mental", () => {
    expect(pickVoiceAgent("Mental")).toBe("mental");
    expect(pickVoiceAgent("I just want to talk")).toBe("mental");
    expect(pickVoiceAgent("School is killing me")).toBe("mental");
    expect(pickVoiceAgent("Anxiety about Friday")).toBe("mental");
  });

  it("ambiguous opens default to mental (per CLAUDE.md §4 — unclear → mental)", () => {
    expect(pickVoiceAgent("hey")).toBe("mental");
    expect(pickVoiceAgent("idk just whatever")).toBe("mental");
  });
});
