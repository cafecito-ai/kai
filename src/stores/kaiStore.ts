import { create } from "zustand";
import { api } from "../lib/api";
import { localSafetyCheck } from "../lib/safety";
import type { ChatMessage, EngineId } from "../lib/types";

interface KaiState {
  conversationId: string | null;
  messages: ChatMessage[];
  sending: boolean;
  hydrate: (input: { conversationId: string | null; messages: ChatMessage[] }) => void;
  send: (message: string, engine?: EngineId | "kai") => Promise<void>;
}

export const useKaiStore = create<KaiState>((set) => ({
  conversationId: null,
  sending: false,
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
  send: async (message, engine = "kai") => {
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
      const result = await api.chat(engine, message, useKaiStore.getState().conversationId);
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
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "I could not reach Kai right now. Pick one lens anyway: Daniel Siegel for naming it, James Clear for the smallest habit, Viktor Frankl for meaning, stoic philosophy for what you control, or body basics for sleep, food, and movement."
          }
        ]
      }));
    }
  }
}));
