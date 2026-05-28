import type { Env } from "../types";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

const ANTHROPIC_TIMEOUT_MS = 1_800;
const WORKERS_AI_TIMEOUT_MS = 1_800;

export async function callClaude(env: Env, system: string, messages: ClaudeMessage[]): Promise<string> {
  if (env.ANTHROPIC_API_KEY) {
    const anthropicReply = await callAnthropic(env, system, messages);
    if (anthropicReply) return anthropicReply;
  }

  if (env.AI) {
    const workersAiReply = await callWorkersAi(env.AI, env.AI_TEXT_MODEL, system, messages);
    if (workersAiReply) return workersAiReply;
  }

  return fallbackReply(messages);
}

async function callAnthropic(env: Env, system: string, messages: ClaudeMessage[]) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022",
        system,
        messages: normalizeAnthropicMessages(messages),
        max_tokens: 320,
        temperature: 0.45
      })
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
    return json.content?.find((item) => item.type === "text" && item.text)?.text?.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callWorkersAi(
  ai: NonNullable<Env["AI"]>,
  model: string | undefined,
  system: string,
  messages: ClaudeMessage[]
) {
  try {
    const prompt = `${system}\n\nConversation:\n${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}\nassistant:`;
    const result = (await withTimeout(
      ai.run(model || "@cf/meta/llama-3.1-8b-instruct", {
        prompt,
        max_tokens: 320,
        temperature: 0.5
      }),
      WORKERS_AI_TIMEOUT_MS,
    )) as { response?: string; text?: string };
    return (result.response || result.text || "").trim() || null;
  } catch {
    return null;
  }
}

function normalizeAnthropicMessages(messages: ClaudeMessage[]) {
  const normalized: ClaudeMessage[] = [];
  for (const message of messages) {
    const content = message.content.trim();
    if (!content) continue;
    const previous = normalized.at(-1);
    if (previous?.role === message.role) {
      previous.content = `${previous.content}\n\n${content}`;
    } else {
      normalized.push({ role: message.role, content });
    }
  }
  return normalized.length ? normalized : [{ role: "user" as const, content: "Help me choose one small next move." }];
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("AI request timed out")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function fallbackReply(messages: ClaudeMessage[]) {
  const last = [...messages].reverse().find((message) => message.role === "user")?.content.toLowerCase() ?? "";
  if (/\b(yo|hey|hi|hello|sup|what'?s up|wassup)\b/.test(last)) {
    return "I’m here. Pick one lane: mind, body, school, sleep, or confidence. I’ll turn it into the next move.";
  }
  if (last.includes("sleep") || last.includes("tired")) {
    return "Sleep is the move. Keep it simple: protect tonight, lower the pressure today, and log what happened so KAI can spot the pattern.";
  }
  if (last.includes("food") || last.includes("eat") || last.includes("practice")) {
    return "Fuel is the move. Get something steady in, add water, and log the meal so the next recommendation has context.";
  }
  if (last.includes("scroll") || last.includes("phone") || last.includes("tiktok") || last.includes("instagram")) {
    return "Attention reset is the move. Put the phone out of reach for one hour and choose one replacement that actually gives your brain a break.";
  }
  return "I can help with that. Start with one small rep you can finish in the next ten minutes, then log it so today counts.";
}
