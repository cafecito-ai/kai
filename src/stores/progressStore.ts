import { create } from "zustand";
import type { ProgressEvent } from "../lib/types";
import { beltForLevel, calculateLevel, calculateStreak } from "../lib/tracker";

interface ProgressState {
  events: ProgressEvent[];
  addEvent: (event: Omit<ProgressEvent, "id" | "occurredAt">) => void;
  level: () => number;
  streak: () => number;
  belt: () => string;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  events: [],
  addEvent: (event) =>
    set((state) => ({
      events: [
        ...state.events,
        { ...event, id: crypto.randomUUID(), occurredAt: new Date().toISOString() }
      ]
    })),
  level: () => calculateLevel(get().events),
  streak: () => calculateStreak(get().events),
  belt: () => beltForLevel(get().level())
}));
