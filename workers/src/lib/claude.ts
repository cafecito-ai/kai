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
// Cheap, fast model for one-shot tasks: safety classifier, intake summary,
// engine routing, strengths summary, post-action cues.
export const HAIKU_MODEL = "claude-haiku-4-5";
// Highest-care model — reserved for Mental engine conversation turns (spec §6).
export const OPUS_MODEL = "claude-opus-4-7";
const FALLBACK_LINE = "I'm here. What's the smallest next step?";

/**
 * One-shot Anthropic call. Returns the trimmed text on success, or `null`
 * if the key isn't configured or the API call fails. Callers use the
 * `null` return to fall back to Cloudflare Workers AI (Llama) so a single
 * Anthropic outage doesn't take chat or onboarding offline.
 *
 * This is the path every non-conversational AI helper (safety classifier,
 * intake summary, engine routing, strengths summary, event cues) routes
 * through so the ANTHROPIC_API_KEY secret is honored everywhere, not just
 * on the main chat turn.
 */
export async function callAnthropic(
  env: Env,
  system: string,
  userPrompt: string,
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
        system,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: options.maxTokens ?? 400,
        temperature: options.temperature ?? 0.5
      })
    });
    if (!res.ok) {
      console.warn("anthropic non-2xx", res.status);
      return null;
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((block) => block.type === "text")?.text?.trim();
    return text && text.length > 0 ? text : null;
  } catch (err) {
    console.warn("anthropic call failed", err);
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
      if (!res.ok) {
        // DEPLOY.md tells ops to grep for `anthropic non-2xx` to verify
        // the key is bound; that log only fired in callAnthropic before
        // (Codex review of #130, P2). Log status only — no request body,
        // no system prompt, no user content.
        console.warn("anthropic non-2xx", res.status);
        throw new Error(`anthropic ${res.status}`);
      }
      const data = (await res.json()) as { content?: { type: string; text?: string }[] };
      const text = data.content?.find((block) => block.type === "text")?.text?.trim();
      if (text) return text;
      // Empty/unexpected response shape — fall through to Workers AI rather
      // than returning the empty string.
      console.warn("anthropic empty response");
    } catch (err) {
      // Network error or the re-thrown non-2xx above. Surface the error
      // name+message so prod tails are actually useful; the throw is
      // intentional (the !res.ok branch already logged) — this catch
      // covers fetch failures, JSON parse failures, and the re-throw.
      console.warn("anthropic call failed", err instanceof Error ? `${err.name}: ${err.message}` : String(err));
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
