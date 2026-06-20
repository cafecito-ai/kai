// Bucket 1 — Kai response quality.
//
// The core trust change: when the model is genuinely unavailable, the chat
// route must NOT fabricate an in-voice "lost the thread" reply and persist it
// as if Kai said it. resolveChatOutcome is the pure decision behind that:
//   - a real Anthropic reply  → kind "reply" (capped to one follow-up question)
//   - body reply still tripping the language filter → safe canned body line
//     (a content-safety guarantee, NOT a model outage)
//   - any non-anthropic source → "model_unavailable" so the caller asks the
//     client to retry instead of faking a line.

import { describe, expect, it } from "vitest";
import { BODY_LANGUAGE_FALLBACK } from "../src/lib/body-language-filter";
import { limitToOneQuestion, resolveChatOutcome } from "../src/routes/chat";

describe("resolveChatOutcome — no fabricated reply on outage", () => {
  it("returns model_unavailable when the source is the rule-table fallback", () => {
    const outcome = resolveChatOutcome({
      decision: "mental",
      source: "fallback",
      reply: "some canned rule-table line",
      passesBodyFilter: true,
    });
    expect(outcome).toEqual({ kind: "model_unavailable" });
  });

  it("returns model_unavailable when only the Llama secondary answered", () => {
    const outcome = resolveChatOutcome({
      decision: "mental",
      source: "workers-ai",
      reply: "llama text",
      passesBodyFilter: true,
    });
    expect(outcome).toEqual({ kind: "model_unavailable" });
  });

  it("serves a real Anthropic reply", () => {
    const outcome = resolveChatOutcome({
      decision: "mental",
      source: "anthropic",
      reply: "Here's the real read, and one thing to try today.",
      passesBodyFilter: true,
    });
    expect(outcome).toEqual({
      kind: "reply",
      reply: "Here's the real read, and one thing to try today.",
    });
  });
});

describe("resolveChatOutcome — body-language content safety", () => {
  it("serves the safe canned body line when a body reply still trips the filter", () => {
    // Even though the model 'spoke' (anthropic), a dirty body reply must not go
    // out — this is a content-safety guarantee, not a model outage.
    const outcome = resolveChatOutcome({
      decision: "physical",
      source: "anthropic",
      reply: "you're looking ripped and shredded",
      passesBodyFilter: false,
    });
    expect(outcome).toEqual({ kind: "body_filter_fallback", reply: BODY_LANGUAGE_FALLBACK });
  });

  it("a body outage (no model + clean rule-table line) is still a retry, not a fake reply", () => {
    const outcome = resolveChatOutcome({
      decision: "physical",
      source: "fallback",
      reply: "clean rule-table body line",
      passesBodyFilter: true,
    });
    expect(outcome).toEqual({ kind: "model_unavailable" });
  });
});

describe("limitToOneQuestion", () => {
  it("keeps a single follow-up question untouched", () => {
    const text = "That makes sense. What felt hardest about it?";
    expect(limitToOneQuestion(text)).toBe(text);
  });

  it("drops all but the last question, keeping statements, when a reply interrogates", () => {
    const out = limitToOneQuestion("You studied hard. How did that feel? What did you do?");
    expect(out).toBe("You studied hard. What did you do?");
  });

  it("leaves statements alone", () => {
    const text = "Start with one small rep today. That's the whole fight.";
    expect(limitToOneQuestion(text)).toBe(text);
  });
});
