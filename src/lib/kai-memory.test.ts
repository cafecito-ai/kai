import { describe, expect, it } from "vitest";
import { getKaiMemoryItems, getKaiRecentContext } from "./kai-memory";

describe("getKaiRecentContext", () => {
  it("stays quiet until the teen has actually told Kai something", () => {
    expect(getKaiRecentContext([{ id: "a1", role: "assistant", content: "Say it messy." }])).toBeNull();
  });

  it("summarizes the latest user message as recent Kai context", () => {
    expect(
      getKaiRecentContext([
        { id: "u1", role: "user", content: "I slept badly" },
        { id: "a1", role: "assistant", content: "Protect sleep tonight." },
        { id: "u2", role: "user", content: "I also have practice and need to eat better" }
      ])
    ).toMatchObject({
      label: "2 things Kai remembers",
      body: "I also have practice and need to eat better",
      turns: 2
    });
  });

  it("keeps long context compact for mobile", () => {
    const context = getKaiRecentContext([{ id: "u1", role: "user", content: "x ".repeat(80) }]);

    expect(context?.body.length).toBeLessThanOrEqual(96);
    expect(context?.body.endsWith("...")).toBe(true);
  });

  it("treats persisted tool completions as Kai memory", () => {
    expect(
      getKaiMemoryItems([
        { id: "a1", role: "assistant", content: "Log sleep saved. Recovery is logged.", metadata: { source: "tool_completion" } },
        { id: "u1", role: "user", content: "I feel better after stretching" }
      ])
    ).toEqual([
      { id: "u1", label: "You said", body: "I feel better after stretching", kind: "said" },
      { id: "a1", label: "Log sleep", body: "Recovery is logged.", kind: "saved" }
    ]);
  });

  it("can summarize saved context even before a user message hydrates", () => {
    expect(
      getKaiRecentContext([
        { id: "a1", role: "assistant", content: "Body scan saved. Private scan context is saved.", metadata: { source: "tool_completion" } }
      ])
    ).toMatchObject({
      label: "Kai remembers",
      body: "Private scan context is saved."
    });
  });
});
