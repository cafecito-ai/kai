import { describe, expect, it } from "vitest";
import { formatKaiReply, repairComplexMessageReply } from "../src/lib/chat-format";

describe("formatKaiReply", () => {
  it("breaks long KAI replies into readable paragraphs", () => {
    const reply = formatKaiReply(
      "This is a lot to carry, but it is not your whole identity. Start by shrinking today down to the next visible rep. Put your phone across the room, drink water, and do ten minutes of the work before judging the whole day. Confidence comes from evidence, not hype.",
      "mind",
    );

    expect(reply).toContain("\n\n");
    expect(reply).not.toMatch(/philosophy lens|Stoic next move|purpose lens/);
  });

  it("does not append after a natural question", () => {
    const reply = formatKaiReply(
      "Start with one clean action.\n\nWhat feels hardest right now?",
      "mind",
    );

    expect(reply.match(/\?/g)?.length).toBe(1);
  });

  it("keeps a generic model question conversational", () => {
    const reply = formatKaiReply(
      "That's a tough cycle to break. Can you tell me more about what's going on when you procrastinate?",
      "mind",
    );

    expect(reply).not.toContain("\n\nWant ");
    expect(reply.match(/\?/g)?.length).toBe(1);
  });

  it("keeps only one follow-up question when the model over-asks", () => {
    const reply = formatKaiReply(
      "Test tomorrow can be really overwhelming. What's going through your mind right now? Is it the material itself or more about the pressure to do well?\n\nWhat's been the most challenging part of studying for this test so far?",
      "mind",
    );

    expect(reply.match(/\?/g)?.length).toBe(1);
    expect(reply).not.toContain("most challenging part");
  });

  it("allows deeper replies without adding a forced menu", () => {
    const reply = formatKaiReply(
      [
        "First useful thought.",
        "Second useful thought.",
        "Third useful thought.",
        "Fourth useful example.",
        "Fifth useful step.",
        "Sixth useful follow-up.",
        "Seventh extra thought that should not keep expanding the bubble.",
      ].join("\n\n"),
      "body",
    );

    expect(reply).toContain("First useful thought.");
    expect(reply).toContain("Sixth useful follow-up.");
    expect(reply).not.toContain("Seventh extra thought");
    expect(reply).not.toMatch(/discipline lens|one clean next move/);
    expect(reply.split("\n\n").length).toBeLessThanOrEqual(6);
  });

  it("uses a small human fallback for empty replies", () => {
    expect(formatKaiReply("", "mind")).toBe("I’m here. What’s actually going on today?");
  });

  it("keeps bullet lists together so deeper guidance is not truncated early", () => {
    const reply = formatKaiReply(
      [
        "Opening thought that sets context.",
        [
          "- Confidence: build evidence through small reps.",
          "- Communication: ask normal questions and listen.",
          "- Respect: stay kind if someone is not interested.",
          "- Self-improvement: build a life you are proud of.",
        ].join("\n"),
        "A simple first-week plan goes here.",
        "One useful follow-up question?",
      ].join("\n\n"),
      "mind",
    );

    expect(reply).toContain("Self-improvement");
    expect(reply).toContain("first-week plan");
    expect(reply).toContain("follow-up question");
  });
});

describe("repairComplexMessageReply", () => {
  const complexMessage =
    "I wrote this in a complicated way because the whole thing is complicated. There are three different pieces happening at once, and every time I try to explain one part, the other two parts change what it means. Now I cannot tell if I should act, wait, or just try to calm down first because every option feels wrong.";

  it("adds a concrete next move when a complex-message reply stays vague", () => {
    const reply = repairComplexMessageReply(
      "You’re overwhelmed by a situation that keeps changing every time you look at it.",
      complexMessage,
    );

    expect(reply).toContain("For right now");
    expect(reply).toContain("10 minutes");
    expect(reply).toContain("one decision");
  });

  it("replaces plain-language deflections for complex messages", () => {
    const reply = repairComplexMessageReply("Say it a little more plainly and I’ll help.", complexMessage);

    expect(reply).toContain("don’t need to simplify it");
    expect(reply).toContain("next move");
    expect(reply).not.toMatch(/say it .*plain|more plainly/i);
  });

  it("leaves replies with a concrete action alone", () => {
    const reply = repairComplexMessageReply("This is messy. Start with water and write one sentence.", complexMessage);

    expect(reply).toBe("This is messy. Start with water and write one sentence.");
  });
});
