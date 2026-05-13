/**
 * Pull the first balanced {...} JSON object out of a model response.
 * Workers AI Llama 3.1 8B (and most chat-tuned models) routinely prefix
 * structured output with chatty preamble or wrap it in a markdown code
 * fence. This walks the string char-by-char tracking string state and
 * brace depth, so braces inside strings and nested objects don't trip it.
 *
 * Returns the JSON substring or null when nothing balanced was found.
 *
 * Consolidated from three drift-prone duplicates that landed in PRs
 * #7 (safety), #8 (intake), #13 (vision). Keep this as the single
 * source of truth — every callsite imports from here.
 */
export function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < raw.length; i++) {
    const char = raw[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\" && inString) {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}
