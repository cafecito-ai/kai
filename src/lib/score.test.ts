import { describe, expect, it } from "vitest";
import { dailyScore, hydrationGlasses, sleepHours, tierLabel } from "./score";
import type { ProgressEvent } from "./types";

const base = "2026-05-26T12:00:00.000Z";

function event(input: Partial<ProgressEvent>): ProgressEvent {
  return {
    id: crypto.randomUUID(),
    engine: "physical",
    eventType: "hydration",
    eventValue: 4,
    occurredAt: base,
    ...input
  };
}

describe("score", () => {
  it("counts hydration events for the day", () => {
    expect(hydrationGlasses([event({ eventValue: 4 }), event({ eventValue: 4 })], new Date(base))).toBe(2);
  });

  it("reads sleep duration from payload", () => {
    expect(sleepHours([event({ eventType: "sleep_log", payload: { durationMinutes: 390 } })], new Date(base))).toBe(6.5);
  });

  it("computes a bounded daily score and tier", () => {
    const score = dailyScore(
      [
        event({ eventType: "hydration", eventValue: 4 }),
        event({ eventType: "sleep_log", payload: { durationMinutes: 480 } }),
        event({ engine: "mental", eventType: "feelings_check_in", eventValue: 24 })
      ],
      new Date(base)
    );
    expect(score).toBeGreaterThan(50);
    expect(tierLabel(score)).toMatch(/Strong start|On fire/);
  });
});
