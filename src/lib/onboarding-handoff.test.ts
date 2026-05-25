import { describe, expect, it } from "vitest";
import { actionForMission, buildFirstKaiMessage } from "./onboarding-handoff";

describe("onboarding handoff", () => {
  it("builds a first Kai message from the teen's actual setup", () => {
    const message = buildFirstKaiMessage({
      kaiName: "Kai",
      vibes: ["tired", "stressed"],
      stressors: ["school", "phone"],
      personality: "overthinker",
      mission: {
        id: "confidence",
        label: "Confidence",
        copy: "Stop shrinking yourself.",
        engine: "mental",
        route: "/mental?module=purpose&action=confidence"
      },
      context: "School pressure has been loud."
    });

    expect(message).toContain("tired, stressed");
    expect(message).toContain("My brain runs loops.");
    expect(message).toContain("school, phone");
    expect(message).toContain("First focus is confidence");
    expect(message).toContain("I’ll remember the extra context");
  });

  it("maps first missions to the same action routes Kai chat uses", () => {
    expect(actionForMission("food").route).toBe("/health?module=food&action=food");
    expect(actionForMission("body").route).toBe("/health?module=scan&action=scan");
    expect(actionForMission("confidence").route).toBe("/mental?module=purpose&action=confidence");
    expect(actionForMission("social").route).toBe("/mental?module=checkin&action=social");
    expect(actionForMission("discipline").route).toBe("/goal?action=goal");
    expect(actionForMission("goals").route).toBe("/goal?action=goal");
  });
});
