import { describe, expect, it } from "vitest";
import { fastPhysicalReply } from "../src/routes/chat";

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
