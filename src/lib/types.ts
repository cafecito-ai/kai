export type EngineId = "physical" | "potential" | "mental";
export type KaiTone = "warm" | "balanced" | "direct";

export interface ProgressEvent {
  id: string;
  engine: EngineId | "kai";
  eventType: string;
  eventValue: number;
  payload?: unknown;
  occurredAt: string;
}

export interface Goal {
  id: string;
  category: "school" | "instrument" | "sport" | "business" | "charity" | "custom";
  title: string;
  description?: string;
  targetDate?: string;
  status: "active" | "achieved" | "paused" | "released";
}

export interface UserProfile {
  kaiName: string;
  kaiTone: KaiTone;
  primaryEngine: EngineId;
  onboardingCompletedAt?: string | null;
  consentStatus?: "not_required" | "pending" | "complete";
  parentConsentAt?: string | null;
}

export interface SafetyResult {
  safe: boolean;
  category?: string;
  severity?: "low" | "medium" | "high" | "critical";
  response?: string;
}
