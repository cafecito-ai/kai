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
      content: "Tell me the loud part. I’ll help you turn it into one small move."
    }
  ],
  send: (message) =>
    set((state) => {
      const safety = localSafetyCheck(message);
      const reply = safety.safe
        ? "Got it. Pick a lane: body, goals, or reset. We only need one rep."
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
