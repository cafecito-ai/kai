import { describe, expect, it } from "vitest";
import { fastKaiReply, fastPhysicalReply } from "../src/routes/chat";

describe("fastKaiReply", () => {
  it("answers simple greetings immediately with useful options", () => {
    const reply = fastKaiReply("whats up Kai");

    expect(reply).toContain("I’m here");
    expect(reply).toContain("mind, body, school, sleep, or confidence");
    expect(reply).not.toContain("I can help with that");
  });

  it("answers low motivation without waiting for the model", () => {
    const reply = fastKaiReply("I feel unmotivated");

    expect(reply).toContain("Motivation is unreliable");
    expect(reply).toContain("ten minutes");
  });
});

describe("fastPhysicalReply", () => {
  it("answers safe muscle-building meal plan asks without calorie targets", () => {
    const reply = fastPhysicalReply("create a diet for bulking by this summer");

    expect(reply).toContain("muscle-building phase");
    expect(reply).toContain("protein");
    expect(reply).not.toMatch(/\bcalorie|calories|weigh|pounds|lbs\b/i);
  });

  it("does not fast-path unrelated physical questions", () => {
    expect(fastPhysicalReply("my shoulder feels tight")).toBeNull();
  });
});
