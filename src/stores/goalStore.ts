import { create } from "zustand";
import { api, KaiApiError } from "../lib/api";
import { normalizeGoal, normalizeGoals } from "../lib/goals";
import type { Goal, GoalCategory } from "../lib/types";

type GoalStoreState = {
  goals: Goal[];
  selectedGoalId: string | null;
  status: "idle" | "loading" | "ready" | "saving" | "error";
  errorMessage: string | null;
  hydratedAt: string | null;
  hydrateGoals: () => Promise<void>;
  createGoal: (input: {
    title: string;
    description: string;
    category: GoalCategory;
    whyItMatters?: string;
    nextAction?: string;
    targetDate?: string | null;
  }) => Promise<Goal>;
  updateGoal: (goalId: string, input: Partial<Goal>) => Promise<Goal>;
  setSelectedGoal: (goalId: string | null) => void;
  clearError: () => void;
};

export const useGoalStore = create<GoalStoreState>((set, get) => ({
  goals: [],
  selectedGoalId: null,
  status: "idle",
  errorMessage: null,
  hydratedAt: null,
  hydrateGoals: async () => {
    set({ status: "loading", errorMessage: null });
    try {
      const result = await api.getGoals();
      set({
        goals: normalizeGoals(result.goals),
        status: "ready",
        hydratedAt: new Date().toISOString(),
        errorMessage: null
      });
    } catch (error) {
      set({
        status: "error",
        errorMessage: errorMessage(error, "Kai could not load goals. Try again.")
      });
    }
  },
  createGoal: async (input) => {
    if (get().status === "saving") throw new Error("Goal save already in progress.");
    set({ status: "saving", errorMessage: null });
    try {
      const result = await api.createGoal({
        ...input,
        description: input.description,
        whyItMatters: input.whyItMatters,
        nextAction: input.nextAction,
        targetDate: input.targetDate ?? null
      });
      const goal = normalizeGoal(result.goal);
      if (!goal) throw new Error("Invalid goal response.");
      set((state) => ({
        goals: [goal, ...state.goals.filter((item) => item.id !== goal.id)],
        selectedGoalId: goal.id,
        status: "ready",
        hydratedAt: state.hydratedAt ?? new Date().toISOString(),
        errorMessage: null
      }));
      return goal;
    } catch (error) {
      set({ status: "error", errorMessage: errorMessage(error, "Kai could not save that goal. Your draft is still here.") });
      throw error;
    }
  },
  updateGoal: async (goalId, input) => {
    set({ status: "saving", errorMessage: null });
    try {
      const result = await api.updateGoal(goalId, input);
      const goal = normalizeGoal(result.goal);
      if (!goal) throw new Error("Invalid goal response.");
      set((state) => ({
        goals: state.goals.map((item) => (item.id === goal.id ? goal : item)),
        status: "ready",
        errorMessage: null
      }));
      return goal;
    } catch (error) {
      set({ status: "error", errorMessage: errorMessage(error, "Kai could not update that goal. Try again.") });
      throw error;
    }
  },
  setSelectedGoal: (selectedGoalId) => set({ selectedGoalId }),
  clearError: () => set({ errorMessage: null, status: get().goals.length ? "ready" : "idle" })
}));

function errorMessage(error: unknown, fallback: string) {
  return error instanceof KaiApiError ? error.userMessage : fallback;
}
