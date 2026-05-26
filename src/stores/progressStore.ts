import { create } from "zustand";
import { api } from "../lib/api";
import type { ProgressEvent } from "../lib/types";
import { beltForLevel, calculateLevel, calculateStreak } from "../lib/tracker";

interface ProgressState {
  events: ProgressEvent[];
  setEvents: (events: ProgressEvent[]) => void;
  addEvent: (event: Omit<ProgressEvent, "id" | "occurredAt">) => void;
  level: () => number;
  streak: () => number;
  belt: () => string;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  events: [],
  setEvents: (events) => set({ events }),
  /**
   * Optimistic-then-reconcile. Append the event locally with a temp
   * id + client timestamp so the UI reflects the action immediately,
   * then fire `api.logProgress` and SWAP the local row for the
   * server-authoritative one when it lands.
   *
   * Pre-reconcile bug: a session would carry a local UUID while the
   * server stored a different UUID — same event, two different ids.
   * After a hard refresh the local id was gone (setEvents wipes
   * everything), but anything that keyed off the local id during the
   * session would hold stale references. Reconciling on the API
   * response keeps `events` consistent with D1 for the lifetime of
   * the session.
   *
   * On API failure we leave the local row in place — better to keep
   * the UI honest about what the user just did than to drop their
   * action visually because of a transient network error. The next
   * full `api.getProgress()` reconciles the truth.
   */
  addEvent: (event) => {
    const localId = crypto.randomUUID();
    const localOccurredAt = new Date().toISOString();
    set((state) => ({
      events: [
        ...state.events,
        { ...event, id: localId, occurredAt: localOccurredAt }
      ]
    }));
    void api
      .logProgress(event)
      .then((result) => {
        if (!result?.event) return;
        set((state) => ({
          events: state.events.map((row) => (row.id === localId ? result.event : row))
        }));
      })
      .catch(() => undefined);
  },
  level: () => calculateLevel(get().events),
  streak: () => calculateStreak(get().events),
  belt: () => beltForLevel(get().level())
}));
