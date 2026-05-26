export interface Env {
  DB: D1Database;
  PROGRESS_KV: KVNamespace;
  SESSIONS_KV: KVNamespace;
  UPLOADS: R2Bucket;
  AI?: {
    run: (model: string, input: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
  };
  EMAIL?: {
    send: (message: { to: string; from: string; subject: string; html?: string; text?: string }) => Promise<{ messageId?: string }>;
  };
  CLERK_SECRET_KEY: string;
  CLERK_JWT_KEY?: string;
  EMAIL_FROM: string;
  USDA_API_KEY: string;
  SAFETY_ALERT_EMAIL?: string;
  AI_TEXT_MODEL?: string;
  AI_VISION_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  APP_ENV?: "staging" | "production" | "development";
}

export type EngineId = "physical" | "potential" | "mental";
export type AppVariables = { userId: string; isOps: boolean };

export interface SafetyClassification {
  safe: boolean;
  category?: "suicide_ideation" | "self_harm" | "eating_disorder" | "abuse_disclosure" | "substance" | "violence_to_others";
  severity?: "low" | "medium" | "high" | "critical";
  response?: string;
}
