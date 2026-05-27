import { create } from "zustand";
import { api } from "../lib/api";
import { inferKaiAction, KAI_ACTIONS, type KaiAction, type KaiActionId } from "../lib/kai-actions";
import { localSafetyCheck } from "../lib/safety";
import type { ChatMessage, EngineId } from "../lib/types";

type ChatEngine = EngineId | "kai";
type EngineChatState = {
  conversationId: string | null;
  messages: ChatMessage[];
  nextAction: KaiAction | null;
  sending: boolean;
  hydrated: boolean;
};

interface KaiState {
  chats: Record<ChatEngine, EngineChatState>;
  hydrate: (engine: ChatEngine, input: { conversationId: string | null; messages: ChatMessage[]; nextAction?: KaiAction | { id: KaiActionId } | null }) => void;
  rememberToolCompletion: (input: { title: string; summary: string; nextActionId?: KaiActionId }) => void;
  send: (message: string, engine?: ChatEngine) => Promise<void>;
}

const ENGINES: ChatEngine[] = ["kai", "physical", "potential", "mental"];
const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Tell me what is going on. No perfect words needed."
};

function emptyChat(): EngineChatState {
  return {
    conversationId: null,
    nextAction: null,
    sending: false,
    hydrated: false,
    messages: [welcomeMessage]
  };
}

function initialChats(): Record<ChatEngine, EngineChatState> {
  return Object.fromEntries(ENGINES.map((engine) => [engine, emptyChat()])) as Record<ChatEngine, EngineChatState>;
}

function normalizeMessages(messages: ChatMessage[]) {
  const visible = messages
    .filter((message) => (message.role === "user" || message.role === "assistant") && !isToolCompletion(message))
    .map((message) => (message.role === "assistant" ? { ...message, content: cleanAssistantCopy(message.content) } : message));
  return visible.length > 0 ? visible : [welcomeMessage];
}

function isToolCompletion(message: ChatMessage) {
  const metadata = message.metadata;
  return Boolean(metadata && typeof metadata === "object" && !Array.isArray(metadata) && (metadata as { source?: unknown }).source === "tool_completion");
}

function cleanAssistantCopy(content: string) {
  const oldSystemLanguage = /\b(mental agent|physical agent|health unit|goals unit|mental unit|one companion across)\b/i;
  if (oldSystemLanguage.test(content)) return welcomeMessage.content;
  return content;
}

export const useKaiStore = create<KaiState>((set) => ({
  chats: initialChats(),
  hydrate: (engine, { conversationId, messages, nextAction }) =>
    set((state) => ({
      chats: {
        ...state.chats,
        [engine]: {
          ...state.chats[engine],
          conversationId,
          hydrated: true,
          messages: normalizeMessages(messages),
          nextAction: resolveKaiAction(nextAction) ?? inferLastAction(messages)
        }
      }
    })),
  rememberToolCompletion: ({ title, summary, nextActionId }) => {
    set((state) => ({
      chats: {
        ...state.chats,
        kai: {
          ...state.chats.kai,
          nextAction: nextActionId ? KAI_ACTIONS[nextActionId] : state.chats.kai.nextAction
        }
      }
    }));
    const conversationId = useKaiStore.getState().chats.kai.conversationId;
    void api.rememberToolCompletion({ conversationId, title, summary, nextActionId }).then((result) => {
      set((state) => ({
        chats: {
          ...state.chats,
          kai: {
            ...state.chats.kai,
            conversationId: result.conversationId,
            nextAction: result.nextAction?.id ? KAI_ACTIONS[result.nextAction.id] ?? state.chats.kai.nextAction : state.chats.kai.nextAction
          }
        }
      }));
    }).catch(() => undefined);
  },
  send: async (message, engine = "kai") => {
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: message };
    set((state) => ({
      chats: {
        ...state.chats,
        [engine]: {
          ...state.chats[engine],
          sending: true,
          messages: [...state.chats[engine].messages, userMessage],
          nextAction: inferKaiAction(message)
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
            nextAction: inferKaiAction(message),
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
      const nextAction = result.nextAction?.id ? KAI_ACTIONS[result.nextAction.id] ?? inferKaiAction(message) : inferKaiAction(message);
      set((state) => ({
        chats: {
          ...state.chats,
          [engine]: {
            ...state.chats[engine],
            conversationId: result.conversationId,
            sending: false,
            nextAction,
            messages: [...state.chats[engine].messages, { id: crypto.randomUUID(), role: "assistant", content: cleanAssistantCopy(result.reply) }]
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
            nextAction: inferKaiAction(message),
            messages: [
              ...state.chats[engine].messages,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                  "I’m having trouble connecting, but we can still make this useful. Pick one small next move: talk it out, reset your body, or move one goal."
              }
            ]
          }
        }
      }));
    }
  }
}));

function inferLastAction(messages: ChatMessage[]) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content;
  return lastUserMessage ? inferKaiAction(lastUserMessage) : null;
}

function resolveKaiAction(action?: KaiAction | { id: KaiActionId } | null) {
  if (!action) return null;
  return KAI_ACTIONS[action.id] ?? null;
}
