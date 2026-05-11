import type { EngineId, Goal, KaiTone, ProgressEvent } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers
    }
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  chat: (engine: EngineId | "kai", message: string, conversationId = "local") =>
    request<{ reply: string; safetyEvent?: unknown }>(engine === "kai" ? "/api/kai/chat" : `/api/engines/${engine}/chat`, {
      method: "POST",
      body: JSON.stringify({ conversationId, message })
    }),
  updateUser: (body: { kaiName?: string; kaiTone?: KaiTone; primaryEngine?: EngineId }) =>
    request("/api/user/me", { method: "PATCH", body: JSON.stringify(body) }),
  logProgress: (body: Omit<ProgressEvent, "id" | "occurredAt">) =>
    request<{ event: ProgressEvent }>("/api/progress/event", { method: "POST", body: JSON.stringify(body) }),
  createGoal: (goal: Omit<Goal, "id" | "status">) =>
    request<{ goal: Goal }>("/api/goals", { method: "POST", body: JSON.stringify(goal) })
};
