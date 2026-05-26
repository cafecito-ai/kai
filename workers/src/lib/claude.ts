import type { Env } from "../types";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface CallOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Spec §6: default to Sonnet 4.6 for general Kai turns. Engine-specific
// callers can override per request (Haiku for fast routing, Opus for the
// Mental engine).
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";
const FALLBACK_LINE = "I'm here. What's the smallest next step?";

/**
 * Lower-level Anthropic call used by background helpers (event cues,
 * intake summary, strengths) that already have a single prompt string
 * and want to keep their existing Workers AI fallback intact.
 *
 * Returns the assistant text on success, or null on:
 *   - ANTHROPIC_API_KEY not set
 *   - network error
 *   - non-2xx from the API
 *   - empty / unexpected response shape
 *
 * Callers should treat null as "Anthropic unavailable — use your
 * existing fallback path." This keeps Workers AI working in
 * dev/staging without polluting the higher-level callClaude with
 * prompt-style call shapes.
 */
export async function callAnthropicCompletion(
  env: Env,
  prompt: string,
  options: CallOptions = {}
): Promise<string | null> {
  if (!env.ANTHROPIC_API_KEY) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: options.model || env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: options.maxTokens ?? 200,
        temperature: options.temperature ?? 0.5
      })
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    return data.content?.find((block) => block.type === "text")?.text?.trim() || null;
  } catch {
    return null;
  }
}

export async function callClaude(
  env: Env,
  system: string,
  messages: ClaudeMessage[],
  options: CallOptions = {}
): Promise<string> {
  // Prefer the Anthropic API when a key is configured. Production must
  // have ANTHROPIC_API_KEY set via `wrangler secret put`. Local dev and
  // staging without the secret fall through to Cloudflare Workers AI
  // (Llama) so the demo still functions, just at lower quality.
  if (env.ANTHROPIC_API_KEY) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: options.model || env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
          system,
          messages,
          max_tokens: options.maxTokens ?? 500,
          temperature: options.temperature ?? 0.5
        })
      });
      if (!res.ok) throw new Error(`anthropic ${res.status}`);
      const data = (await res.json()) as { content?: { type: string; text?: string }[] };
      const text = data.content?.find((block) => block.type === "text")?.text?.trim();
      if (text) return text;
      // Empty/unexpected response shape — fall through to Workers AI rather
      // than returning the empty string.
    } catch {
      // Any network or non-2xx error: degrade silently to Workers AI.
    }
  }

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
    return result.response || result.text || FALLBACK_LINE;
  } catch {
    return "I hit a snag, but the next move is still simple: pause, name what is happening, and choose one small action.";
  }
}
