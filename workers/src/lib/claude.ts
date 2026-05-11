import type { Env } from "../types";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export async function callClaude(env: Env, system: string, messages: ClaudeMessage[]): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) {
    return "I can help with that. For now, pick one small step you can do in the next ten minutes.";
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system,
      messages
    })
  });

  if (!res.ok) {
    return "I hit a snag, but the next move is still simple: pause, name what is happening, and choose one small action.";
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  return data.content?.find((part) => part.type === "text")?.text ?? "I'm here. What's the smallest next step?";
}
