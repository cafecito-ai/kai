import { describe, expect, it } from "vitest";
import { avatarTraitsForLevel } from "./avatar";

describe("avatarTraitsForLevel", () => {
  it("clamps levels to 1-10", () => {
    expect(avatarTraitsForLevel(0).level).toBe(1);
    expect(avatarTraitsForLevel(-5).level).toBe(1);
    expect(avatarTraitsForLevel(11).level).toBe(10);
    expect(avatarTraitsForLevel(100).level).toBe(10);
  });

  it("rounds fractional levels down", () => {
    expect(avatarTraitsForLevel(3.7).level).toBe(3);
  });

  it("size grows monotonically with level", () => {
    let last = 0;
    for (let level = 1; level <= 10; level++) {
      const traits = avatarTraitsForLevel(level);
      expect(traits.size).toBeGreaterThan(last);
      last = traits.size;
    }
  });

  it("level 1 is neutral and unadorned", () => {
    const traits = avatarTraitsForLevel(1);
    expect(traits.mouthCurve).toBe(0);
    expect(traits.hasAccessory).toBe(false);
    expect(traits.hasBackground).toBe(false);
    expect(traits.hasMotion).toBe(false);
    expect(traits.hasAura).toBe(false);
  });

  it("mouth-curve transitions match the Section 9 ladder", () => {
    expect(avatarTraitsForLevel(1).mouthCurve).toBe(0); // neutral
    expect(avatarTraitsForLevel(2).mouthCurve).toBe(0.4); // gentle smile
    expect(avatarTraitsForLevel(3).mouthCurve).toBe(0.4);
    expect(avatarTraitsForLevel(4).mouthCurve).toBe(0.8); // bright smile
  });

  it("accessory appears at level 5+", () => {
    expect(avatarTraitsForLevel(4).hasAccessory).toBe(false);
    expect(avatarTraitsForLevel(5).hasAccessory).toBe(true);
  });

  it("background appears at level 6+", () => {
    expect(avatarTraitsForLevel(5).hasBackground).toBe(false);
    expect(avatarTraitsForLevel(6).hasBackground).toBe(true);
  });

  it("motion gates on at level 7+", () => {
    expect(avatarTraitsForLevel(6).hasMotion).toBe(false);
    expect(avatarTraitsForLevel(7).hasMotion).toBe(true);
  });

  it("aura gates on at level 9+", () => {
    expect(avatarTraitsForLevel(8).hasAura).toBe(false);
    expect(avatarTraitsForLevel(9).hasAura).toBe(true);
    expect(avatarTraitsForLevel(10).hasAura).toBe(true);
  });

  it("level 10 has every trait enabled", () => {
    const traits = avatarTraitsForLevel(10);
    expect(traits.mouthCurve).toBe(0.8);
    expect(traits.hasAccessory).toBe(true);
    expect(traits.hasBackground).toBe(true);
    expect(traits.hasMotion).toBe(true);
    expect(traits.hasAura).toBe(true);
  });
});
