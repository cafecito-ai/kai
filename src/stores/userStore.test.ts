import { describe, expect, it } from "vitest";
import { useUserStore } from "./userStore";

describe("userStore", () => {
  it("can mark onboarding complete locally for the Kai handoff", () => {
    useUserStore.setState({ onboardingCompletedAt: null });

    useUserStore.getState().markOnboardingComplete();

    expect(useUserStore.getState().onboardingCompletedAt).toEqual(expect.any(String));
  });
});
