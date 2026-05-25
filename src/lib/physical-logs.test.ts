import { describe, expect, it } from "vitest";
import { movementInsight, normalizeMovementMinutes, normalizeSleepHours, sleepInsight } from "./physical-logs";

describe("physical log helpers", () => {
  it("normalizes teen sleep hours without letting bad input leak into payloads", () => {
    expect(normalizeSleepHours("8.25")).toBe(8.3);
    expect(normalizeSleepHours("-2")).toBe(0);
    expect(normalizeSleepHours("18")).toBe(14);
    expect(normalizeSleepHours("bad")).toBe(0);
  });

  it("keeps sleep feedback recovery-focused instead of performative", () => {
    expect(sleepInsight(6.5, "okay")).toMatch(/protect tonight/i);
    expect(sleepInsight(8.5, "solid")).toMatch(/without forcing/i);
    expect(sleepInsight(8, "rough")).toMatch(/wind-down/i);
  });

  it("normalizes movement minutes and gives practical next feedback", () => {
    expect(normalizeMovementMinutes("12.2")).toBe(12);
    expect(normalizeMovementMinutes("-1")).toBe(0);
    expect(normalizeMovementMinutes("400")).toBe(180);
    expect(movementInsight(3, "hips")).toMatch(/5 minutes/);
    expect(movementInsight(35, "shoulders")).toMatch(/Recovery matters/);
  });
});
