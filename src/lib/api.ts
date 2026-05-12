import type { ChatMessage, EngineEntry, EngineId, Goal, KaiTone, ProgressEvent, UserProfile } from "./types";

const PROD_API_BASE = "https://kai.evan-ratner.workers.dev";
const STAGING_API_BASE = "https://kai-staging.evan-ratner.workers.dev";
type TokenGetter = () => Promise<string | null>;

let apiAuthTokenGetter: TokenGetter | null = null;

export function setApiAuthTokenGetter(getter: TokenGetter | null) {
  apiAuthTokenGetter = getter;
}

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  if (typeof window === "undefined") return "";
  if (window.location.hostname === "kai.boostaisearch.ai") return PROD_API_BASE;
  return STAGING_API_BASE;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const token = await apiAuthTokenGetter?.();
  const devUser = getDevUser();
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(!token && devUser ? { "x-dev-user": devUser } : {}),
      ...init?.headers
    }
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

function getDevUser() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  const authRequired = import.meta.env.VITE_AUTH_REQUIRED === "1";
  const canUseDevUser =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".pages.dev") ||
    (host === "kai.boostaisearch.ai" && !authRequired);
  if (!canUseDevUser) return null;
  return localStorage.getItem("kai.devUser") || "demo-teen";
}

export const api = {
  getUser: () =>
    request<{ user: unknown; intake: unknown } & UserProfile>("/api/user/me"),
  chat: (engine: EngineId | "kai", message: string, conversationId?: string | null) =>
    request<{ conversationId: string; reply: string; safetyEvent?: unknown }>(engine === "kai" ? "/api/kai/chat" : `/api/engines/${engine}/chat`, {
      method: "POST",
      body: JSON.stringify({ conversationId, message })
    }),
  getCurrentConversation: (engine: EngineId | "kai" = "kai") =>
    request<{ conversationId: string | null; messages: ChatMessage[] }>(`/api/conversations/current?engine=${engine}`),
  updateUser: (body: { kaiName?: string; kaiTone?: KaiTone; primaryEngine?: EngineId; age?: number; parentEmail?: string; onboardingCompleted?: boolean; designPreference?: string }) =>
    request("/api/user/me", { method: "PATCH", body: JSON.stringify(body) }),
  submitIntake: (responses: Record<string, string>) =>
    request<{ summary: string; suggestedEngine: EngineId; reasoning: string }>("/api/onboarding/intake", {
      method: "POST",
      body: JSON.stringify({ responses })
    }),
  logProgress: (body: Omit<ProgressEvent, "id" | "occurredAt">) =>
    request<{ event: ProgressEvent }>("/api/progress/event", { method: "POST", body: JSON.stringify(body) }),
  getProgress: () => request<{ eventsByDay: ProgressEvent[]; level: number; streaks: unknown; belts: unknown }>("/api/progress"),
  getGoals: () => request<{ goals: Goal[] }>("/api/goals"),
  createGoal: (goal: Omit<Goal, "id" | "status">) =>
    request<{ goal: Goal }>("/api/goals", { method: "POST", body: JSON.stringify(goal) }),
  updateGoal: (goalId: string, body: Partial<Goal>) =>
    request<{ goal: Goal }>(`/api/goals/${goalId}`, { method: "PATCH", body: JSON.stringify(body) }),
  getEngineEntries: (engine: EngineId) =>
    request<{ entries: EngineEntry[] }>(`/api/engines/${engine}/entries`),
  createEngineEntry: (engine: EngineId, body: { entryType: string; title?: string; payload?: unknown; completed?: boolean }) =>
    request<{ entry: EngineEntry }>(`/api/engines/${engine}/entries`, { method: "POST", body: JSON.stringify(body) }),
  analyzeFoodPhoto: (body: { r2Key?: string; note?: string }) =>
    request<{ mealId: string; items: Array<{ name: string; source?: string }>; totals: null; confidence: string; notes: string }>("/api/food-photo", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  sendParentConsent: (body: { parentEmail: string; teenName?: string }) =>
    request<{ ok: boolean; expiresAt: string; emailSent: boolean }>("/api/parent/consent/request", { method: "POST", body: JSON.stringify(body) }),
  submitStrengthsDiscovery: (responses: Record<string, string>) =>
    request<{ summary: string; answered: number; total: number }>("/api/engines/potential/strengths", {
      method: "POST",
      body: JSON.stringify({ responses })
    })
};
