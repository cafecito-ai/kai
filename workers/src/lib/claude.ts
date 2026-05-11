import type { Env } from "../types";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export async function callClaude(env: Env, system: string, messages: ClaudeMessage[]): Promise<string> {
  if (!env.AI) {
    return "I can help with that. For now, pick one small step you can do in the next ten minutes.";
  }

  try {
    const prompt = `${system}\n\nConversation:\n${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}\nassistant:`;
    const result = (await env.AI.run(env.AI_TEXT_MODEL || "@cf/meta/llama-3.1-8b-instruct", {
      prompt,
      max_tokens: 500,
      temperature: 0.5
    })) as { response?: string; text?: string };
    return result.response || result.text || "I'm here. What's the smallest next step?";
  } catch {
    return "I hit a snag, but the next move is still simple: pause, name what is happening, and choose one small action.";
  }
}
