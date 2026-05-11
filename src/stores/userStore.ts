import { create } from "zustand";
import type { EngineId, KaiTone, UserProfile } from "../lib/types";

interface UserState {
  kaiName: string;
  kaiTone: KaiTone;
  primaryEngine: EngineId;
  onboardingCompletedAt: string | null;
  consentStatus: NonNullable<UserProfile["consentStatus"]>;
  parentConsentAt: string | null;
  hydrate: (profile: UserProfile) => void;
  setKai: (kaiName: string, kaiTone: KaiTone) => void;
  setPrimaryEngine: (engine: EngineId) => void;
}

export const useUserStore = create<UserState>((set) => ({
  kaiName: "Kai",
  kaiTone: "balanced",
  primaryEngine: "physical",
  onboardingCompletedAt: null,
  consentStatus: "not_required",
  parentConsentAt: null,
  hydrate: (profile) =>
    set({
      kaiName: profile.kaiName || "Kai",
      kaiTone: profile.kaiTone || "balanced",
      primaryEngine: profile.primaryEngine || "physical",
      onboardingCompletedAt: profile.onboardingCompletedAt ?? null,
      consentStatus: profile.consentStatus ?? "not_required",
      parentConsentAt: profile.parentConsentAt ?? null
    }),
  setKai: (kaiName, kaiTone) => set({ kaiName, kaiTone }),
  setPrimaryEngine: (primaryEngine) => set({ primaryEngine })
}));
