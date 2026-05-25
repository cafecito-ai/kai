import type { ChatMessage } from "./types";

export type KaiRecentContext = {
  label: string;
  body: string;
  turns: number;
};

export function getKaiRecentContext(messages: ChatMessage[]): KaiRecentContext | null {
  const visible = messages.filter((message) => message.role === "user" || message.role === "assistant");
  const userMessages = visible.filter((message) => message.role === "user");
  if (userMessages.length === 0) return null;

  const lastUser = userMessages[userMessages.length - 1];
  const body = clampContext(lastUser.content);
  return {
    label: userMessages.length === 1 ? "Kai remembers" : `${userMessages.length} things Kai remembers`,
    body,
    turns: userMessages.length
  };
}

function clampContext(content: string) {
  const trimmed = content.replace(/\s+/g, " ").trim();
  if (trimmed.length <= 96) return trimmed;
  return `${trimmed.slice(0, 93).trimEnd()}...`;
}
