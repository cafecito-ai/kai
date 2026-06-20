import { describe, expect, it } from "vitest";
import { looksLikePlan } from "./plan-from-chat";

describe("looksLikePlan", () => {
  it("detects a multi-step workout plan", () => {
    const reply =
      "Here's a solid session:\n1) 5 min warmup\n2) 3 sets of pushups\n3) 3 sets of squats";
    expect(looksLikePlan(reply)).toBe(true);
  });

  it("detects a sleep routine laid out as a list", () => {
    expect(
      looksLikePlan("Wind-down plan:\n- Phone across the room\n- Lights low\n- In bed by 10:30"),
    ).toBe(true);
  });

  it("ignores plain advice with no list", () => {
    expect(
      looksLikePlan("Just get outside for a ten-minute walk and you'll feel better."),
    ).toBe(false);
  });

  it("ignores a list that isn't a plan (no routine language)", () => {
    expect(looksLikePlan("Two options:\n- the blue one\n- the red one")).toBe(false);
  });

  it("excludes grocery lists (those belong in chat, not My Plan)", () => {
    const grocery =
      "Here's your grocery plan:\nProtein\n- chicken breast\n- eggs\nCarbs\n- rice\n- oats";
    expect(looksLikePlan(grocery)).toBe(false);
  });
});
