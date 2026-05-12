import { describe, expect, it } from "vitest";
import { BREATH_PATTERNS, currentPhase } from "./breathing";

const box = BREATH_PATTERNS.find((p) => p.id === "box")!; // 4 / 4 / 4 / 4 = 16s cycle
const four78 = BREATH_PATTERNS.find((p) => p.id === "4-7-8")!; // 4 / 7 / 8 = 19s cycle

describe("currentPhase", () => {
  it("starts in the first phase at t=0", () => {
    const { phase, remaining, cycle } = currentPhase(box, 0);
    expect(phase.label).toBe("Inhale");
    expect(remaining).toBe(4);
    expect(cycle).toBe(0);
  });

  it("advances inside a single phase", () => {
    const { phase, remaining } = currentPhase(box, 3);
    expect(phase.label).toBe("Inhale");
    expect(remaining).toBe(1);
  });

  it("crosses phase boundaries cleanly", () => {
    expect(currentPhase(box, 4).phase.label).toBe("Hold");
    expect(currentPhase(box, 8).phase.label).toBe("Exhale");
    expect(currentPhase(box, 12).phase.label).toBe("Rest");
  });

  it("loops back to phase 0 at the cycle boundary", () => {
    const { phase, remaining, cycle } = currentPhase(box, 16);
    expect(phase.label).toBe("Inhale");
    expect(remaining).toBe(4);
    expect(cycle).toBe(1);
  });

  it("handles 4-7-8 boundaries correctly", () => {
    expect(currentPhase(four78, 0).phase.label).toBe("Inhale");
    expect(currentPhase(four78, 4).phase.label).toBe("Hold");
    expect(currentPhase(four78, 11).phase.label).toBe("Exhale");
    expect(currentPhase(four78, 19).cycle).toBe(1);
  });
});
