import { create } from "zustand";
import type { EngineId, KaiTone, UserProfile } from "../lib/types";

interface UserState {
  kaiName: string;
  kaiTone: KaiTone;
  primaryEngine: EngineId;
  age: number | null;
  parentEmail: string | null;
  onboardingCompletedAt: string | null;
  consentStatus: NonNullable<UserProfile["consentStatus"]>;
  parentConsentAt: string | null;
  hydrate: (profile: UserProfile) => void;
  setKai: (kaiName: string, kaiTone: KaiTone) => void;
  setPrimaryEngine: (engine: EngineId) => void;
  setConsentPending: (parentEmail: string) => void;
  markOnboardingComplete: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  kaiName: "Kai",
  kaiTone: "balanced",
  primaryEngine: "physical",
  age: null,
  parentEmail: null,
  onboardingCompletedAt: null,
  consentStatus: "not_required",
  parentConsentAt: null,
  hydrate: (profile) =>
    set({
      kaiName: profile.kaiName || "Kai",
      kaiTone: profile.kaiTone || "balanced",
      primaryEngine: profile.primaryEngine || "physical",
      age: profile.age ?? null,
      parentEmail: profile.parentEmail ?? null,
      onboardingCompletedAt: profile.onboardingCompletedAt ?? null,
      consentStatus: profile.consentStatus ?? "not_required",
      parentConsentAt: profile.parentConsentAt ?? null
    }),
  setKai: (kaiName, kaiTone) => set({ kaiName, kaiTone }),
  setPrimaryEngine: (primaryEngine) => set({ primaryEngine }),
  setConsentPending: (parentEmail) => set({ parentEmail, consentStatus: "pending", parentConsentAt: null }),
  markOnboardingComplete: () => set({ onboardingCompletedAt: new Date().toISOString() })
}));
