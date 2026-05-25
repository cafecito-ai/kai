import type { ChatMessage } from "./types";

export type KaiRecentContext = {
  label: string;
  body: string;
  turns: number;
};

export type KaiMemoryItem = {
  id: string;
  label: string;
  body: string;
  kind: "said" | "saved";
};

export function getKaiRecentContext(messages: ChatMessage[]): KaiRecentContext | null {
  const visible = messages.filter((message) => message.role === "user" || message.role === "assistant");
  const userMessages = visible.filter((message) => message.role === "user");
  const savedItems = getKaiMemoryItems(messages).filter((item) => item.kind === "saved");
  if (userMessages.length === 0 && savedItems.length === 0) return null;

  if (savedItems[0] && userMessages.length === 0) {
    return {
      label: "Kai remembers",
      body: savedItems[0].body,
      turns: 1
    };
  }

  const lastUser = userMessages[userMessages.length - 1];
  const body = clampContext(lastUser.content);
  return {
    label: userMessages.length === 1 ? "Kai remembers" : `${userMessages.length} things Kai remembers`,
    body,
    turns: userMessages.length
  };
}

export function getKaiMemoryItems(messages: ChatMessage[], limit = 3): KaiMemoryItem[] {
  const items: KaiMemoryItem[] = [];
  for (const message of [...messages].reverse()) {
    if (message.role === "assistant" && isToolCompletion(message)) {
      const parsed = parseSavedCompletion(message.content);
      items.push({
        id: message.id,
        label: parsed.title || "Saved",
        body: clampContext(parsed.summary || message.content),
        kind: "saved"
      });
    } else if (message.role === "user") {
      items.push({
        id: message.id,
        label: "You said",
        body: clampContext(message.content),
        kind: "said"
      });
    }
    if (items.length >= limit) break;
  }
  return items;
}

function clampContext(content: string) {
  const trimmed = content.replace(/\s+/g, " ").trim();
  if (trimmed.length <= 96) return trimmed;
  return `${trimmed.slice(0, 93).trimEnd()}...`;
}

function isToolCompletion(message: ChatMessage) {
  const metadata = message.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata) && (metadata as { source?: unknown }).source === "tool_completion") return true;
  return /^[A-Z][^.!?]{1,70} saved\. /.test(message.content);
}

function parseSavedCompletion(content: string) {
  const match = content.match(/^(.+?) saved\. (.+)$/);
  return {
    title: match?.[1]?.trim() ?? "",
    summary: match?.[2]?.trim() ?? content
  };
}
