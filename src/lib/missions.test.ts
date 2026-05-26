import { describe, expect, it } from "vitest";
import { pillarForEvent } from "./missions";

describe("pillarForEvent", () => {
  it("maps physical events to body", () => {
    expect(pillarForEvent("sleep_log")).toBe("body");
    expect(pillarForEvent("food_photo")).toBe("body");
  });

  it("maps mental and social events separately", () => {
    expect(pillarForEvent("thought_reframe")).toBe("mind");
    expect(pillarForEvent("social_reset")).toBe("people");
  });

  it("maps goal work to purpose", () => {
    expect(pillarForEvent("goal_created")).toBe("purpose");
  });
});
