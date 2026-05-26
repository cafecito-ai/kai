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
  /**
   * The teen's first name as known to Clerk. Synced into the store
   * by `ApiAuthBridge` (which is provider-gated) so pages can read
   * it without calling Clerk hooks directly — see
   * `src/architecture.test.ts` rule 1 for the rationale.
   *
   * `null` is the correct empty value (not `""`): consumers check
   * for nullish to decide whether to fall back to a non-personalized
   * greeting.
   */
  firstName: string | null;
  hydrate: (profile: UserProfile) => void;
  setKai: (kaiName: string, kaiTone: KaiTone) => void;
  setPrimaryEngine: (engine: EngineId) => void;
  setConsentPending: (parentEmail: string) => void;
  setFirstName: (firstName: string | null) => void;
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
  firstName: null,
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
      // firstName intentionally not hydrated from `profile` — it's
      // pushed by ApiAuthBridge from Clerk's session, not stored
      // server-side. The api.getUser() shape doesn't include it.
    }),
  setKai: (kaiName, kaiTone) => set({ kaiName, kaiTone }),
  setPrimaryEngine: (primaryEngine) => set({ primaryEngine }),
  setConsentPending: (parentEmail) => set({ parentEmail, consentStatus: "pending", parentConsentAt: null }),
  setFirstName: (firstName) => set({ firstName })
}));
