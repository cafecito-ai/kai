import { create } from "zustand";
import { localSafetyCheck } from "../lib/safety";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface KaiState {
  messages: ChatMessage[];
  send: (message: string) => void;
}

export const useKaiStore = create<KaiState>((set) => ({
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content: "I'm Kai. Tell me what's going on, and we'll pick the next useful step."
    }
  ],
  send: (message) =>
    set((state) => {
      const safety = localSafetyCheck(message);
      const reply = safety.safe
        ? "Got it. Let's turn that into one small next move."
        : safety.response ?? "Let's get you real support right now.";
      return {
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), role: "user", content: message },
          { id: crypto.randomUUID(), role: "assistant", content: reply }
        ]
      };
    })
}));
