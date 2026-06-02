// Body-language filter — applied to every Body agent + body scan response
// before the user sees it. Per CLAUDE.md v2 §3 and AGENT_PLAN §2.2:
//
//   "If your generated AI prompt outputs anything matching this list,
//    regenerate with a stricter system prompt."
//
// The forbidden-word list is shared between the Body chat agent and the
// body scan vision pipeline. Body scan's vision prompt re-exports its own
// filter (workers/src/lib/prompts/body-scan-prompt.ts) for backward compat,
// but it should use this canonical list going forward.

/**
 * Forbidden words and phrases. Match is case-insensitive, substring.
 * Order doesn't matter for correctness but longer phrases are listed first
 * for easier audit.
 */
export const FORBIDDEN_BODY_LANGUAGE = [
  // Comparisons
  "compared to average",
  "for your age",
  "for a guy",
  "for a girl",
  "above average",
  "below average",
  "most people your age",
  // Body metrics
  "body fat percentage",
  "body fat",
  "body composition",
  "lean body mass",
  "lean mass",
  "calorie deficit",
  "target weight",
  "ideal weight",
  "weight estimate",
  "bmi",
  // Standalone weight/size language. For a teen body-image tool we block the
  // word "weight" outright — posture findings should describe "pressure",
  // "load", or "balance" instead (the vision prompt is steered to do so), and
  // a stray "lose some weight" must never reach a teen. The regen loop rephrases
  // any legit "weight shift" cue; worst case is a safe retake message, never a leak.
  "weight",
  "pounds",
  "leaner",
  // Physique descriptors
  "ideal body",
  "perfect body",
  "fat",
  "skinny",
  "overweight",
  "underweight",
  "obese",
  "chubby",
  "plump",
  "scrawny",
  "thin",
  "bulky",
  "ripped",
  "shredded",
  // Aesthetic words (case-insensitive substring)
  "attractive",
  "ugly",
  "beautiful",
  "gorgeous",
  "toned",
  "slim",
  "physique",
  "well-built",
  "flabby",
  "jacked",
  "swole",
  "lanky",
  "stocky",
  "chunky",
  "pudgy",
  "curvy",
  "belly",
  "gut",
  "pot belly",
  "double chin",
  "dad bod",
  "beer belly",
  "love handles",
  "muffin top",
  "thigh gap",
  "six pack",
  "six-pack",
  // Shame language
  "lazy",
  "undisciplined",
  "no excuse",
  // Diet culture
  "cutting",
  "bulking",
] as const;

export type ForbiddenMatch = {
  word: string;
  index: number;
};

/**
 * Return every forbidden hit in the response. Useful for logging /
 * regeneration context — the caller can tell the model exactly which words
 * to avoid on the retry.
 *
 * Matching: case-insensitive, with WORD BOUNDARIES so single-word forbidden
 * terms like "fat" and "thin" don't false-positive inside "fatigue" or
 * "breathing". Multi-word phrases like "calorie deficit" still match via
 * the same regex — the `\b` at start/end is satisfied by the surrounding
 * spaces and punctuation as expected.
 *
 * Word boundary is `\b` which matches between a `\w` (letter/digit/_) and
 * a non-`\w`. So "fat-shaming" still flags "fat" (the hyphen is a
 * boundary), but "fatigue" doesn't (no boundary between t and i).
 */
export function findForbidden(response: string): ForbiddenMatch[] {
  const hits: ForbiddenMatch[] = [];
  for (const word of FORBIDDEN_BODY_LANGUAGE) {
    // Escape any regex metachars in the forbidden term (none today, but
    // defensive — and use `i` flag for case-insensitive matching).
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(response)) !== null) {
      hits.push({ word, index: m.index });
      // Guard against zero-width match infinite loops (shouldn't happen
      // with our terms, but be safe).
      if (m.index === re.lastIndex) re.lastIndex += 1;
    }
  }
  return hits;
}

/**
 * `true` if the response is clean of forbidden body-language terms.
 */
export function passesBodyLanguageFilter(response: string): boolean {
  return findForbidden(response).length === 0;
}

/**
 * Fallback message returned after the regeneration loop gives up.
 * Per CLAUDE.md v2 §6: "Returns fallback after 3 failures."
 */
export const BODY_LANGUAGE_FALLBACK =
  "Let me try that again — I want to focus on how your body feels and performs, not how it looks. What's the specific goal we're working toward?";
