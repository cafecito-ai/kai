import { describe, it, expect } from "vitest";

import { suggestChatAction } from "./chat-actions";

describe("suggestChatAction", () => {
  it("returns null for empty / plain conversation", () => {
    expect(suggestChatAction("")).toBeNull();
    expect(suggestChatAction("Yeah, that sounds rough. Tell me more.")).toBeNull();
  });

  it("suggests the body scan", () => {
    expect(suggestChatAction("Want to run a body scan and see your posture?")?.route).toBe("/scan");
  });

  it("suggests the food log on a meal suggestion", () => {
    expect(
      suggestChatAction("Next time, snap a photo of your lunch so we can track your food.")?.route,
    ).toBe("/food/log");
  });

  it("suggests the journal", () => {
    expect(suggestChatAction("Maybe write it down — journal about what set you off.")?.route).toBe(
      "/journal",
    );
  });

  it("suggests goals", () => {
    expect(suggestChatAction("Let's set a goal you actually care about.")?.route).toBe("/goals");
  });

  it("suggests a stretch / mobility", () => {
    expect(suggestChatAction("Try to loosen up — a quick stretch might help.")?.route).toBe(
      "/mobility",
    );
  });

  // The load-bearing guarantee: never offer a feature shortcut on a crisis reply.
  it("returns null when the reply contains crisis resources", () => {
    expect(
      suggestChatAction(
        "What you're carrying is bigger than what I can help with. Please reach out to 988 — they're there 24/7. I'm still right here.",
      ),
    ).toBeNull();
    expect(
      suggestChatAction("Text HOME to 741741 to reach the Crisis Text Line. You can journal later."),
    ).toBeNull();
  });

  it("returns at most one action (priority order)", () => {
    // mentions both sleep and a workout — first matching rule (workout is higher) wins,
    // but either way it returns a single defined route, never an array.
    const a = suggestChatAction("Log that workout, then track your sleep tonight.");
    expect(a).not.toBeNull();
    expect(typeof a?.route).toBe("string");
  });
});
