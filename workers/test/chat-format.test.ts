import { describe, expect, it } from "vitest";
import { formatKaiReply } from "../src/lib/chat-format";

describe("formatKaiReply", () => {
  it("breaks long KAI replies into readable paragraphs", () => {
    const reply = formatKaiReply(
      "This is a lot to carry, but it is not your whole identity. Start by shrinking today down to the next visible rep. Put your phone across the room, drink water, and do ten minutes of the work before judging the whole day. Confidence comes from evidence, not hype.",
      "mind",
    );

    expect(reply).toContain("\n\n");
    expect(reply).toMatch(/philosophy lens|Stoic next move|purpose lens/);
  });

  it("does not append a duplicate keep-going offer", () => {
    const reply = formatKaiReply(
      "Start with one clean action.\n\nWant the philosophy lens on this?",
      "mind",
    );

    expect(reply.match(/\?/g)?.length).toBe(1);
  });

  it("does append after a generic model question", () => {
    const reply = formatKaiReply(
      "That's a tough cycle to break. Can you tell me more about what's going on when you procrastinate?",
      "mind",
    );

    expect(reply).toContain("\n\nWant ");
    expect(reply).toMatch(/philosophy lens|Stoic next move/);
  });

  it("caps wall-of-text replies before adding a keep-going prompt", () => {
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
    expect(reply.split("\n\n").length).toBeLessThanOrEqual(4);
  });
});
