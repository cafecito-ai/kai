import { create } from "zustand";
import { api } from "../lib/api";
import { localSafetyCheck } from "../lib/safety";
import type { ChatMessage, EngineId } from "../lib/types";

type ChatEngine = EngineId | "kai";
type EngineChatState = {
  conversationId: string | null;
  messages: ChatMessage[];
  sending: boolean;
  hydrated: boolean;
};

interface KaiState {
  chats: Record<ChatEngine, EngineChatState>;
  hydrate: (engine: ChatEngine, input: { conversationId: string | null; messages: ChatMessage[] }) => void;
  send: (message: string, engine?: ChatEngine) => Promise<void>;
}

const ENGINES: ChatEngine[] = ["kai", "physical", "potential", "mental"];
const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Tell me the loud part. I’ll help you turn it into one small move."
};

function emptyChat(): EngineChatState {
  return {
    conversationId: null,
    sending: false,
    hydrated: false,
    messages: [welcomeMessage]
  };
}

function initialChats(): Record<ChatEngine, EngineChatState> {
  return Object.fromEntries(ENGINES.map((engine) => [engine, emptyChat()])) as Record<ChatEngine, EngineChatState>;
}

function normalizeMessages(messages: ChatMessage[]) {
  const visible = messages.filter((message) => message.role === "user" || message.role === "assistant");
  return visible.length > 0 ? visible : [welcomeMessage];
}

export const useKaiStore = create<KaiState>((set) => ({
  chats: initialChats(),
  hydrate: (engine, { conversationId, messages }) =>
    set((state) => ({
      chats: {
        ...state.chats,
        [engine]: {
          ...state.chats[engine],
          conversationId,
          hydrated: true,
          messages: normalizeMessages(messages)
        }
      }
    })),
  send: async (message, engine = "kai") => {
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: message };
    set((state) => ({
      chats: {
        ...state.chats,
        [engine]: {
          ...state.chats[engine],
          sending: true,
          messages: [...state.chats[engine].messages, userMessage]
        }
      }
    }));
    const safety = localSafetyCheck(message);
    if (!safety.safe) {
      set((state) => ({
        chats: {
          ...state.chats,
          [engine]: {
            ...state.chats[engine],
            sending: false,
            messages: [
              ...state.chats[engine].messages,
              { id: crypto.randomUUID(), role: "assistant", content: safety.response ?? "Let's get you real support right now." }
            ]
          }
        }
      }));
      return;
    }
    try {
      const result = await api.chat(engine, message, useKaiStore.getState().chats[engine].conversationId);
      set((state) => ({
        chats: {
          ...state.chats,
          [engine]: {
            ...state.chats[engine],
            conversationId: result.conversationId,
            sending: false,
            messages: [...state.chats[engine].messages, { id: crypto.randomUUID(), role: "assistant", content: result.reply }]
          }
        }
      }));
    } catch {
      set((state) => ({
        chats: {
          ...state.chats,
          [engine]: {
            ...state.chats[engine],
            sending: false,
            messages: [
              ...state.chats[engine].messages,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                  "I could not reach Kai right now. Pick one lens anyway: Daniel Siegel for naming it, James Clear for the smallest habit, Viktor Frankl for meaning, stoic philosophy for what you control, or body basics for sleep, food, and movement."
              }
            ]
          }
        }
      }));
    }
  }
}));
