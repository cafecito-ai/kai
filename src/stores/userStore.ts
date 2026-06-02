import { create } from "zustand";
import type { EngineId, KaiTone, UserProfile } from "../lib/types";

interface UserState {
  /** What KAI calls the user (first name from onboarding). */
  displayName: string | null;
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
}

export const useUserStore = create<UserState>((set) => ({
  displayName: null,
  kaiName: "Kai",
  kaiTone: "balanced",
  primaryEngine: "physical",
  age: null,
  parentEmail: null,
  onboardingCompletedAt: null,
  consentStatus: "not_required",
  parentConsentAt: null,
  hydrate: (profile) => {
    // displayName can arrive either at the top level (newer flows) or
    // nested inside `user.display_name` (the raw API record). Normalise
    // here so the rest of the app can read it from one place.
    const nestedUser = (profile as unknown as { user?: { display_name?: string | null } }).user;
    const dn =
      (typeof profile.displayName === "string" && profile.displayName.trim()) ||
      (typeof nestedUser?.display_name === "string" && nestedUser.display_name.trim()) ||
      null;
    set({
      displayName: dn || null,
      kaiName: profile.kaiName || "Kai",
      kaiTone: profile.kaiTone || "balanced",
      primaryEngine: profile.primaryEngine || "physical",
      age: profile.age ?? null,
      parentEmail: profile.parentEmail ?? null,
      onboardingCompletedAt: profile.onboardingCompletedAt ?? null,
      consentStatus: profile.consentStatus ?? "not_required",
      parentConsentAt: profile.parentConsentAt ?? null,
    });
  },
  setKai: (kaiName, kaiTone) => set({ kaiName, kaiTone }),
  setPrimaryEngine: (primaryEngine) => set({ primaryEngine }),
  setConsentPending: (parentEmail) => set({ parentEmail, consentStatus: "pending", parentConsentAt: null })
}));
