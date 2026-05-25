import { describe, expect, it } from "vitest";
import {
  calculateLoopScore,
  completeLoopStep,
  createDefaultLoop,
  getNextAvailableStep,
  normalizeLoop,
  normalizeLoopStep,
  skipLoopStep,
  todayIso
} from "./loop";

describe("daily loop helpers", () => {
  it("returns null for empty or malformed loops", () => {
    expect(normalizeLoop(null)).toBeNull();
    expect(normalizeLoop({ dateIso: "2026-05-24", steps: [] })).toBeNull();
    expect(normalizeLoopStep({ id: "nope" })).toBeNull();
  });

  it("creates the default loop and calculates score", () => {
    const loop = createDefaultLoop([]);
    expect(loop.score).toBe(20);
    expect(loop.steps).toHaveLength(5);
    expect(getNextAvailableStep(loop.steps)?.id).toBe("check_in");

    const complete = loop.steps.map((step) => ({ ...step, status: "completed" as const }));
    expect(calculateLoopScore(complete)).toBe(100);
  });

  it("completes and skips steps while unlocking the next step", () => {
    let loop = createDefaultLoop([]);
    loop = completeLoopStep(loop, "check_in", { mood: "Stressed", note: "private text", source: "loop" });
    expect(loop.score).toBe(35);
    expect(loop.steps[0].payload).toEqual({ mood: "Stressed", noteLength: 12, source: "loop" });
    expect(getNextAvailableStep(loop.steps)?.id).toBe("body_action");

    loop = skipLoopStep(loop, "body_action");
    expect(getNextAvailableStep(loop.steps)?.id).toBe("mind_action");
  });

  it("normalizes api loops and date rollover helpers", () => {
    expect(todayIso(new Date("2026-05-24T12:00:00Z"))).toBe("2026-05-24");
    const loop = normalizeLoop({
      date_iso: "2026-05-24",
      steps: [{ id: "check_in", status: "completed", title: "Check in", subtitle: "How are you?" }]
    });
    expect(loop?.dateIso).toBe("2026-05-24");
    expect(loop?.steps[1].status).toBe("available");
  });
});
