import { describe, expect, it } from "vitest";

import { buildAdaptiveReminderPlan } from "./adaptive-reminders";

describe("buildAdaptiveReminderPlan", () => {
  it("uses competitive reminders for sport goals", () => {
    const plan = buildAdaptiveReminderPlan({
      focusAreas: ["getting_stronger"],
      hardestLately: "basketball shooting and training",
      followUps: {},
      updatedAt: new Date().toISOString(),
    });

    expect(plan.style).toBe("competitive");
    expect(plan.examples.join(" ")).toContain("rep");
  });

  it("uses calm reminders for stress and overthinking", () => {
    const plan = buildAdaptiveReminderPlan({
      focusAreas: ["managing_stress"],
      hardestLately: "overthinking at night",
      followUps: {},
      updatedAt: new Date().toISOString(),
    });

    expect(plan.style).toBe("calm");
  });
});
