import { describe, expect, it, vi } from "vitest";
import { mergeDelta, persistProfile, type PersistDeps } from "./profileBuilder";
import { EMPTY_DRAFT, type ProfileDraft } from "./types";

describe("mergeDelta", () => {
  it("accumulates across turns, last non-empty wins", () => {
    let d = mergeDelta(EMPTY_DRAFT, { firstName: "Leo" });
    d = mergeDelta(d, { primaryGoal: "get stronger", motivation: "football" });
    expect(d.firstName).toBe("Leo");
    expect(d.primaryGoal).toBe("get stronger");
    expect(d.motivation).toBe("football");
  });

  it("never clobbers a captured value with null/empty", () => {
    let d = mergeDelta(EMPTY_DRAFT, { firstName: "Leo" });
    d = mergeDelta(d, { firstName: null });
    d = mergeDelta(d, { firstName: "   " });
    expect(d.firstName).toBe("Leo");
  });

  it("unions focusAreas without duplicates", () => {
    let d = mergeDelta(EMPTY_DRAFT, { focusAreas: ["getting_stronger", "energy"] });
    d = mergeDelta(d, { focusAreas: ["energy", "better_sleep"] });
    expect(d.focusAreas).toEqual(["getting_stronger", "energy", "better_sleep"]);
  });

  it("captures tone only from a real value", () => {
    let d = mergeDelta(EMPTY_DRAFT, { tone: "direct" });
    d = mergeDelta(d, { tone: null });
    expect(d.tone).toBe("direct");
  });
});

function mockDeps(overrides: Partial<PersistDeps> = {}): PersistDeps {
  return {
    userId: "u1",
    setDisplayName: vi.fn(),
    setKaiTone: vi.fn(),
    setNorthStar: vi.fn(),
    seedNorthStarFromFocus: vi.fn(),
    getNorthStar: vi.fn(() => ({ goal: "Derived goal", theme: "general" as const, source: "derived" as const, createdAt: "" })),
    setSystemGoal: vi.fn(),
    setIdentityStatement: vi.fn(),
    setOriginStory: vi.fn(),
    getOriginStory: vi.fn(() => null),
    queueOnboardingIntake: vi.fn(),
    flushPendingOnboardingIntake: vi.fn(async () => "flushed" as const),
    updateUser: vi.fn(async () => ({})),
    ...overrides,
  };
}

describe("persistProfile", () => {
  const fullDraft: ProfileDraft = {
    ...EMPTY_DRAFT,
    firstName: "Leo",
    primaryGoal: "get stronger for football",
    motivation: "football",
    emotionalMotivation: "confidence",
    timeframe: "before the season",
    blocker: "consistency",
    identityStatement: "someone who shows up",
    focusAreas: ["getting_stronger"],
    tone: "direct",
  };

  it("uses a custom North Star for a free-text goal", async () => {
    const deps = mockDeps();
    const { goal } = await persistProfile(fullDraft, deps);
    expect(deps.setNorthStar).toHaveBeenCalledWith("get stronger for football", "custom");
    expect(deps.seedNorthStarFromFocus).not.toHaveBeenCalled();
    expect(deps.setSystemGoal).toHaveBeenCalledWith("get stronger for football", "u1");
    expect(goal).toBe("get stronger for football");
  });

  it("derives the North Star from focus when there's no free-text goal", async () => {
    const deps = mockDeps();
    const draft: ProfileDraft = { ...EMPTY_DRAFT, firstName: "Mia", focusAreas: ["better_sleep"] };
    const { goal } = await persistProfile(draft, deps);
    expect(deps.seedNorthStarFromFocus).toHaveBeenCalledWith(["better_sleep"]);
    expect(deps.getNorthStar).toHaveBeenCalled();
    expect(goal).toBe("Derived goal");
  });

  it("respects the write-once origin story", async () => {
    const alreadySet = mockDeps({ getOriginStory: vi.fn(() => "an earlier story") });
    await persistProfile({ ...fullDraft, originStory: "a new story" }, alreadySet);
    expect(alreadySet.setOriginStory).not.toHaveBeenCalled();

    const fresh = mockDeps({ getOriginStory: vi.fn(() => null) });
    await persistProfile({ ...fullDraft, originStory: "a new story" }, fresh);
    expect(fresh.setOriginStory).toHaveBeenCalledWith("a new story");
  });

  it("queues a flat intake record with comma-joined focus areas, then flushes", async () => {
    const deps = mockDeps();
    await persistProfile({ ...fullDraft, focusAreas: ["getting_stronger", "energy"] }, deps);
    expect(deps.queueOnboardingIntake).toHaveBeenCalledTimes(1);
    const record = (deps.queueOnboardingIntake as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as Record<string, string>;
    expect(record.focus_areas).toBe("getting_stronger,energy");
    expect(record.first_name).toBe("Leo");
    expect(record.motivation).toBe("football");
    expect(record.emotional_motivation).toBe("confidence");
    expect(record.biggest_blocker).toBe("consistency");
    expect(record.identity_statement).toBe("someone who shows up");
    expect(deps.flushPendingOnboardingIntake).toHaveBeenCalled();
  });

  it("marks onboarding complete via updateUser", async () => {
    const deps = mockDeps();
    await persistProfile(fullDraft, deps);
    expect(deps.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingCompleted: true, displayName: "Leo", kaiTone: "direct" }),
    );
  });

  it("still completes (and returns the goal) when updateUser throws", async () => {
    const deps = mockDeps({ updateUser: vi.fn(async () => { throw new Error("network"); }) });
    const { goal } = await persistProfile(fullDraft, deps);
    expect(goal).toBe("get stronger for football");
    expect(deps.queueOnboardingIntake).toHaveBeenCalled(); // intake still queued
  });
});
