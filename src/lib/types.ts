export type EngineId = "physical" | "superpower" | "mental";
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
  age?: number | null;
  parentEmail?: string | null;
  onboardingCompletedAt?: string | null;
  consentStatus?: "not_required" | "pending" | "complete";
  parentConsentAt?: string | null;
}

export interface EngineEntry {
  id: string;
  engine: EngineId;
  entryType: string;
  title?: string | null;
  payload?: unknown;
  createdAt?: string;
  completedAt?: string | null;
}

export interface SafetyResult {
  safe: boolean;
  category?: string;
  severity?: "low" | "medium" | "high" | "critical";
  response?: string;
}

export interface SafetyEventInfo {
  category?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  safetyEvent?: SafetyEventInfo;
}

/**
 * Macro totals for a meal item. Mirrors `Nutrition` in
 * workers/src/lib/usda.ts. The worker fills these from USDA FoodData
 * Central when a vision-identified item matches; missing on manual
 * entries until the teen opts into macro tracking.
 *
 * Per spec Section 10, the UI default is descriptive — these numbers
 * are NOT shown as a daily target unless the teen explicitly asks to
 * track macros.
 */
export interface FoodNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodPhotoItem {
  name: string;
  source: "vision" | "manual";
  estimatedGrams?: number;
  nutrition?: FoodNutrition;
  nutritionSource?: "usda" | null;
}

/** Confidence values emitted by `/api/food-photo` + `/api/food-photo-upload`. */
export type FoodPhotoConfidence = "high" | "medium" | "low" | "photo_stub" | "manual_stub";

export interface FoodPhotoResult {
  mealId: string;
  /** Present on the upload variant — the R2 key for the saved photo. */
  r2Key?: string;
  items: FoodPhotoItem[];
  /** Aggregate macros across items that had USDA data; null if no items did. */
  totals: FoodNutrition | null;
  confidence: FoodPhotoConfidence;
  notes: string;
}

/**
 * Response shape for the anonymous /api/demo-food-photo endpoint.
 * Same as FoodPhotoResult but without `mealId` — the demo endpoint
 * doesn't persist to D1.
 */
export interface DemoFoodPhotoResult {
  r2Key?: string;
  items: FoodPhotoItem[];
  totals: FoodNutrition | null;
  confidence: FoodPhotoConfidence;
  notes: string;
}

export interface PostureCue {
  focus: string;
  suggestion: string;
}

/**
 * Response shape for /api/body-scan-upload. The teen sees `cues`
 * surfaced as supportive posture/alignment notes — never body
 * composition. Filter enforced server-side; UI doesn't need to
 * re-filter, but should still render the persistent "no body score"
 * Note for reassurance.
 */
export interface BodyScanResult {
  scanId: string;
  r2Key?: string;
  cues: PostureCue[];
  confidence: "high" | "medium" | "low";
  notes: string;
}

export interface DemoFeedbackChoices {
  ui: "Calm Coach" | "Quest Mode" | "Lifestyle Feed";
  habit: "Food Camera" | "Emotional Check-in" | "Streaks + Belts" | "Home-screen Character";
  onboarding: "Fast Start" | "Personality Setup" | "Goal Setup";
  parent: "Safety-only" | "Weekly Summary" | "Shared Wins";
}
