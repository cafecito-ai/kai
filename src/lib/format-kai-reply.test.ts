import { describe, expect, it } from "vitest";
import { formatKaiReply } from "./format-kai-reply";

describe("formatKaiReply", () => {
  it("returns a single paragraph for a flowing reply (no invented structure)", () => {
    const blocks = formatKaiReply(
      "Off days happen, no need to diagnose it. Easiest reset is a ten-minute walk.",
    );
    expect(blocks).toEqual([
      {
        type: "paragraph",
        text: "Off days happen, no need to diagnose it. Easiest reset is a ten-minute walk.",
      },
    ]);
  });

  it("splits distinct thoughts (blank-line separated) into separate paragraphs", () => {
    const blocks = formatKaiReply("First thought here.\n\nSecond thought here.");
    expect(blocks).toEqual([
      { type: "paragraph", text: "First thought here." },
      { type: "paragraph", text: "Second thought here." },
    ]);
  });

  it("treats single newlines as paragraph breaks too", () => {
    const blocks = formatKaiReply("Line one.\nLine two.");
    expect(blocks).toEqual([
      { type: "paragraph", text: "Line one." },
      { type: "paragraph", text: "Line two." },
    ]);
  });

  it("parses a numbered list and strips the markers", () => {
    const blocks = formatKaiReply("Here's the plan:\n1) Do the warmup\n2) Then the set");
    expect(blocks).toEqual([
      { type: "paragraph", text: "Here's the plan:" },
      { type: "list", ordered: true, items: ["Do the warmup", "Then the set"] },
    ]);
  });

  it("parses a dashed/bulleted list as unordered", () => {
    const blocks = formatKaiReply("- eggs and toast\n- a rice bowl\n• yogurt and fruit");
    expect(blocks).toEqual([
      {
        type: "list",
        ordered: false,
        items: ["eggs and toast", "a rice bowl", "yogurt and fruit"],
      },
    ]);
  });

  it("supports '1.' style numbering", () => {
    const blocks = formatKaiReply("1. first\n2. second");
    expect(blocks).toEqual([
      { type: "list", ordered: true, items: ["first", "second"] },
    ]);
  });

  it("keeps an ordered and an unordered list as separate blocks", () => {
    const blocks = formatKaiReply("1) one\n2) two\n- a\n- b");
    expect(blocks).toEqual([
      { type: "list", ordered: true, items: ["one", "two"] },
      { type: "list", ordered: false, items: ["a", "b"] },
    ]);
  });

  it("does not treat an inline '1) ... 2) ...' sentence as a list", () => {
    const blocks = formatKaiReply("Two things: 1) breathe and 2) start small.");
    expect(blocks).toEqual([
      { type: "paragraph", text: "Two things: 1) breathe and 2) start small." },
    ]);
  });

  it("returns no blocks for empty/whitespace input (caller falls back to raw)", () => {
    expect(formatKaiReply("")).toEqual([]);
    expect(formatKaiReply("   \n  \n")).toEqual([]);
  });
});
