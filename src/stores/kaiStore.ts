import { create } from "zustand";
import { api } from "../lib/api";
import { localSafetyCheck } from "../lib/safety";
import type { ChatMessage } from "../lib/types";

interface KaiState {
  conversationId: string | null;
  messages: ChatMessage[];
  sending: boolean;
  // A handoff seed: when a teen taps "keep talking" from a check-in / food log /
  // journal, we stash a first-person opening here so the chat continues that
  // thread instead of starting cold. KaiChat consumes it on mount via send(),
  // so it still flows through the normal safety + model path.
  pendingSeed: string | null;
  setPendingSeed: (text: string | null) => void;
  hydrate: (input: { conversationId: string | null; messages: ChatMessage[] }) => void;
  send: (message: string) => Promise<void>;
}

export const useKaiStore = create<KaiState>((set) => ({
  conversationId: null,
  sending: false,
  pendingSeed: null,
  setPendingSeed: (text) => set({ pendingSeed: text }),
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content: "Tell me the loud part. I’ll help you turn it into one small move."
    }
  ],
  hydrate: ({ conversationId, messages }) =>
    set({
      conversationId,
      messages:
        messages.length > 0
          ? messages.filter((message) => message.role === "user" || message.role === "assistant")
          : [
              {
                id: "welcome",
                role: "assistant",
                content: "Tell me the loud part. I’ll help you turn it into one small move."
              }
            ]
    }),
  send: async (message) => {
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: message };
    set((state) => ({ sending: true, messages: [...state.messages, userMessage] }));
    const safety = localSafetyCheck(message);
    if (!safety.safe) {
      set((state) => ({
        sending: false,
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), role: "assistant", content: safety.response ?? "Let's get you real support right now." }
        ]
      }));
      return;
    }
    try {
      const result = await api.chat("kai", message, useKaiStore.getState().conversationId);
      set((state) => ({
        conversationId: result.conversationId,
        sending: false,
        messages: [...state.messages, { id: crypto.randomUUID(), role: "assistant", content: result.reply }]
      }));
    } catch {
      set((state) => ({
        sending: false,
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), role: "assistant", content: "I could not reach Kai right now. Pick body, goals, or reset and do one small rep." }
        ]
      }));
    }
  }
}));
