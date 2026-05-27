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
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  AI_TEXT_MODEL?: string;
  AI_VISION_MODEL?: string;
  APP_ENV?: "staging" | "production" | "development";
  // T-032 — Bland AI voice integration. Set as Cloudflare secrets
  // (NOT committed to repo) once Ratner provisions a Bland account:
  //   wrangler secret put BLAND_API_KEY
  //   wrangler secret put BLAND_PHONE_NUMBER
  // Webhook URL to register with Bland: <worker-origin>/api/voice/webhook
  BLAND_API_KEY?: string;
  BLAND_PHONE_NUMBER?: string;
  /** Webhook signing secret Bland AI sends in the X-Bland-Signature header
   *  so we can verify the request actually came from them. Optional in
   *  dev; required in production. */
  BLAND_WEBHOOK_SECRET?: string;
}

export type EngineId = "physical" | "potential" | "mental";
export type AppVariables = { userId: string; isOps: boolean };

export interface SafetyClassification {
  safe: boolean;
  category?: "suicide_ideation" | "self_harm" | "eating_disorder" | "abuse_disclosure" | "substance" | "violence_to_others";
  severity?: "low" | "medium" | "high" | "critical";
  response?: string;
}
