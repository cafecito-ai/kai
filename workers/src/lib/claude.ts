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
    return "I’m here. What’s the vibe today: mind, body, school, sleep, or confidence?";
  }
  if (/\b(friend|friends|group chat|left me out|lonely|crush|delivered|rejected|ignored|social)\b/.test(last)) {
    return "Oof. That actually hurts. Was it clearly on purpose, or is the silence making your brain run?";
  }
  if (/\b(mad|angry|rage|yelled|fight|mom|dad|parent|parents)\b/.test(last)) {
    return "Feeling bad after means you probably care more than you showed. Cool down first, then say one honest sentence.";
  }
  if (/\b(point of trying|always quit|why try|i always fail|nothing works|keep quitting|what's the point|whats the point)\b/.test(last)) {
    return "Quitting before doesn’t mean you’re cooked forever. The plan was probably too big. What’s one tiny thing you could do for three days?";
  }
  if (/\b(test|quiz|exam|homework|study|studying|school|grades?|class|assignment|finals?)\b/.test(last)) {
    return "Yeah, test stress can make your brain freeze. Do 12 minutes on one topic with your phone away, then check what still feels confusing.";
  }
  if (/\b(basketball|hoop|shooting|handles)\b/.test(last)) {
    return "Keep it simple today: 5 minutes handles, 10 minutes form shots, 5 minutes stretching. Log it after so it counts.";
  }
  if (/\b(hungry|lunch|lunc|food|eat|make|cook)\b/.test(last)) {
    return "I got you. Go protein + carb + something fresh: eggs and toast, a turkey/rice bowl, tuna sandwich, Greek yogurt with fruit, or leftovers with water. What do you have?";
  }
  if (last.includes("sleep") || last.includes("tired")) {
    return "No perfect routine needed tonight. Just make the next hour easier: dim the screen, plug the phone away from bed, and do one boring thing.";
  }
  if (last.includes("food") || last.includes("eat") || last.includes("practice")) {
    return "Fuel should support the day, not turn into pressure. Tell me what you ate and what you’re trying to do, and I’ll keep it simple.";
  }
  if (last.includes("scroll") || last.includes("phone") || last.includes("tiktok") || last.includes("instagram")) {
    return "Okay, the phone won that round. Day’s not over. Put it across the room for 15 minutes and pick one replacement.";
  }
  if (last.length > 220) {
    return "That’s a lot to carry, but you don’t need to rewrite it for me. The next move is to separate it into three pieces: what happened, what hit you the hardest, and what you can control in the next 10 minutes. Start with the part that feels most urgent right now.";
  }
  return "I can work with that. The next move is to name the part that matters most right now, then take one small action instead of trying to solve the whole thing at once.";
}
