import { describe, expect, it } from "vitest";
import { fastKaiReply, fastPhysicalReply } from "../src/routes/chat";

describe("fastKaiReply", () => {
  it("answers simple greetings immediately with useful options", () => {
    const reply = fastKaiReply("whats up Kai");

    expect(reply).toContain("I’m here");
    expect(reply).toContain("What’s the vibe today");
    expect(reply).not.toContain("I can help with that");
    expect(reply).not.toMatch(/philosophy lens|purpose lens|next move/);
  });

  it("answers low motivation without waiting for the model", () => {
    const reply = fastKaiReply("I feel unmotivated");

    expect(reply).toContain("stuck feeling is real");
    expect(reply).toContain("10-minute start");
    expect(reply).not.toMatch(/philosophy lens|purpose lens/);
  });

  it("answers social rejection like a coach instead of a generic fallback", () => {
    const reply = fastKaiReply("my crush left me on delivered");

    expect(reply).toContain("belonging");
    expect(reply).not.toContain("I can help with that");
  });

  it("answers school focus pressure with a concrete short block", () => {
    const reply = fastKaiReply("i have a huge test tomorrow and i cant focus");

    expect(reply).toContain("12-minute block");
    expect(reply).not.toContain("I can help with that");
  });

  it("answers doomscrolling without a model wait", () => {
    const reply = fastKaiReply("i wasted 5 hours on tiktok and feel cooked");

    expect(reply).toContain("attention got pulled");
    expect(reply).toContain("15 minutes");
  });

  it("answers teen slang overwhelm without falling to generic backup", () => {
    const reply = fastKaiReply("bro i am cooked what do i do");

    expect(reply).toContain("overloaded");
    expect(reply).toContain("reset");
    expect(reply).not.toContain("I can help with that");
  });
});

describe("fastPhysicalReply", () => {
  it("answers basketball consistency asks with a specific workout", () => {
    const reply = fastPhysicalReply("i want to get better at basketball but i keep skipping workouts");

    expect(reply).toContain("20 minutes");
    expect(reply).toContain("handles");
    expect(reply).not.toContain("I can help with that");
  });

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
