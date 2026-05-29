import { describe, expect, it } from "vitest";
import { callClaude } from "../src/lib/claude";
import type { Env } from "../src/types";

describe("callClaude fallback", () => {
  it("does not ask users to rewrite long or complicated text more plainly", async () => {
    const longMessage = [
      "I wrote this in a complicated way because the whole thing is complicated.",
      "There are three different pieces happening at once, and every time I try to explain one part, the other two parts change what it means.",
      "Now I cannot tell if I should act, wait, or just try to calm down first because every option feels wrong.",
    ].join(" ");

    const reply = await callClaude({} as Env, "system", [{ role: "user", content: longMessage }]);

    expect(reply).toContain("don’t need to rewrite it");
    expect(reply).toContain("next move");
    expect(reply).not.toMatch(/say it .*plain|more plainly|restate it/i);
  });

  it("gives a useful default answer instead of a plain-language deflection", async () => {
    const reply = await callClaude({} as Env, "system", [{ role: "user", content: "this is complicated" }]);

    expect(reply).toContain("I can work with that");
    expect(reply).not.toMatch(/say it .*plain|more plainly|restate it/i);
  });
});
