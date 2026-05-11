import { create } from "zustand";
import { api } from "../lib/api";
import { localSafetyCheck } from "../lib/safety";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface KaiState {
  messages: ChatMessage[];
  sending: boolean;
  send: (message: string) => Promise<void>;
}

export const useKaiStore = create<KaiState>((set) => ({
  sending: false,
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content: "Tell me the loud part. I’ll help you turn it into one small move."
    }
  ],
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
      const result = await api.chat("kai", message);
      set((state) => ({
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
