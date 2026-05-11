export interface Env {
  DB: D1Database;
  PROGRESS_KV: KVNamespace;
  SESSIONS_KV: KVNamespace;
  UPLOADS: R2Bucket;
  ANTHROPIC_API_KEY: string;
  CLERK_SECRET_KEY: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  USDA_API_KEY: string;
  SAFETY_ALERT_EMAIL?: string;
}

export type EngineId = "physical" | "potential" | "mental";

export interface SafetyClassification {
  safe: boolean;
  category?: "suicide_ideation" | "self_harm" | "eating_disorder" | "abuse_disclosure" | "substance" | "violence_to_others";
  severity?: "low" | "medium" | "high" | "critical";
  response?: string;
}
