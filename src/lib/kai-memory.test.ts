import { describe, expect, it } from "vitest";
import { getKaiRecentContext } from "./kai-memory";

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
});
