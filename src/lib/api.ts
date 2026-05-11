import type { EngineId, Goal, KaiTone, ProgressEvent } from "./types";

const PROD_API_BASE = "https://kai.evan-ratner.workers.dev";
const STAGING_API_BASE = "https://kai-staging.evan-ratner.workers.dev";

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  if (typeof window === "undefined") return "";
  if (window.location.hostname === "kai.boostaisearch.ai") return PROD_API_BASE;
  return STAGING_API_BASE;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-dev-user": localStorage.getItem("kai.devUser") || "demo-teen",
      ...init?.headers
    }
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  getUser: () =>
    request<{ user: unknown; intake: unknown; primaryEngine: EngineId; kaiName: string; kaiTone: KaiTone }>("/api/user/me"),
  chat: (engine: EngineId | "kai", message: string, conversationId = "local") =>
    request<{ reply: string; safetyEvent?: unknown }>(engine === "kai" ? "/api/kai/chat" : `/api/engines/${engine}/chat`, {
      method: "POST",
      body: JSON.stringify({ conversationId, message })
    }),
  updateUser: (body: { kaiName?: string; kaiTone?: KaiTone; primaryEngine?: EngineId; age?: number; parentEmail?: string }) =>
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
  sendParentConsent: (body: { parentEmail: string; teenName?: string; consentUrl: string }) =>
    request<{ ok: boolean }>("/api/parent/consent", { method: "POST", body: JSON.stringify(body) })
};
