import { describe, expect, it } from "vitest";
import { formatKaiReply } from "../src/lib/chat-format";

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

  it("caps wall-of-text replies without adding a forced menu", () => {
    const reply = formatKaiReply(
      [
        "First useful thought.",
        "Second useful thought.",
        "Third useful thought.",
        "Fourth extra thought that should not keep expanding the bubble.",
        "Fifth extra thought that should not keep expanding the bubble.",
      ].join("\n\n"),
      "body",
    );

    expect(reply).toContain("First useful thought.");
    expect(reply).toContain("Third useful thought.");
    expect(reply).not.toContain("Fourth extra thought");
    expect(reply).not.toMatch(/discipline lens|one clean next move/);
    expect(reply.split("\n\n").length).toBeLessThanOrEqual(3);
  });

  it("uses a small human fallback for empty replies", () => {
    expect(formatKaiReply("", "mind")).toBe("I’m here. What’s actually going on today?");
  });
});
