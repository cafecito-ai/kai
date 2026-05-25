import { create } from "zustand";
import { api } from "../lib/api";
import { localSafetyCheck } from "../lib/safety";
import type { ChatMessage } from "../lib/types";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Tell me the loud part. I’ll help you turn it into one small move."
};

interface KaiState {
  conversationId: string | null;
  messages: ChatMessage[];
  sending: boolean;
  hydrate: (input: { conversationId: string | null; messages: ChatMessage[] }) => void;
  send: (message: string) => Promise<void>;
}

export const useKaiStore = create<KaiState>((set) => ({
  conversationId: null,
  sending: false,
  messages: [WELCOME_MESSAGE],
  hydrate: ({ conversationId, messages }) =>
    set({
      conversationId,
      messages:
        messages.length > 0
          ? messages.filter((message) => message.role === "user" || message.role === "assistant")
          : [WELCOME_MESSAGE]
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
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: safety.response ?? "Let's get you real support right now.",
            safetyEvent: { category: safety.category, severity: safety.severity }
          }
        ]
      }));
      return;
    }
    try {
      const result = await api.chat("kai", message, useKaiStore.getState().conversationId);
      set((state) => ({
        conversationId: result.conversationId,
        sending: false,
        messages: [
          ...state.messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.reply,
            // Spec §7: server-side classifier may flag content the regex
            // missed. When it does, render the crisis resource card.
            safetyEvent: result.safetyEvent
              ? { category: result.safetyEvent.category, severity: result.safetyEvent.severity }
              : undefined
          }
        ]
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
