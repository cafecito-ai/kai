import { describe, expect, it } from "vitest";
import { parseBlocks } from "./ArticleBody";

// We test the pure parser. The React rendering layer is intentionally
// thin and small enough that visual review is sufficient.

describe("parseBlocks", () => {
  it("splits paragraphs separated by blank lines", () => {
    const blocks = parseBlocks("First para.\n\nSecond para.\n\nThird para.");
    expect(blocks).toEqual([
      { kind: "paragraph", text: "First para." },
      { kind: "paragraph", text: "Second para." },
      { kind: "paragraph", text: "Third para." }
    ]);
  });

  it("groups consecutive bullet lines into a single ul block", () => {
    const blocks = parseBlocks("- One\n- Two\n- Three");
    expect(blocks).toEqual([{ kind: "ul", items: ["One", "Two", "Three"] }]);
  });

  it("also accepts asterisk bullet markers", () => {
    const blocks = parseBlocks("* One\n* Two");
    expect(blocks).toEqual([{ kind: "ul", items: ["One", "Two"] }]);
  });

  it("groups consecutive numbered lines into a single ol block", () => {
    const blocks = parseBlocks("1. First\n2. Second\n3. Third");
    expect(blocks).toEqual([{ kind: "ol", items: ["First", "Second", "Third"] }]);
  });

  it("mixes paragraphs and lists with blank-line separators", () => {
    const body = "Intro paragraph.\n\n- bullet one\n- bullet two\n\nClosing paragraph.";
    expect(parseBlocks(body)).toEqual([
      { kind: "paragraph", text: "Intro paragraph." },
      { kind: "ul", items: ["bullet one", "bullet two"] },
      { kind: "paragraph", text: "Closing paragraph." }
    ]);
  });

  it("joins multi-line paragraph text with single spaces", () => {
    // Single newlines inside a paragraph block (no list markers) become spaces,
    // so soft-wrapped source text renders naturally.
    const blocks = parseBlocks("Line one\nLine two\nLine three");
    expect(blocks).toEqual([
      { kind: "paragraph", text: "Line one Line two Line three" }
    ]);
  });

  it("strips trailing/leading whitespace and ignores empty paragraphs", () => {
    const blocks = parseBlocks("\n\n  Hello.  \n\n\n\nWorld.\n\n");
    expect(blocks).toEqual([
      { kind: "paragraph", text: "Hello." },
      { kind: "paragraph", text: "World." }
    ]);
  });

  it("handles a realistic primer body (paragraph + bullets + closing)", () => {
    const body = [
      "**Key facts:**",
      "",
      "- 988 is the US Suicide and Crisis Lifeline.",
      "- Crisis Text Line: text HOME to 741741.",
      "- For LGBTQ+ teens: Trevor Project at 1-866-488-7386.",
      "",
      "These are 24/7 and free.",
    ].join("\n");

    expect(parseBlocks(body)).toEqual([
      { kind: "paragraph", text: "**Key facts:**" },
      {
        kind: "ul",
        items: [
          "988 is the US Suicide and Crisis Lifeline.",
          "Crisis Text Line: text HOME to 741741.",
          "For LGBTQ+ teens: Trevor Project at 1-866-488-7386.",
        ]
      },
      { kind: "paragraph", text: "These are 24/7 and free." }
    ]);
  });

  it("does NOT treat a mixed paragraph as a list", () => {
    const body = "Some intro - with a dash.\n- and a bullet.";
    // First line doesn't start with a bullet marker, so the whole thing
    // collapses into a paragraph block.
    const blocks = parseBlocks(body);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("paragraph");
  });

  it("handles numbered steps that include longer sentences", () => {
    const body = "1. Take a breath.\n2. Notice the body.\n3. Choose one small step.";
    expect(parseBlocks(body)).toEqual([
      {
        kind: "ol",
        items: ["Take a breath.", "Notice the body.", "Choose one small step."]
      }
    ]);
  });
});
