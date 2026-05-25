import { create } from "zustand";
import { api, KaiApiError } from "../lib/api";
import {
  completeLoopStep,
  createDefaultLoop,
  normalizeLoop,
  sanitizeLoopPayload,
  skipLoopStep
} from "../lib/loop";
import type { DailyLoop, Goal, LoopStepId, ProgressEvent } from "../lib/types";

type LoopStoreState = {
  loop: DailyLoop | null;
  status: "idle" | "loading" | "ready" | "saving" | "offline" | "error";
  errorMessage: string | null;
  pendingEvents: ProgressEvent[];
  hydratedAt: string | null;
  hydrateLoop: (goals?: Goal[]) => Promise<void>;
  completeStep: (stepId: LoopStepId, payload?: Record<string, unknown>) => Promise<void>;
  skipStep: (stepId: LoopStepId) => Promise<void>;
  syncPendingEvents: () => Promise<void>;
  resetForToday: (goals?: Goal[]) => void;
  clearError: () => void;
};

export const useLoopStore = create<LoopStoreState>((set, get) => ({
  loop: null,
  status: "idle",
  errorMessage: null,
  pendingEvents: [],
  hydratedAt: null,
  hydrateLoop: async (goals = []) => {
    set({ status: "loading", errorMessage: null });
    try {
      const result = await api.getTodayLoop();
      const loop = normalizeLoop(result.loop);
      if (!loop) throw new Error("Invalid loop response.");
      set({ loop, status: "ready", hydratedAt: new Date().toISOString(), errorMessage: null });
    } catch (error) {
      const localLoop = get().loop ?? createDefaultLoop(goals);
      set({
        loop: localLoop,
        status: error instanceof KaiApiError && error.code === "NETWORK_ERROR" ? "offline" : "error",
        errorMessage: errorMessage(error, "Kai could not load today’s loop. You can keep going offline."),
        hydratedAt: new Date().toISOString()
      });
    }
  },
  completeStep: async (stepId, payload) => {
    const current = get().loop ?? createDefaultLoop([]);
    const localLoop = completeLoopStep(current, stepId, payload);
    set({ loop: localLoop, status: "saving", errorMessage: null });
    try {
      const result = await api.completeLoopStep({ stepId, payload: sanitizeLoopPayload(payload) });
      const loop = normalizeLoop(result.loop);
      set({ loop: loop ?? localLoop, status: "ready", errorMessage: null });
    } catch (error) {
      set((state) => ({
        loop: localLoop,
        status: error instanceof KaiApiError && error.code === "NETWORK_ERROR" ? "offline" : "error",
        errorMessage: errorMessage(error, "Kai saved that locally. Try syncing again in a moment."),
        pendingEvents: [...state.pendingEvents, pendingEvent(stepId, sanitizeLoopPayload(payload))]
      }));
    }
  },
  skipStep: async (stepId) => {
    const current = get().loop ?? createDefaultLoop([]);
    set({ loop: skipLoopStep(current, stepId), status: "ready", errorMessage: null });
  },
  syncPendingEvents: async () => {
    const events = get().pendingEvents;
    if (events.length === 0) return;
    set({ status: "saving", errorMessage: null });
    try {
      const result = await api.syncLoopEvents({ events });
      const loop = normalizeLoop(result.loop);
      set({ loop: loop ?? get().loop, pendingEvents: [], status: "ready", errorMessage: null });
    } catch (error) {
      set({
        status: error instanceof KaiApiError && error.code === "NETWORK_ERROR" ? "offline" : "error",
        errorMessage: errorMessage(error, "Kai could not sync yet. Your local loop is still here.")
      });
    }
  },
  resetForToday: (goals = []) => set({ loop: createDefaultLoop(goals), status: "ready", errorMessage: null }),
  clearError: () => set({ errorMessage: null, status: get().loop ? "ready" : "idle" })
}));

function pendingEvent(stepId: LoopStepId, payload?: Record<string, unknown>): ProgressEvent {
  return {
    id: crypto.randomUUID(),
    engine: stepId === "body_action" ? "physical" : stepId === "goal_action" ? "potential" : "mental",
    eventType: `loop_${stepId}`,
    eventValue: stepId === "reflection" ? 5 : stepId === "check_in" ? 15 : 20,
    payload: { ...(payload ?? {}), source: "loop_offline" },
    occurredAt: new Date().toISOString()
  };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof KaiApiError ? error.userMessage : fallback;
}
