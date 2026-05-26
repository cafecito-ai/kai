import { describe, expect, it } from "vitest";
import { isSafePostureCue, parsePostureResponse } from "../src/lib/posture";

describe("isSafePostureCue", () => {
  it("accepts a posture-focused cue", () => {
    expect(
      isSafePostureCue({
        focus: "rounded shoulders",
        suggestion: "Try a doorway chest opener — hold for 30 seconds each side."
      })
    ).toBe(true);
  });

  it("rejects cues mentioning body fat", () => {
    expect(isSafePostureCue({ focus: "core", suggestion: "Activate your core to look less fat." })).toBe(false);
  });

  it("rejects cues using weight loss language", () => {
    expect(isSafePostureCue({ focus: "balance", suggestion: "Lose a few pounds and your posture improves." })).toBe(false);
  });

  it("rejects cues about leanness or muscle definition", () => {
    expect(isSafePostureCue({ focus: "shoulders", suggestion: "Build lean muscle to hold this position." })).toBe(false);
    expect(isSafePostureCue({ focus: "back", suggestion: "More muscle definition will support the spine." })).toBe(false);
  });

  it("rejects cues commenting on body shape or size", () => {
    expect(isSafePostureCue({ focus: "stance", suggestion: "Your body shape needs more spine support." })).toBe(false);
    expect(isSafePostureCue({ focus: "stance", suggestion: "Stand at a wider size." })).toBe(false);
  });

  it("rejects cues commenting on appearance / clothing", () => {
    expect(isSafePostureCue({ focus: "alignment", suggestion: "Your outfit hides a slouched posture." })).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isSafePostureCue({ focus: "shoulders", suggestion: "LOSE WEIGHT and posture follows." })).toBe(false);
  });
});

describe("parsePostureResponse", () => {
  it("parses a clean response with two cues", () => {
    const raw = JSON.stringify({
      cues: [
        { focus: "rounded shoulders", suggestion: "Try a doorway chest opener for one minute." },
        { focus: "head forward", suggestion: "Notice if your head drifts forward when you sit." }
      ],
      confidence: "high",
      notes: "full body visible"
    });
    const result = parsePostureResponse(raw);
    expect(result).not.toBeNull();
    expect(result?.cues.length).toBe(2);
    expect(result?.confidence).toBe("high");
  });

  it("drops cues that violate the safety filter", () => {
    const raw = JSON.stringify({
      cues: [
        { focus: "shoulders", suggestion: "Try a doorway chest opener." },
        { focus: "appearance", suggestion: "Lose weight to improve posture." }
      ],
      confidence: "high",
      notes: ""
    });
    const result = parsePostureResponse(raw);
    expect(result?.cues.length).toBe(1);
    expect(result?.cues[0].focus).toBe("shoulders");
  });

  it("caps cues at 2 per Claude Design v2 spec (1-2 max)", () => {
    const raw = JSON.stringify({
      cues: [
        { focus: "a", suggestion: "a1" },
        { focus: "b", suggestion: "b1" },
        { focus: "c", suggestion: "c1" },
        { focus: "d", suggestion: "d1" },
        { focus: "e", suggestion: "e1" }
      ],
      confidence: "medium",
      notes: ""
    });
    const result = parsePostureResponse(raw);
    expect(result?.cues.length).toBe(2);
  });

  it("returns null for an invalid confidence", () => {
    const raw = JSON.stringify({ cues: [], confidence: "perfect", notes: "" });
    expect(parsePostureResponse(raw)).toBeNull();
  });

  it("returns null for non-JSON garbage", () => {
    expect(parsePostureResponse("totally not json")).toBeNull();
  });

  it("returns an empty cue array when no person is visible", () => {
    const raw = JSON.stringify({ cues: [], confidence: "low", notes: "no person visible" });
    const result = parsePostureResponse(raw);
    expect(result?.cues).toEqual([]);
    expect(result?.confidence).toBe("low");
  });

  it("trims focus / suggestion length", () => {
    const raw = JSON.stringify({
      cues: [
        {
          focus: "shoulders".repeat(20),
          suggestion: "a very long suggestion ".repeat(50)
        }
      ],
      confidence: "high",
      notes: ""
    });
    const result = parsePostureResponse(raw);
    expect(result?.cues[0].focus.length).toBeLessThanOrEqual(60);
    expect(result?.cues[0].suggestion.length).toBeLessThanOrEqual(200);
  });
});
