import { describe, expect, it } from "vitest";
import { parseToolCards } from "./kai-tools";

describe("parseToolCards", () => {
  it("strips kai-tools fences and returns registered tools", () => {
    const result = parseToolCards('Try this.\n```kai-tools\n[{"id":"breathing.478","reason":"tight chest"}]\n```');
    expect(result.text).toBe("Try this.");
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0]).toMatchObject({ id: "breathing.478", label: "Try a 4-7-8 breath", reason: "tight chest" });
  });

  it("drops unknown and malformed tool cards from visible text", () => {
    const unknown = parseToolCards('No raw JSON.\n```kai-tools\n[{"id":"made.up"}]\n```');
    expect(unknown.text).toBe("No raw JSON.");
    expect(unknown.tools).toEqual([]);

    const malformed = parseToolCards("Text\n```kai-tools\nnot-json\n```");
    expect(malformed.text).toBe("Text");
    expect(malformed.tools).toEqual([]);
  });

  it("caps suggestions at three", () => {
    const result = parseToolCards(
      'Cards\n```kai-tools\n[{"id":"breathing.478"},{"id":"thought.reframe"},{"id":"social.reset"},{"id":"goal.create"}]\n```'
    );
    expect(result.tools.map((tool) => tool.id)).toEqual(["breathing.478", "thought.reframe", "social.reset"]);
  });
});
